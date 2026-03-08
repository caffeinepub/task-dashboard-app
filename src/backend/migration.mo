import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";

module {
  type Blob = Storage.ExternalBlob;
  type TaskStatus = {
    #pending;
    #approved;
    #declined;
  };

  type BankDetails = {
    ifscCode : Text;
    bankName : Text;
    accountNumber : Text;
  };

  type UserProfile = {
    email : Text;
    role : Text;
    isBlocked : Bool;
    coinBalance : Nat;
    bankDetails : ?BankDetails;
  };

  type OldTask = {
    id : Nat;
    title : Text;
    image : ?Blob;
  };

  type NewTask = {
    id : Nat;
    title : Text;
    image : ?Blob;
    reward : Nat;
  };

  type Submission = {
    id : Nat;
    userId : Principal.Principal;
    taskId : Nat;
    file : Blob;
    status : TaskStatus;
    createdAt : Int;
  };

  type PaymentRequest = {
    id : Nat;
    userId : Principal.Principal;
    amount : Nat;
    status : { #pending; #approved; #inPayment; #transferred; #declined };
    createdAt : Int;
    orderId : Text;
    coinsDeducted : Bool;
  };

  type OldActor = {
    tasks : Map.Map<Nat, OldTask>;
    submissions : Map.Map<Nat, Submission>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    paymentRequests : Map.Map<Nat, PaymentRequest>;
    nextSubmissionId : Nat;
    nextPaymentId : Nat;
    userAnalytics : Map.Map<Principal.Principal, {
      var lastLogin : ?Int;
      var tasksCompleted : Nat;
      var totalSubmissions : Nat;
    }>;
    accessControlState : AccessControl.AccessControlState;
    autoRegisteredUsers : Map.Map<Principal.Principal, Bool>;
  };

  type NewActor = {
    tasks : Map.Map<Nat, NewTask>;
    submissions : Map.Map<Nat, Submission>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    paymentRequests : Map.Map<Nat, PaymentRequest>;
    nextSubmissionId : Nat;
    nextPaymentId : Nat;
    userAnalytics : Map.Map<Principal.Principal, {
      var lastLogin : ?Int;
      var tasksCompleted : Nat;
      var totalSubmissions : Nat;
    }>;
    accessControlState : AccessControl.AccessControlState;
    autoRegisteredUsers : Map.Map<Principal.Principal, Bool>;
  };

  public func run(old : OldActor) : NewActor {
    let newTasks = old.tasks.map<Nat, OldTask, NewTask>(
      func(_id, oldTask) {
        {
          id = oldTask.id;
          title = oldTask.title;
          image = oldTask.image;
          reward = 0;
        };
      }
    );
    {
      old with
      tasks = newTasks;
    };
  };
};
