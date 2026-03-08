import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import {
  AlertCircle,
  ArrowDownToLine,
  BadgeCheck,
  Building2,
  CheckCircle,
  Clock,
  Coins,
  CreditCard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Shield,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCoinBalance,
  useRequestPayment,
  useSaveBankDetails,
  useUserPayments,
  useUserSubmissions,
} from "../hooks/useQueries";

interface ProfilePageProps {
  profile: UserProfile | null;
  isAdmin: boolean;
  principal: Principal | undefined;
  isLoading: boolean;
}

// ── IFSC API response shape ────────────────────────────────────────────────

interface IFSCResponse {
  BANK: string;
  BRANCH: string;
  CITY: string;
  STATE: string;
  IFSC: string;
}

// ── Masked account number helper ───────────────────────────────────────────

function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  return "●".repeat(account.length - 4) + account.slice(-4);
}

// ── Withdrawal Dialog ──────────────────────────────────────────────────────

function WithdrawalDialog({
  open,
  onOpenChange,
  profile,
  coinBalance,
  userPayments,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: UserProfile | null;
  coinBalance: bigint;
  userPayments: Array<{
    status: unknown;
    id: bigint;
    amount: bigint;
    createdAt: bigint;
    userId: Principal;
  }>;
}) {
  const saveBankDetails = useSaveBankDetails();
  const requestPayment = useRequestPayment();

  // Step state: 1 = IFSC, 2 = Account number
  const [step, setStep] = useState<1 | 2>(1);

  // IFSC step
  const [ifscCode, setIfscCode] = useState("");
  const [ifscVerified, setIfscVerified] = useState(false);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<IFSCResponse | null>(null);

  // Account step
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);

  const hasBankDetails = !!profile?.bankDetails;
  const balance = Number(coinBalance);
  const hasPendingWithdrawal = userPayments.some(
    (p) => String(p.status) === "pending",
  );

  const resetState = () => {
    setStep(1);
    setIfscCode("");
    setIfscVerified(false);
    setIfscLoading(false);
    setIfscError(null);
    setBankInfo(null);
    setAccountNumber("");
    setConfirmAccountNumber("");
    setAccountError(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  const handleVerifyIFSC = async () => {
    const code = ifscCode.trim().toUpperCase();
    if (!code || code.length < 11) {
      setIfscError("Please enter a valid 11-character IFSC code");
      return;
    }
    setIfscError(null);
    setIfscVerified(false);
    setIfscLoading(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${code}`);
      if (!res.ok) {
        setIfscError("Invalid IFSC code. Please check and try again.");
        return;
      }
      const data: IFSCResponse = await res.json();
      setBankInfo(data);
      setIfscVerified(true);
    } catch {
      setIfscError(
        "Could not verify IFSC. Please check your internet connection.",
      );
    } finally {
      setIfscLoading(false);
    }
  };

  const handleSaveBankAndWithdraw = async () => {
    setAccountError(null);
    if (!accountNumber.trim() || accountNumber.trim().length < 9) {
      setAccountError("Account number must be at least 9 digits");
      return;
    }
    if (!/^\d+$/.test(accountNumber)) {
      setAccountError("Account number must contain digits only");
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      setAccountError("Account numbers do not match");
      return;
    }
    if (!bankInfo) return;

    let bankSaved = false;
    try {
      await saveBankDetails.mutateAsync({
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankInfo.BANK,
        accountNumber: accountNumber.trim(),
      });
      bankSaved = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // If bank details were already saved previously, proceed to payment
      if (msg.toLowerCase().includes("already")) {
        bankSaved = true;
      } else {
        // Show specific error message from backend
        const displayMsg = msg.includes(":")
          ? msg.split(":").slice(-1)[0].trim()
          : msg;
        toast.error(
          displayMsg
            ? `Bank save failed: ${displayMsg}`
            : "Failed to save bank details. Please try again.",
        );
        return;
      }
    }

    if (!bankSaved) return;

    // Now request payment
    try {
      await requestPayment.mutateAsync(coinBalance);
      toast.success("Withdrawal request submitted! Pending admin review.");
      handleOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg = msg.includes(":")
        ? msg.split(":").slice(-1)[0].trim()
        : msg;
      toast.error(
        displayMsg || "Failed to submit withdrawal. Please try again.",
      );
    }
  };

  const handleDirectWithdraw = async () => {
    try {
      await requestPayment.mutateAsync(coinBalance);
      toast.success("Withdrawal request submitted! Pending admin review.");
      handleOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit withdrawal";
      toast.error(msg);
    }
  };

  const canWithdraw = balance > 0 && !hasPendingWithdrawal;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          data-ocid="profile.withdrawal.open_modal_button"
          size="sm"
          className="rounded-xl h-8 text-xs font-bold btn-glow"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
            color: "oklch(0.1 0.02 85)",
          }}
        >
          <ArrowDownToLine className="w-3 h-3 mr-1.5" />
          Withdraw
        </Button>
      </DialogTrigger>

      <DialogContent
        data-ocid="profile.withdrawal.dialog"
        className="rounded-3xl border-border/50 max-w-sm"
        style={{
          background: "oklch(0.14 0.015 265)",
          border: "1px solid oklch(0.82 0.18 85 / 0.15)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-foreground">
            Request Withdrawal
          </DialogTitle>
        </DialogHeader>

        {/* Balance display */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{
            background: "oklch(0.82 0.18 85 / 0.08)",
            border: "1px solid oklch(0.82 0.18 85 / 0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <Coins
              className="w-4 h-4"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
            <span className="text-sm text-muted-foreground">
              Available Balance
            </span>
          </div>
          <span
            className="font-display font-bold text-lg tabular-nums"
            style={{ color: "oklch(0.82 0.18 85)" }}
          >
            {balance.toLocaleString()} DC
          </span>
        </div>

        {hasPendingWithdrawal && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: "oklch(0.82 0.18 85 / 0.08)",
              border: "1px solid oklch(0.82 0.18 85 / 0.2)",
            }}
          >
            <Clock
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
            <p className="text-xs" style={{ color: "oklch(0.82 0.18 85)" }}>
              You have a pending withdrawal request
            </p>
          </div>
        )}

        {balance === 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: "oklch(var(--destructive) / 0.08)",
              border: "1px solid oklch(var(--destructive) / 0.2)",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-destructive" />
            <p className="text-xs text-destructive">No balance to withdraw</p>
          </div>
        )}

        {/* ── Has bank details → direct withdraw ── */}
        {hasBankDetails && profile?.bankDetails && (
          <div className="space-y-3 py-1">
            <div
              className="space-y-2 p-4 rounded-2xl"
              style={{
                background: "oklch(0.12 0.015 265 / 0.7)",
                border: "1px solid oklch(0.82 0.18 85 / 0.1)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Building2
                  className="w-4 h-4"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                />
                <span className="text-sm font-semibold text-foreground">
                  {profile.bankDetails.bankName}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Account Number</p>
                  <p className="font-mono text-foreground mt-0.5">
                    {maskAccount(profile.bankDetails.accountNumber)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">IFSC Code</p>
                  <p className="font-mono text-foreground mt-0.5">
                    {profile.bankDetails.ifscCode}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2 rounded-xl"
              style={{ background: "oklch(0.12 0.01 265 / 0.5)" }}
            >
              <Lock className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Bank details are permanent. Contact admin to change.
              </p>
            </div>
          </div>
        )}

        {/* ── No bank details → 2-step form ── */}
        {!hasBankDetails && (
          <div className="space-y-4 py-1">
            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-foreground mb-1.5 block">
                    IFSC Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      data-ocid="profile.withdrawal.ifsc_input"
                      value={ifscCode}
                      onChange={(e) => {
                        setIfscCode(e.target.value.toUpperCase());
                        setIfscVerified(false);
                        setBankInfo(null);
                        setIfscError(null);
                      }}
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                      className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 font-mono uppercase flex-1"
                    />
                    <Button
                      data-ocid="profile.withdrawal.verify_ifsc_button"
                      onClick={handleVerifyIFSC}
                      disabled={ifscLoading || ifscCode.length < 11}
                      className="rounded-xl h-11 px-4 text-xs font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                        color: "oklch(0.1 0.02 85)",
                      }}
                    >
                      {ifscLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                  {ifscError && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {ifscError}
                    </p>
                  )}
                </div>

                {/* Bank info card on success */}
                {ifscVerified && bankInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-2xl space-y-1"
                    style={{
                      background: "oklch(0.72 0.18 155 / 0.08)",
                      border: "1px solid oklch(0.72 0.18 155 / 0.2)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BadgeCheck
                        className="w-4 h-4"
                        style={{ color: "oklch(0.72 0.18 155)" }}
                      />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "oklch(0.72 0.18 155)" }}
                      >
                        Bank Verified
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {bankInfo.BANK}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bankInfo.BRANCH} · {bankInfo.CITY}, {bankInfo.STATE}
                    </p>
                  </motion.div>
                )}

                {ifscVerified && (
                  <Button
                    onClick={() => setStep(2)}
                    className="w-full h-11 rounded-2xl font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                      color: "oklch(0.1 0.02 85)",
                    }}
                  >
                    Continue
                  </Button>
                )}
              </div>
            )}

            {step === 2 && bankInfo && (
              <div className="space-y-3">
                {/* Bank confirmed badge */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: "oklch(0.72 0.18 155 / 0.08)",
                    border: "1px solid oklch(0.72 0.18 155 / 0.2)",
                  }}
                >
                  <BadgeCheck
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.72 0.18 155)" }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {bankInfo.BANK}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {ifscCode}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-foreground mb-1.5 block">
                    Account Number
                  </Label>
                  <Input
                    data-ocid="profile.withdrawal.account_input"
                    value={accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setAccountNumber(val);
                      setAccountError(null);
                    }}
                    placeholder="Enter account number"
                    inputMode="numeric"
                    maxLength={18}
                    className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground mb-1.5 block">
                    Confirm Account Number
                  </Label>
                  <Input
                    data-ocid="profile.withdrawal.confirm_account_input"
                    value={confirmAccountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setConfirmAccountNumber(val);
                      setAccountError(null);
                    }}
                    placeholder="Re-enter account number"
                    inputMode="numeric"
                    maxLength={18}
                    className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 font-mono"
                  />
                </div>

                {accountError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {accountError}
                  </p>
                )}

                <div
                  className="flex items-start gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: "oklch(0.82 0.18 85 / 0.05)",
                    border: "1px solid oklch(0.82 0.18 85 / 0.12)",
                  }}
                >
                  <Lock
                    className="w-3 h-3 mt-0.5 flex-shrink-0"
                    style={{ color: "oklch(0.82 0.18 85 / 0.6)" }}
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Bank details are saved permanently and cannot be changed
                    later.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="rounded-xl flex-1 h-11 border-border/50 text-sm"
                  >
                    Back
                  </Button>
                  <Button
                    data-ocid="profile.withdrawal.save_bank_button"
                    onClick={handleSaveBankAndWithdraw}
                    disabled={
                      !canWithdraw ||
                      saveBankDetails.isPending ||
                      requestPayment.isPending ||
                      accountNumber.length < 9 ||
                      accountNumber !== confirmAccountNumber
                    }
                    className="rounded-xl flex-1 h-11 font-semibold text-sm btn-glow"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                      color: "oklch(0.1 0.02 85)",
                    }}
                  >
                    {saveBankDetails.isPending || requestPayment.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save & Withdraw"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer for existing bank details */}
        {hasBankDetails && (
          <DialogFooter className="gap-2">
            <Button
              data-ocid="profile.withdrawal.cancel_button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl border-border/50"
            >
              Cancel
            </Button>
            <Button
              data-ocid="profile.withdrawal.request_button"
              onClick={handleDirectWithdraw}
              disabled={!canWithdraw || requestPayment.isPending}
              className="rounded-xl btn-glow"
              style={{
                background: canWithdraw
                  ? "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))"
                  : undefined,
                color: canWithdraw ? "oklch(0.1 0.02 85)" : undefined,
              }}
            >
              {requestPayment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Request Withdrawal"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Profile Page ───────────────────────────────────────────────────────────

export function ProfilePage({
  profile,
  isAdmin,
  principal,
  isLoading,
}: ProfilePageProps) {
  const { clear } = useInternetIdentity();
  const { data: submissions } = useUserSubmissions(principal);
  const { data: userPayments } = useUserPayments(principal);
  const { data: coinBalance } = useGetCoinBalance(principal);

  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const submissionStats = {
    total: submissions?.length ?? 0,
    approved:
      submissions?.filter((s) => String(s.status) === "approved").length ?? 0,
    pending:
      submissions?.filter((s) => String(s.status) === "pending").length ?? 0,
    declined:
      submissions?.filter((s) => String(s.status) === "declined").length ?? 0,
  };

  const principalStr = principal?.toString() ?? "";
  const truncatedPrincipal =
    principalStr.length > 20
      ? `${principalStr.slice(0, 10)}…${principalStr.slice(-10)}`
      : principalStr;

  // Derive display name from email prefix
  const displayName = profile?.email?.split("@")[0] ?? "Anonymous";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div data-ocid="profile.page" className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center gap-2.5"
        style={{
          background: "oklch(0.09 0.01 260 / 0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid oklch(0.82 0.18 85 / 0.1)",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: "oklch(0.82 0.18 85 / 0.15)",
            border: "1px solid oklch(0.82 0.18 85 / 0.3)",
          }}
        >
          <User
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.82 0.18 85)" }}
          />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">
          My Profile
        </h1>
      </header>

      <main className="px-4 pt-5 pb-24 space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-3xl p-5"
          style={{ border: "1px solid oklch(0.82 0.18 85 / 0.1)" }}
        >
          {isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-2xl skeleton-shimmer" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/2 skeleton-shimmer rounded-lg" />
                <Skeleton className="h-4 w-3/4 skeleton-shimmer rounded-lg" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-display font-bold flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                  color: "oklch(0.1 0.02 85)",
                  boxShadow: "0 0 16px oklch(0.82 0.18 85 / 0.3)",
                }}
              >
                {profile?.email ? avatarLetter : <User className="w-7 h-7" />}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-foreground text-base truncate">
                    {displayName}
                  </h2>
                  {isAdmin && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: "oklch(0.82 0.18 85 / 0.12)",
                        color: "oklch(0.82 0.18 85)",
                        border: "1px solid oklch(0.82 0.18 85 / 0.25)",
                      }}
                    >
                      <Shield className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  )}
                </div>
                {profile?.email && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <p className="text-muted-foreground text-xs truncate">
                      {profile.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Principal */}
        {principalStr && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-4"
          >
            <p className="text-xs text-muted-foreground mb-1">Principal ID</p>
            <p className="text-sm font-mono text-foreground/80 break-all">
              {truncatedPrincipal}
            </p>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-semibold text-foreground text-sm mb-3 px-1">
            Task Submissions
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Approved",
                count: submissionStats.approved,
                Icon: CheckCircle,
                color: "var(--success)",
              },
              {
                label: "Pending",
                count: submissionStats.pending,
                Icon: Clock,
                color: "var(--warning)",
              },
              {
                label: "Declined",
                count: submissionStats.declined,
                Icon: XCircle,
                color: "var(--destructive)",
              },
            ].map(({ label, count, Icon, color }) => (
              <div
                key={label}
                className="glass-card rounded-2xl p-3 text-center"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: `oklch(${color} / 0.15)` }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: `oklch(${color})` }}
                  />
                </div>
                <p className="font-display font-bold text-xl text-foreground">
                  {count}
                </p>
                <p className="text-muted-foreground text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between"
        >
          <span className="text-muted-foreground text-sm">
            Total Submissions
          </span>
          <span className="font-display font-bold text-foreground text-lg">
            {submissionStats.total}
          </span>
        </motion.div>

        {/* Bank Details (if saved) */}
        {profile?.bankDetails && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21 }}
          >
            <h3 className="font-semibold text-foreground text-sm mb-3 px-1">
              Bank Account
            </h3>
            <div
              className="glass-card rounded-2xl p-4 space-y-2"
              style={{ border: "1px solid oklch(0.82 0.18 85 / 0.1)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Building2
                  className="w-4 h-4"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                />
                <span className="text-sm font-bold text-foreground">
                  {profile.bankDetails.bankName}
                </span>
                <span
                  className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "oklch(0.72 0.18 155 / 0.12)",
                    color: "oklch(0.72 0.18 155)",
                  }}
                >
                  Verified
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Account</p>
                  <p className="font-mono text-foreground mt-0.5">
                    {maskAccount(profile.bankDetails.accountNumber)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">IFSC</p>
                  <p className="font-mono text-foreground mt-0.5">
                    {profile.bankDetails.ifscCode}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Withdrawal Request Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <h3 className="font-semibold text-foreground text-sm mb-3 px-1">
            Withdrawals
          </h3>
          <div
            className="glass-card rounded-2xl p-4"
            style={{ border: "1px solid oklch(0.82 0.18 85 / 0.1)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet
                  className="w-4 h-4"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                />
                <span className="text-sm font-semibold text-foreground">
                  Request Payout
                </span>
              </div>
              <WithdrawalDialog
                open={withdrawOpen}
                onOpenChange={setWithdrawOpen}
                profile={profile}
                coinBalance={coinBalance ?? BigInt(0)}
                userPayments={userPayments ?? []}
              />
            </div>

            {/* Withdrawal history */}
            {userPayments && userPayments.length > 0 ? (
              <div className="space-y-2 mt-1">
                {[...userPayments]
                  .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
                  .map((payment, idx) => {
                    const statusStr = String(payment.status);
                    const statusConfig = {
                      pending: {
                        label: "Pending",
                        color: "oklch(0.82 0.18 85)",
                        bg: "oklch(0.82 0.18 85 / 0.12)",
                        Icon: Clock,
                      },
                      accepted: {
                        label: "Accepted",
                        color: "oklch(0.72 0.18 155)",
                        bg: "oklch(0.72 0.18 155 / 0.12)",
                        Icon: CheckCircle,
                      },
                      declined: {
                        label: "Declined",
                        color: "oklch(var(--destructive))",
                        bg: "oklch(var(--destructive) / 0.12)",
                        Icon: XCircle,
                      },
                    };
                    const cfg =
                      statusConfig[statusStr as keyof typeof statusConfig] ??
                      statusConfig.pending;
                    const dateStr = new Date(
                      Number(payment.createdAt) / 1_000_000,
                    ).toLocaleDateString();
                    return (
                      <div
                        key={String(payment.id)}
                        data-ocid={`profile.withdrawal.item.${idx + 1}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                        style={{
                          background: "oklch(0.12 0.015 265 / 0.6)",
                          border: "1px solid oklch(0.82 0.18 85 / 0.08)",
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.bg }}
                          >
                            <cfg.Icon
                              className="w-3.5 h-3.5"
                              style={{ color: cfg.color }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-bold tabular-nums"
                              style={{ color: "oklch(0.82 0.18 85)" }}
                            >
                              {Number(payment.amount).toLocaleString()}{" "}
                              <span
                                className="text-xs font-normal"
                                style={{
                                  color: "oklch(0.82 0.18 85 / 0.6)",
                                }}
                              >
                                DC
                              </span>
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                              {dateStr}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div
                data-ocid="profile.withdrawal.empty_state"
                className="py-6 text-center"
              >
                <CreditCard
                  className="w-8 h-8 mx-auto mb-2 opacity-25"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                />
                <p className="text-muted-foreground text-xs">
                  No withdrawal requests yet
                </p>
                <p className="text-muted-foreground text-[10px] mt-0.5">
                  Complete approved tasks to request payouts
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="pt-2"
        >
          <Button
            data-ocid="profile.logout_button"
            onClick={() => clear()}
            variant="outline"
            className="w-full h-12 rounded-2xl font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          &copy; {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </main>
    </div>
  );
}
