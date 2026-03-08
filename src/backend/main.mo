import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  public type Blob = Storage.ExternalBlob;

  type TaskStatus = {
    #pending;
    #approved;
    #declined;
  };

  public type BankDetails = {
    ifscCode : Text;
    bankName : Text;
    accountNumber : Text;
  };

  public type UserProfile = {
    email : Text;
    role : Text;
    isBlocked : Bool;
    coinBalance : Nat;
    bankDetails : ?BankDetails;
  };

  public type PaymentRequest = {
    id : Nat;
    userId : Principal;
    amount : Nat;
    status : { #pending; #accepted; #declined };
    createdAt : Int;
    orderId : Text;
  };

  module Task {
    public type Task = {
      id : Nat;
      title : Text;
      image : ?Blob;
    };

    public func compare(t1 : Task, t2 : Task) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };
  };

  module Submission {
    public type Submission = {
      id : Nat;
      userId : Principal;
      taskId : Nat;
      file : Blob;
      status : TaskStatus;
      createdAt : Int;
    };

    public func compare(s1 : Submission, s2 : Submission) : Order.Order {
      let timeOrder = Int.compare(s2.createdAt, s1.createdAt);
      if (timeOrder != #equal) {
        return timeOrder;
      };
      Nat.compare(s1.id, s2.id);
    };
  };

  let tasks = Map.empty<Nat, Task.Task>();
  let submissions = Map.empty<Nat, Submission.Submission>();
  var nextSubmissionId : Nat = 0;
  let userProfiles = Map.empty<Principal, UserProfile>();
  let paymentRequests = Map.empty<Nat, PaymentRequest>();
  var nextPaymentId : Nat = 0;

  let userAnalytics = Map.empty<Principal, {
    var lastLogin : ?Int;
    var tasksCompleted : Nat;
    var totalSubmissions : Nat;
  }>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let autoRegisteredUsers = Map.empty<Principal, Bool>();

  private func initTasks() {
    for (i in [0, 1, 2, 3, 4, 5].values()) {
      tasks.add(i, { id = i; title = "Task " # i.toText(); image = null });
    };
  };
  initTasks();

  private func ensureUserRegistered(caller : Principal) {
    if (not caller.isAnonymous()) {
      switch (userProfiles.get(caller)) {
        case (null) {
          let newProfile : UserProfile = {
            email = "";
            role = "user";
            isBlocked = false;
            coinBalance = 0;
            bankDetails = null;
          };
          userProfiles.add(caller, newProfile);
          autoRegisteredUsers.add(caller, true);
          userAnalytics.add(
            caller,
            {
              var lastLogin : ?Int = null;
              var tasksCompleted = 0;
              var totalSubmissions = 0;
            },
          );
        };
        case (_) {};
      };
    };
  };

  private func hasUserPermission(caller : Principal) : Bool {
    if (caller.isAnonymous()) {
      return false;
    };
    switch (autoRegisteredUsers.get(caller)) {
      case (?true) { return true };
      case (_) {};
    };
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  private func isUserBlocked(userId : Principal) : Bool {
    switch (userProfiles.get(userId)) {
      case (?profile) { profile.isBlocked };
      case null { false };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(_user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    userProfiles.get(_user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : { email : Text; role : Text; isBlocked : Bool }) : async () {
    ensureUserRegistered(caller);
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        if (existingProfile.isBlocked) {
          Runtime.trap("Unauthorized: User is blocked");
        };
      };
      case null {};
    };
    let updatedProfile : UserProfile = {
      email = profile.email;
      role = profile.role;
      isBlocked = profile.isBlocked;
      coinBalance = switch (userProfiles.get(caller)) {
        case (?existing) { existing.coinBalance };
        case (null) { 0 };
      };
      bankDetails = switch (userProfiles.get(caller)) {
        case (?existing) { existing.bankDetails };
        case (null) { null };
      };
    };
    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func addCoins(userId : Principal, amount : Nat) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can add coins");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) {
        let updatedProfile = {
          profile with coinBalance = profile.coinBalance + amount : Nat;
        };
        userProfiles.add(userId, updatedProfile);
      };
      case null {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func deductCoins(userId : Principal, amount : Nat) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can deduct coins");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) {
        if (profile.coinBalance < amount) {
          Runtime.trap("Insufficient coins");
        };
        let updatedProfile = {
          profile with coinBalance = profile.coinBalance - amount : Nat;
        };
        userProfiles.add(userId, updatedProfile);
      };
      case null {
        Runtime.trap("User not found");
      };
    };
  };

  public query ({ caller }) func getCoinBalance(userId : Principal) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can view coin balance");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) { profile.coinBalance };
      case null { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func blockUser(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can block users");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) {
        let updated = {
          email = profile.email;
          role = profile.role;
          isBlocked = true;
          coinBalance = profile.coinBalance;
          bankDetails = profile.bankDetails;
        };
        userProfiles.add(userId, updated);
      };
      case null {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func unblockUser(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can unblock users");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) {
        let updated = {
          email = profile.email;
          role = profile.role;
          isBlocked = false;
          coinBalance = profile.coinBalance;
          bankDetails = profile.bankDetails;
        };
        userProfiles.add(userId, updated);
      };
      case null {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func updateTask(taskId : Nat, title : Text, image : ?Blob) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can update tasks");
    };
    if (taskId >= 6) {
      Runtime.trap("Invalid task id");
    };
    let task : Task.Task = {
      id = taskId;
      title;
      image;
    };
    tasks.add(taskId, task);
  };

  public query ({ caller }) func getTasks() : async [Task.Task] {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view tasks");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    tasks.values().toArray().sort();
  };

  public shared ({ caller }) func submitTask(taskId : Nat, file : Blob) : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can submit tasks");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    if (taskId >= 6) {
      Runtime.trap("Invalid task id");
    };
    let submission : Submission.Submission = {
      id = nextSubmissionId;
      userId = caller;
      taskId;
      file;
      status = #pending;
      createdAt = Time.now();
    };
    submissions.add(nextSubmissionId, submission);
    nextSubmissionId += 1;
    switch (userAnalytics.get(caller)) {
      case (?analytics) {
        analytics.totalSubmissions += 1;
      };
      case null {};
    };
  };

  public shared ({ caller }) func reviewSubmission(submissionId : Nat, approve : Bool) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can review submissions");
    };
    switch (submissions.get(submissionId)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?submission) {
        let updated = {
          id = submission.id;
          userId = submission.userId;
          taskId = submission.taskId;
          file = submission.file;
          status = if (approve) { #approved } else { #declined };
          createdAt = submission.createdAt;
        };
        submissions.add(submissionId, updated);
        if (approve) {
          switch (userAnalytics.get(submission.userId)) {
            case (?analytics) {
              analytics.tasksCompleted += 1;
            };
            case null {};
          };
          switch (userProfiles.get(submission.userId)) {
            case (?profile) {
              let updatedProfile = {
                profile with coinBalance = profile.coinBalance + 10 : Nat;
              };
              userProfiles.add(submission.userId, updatedProfile);
            };
            case null {};
          };
        };
      };
    };
  };

  public query ({ caller }) func getUserSubmissions(userId : Principal) : async [Submission.Submission] {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view submissions");
    };
    if (caller != userId) {
      Runtime.trap("Unauthorized: Can only view your own submissions");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    submissions.values().toArray().filter(func(s : Submission.Submission) : Bool {
      s.userId == userId
    }).sort();
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission.Submission] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can view all submissions");
    };
    submissions.values().toArray().sort();
  };

  public shared ({ caller }) func requestPayment(amount : Nat) : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can request payments");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };

    let callerProfile = switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User profile not found") };
    };
    if (callerProfile.coinBalance < amount) {
      Runtime.trap("Insufficient coin balance for withdrawal");
    };

    let request : PaymentRequest = {
      id = nextPaymentId;
      userId = caller;
      amount;
      status = #pending;
      createdAt = Time.now();
      orderId = generateOrderId();
    };
    paymentRequests.add(nextPaymentId, request);
    nextPaymentId += 1;
  };

  public shared ({ caller }) func reviewPayment(paymentId : Nat, approve : Bool) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can review payments");
    };
    switch (paymentRequests.get(paymentId)) {
      case (null) {
        Runtime.trap("Payment request not found");
      };
      case (?request) {
        switch (request.status) {
          case (#pending) {
            if (approve) {
              switch (userProfiles.get(request.userId)) {
                case (?profile) {
                  if (profile.coinBalance < request.amount) {
                    Runtime.trap("User does not have enough coins for this payment");
                  };

                  let updatedProfile = {
                    profile with coinBalance = profile.coinBalance - request.amount : Nat;
                  };
                  userProfiles.add(request.userId, updatedProfile);
                };
                case null {
                  Runtime.trap("User not found");
                };
              };
            };

            let updated = {
              id = request.id;
              userId = request.userId;
              amount = request.amount;
              status = if (approve) { #accepted } else { #declined };
              createdAt = request.createdAt;
              orderId = request.orderId;
            };
            paymentRequests.add(paymentId, updated);
          };
          case (_) {
            Runtime.trap("Payment request already processed");
          };
        };
      };
    };
  };

  public query ({ caller }) func getUserPayments(userId : Principal) : async [PaymentRequest] {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view payments");
    };
    if (caller != userId) {
      Runtime.trap("Unauthorized: Can only view your own payments");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    paymentRequests.values().toArray().filter<PaymentRequest>(func(p : PaymentRequest) : Bool {
      p.userId == userId
    });
  };

  public query ({ caller }) func getAllPayments() : async [PaymentRequest] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can view all payments");
    };
    paymentRequests.values().toArray();
  };

  public shared ({ caller }) func recordLastLogin() : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can record login");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    switch (userAnalytics.get(caller)) {
      case (?analytics) {
        analytics.lastLogin := ?Time.now();
      };
      case null {
        userAnalytics.add(
          caller,
          {
            var lastLogin : ?Int = ?Time.now();
            var tasksCompleted = 0;
            var totalSubmissions = 0;
          },
        );
      };
    };
  };

  public query ({ caller }) func getUserAnalytics(userId : Principal) : async {
    lastLogin : ?Int;
    tasksCompleted : Nat;
    totalSubmissions : Nat;
  } {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can view analytics");
    };
    switch (userAnalytics.get(userId)) {
      case (?analytics) {
        {
          lastLogin = analytics.lastLogin;
          tasksCompleted = analytics.tasksCompleted;
          totalSubmissions = analytics.totalSubmissions;
        };
      };
      case null {
        { lastLogin = null; tasksCompleted = 0; totalSubmissions = 0 };
      };
    };
  };

  public query ({ caller }) func getAllUsersAnalytics() : async [{
    userId : Principal;
    email : Text;
    lastLogin : ?Int;
    tasksCompleted : Nat;
    totalSubmissions : Nat;
  }] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can view all analytics");
    };
    userProfiles.entries().toArray().map(
      func((userId, profile) : (Principal, UserProfile)) : {
        userId : Principal;
        email : Text;
        lastLogin : ?Int;
        tasksCompleted : Nat;
        totalSubmissions : Nat;
      } {
        let analytics = switch (userAnalytics.get(userId)) {
          case (?a) { a };
          case null {
            { var lastLogin : ?Int = null; var tasksCompleted : Nat = 0; var totalSubmissions : Nat = 0 };
          };
        };
        {
          userId;
          email = profile.email;
          lastLogin = analytics.lastLogin;
          tasksCompleted = analytics.tasksCompleted;
          totalSubmissions = analytics.totalSubmissions;
        };
      }
    );
  };

  // NEW FUNCTIONS

  public shared ({ caller }) func saveBankDetails(ifscCode : Text, bankName : Text, accountNumber : Text) : async () {
    ensureUserRegistered(caller);
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save bank details");
    };
    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        switch (existingProfile.bankDetails) {
          case (?_) {
            Runtime.trap("Bank details already saved and cannot be changed. Contact admin.");
          };
          case (null) {
            let updatedProfile : UserProfile = {
              existingProfile with bankDetails = ?{
                ifscCode;
                bankName;
                accountNumber;
              }
            };
            userProfiles.add(caller, updatedProfile);
          };
        };
      };
      case null {
        let newProfile : UserProfile = {
          email = "";
          role = "user";
          isBlocked = false;
          coinBalance = 0;
          bankDetails = ?{
            ifscCode;
            bankName;
            accountNumber;
          };
        };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  public shared ({ caller }) func adminUpdateBankDetails(userId : Principal, ifscCode : Text, bankName : Text, accountNumber : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can update bank details");
    };
    switch (userProfiles.get(userId)) {
      case (?existingProfile) {
        let updatedProfile : UserProfile = {
          existingProfile with bankDetails = ?{
            ifscCode;
            bankName;
            accountNumber;
          }
        };
        userProfiles.add(userId, updatedProfile);
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  public query ({ caller }) func getBankDetails(userId : Principal) : async ?BankDetails {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can view bank details");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) { profile.bankDetails };
      case null { null };
    };
  };

  public shared ({ caller }) func freezeAccountForCheat(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can freeze accounts");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with isBlocked = true;
        };
        userProfiles.add(userId, updatedProfile);
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  // NEW: PIN-based Admin Check
  public query ({ caller }) func isPinAdmin() : async Bool {
    not caller.isAnonymous();
  };

  func generateOrderId() : Text {
    let timestamp = Time.now();
    let tsNat = if (timestamp < 0) { 0 } else { Int.abs(timestamp) };
    let modNumber = tsNat % 1_000_000_000_000;
    let ret = modNumber.toText();
    if (ret.size() < 12) {
      let zerosNeeded = 12 - ret.size();
      "0" # zerosNeeded.toText() # ret;
    } else {
      ret;
    };
  };

  public shared ({ caller }) func deleteUser(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can delete users");
    };

    userProfiles.remove(userId);
    userAnalytics.remove(userId);
    autoRegisteredUsers.remove(userId);

    let filteredSubmissions = submissions.filter(
      func(_id, submission) {
        submission.userId != userId;
      }
    );
    submissions.clear();
    filteredSubmissions.entries().forEach(
      func((k, v)) {
        submissions.add(k, v);
      }
    );

    let filteredPayments = paymentRequests.filter(
      func(_id, payment) {
        payment.userId != userId;
      }
    );
    paymentRequests.clear();
    filteredPayments.entries().forEach(
      func((k, v)) {
        paymentRequests.add(k, v);
      }
    );
  };

  public shared ({ caller }) func clearAllData() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only PIN-authenticated users can clear all data");
    };

    submissions.clear();
    paymentRequests.clear();
    nextSubmissionId := 0;
    nextPaymentId := 0;

    let updatedUserProfiles = userProfiles.map<Principal, UserProfile, UserProfile>(
      func(_p, profile) {
        { profile with coinBalance = 0 };
      }
    );
    userProfiles.clear();
    updatedUserProfiles.entries().forEach(
      func((k, v)) {
        userProfiles.add(k, v);
      }
    );

    userAnalytics.forEach(
      func(_p, analytics) {
        analytics.tasksCompleted := 0;
        analytics.totalSubmissions := 0;
      }
    );
  };
};
