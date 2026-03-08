import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldPaymentRequest = {
    id : Nat;
    userId : Principal.Principal;
    amount : Nat;
    status : { #pending; #accepted; #declined };
    createdAt : Int;
  };

  type OldActor = {
    paymentRequests : Map.Map<Nat, OldPaymentRequest>;
  };

  type NewPaymentRequest = {
    id : Nat;
    userId : Principal.Principal;
    amount : Nat;
    status : { #pending; #accepted; #declined };
    createdAt : Int;
    orderId : Text;
  };

  type NewActor = {
    paymentRequests : Map.Map<Nat, NewPaymentRequest>;
  };

  public func run(old : OldActor) : NewActor {
    let newPaymentRequests = old.paymentRequests.map<Nat, OldPaymentRequest, NewPaymentRequest>(
      func(_id, oldRequest) {
        { oldRequest with orderId = "" };
      }
    );
    { old with paymentRequests = newPaymentRequests };
  };
};
