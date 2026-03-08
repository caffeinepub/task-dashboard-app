import { Toaster } from "@/components/ui/sonner";
import { Coins, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AdminAuthGate } from "./components/app/AdminAuthGate";
import { AuthScreen } from "./components/app/AuthScreen";
import { BottomNav, type NavTab } from "./components/app/BottomNav";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCallerProfile,
  useIsAdmin,
  useRecordLastLogin,
} from "./hooks/useQueries";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";

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

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const recordLastLogin = useRecordLastLogin();
  const { actor } = useActor();

  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [showSplash, setShowSplash] = useState(false);

  // Track whether the user was previously unauthenticated (for detecting fresh login)
  const prevAuthRef = useRef(false);

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

  const principal = identity?.getPrincipal();

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
