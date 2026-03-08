import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldBankDetails = {
    ifscCode : Text;
    bankName : Text;
    accountNumber : Text;
  };

  type OldUserProfile = {
    email : Text;
    role : Text;
    isBlocked : Bool;
    coinBalance : Nat;
    bankDetails : ?OldBankDetails;
  };

  type OldTask = {
    id : Nat;
    title : Text;
    image : ?Blob;
    reward : Nat;
  };

  type OldActor = {
    tasks : Map.Map<Nat, OldTask>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewUserProfile = {
    email : Text;
    role : Text;
    isBlocked : Bool;
    coinBalance : Nat;
    bankDetails : ?OldBankDetails;
    uniqueId : ?Text;
  };

  type NewActor = {
    tasks : Map.Map<Nat, OldTask>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_p, oldProfile) {
        { oldProfile with uniqueId = null };
      }
    );
    { old with userProfiles = newProfiles };
  };
};

