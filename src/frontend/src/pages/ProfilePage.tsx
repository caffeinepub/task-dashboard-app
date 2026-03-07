import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import {
  CheckCircle,
  Clock,
  Loader2,
  LogOut,
  Mail,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
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

  return (
    <div data-ocid="profile.page" className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3"
        style={{
          background: "oklch(0.13 0.02 260 / 0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.28 0.04 265 / 0.4)",
        }}
      >
        <h1 className="font-display text-xl font-bold text-foreground">
          Profile
        </h1>
      </header>

      <main className="px-4 pt-5 pb-24 space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-3xl p-5"
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
                    "linear-gradient(135deg, oklch(0.75 0.18 195), oklch(0.7 0.2 220))",
                  color: "oklch(0.1 0.02 260)",
                }}
              >
                {profile?.email ? (
                  profile.email.charAt(0).toUpperCase()
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-foreground text-base truncate">
                    {profile?.email?.split("@")[0] ?? "Anonymous"}
                  </h2>
                  {isAdmin && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: "oklch(0.7 0.2 300 / 0.15)",
                        color: "oklch(0.7 0.2 300)",
                        border: "1px solid oklch(0.7 0.2 300 / 0.3)",
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
