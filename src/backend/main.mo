import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Char "mo:core/Char";



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
    uniqueId : ?Text;
  };

  public type Task = {
    id : Nat;
    title : Text;
    image : ?Blob;
    reward : Nat;
  };

  public type Submission = {
    id : Nat;
    userId : Principal;
    taskId : Nat;
    file : Blob;
    status : TaskStatus;
    createdAt : Int;
  };

  public type PaymentRequest = {
    id : Nat;
    userId : Principal;
    amount : Nat;
    status : { #pending; #approved; #inPayment; #transferred; #declined };
    createdAt : Int;
    orderId : Text;
    coinsDeducted : Bool;
  };

  type UserAnalytics = {
    var lastLogin : ?Int;
    var tasksCompleted : Nat;
    var totalSubmissions : Nat;
  };

  // State
  let tasks = Map.empty<Nat, Task>();
  let submissions = Map.empty<Nat, Submission>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextSubmissionId : Nat = 0;
  let paymentRequests = Map.empty<Nat, PaymentRequest>();
  var nextPaymentId : Nat = 0;
  let userAnalytics = Map.empty<Principal, UserAnalytics>();
  let autoRegisteredUsers = Map.empty<Principal, Bool>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // -- Helper Functions --
  func generateUniqueId(caller : Principal) : Text {
    let timestamp = Time.now();
    let callerText = caller.toText();

    var numericValue = timestamp.toText().size() + callerText.size();

    for (char in callerText.chars()) {
      let charValue = char.toNat32().toNat().toText();
      numericValue += charValue.size();
    };

    let modValue = numericValue % 900_000;
    let normalizedValue = if (modValue + 100_000 > 0) {
      modValue + 100_000;
    } else {
      1;
    };
    normalizedValue.toText();
  };

  func ensureUserRegistered(caller : Principal) {
    if (not caller.isAnonymous()) {
      switch (userProfiles.get(caller)) {
        case (null) {
          let newProfile : UserProfile = {
            email = "";
            role = "user";
            isBlocked = false;
            coinBalance = 0;
            bankDetails = null;
            uniqueId = ?generateUniqueId(caller);
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
        case (?existing) {
          switch (existing.uniqueId) {
            case (null) {
              let updatedProfile = { existing with uniqueId = ?generateUniqueId(caller) };
              userProfiles.add(caller, updatedProfile);
            };
            case (?_) {};
          };
        };
      };
    };
  };

  func hasUserPermission(caller : Principal) : Bool {
    if (caller.isAnonymous()) {
      return false;
    };
    switch (autoRegisteredUsers.get(caller)) {
      case (?true) { return true };
      case (_) {};
    };
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  func isUserBlocked(userId : Principal) : Bool {
    switch (userProfiles.get(userId)) {
      case (?profile) { profile.isBlocked };
      case null { false };
    };
  };

  func generateOrderId() : Text {
    let timestamp = Time.now();
    let tsNat = if (timestamp < 0) { 0 } else { Int.abs(timestamp) };
    let modNumber = tsNat % 1_000_000_000_000;
    let ret = modNumber.toText();
    let retSize = ret.size();
    if (retSize < 12) {
      let zerosNeeded = 12 - retSize;
      let emptyString = "";
      let zeros = zerosNeeded.toText();
      emptyString # zeros # ret;
    } else {
      ret;
    };
  };

  // ------ User Management ------
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    ensureUserRegistered(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(_user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    userProfiles.get(_user);
  };

  public query ({ caller }) func getUserByUniqueId(uid : Text) : async ?{
    profile : UserProfile;
    userId : Principal;
    analytics : {
      lastLogin : ?Int;
      tasksCompleted : Nat;
      totalSubmissions : Nat;
    };
  } {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };

    switch (userProfiles.entries().find(
      func((p, profile)) {
        profile.uniqueId == ?uid;
      }
    )) {
      case (null) { null };
      case (?first) {
        let (userId, foundProfile) = first;

        let analytics = switch (userAnalytics.get(userId)) {
          case (?a) { a };
          case null {
            { var lastLogin : ?Int = null; var tasksCompleted : Nat = 0; var totalSubmissions : Nat = 0 };
          };
        };

        ?{
          profile = foundProfile;
          userId;
          analytics = {
            lastLogin = analytics.lastLogin;
            tasksCompleted = analytics.tasksCompleted;
            totalSubmissions = analytics.totalSubmissions;
          };
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : { email : Text; role : Text; isBlocked : Bool }) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    ensureUserRegistered(caller);
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
      uniqueId = switch (userProfiles.get(caller)) {
        case (?existing) { existing.uniqueId };
        case (null) { null };
      };
    };
    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func addCoins(userId : Principal, amount : Nat) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
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
      Runtime.trap("Unauthorized: Not authenticated");
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
      Runtime.trap("Unauthorized: Not authenticated");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) { profile.coinBalance };
      case null { 0 };
    };
  };

  public shared ({ caller }) func blockUser(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
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

  public shared ({ caller }) func unblockUser(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with isBlocked = false;
        };
        userProfiles.add(userId, updatedProfile);
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  // ------ Task Management ------
  public shared ({ caller }) func updateTask(taskId : Nat, title : Text, image : ?Blob, reward : Nat) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    if (taskId >= 6) {
      Runtime.trap("Invalid task id");
    };
    let existingImage = switch (tasks.get(taskId)) {
      case (?existingTask) { existingTask.image };
      case null { null };
    };
    let task : Task = {
      id = taskId;
      title;
      image = switch (image) {
        case (null) { existingImage };
        case (?img) { ?img };
      };
      reward;
    };
    tasks.add(taskId, task);
  };

  func taskCompare(t1 : Task, t2 : Task) : Order.Order {
    Nat.compare(t1.id, t2.id);
  };

  public query ({ caller }) func getTasks() : async [Task] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    tasks.values().toArray().sort(taskCompare);
  };

  // ------ Submission Management ------
  public shared ({ caller }) func submitTask(taskId : Nat, file : Blob) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    if (taskId >= 6) {
      Runtime.trap("Invalid task id");
    };

    switch (submissions.values().find(
      func(submission) {
        submission.userId == caller and submission.taskId == taskId
      }
    )) {
      case (null) {};
      case (?_) { Runtime.trap("User has already submitted for this task."); };
    };

    let submission : Submission = {
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
      Runtime.trap("Unauthorized: Not authenticated");
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
              let taskReward = switch (tasks.get(submission.taskId)) {
                case (?task) { task.reward };
                case (null) { 10 };
              };
              let updatedProfile = {
                profile with coinBalance = profile.coinBalance + taskReward : Nat;
              };
              userProfiles.add(submission.userId, updatedProfile);
            };
            case null {};
          };
        };
      };
    };
  };

  public query ({ caller }) func getUserSubmissions(userId : Principal) : async [Submission] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    submissions.values().toArray().filter(func(s : Submission) : Bool {
      s.userId == userId
    });
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    submissions.values().toArray();
  };

  // --- PaymentRequest Functions ---
  public shared ({ caller }) func requestPayment(amount : Nat) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    ensureUserRegistered(caller);
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
      coinsDeducted = false;
    };
    paymentRequests.add(nextPaymentId, request);
    nextPaymentId += 1;
  };

  public shared ({ caller }) func reviewPayment(paymentId : Nat, approve : Bool) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
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
              status = if (approve) { #approved } else { #declined };
              createdAt = request.createdAt;
              orderId = request.orderId;
              coinsDeducted = approve;
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

  public shared ({ caller }) func updatePaymentStatus(paymentId : Nat, newStatus : { #approved; #inPayment; #transferred; #declined }) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };

    switch (paymentRequests.get(paymentId)) {
      case (null) {
        Runtime.trap("Payment request not found");
      };
      case (?request) {
        let coinsDeducted = switch (newStatus) {
          case (#approved) {
            if (request.status == #pending and not request.coinsDeducted) {
              switch (userProfiles.get(request.userId)) {
                case (?profile) {
                  if (profile.coinBalance < request.amount) {
                    Runtime.trap("Insufficient coin balance");
                  };
                  let updatedProfile = {
                    profile with coinBalance = profile.coinBalance - request.amount : Nat;
                  };
                  userProfiles.add(request.userId, updatedProfile);
                  true;
                };
                case (null) {
                  Runtime.trap("User not found");
                };
              };
            } else {
              request.coinsDeducted;
            };
          };
          case (_) { request.coinsDeducted };
        };

        let updated = {
          id = request.id;
          userId = request.userId;
          amount = request.amount;
          status = newStatus;
          createdAt = request.createdAt;
          orderId = request.orderId;
          coinsDeducted;
        };
        paymentRequests.add(paymentId, updated);
      };
    };
  };

  public query ({ caller }) func getUserPayments(userId : Principal) : async [PaymentRequest] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    paymentRequests.values().toArray().filter<PaymentRequest>(func(p : PaymentRequest) : Bool {
      p.userId == userId
    });
  };

  public query ({ caller }) func getAllPayments() : async [PaymentRequest] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    paymentRequests.values().toArray();
  };

  // ------ User Analytics ------
  public shared ({ caller }) func recordLastLogin() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
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
      Runtime.trap("Unauthorized: Not authenticated");
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
    uniqueId : ?Text;
    lastLogin : ?Int;
    tasksCompleted : Nat;
    totalSubmissions : Nat;
    coinBalance : Nat;
    isBlocked : Bool;
    bankDetails : ?BankDetails;
  }] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };

    let array = userProfiles.entries().toArray().map(
      func((userId, profile)) {
        let analytics = switch (userAnalytics.get(userId)) {
          case (?a) { a };
          case null {
            { var lastLogin : ?Int = null; var tasksCompleted : Nat = 0; var totalSubmissions : Nat = 0 };
          };
        };
        {
          userId;
          email = profile.email;
          uniqueId = profile.uniqueId;
          lastLogin = analytics.lastLogin;
          tasksCompleted = analytics.tasksCompleted;
          totalSubmissions = analytics.totalSubmissions;
          coinBalance = profile.coinBalance;
          isBlocked = profile.isBlocked;
          bankDetails = profile.bankDetails;
        };
      }
    );

    array;
  };

  // Bank Details Functions

  public shared ({ caller }) func saveBankDetails(ifscCode : Text, bankName : Text, accountNumber : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
    };
    ensureUserRegistered(caller);
    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        if (existingProfile.isBlocked) {
          Runtime.trap("Unauthorized: User is blocked");
        };
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
          uniqueId = null;
        };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  public shared ({ caller }) func adminUpdateBankDetails(userId : Principal, ifscCode : Text, bankName : Text, accountNumber : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
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
      Runtime.trap("Unauthorized: Not authenticated");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) { profile.bankDetails };
      case null { null };
    };
  };

  public shared ({ caller }) func freezeAccountForCheat(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
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

  public query ({ caller }) func isPinAdmin() : async Bool {
    false;
  };


  // --- Task only on startup ---
  private func initTasks() {
    for (i in [0, 1, 2, 3, 4, 5].values()) {
      tasks.add(i, {
        id = i;
        title = "Task " # (i + 1).toText();
        image = null;
        reward = if (i == 0) { 11 } else { 0 };
      });
    };
  };
  initTasks();

  public shared ({ caller }) func deleteUser(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Not authenticated");
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
      Runtime.trap("Unauthorized: Not authenticated");
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
