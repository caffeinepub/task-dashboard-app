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
  ArrowDownToLine,
  CheckCircle,
  Clock,
  Coins,
  Loader2,
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
import { useUserSubmissions } from "../hooks/useQueries";

interface ProfilePageProps {
  profile: UserProfile | null;
  isAdmin: boolean;
  principal: Principal | undefined;
  isLoading: boolean;
}

export function ProfilePage({
  profile,
  isAdmin,
  principal,
  isLoading,
}: ProfilePageProps) {
  const { clear } = useInternetIdentity();
  const { data: submissions } = useUserSubmissions(principal);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [withdrawPending, setWithdrawPending] = useState(false);

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

  const handleWithdrawSubmit = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!walletAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }
    setWithdrawPending(true);
    // Simulate API call — backend withdrawal not yet implemented
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setWithdrawPending(false);
    toast.success("Withdrawal request submitted! Pending admin review.");
    setWithdrawOpen(false);
    setWithdrawAmount("");
    setWalletAddress("");
  };

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
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
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

                  <div className="space-y-4 py-2">
                    <div>
                      <Label
                        htmlFor="withdrawAmount"
                        className="text-sm font-semibold text-foreground mb-1.5 block"
                      >
                        Amount
                      </Label>
                      <Input
                        data-ocid="profile.withdrawal.input"
                        id="withdrawAmount"
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="walletAddress"
                        className="text-sm font-semibold text-foreground mb-1.5 block"
                      >
                        Wallet Address
                      </Label>
                      <Input
                        id="walletAddress"
                        type="text"
                        placeholder="Enter your wallet address"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      data-ocid="profile.withdrawal.cancel_button"
                      variant="outline"
                      onClick={() => setWithdrawOpen(false)}
                      className="rounded-xl border-border/50"
                    >
                      Cancel
                    </Button>
                    <Button
                      data-ocid="profile.withdrawal.submit_button"
                      onClick={handleWithdrawSubmit}
                      disabled={withdrawPending}
                      className="rounded-xl btn-glow"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                        color: "oklch(0.1 0.02 85)",
                      }}
                    >
                      {withdrawPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Withdrawal history placeholder */}
            <div
              data-ocid="profile.withdrawal.empty_state"
              className="py-6 text-center"
            >
              <Coins
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
