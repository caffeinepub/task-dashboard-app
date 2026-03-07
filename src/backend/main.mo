import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Text "mo:core/Text";

actor {
  include MixinStorage();

  type Blob = Storage.ExternalBlob;
  type TaskStatus = {
    #pending;
    #approved;
    #declined;
  };

  public type UserProfile = {
    email : Text;
    role : Text;
    isBlocked : Bool;
  };

  public type PaymentRequest = {
    id : Nat;
    userId : Principal;
    amount : Nat;
    status : { #pending; #accepted; #declined };
    createdAt : Int;
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

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
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
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func blockUser(userId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can block users");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) {
        let updated = {
          email = profile.email;
          role = profile.role;
          isBlocked = true;
        };
        userProfiles.add(userId, updated);
      };
      case null {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func unblockUser(userId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can unblock users");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) {
        let updated = {
          email = profile.email;
          role = profile.role;
          isBlocked = false;
        };
        userProfiles.add(userId, updated);
      };
      case null {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func updateTask(taskId : Nat, title : Text, image : ?Blob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update tasks");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can review submissions");
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
        };
      };
    };
  };

  public query ({ caller }) func getUserSubmissions(userId : Principal) : async [Submission.Submission] {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view submissions");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own submissions");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    let filtered = submissions.values().toArray().filter(func(s : Submission.Submission) : Bool {
      s.userId == userId
    });
    filtered.sort();
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission.Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all submissions");
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
    let request : PaymentRequest = {
      id = nextPaymentId;
      userId = caller;
      amount;
      status = #pending;
      createdAt = Time.now();
    };
    paymentRequests.add(nextPaymentId, request);
    nextPaymentId += 1;
  };

  public shared ({ caller }) func reviewPayment(paymentId : Nat, approve : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can review payments");
    };
    switch (paymentRequests.get(paymentId)) {
      case (null) {
        Runtime.trap("Payment request not found");
      };
      case (?request) {
        let updated = {
          id = request.id;
          userId = request.userId;
          amount = request.amount;
          status = if (approve) { #accepted } else { #declined };
          createdAt = request.createdAt;
        };
        paymentRequests.add(paymentId, updated);
      };
    };
  };

  public query ({ caller }) func getUserPayments(userId : Principal) : async [PaymentRequest] {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view payments");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all payments");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view user analytics");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all analytics");
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
};
