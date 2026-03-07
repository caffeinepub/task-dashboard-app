import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Array "mo:core/Array";

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
    role : Text; // "admin" or "user"
    isBlocked : Bool;
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
      let timeOrder = Int.compare(s2.createdAt, s1.createdAt); // Most recent first
      if (timeOrder != #equal) {
        return timeOrder;
      };
      Nat.compare(s1.id, s2.id);
    };
  };

  // Persistent storage
  let tasks = Map.empty<Nat, Task.Task>();
  let submissions = Map.empty<Nat, Submission.Submission>();
  var nextSubmissionId : Nat = 0;
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Initialize 6 tasks
  private func initTasks() {
    for (i in [0, 1, 2, 3, 4, 5].values()) {
      tasks.add(i, { id = i; title = "Task " # i.toText(); image = null });
    };
  };
  initTasks();

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    // Check if user is blocked
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

  // Admin user management
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

  // Helper to check if user is blocked
  private func isUserBlocked(userId : Principal) : Bool {
    switch (userProfiles.get(userId)) {
      case (?profile) { profile.isBlocked };
      case null { false };
    };
  };

  // Admin functions for tasks
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

  // Get all tasks - requires user authentication
  public query ({ caller }) func getTasks() : async [Task.Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view tasks");
    };
    if (isUserBlocked(caller)) {
      Runtime.trap("Unauthorized: User is blocked");
    };
    tasks.values().toArray().sort();
  };

  // User submissions
  public shared ({ caller }) func submitTask(taskId : Nat, file : Blob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
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
  };

  // Admin review submissions
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
      };
    };
  };

  // Get submissions for user
  public query ({ caller }) func getUserSubmissions(userId : Principal) : async [Submission.Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view submissions");
    };
    // Users can only view their own submissions, admins can view any
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

  // Get all submissions (admin only)
  public query ({ caller }) func getAllSubmissions() : async [Submission.Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all submissions");
    };
    submissions.values().toArray().sort();
  };
};
