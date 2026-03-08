import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

module {
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
  };

  public type TaskStatus = {
    #pending;
    #approved;
    #declined;
  };

  public type Task = {
    id : Nat;
    title : Text;
    image : ?Blob;
  };

  public type Submission = {
    id : Nat;
    userId : Principal;
    taskId : Nat;
    file : Blob;
    status : TaskStatus;
    createdAt : Int;
  };

  public type Actor = {
    tasks : Map.Map<Nat, Task>;
    submissions : Map.Map<Nat, Submission>;
    nextSubmissionId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
    paymentRequests : Map.Map<Nat, PaymentRequest>;
    nextPaymentId : Nat;
    userAnalytics : Map.Map<Principal, {
      var lastLogin : ?Int;
      var tasksCompleted : Nat;
      var totalSubmissions : Nat;
    }>;
    autoRegisteredUsers : Map.Map<Principal, Bool>;
  };

  public func run(old : Actor) : Actor {
    old;
  };
};
