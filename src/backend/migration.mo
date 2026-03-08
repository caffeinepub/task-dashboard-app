import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

module {
  type OldUserProfile = {
    email : Text;
    role : Text;
    isBlocked : Bool;
    coinBalance : Nat;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewUserProfile = {
    email : Text;
    role : Text;
    isBlocked : Bool;
    coinBalance : Nat;
    bankDetails : ?{
      ifscCode : Text;
      bankName : Text;
      accountNumber : Text;
    };
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_id, oldProfile) {
        { oldProfile with bankDetails = null };
      }
    );
    { userProfiles = newUserProfiles };
  };
};
