import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldActor = {
    userProfiles : Map.Map<Principal, {
      email : Text;
      role : Text;
      isBlocked : Bool;
    }>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, {
      email : Text;
      role : Text;
      isBlocked : Bool;
      coinBalance : Nat;
    }>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, { email : Text; role : Text; isBlocked : Bool }, { email : Text; role : Text; isBlocked : Bool; coinBalance : Nat }>(
      func(_principal, oldProfile) {
        { oldProfile with coinBalance = 0 };
      }
    );
    { old with userProfiles = newUserProfiles };
  };
};
