import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Coins,
  Loader2,
  Lock,
  LogOut,
  ShieldOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminAuthGate } from "./components/app/AdminAuthGate";
import { AuthScreen } from "./components/app/AuthScreen";
import { BottomNav, type NavTab } from "./components/app/BottomNav";
import { useActor } from "./hooks/useActor";
import { useAnticheat } from "./hooks/useAnticheat";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCallerProfile,
  useIsAdmin,
  useRecordLastLogin,
  useSaveBankDetails,
} from "./hooks/useQueries";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";

// ── IFSC types ────────────────────────────────────────────────────────────────
interface IFSCResponse {
  BANK: string;
  BRANCH: string;
  CITY: string;
  STATE: string;
  IFSC: string;
}

// Detect if the current URL path is /admin
const isAdminRoute =
  window.location.pathname === "/admin" ||
  window.location.pathname.startsWith("/admin/");

// ── Splash Screen Component ───────────────────────────────────────────────────

function SplashScreen() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.82 0.18 85 / 0.08) 0%, transparent 70%)",
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.82 0.18 85) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.82 0.18 85) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.75, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="flex flex-col items-center gap-7 relative z-10"
      >
        {/* Gold coin logo */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px oklch(0.82 0.18 85 / 0.4), 0 0 40px oklch(0.82 0.18 85 / 0.2)",
              "0 0 50px oklch(0.82 0.18 85 / 0.7), 0 0 80px oklch(0.82 0.18 85 / 0.4)",
              "0 0 20px oklch(0.82 0.18 85 / 0.4), 0 0 40px oklch(0.82 0.18 85 / 0.2)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="w-32 h-32 rounded-3xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.2), oklch(0.7 0.12 80 / 0.1))",
            border: "2px solid oklch(0.82 0.18 85 / 0.5)",
          }}
        >
          <Coins
            className="w-16 h-16"
            style={{ color: "oklch(0.82 0.18 85)" }}
          />
        </motion.div>

        {/* App name */}
        <div className="text-center space-y-1.5">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="font-display text-5xl font-bold tracking-tight"
            style={{ color: "oklch(0.82 0.18 85)" }}
          >
            Dark Coin
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground text-sm tracking-wide"
          >
            Complete tasks. Earn Dark Coin.
          </motion.p>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-2.5 w-64"
        >
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-secondary/60">
            <div
              className="h-full rounded-full splash-progress"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.82 0.18 85), oklch(0.92 0.1 90))",
              }}
            />
          </div>
          <p className="text-muted-foreground text-xs tracking-widest animate-pulse uppercase">
            Loading…
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Freeze Screen Component ────────────────────────────────────────────────────

function FreezeScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 70% at 50% 30%, oklch(0.25 0.12 25 / 0.9) 0%, oklch(0.08 0.03 25) 70%)",
      }}
    >
      {/* Red grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.6 0.25 25) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.6 0.25 25) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow pulse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 2.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, oklch(0.55 0.25 25 / 0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-sm">
        {/* Dark Coin branding */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(0.55 0.25 25 / 0.2)",
              border: "1px solid oklch(0.55 0.25 25 / 0.4)",
            }}
          >
            <Coins
              className="w-4 h-4"
              style={{ color: "oklch(0.7 0.15 25)" }}
            />
          </div>
          <span
            className="font-display text-sm font-bold tracking-wide"
            style={{ color: "oklch(0.7 0.15 25)" }}
          >
            Dark Coin
          </span>
        </div>

        {/* Icon */}
        <motion.div
          animate={{
            scale: [1, 1.04, 1],
            boxShadow: [
              "0 0 30px oklch(0.55 0.25 25 / 0.3), 0 0 60px oklch(0.55 0.25 25 / 0.15)",
              "0 0 50px oklch(0.55 0.25 25 / 0.6), 0 0 100px oklch(0.55 0.25 25 / 0.3)",
              "0 0 30px oklch(0.55 0.25 25 / 0.3), 0 0 60px oklch(0.55 0.25 25 / 0.15)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: "oklch(0.55 0.25 25 / 0.15)",
            border: "2px solid oklch(0.55 0.25 25 / 0.4)",
          }}
        >
          <ShieldOff
            className="w-12 h-12"
            style={{ color: "oklch(0.65 0.25 25)" }}
          />
        </motion.div>

        {/* Text */}
        <div className="space-y-3">
          <h1
            className="font-display text-3xl font-bold tracking-tight"
            style={{ color: "oklch(0.65 0.25 25)" }}
          >
            Account Frozen
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "oklch(0.55 0.12 25)" }}
          >
            Suspicious activity detected. Your account has been frozen.
          </p>
          <p className="text-xs" style={{ color: "oklch(0.45 0.1 25)" }}>
            Please contact support to resolve this issue.
          </p>
        </div>

        {/* Sign out */}
        <Button
          data-ocid="freeze.logout_button"
          onClick={onSignOut}
          variant="outline"
          className="mt-2 h-11 px-8 rounded-2xl font-semibold"
          style={{
            borderColor: "oklch(0.55 0.25 25 / 0.4)",
            color: "oklch(0.65 0.25 25)",
            background: "oklch(0.55 0.25 25 / 0.1)",
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
}

// ── Bank Setup Screen ─────────────────────────────────────────────────────────

function BankSetupScreen() {
  const saveBankDetails = useSaveBankDetails();

  const [step, setStep] = useState<1 | 2>(1);
  const [ifscCode, setIfscCode] = useState("");
  const [ifscVerified, setIfscVerified] = useState(false);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<IFSCResponse | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);

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

  const handleSave = async () => {
    setAccountError(null);
    if (!accountNumber.trim() || accountNumber.length < 9) {
      setAccountError("Account number must be at least 9 digits");
      return;
    }
    if (!/^\d+$/.test(accountNumber)) {
      setAccountError("Account number must contain digits only");
      return;
    }
    if (accountNumber !== confirmAccount) {
      setAccountError("Account numbers do not match");
      return;
    }
    if (!bankInfo) return;
    try {
      await saveBankDetails.mutateAsync({
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankInfo.BANK,
        accountNumber: accountNumber.trim(),
      });
      toast.success("Bank account linked successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg = msg.includes(":")
        ? msg.split(":").slice(-1)[0].trim()
        : msg;
      toast.error(
        displayMsg || "Failed to save bank details. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.18 85 / 0.06) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(oklch(0.82 0.18 85) 1px, transparent 1px),
              linear-gradient(90deg, oklch(0.82 0.18 85) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1,
              duration: 0.4,
              type: "spring",
              stiffness: 200,
            }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.2), oklch(0.75 0.15 80 / 0.1))",
              border: "1.5px solid oklch(0.82 0.18 85 / 0.4)",
              boxShadow: "0 0 32px oklch(0.82 0.18 85 / 0.25)",
            }}
          >
            <Building2
              className="w-10 h-10"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl font-bold tracking-tight"
            style={{ color: "oklch(0.82 0.18 85)" }}
          >
            Link Bank Account
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm mt-1.5"
          >
            Required to receive your Dark Coin earnings
          </motion.p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5 justify-center">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={
                  step >= s
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                        color: "oklch(0.1 0.02 85)",
                      }
                    : {
                        background: "oklch(0.2 0.02 265)",
                        color: "oklch(0.5 0.05 265)",
                        border: "1px solid oklch(0.3 0.03 265)",
                      }
                }
              >
                {s}
              </div>
              {s < 2 && (
                <div
                  className="w-8 h-0.5 rounded-full transition-all duration-300"
                  style={{
                    background:
                      step > s
                        ? "linear-gradient(90deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))"
                        : "oklch(0.25 0.02 265)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="glass-card rounded-3xl p-6"
          style={{ border: "1px solid oklch(0.82 0.18 85 / 0.12)" }}
        >
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Verify Your Bank
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Enter your IFSC code to auto-detect your bank
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold text-foreground mb-1.5 block">
                  IFSC Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    data-ocid="bank_setup.ifsc_input"
                    value={ifscCode}
                    onChange={(e) => {
                      setIfscCode(e.target.value.toUpperCase());
                      setIfscVerified(false);
                      setBankInfo(null);
                      setIfscError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyIFSC()}
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                    className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 font-mono uppercase flex-1"
                  />
                  <Button
                    data-ocid="bank_setup.verify_button"
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
                  data-ocid="bank_setup.continue_button"
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
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Account Number
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Enter and confirm your account number
                </p>
              </div>

              {/* Bank badge */}
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
                  data-ocid="bank_setup.account_input"
                  value={accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setAccountNumber(val);
                    setAccountError(null);
                  }}
                  placeholder="Enter account number"
                  inputMode="numeric"
                  maxLength={17}
                  className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 font-mono"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-foreground mb-1.5 block">
                  Confirm Account Number
                </Label>
                <Input
                  data-ocid="bank_setup.confirm_account_input"
                  value={confirmAccount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setConfirmAccount(val);
                    setAccountError(null);
                  }}
                  placeholder="Re-enter account number"
                  inputMode="numeric"
                  maxLength={17}
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
                  later. Only admin can modify them.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  data-ocid="bank_setup.back_button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl flex-1 h-11 border-border/50 text-sm"
                >
                  Back
                </Button>
                <Button
                  data-ocid="bank_setup.save_button"
                  onClick={handleSave}
                  disabled={
                    saveBankDetails.isPending ||
                    accountNumber.length < 9 ||
                    accountNumber !== confirmAccount
                  }
                  className="rounded-xl flex-1 h-11 font-semibold text-sm btn-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                    color: "oklch(0.1 0.02 85)",
                  }}
                >
                  {saveBankDetails.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save & Continue"
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
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
      </motion.div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { identity, isInitializing, loginStatus, clear } =
    useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const recordLastLogin = useRecordLastLogin();
  const { actor } = useActor();

  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [showSplash, setShowSplash] = useState(false);

  // Track whether the user was previously unauthenticated (for detecting fresh login)
  const prevAuthRef = useRef(false);

  // ── Anticheat — called at top level (rules of hooks) ──────────────────────
  // principal and profile may be undefined/null; hook handles those cases gracefully
  const principal = identity?.getPrincipal();
  const { isFrozen } = useAnticheat(
    principal,
    isAuthenticated && !!profile && !isAdminRoute,
  );

  // Record last login only after the user has a profile (i.e., they're already registered).
  // Calling this before saveCallerUserProfile causes a permission error for new users.
  const recordLastLoginMutate = recordLastLogin.mutate;
  useEffect(() => {
    if (isAuthenticated && actor && profile) {
      recordLastLoginMutate();
    }
  }, [isAuthenticated, actor, profile, recordLastLoginMutate]);

  // When user transitions from unauthenticated → authenticated + has profile → show splash
  // Skip splash when on admin route
  useEffect(() => {
    if (!isAdminRoute && !prevAuthRef.current && isAuthenticated && profile) {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 3500);
      prevAuthRef.current = true;
      return () => clearTimeout(timer);
    }
    if (isAuthenticated) {
      prevAuthRef.current = true;
    }
  }, [isAuthenticated, profile]);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
  };

  const handleBackFromAdmin = () => {
    // Navigate back to home when leaving admin
    window.location.href = "/";
  };

  // ── Loading state while initializing auth ─────────────────────────────────
  if (isInitializing || loginStatus === "initializing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.2), oklch(0.75 0.15 80 / 0.1))",
              border: "1px solid oklch(0.82 0.18 85 / 0.3)",
              boxShadow: "0 0 20px oklch(0.82 0.18 85 / 0.2)",
            }}
          >
            <Coins
              className="w-7 h-7"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
            <p className="text-muted-foreground text-sm">Initializing…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not authenticated → show auth screen ─────────────────────────────────
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen hasProfile={false} onProfileSaved={() => {}} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.14 0.015 265)",
              border: "1px solid oklch(0.24 0.03 265 / 0.6)",
              color: "oklch(0.96 0.008 80)",
            },
          }}
        />
      </>
    );
  }

  // ── Admin route — render admin panel directly, no bottom nav ─────────────
  // This check must come before the profile guard so /admin works even if
  // the authenticated user has not yet completed their profile setup.
  if (isAdminRoute) {
    return (
      <>
        <AdminAuthGate onBack={handleBackFromAdmin} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.14 0.015 265)",
              border: "1px solid oklch(0.24 0.03 265 / 0.6)",
              color: "oklch(0.96 0.008 80)",
            },
          }}
        />
      </>
    );
  }

  // ── Still loading profile ─────────────────────────────────────────────────
  if (profileLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "oklch(0.82 0.18 85)" }}
          />
          <p className="text-muted-foreground text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  // ── Authenticated but no profile → show profile setup ────────────────────
  if (!profile) {
    return (
      <>
        <AuthScreen
          hasProfile={false}
          onProfileSaved={() => {
            // Profile saved, the query will re-fetch automatically
          }}
        />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.14 0.015 265)",
              border: "1px solid oklch(0.24 0.03 265 / 0.6)",
              color: "oklch(0.96 0.008 80)",
            },
          }}
        />
      </>
    );
  }

  // ── Profile exists but no bank details → force bank setup ────────────────
  // Skip for admin route (already handled above)
  if (profile && !profile.bankDetails) {
    return (
      <>
        <BankSetupScreen />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.14 0.015 265)",
              border: "1px solid oklch(0.24 0.03 265 / 0.6)",
              color: "oklch(0.96 0.008 80)",
            },
          }}
        />
      </>
    );
  }

  if (isFrozen) {
    return (
      <>
        <FreezeScreen onSignOut={() => clear()} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.14 0.015 265)",
              border: "1px solid oklch(0.24 0.03 265 / 0.6)",
              color: "oklch(0.96 0.008 80)",
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      {/* Splash screen overlay (post-login) */}
      <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>

      <div className="min-h-screen bg-background">
        {/* Max-width container for main screens */}
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "home" ? (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <HomePage
                  profile={profile}
                  isAdmin={isAdmin ?? false}
                  principal={principal}
                />
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ProfilePage
                  profile={profile}
                  isAdmin={isAdmin ?? false}
                  principal={principal}
                  isLoading={profileLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isAdmin={isAdmin ?? false}
        />
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.14 0.015 265)",
            border: "1px solid oklch(0.24 0.03 265 / 0.6)",
            color: "oklch(0.96 0.008 80)",
          },
        }}
      />
    </>
  );
}
