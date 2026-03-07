import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AuthScreen } from "./components/app/AuthScreen";
import { BottomNav, type NavTab } from "./components/app/BottomNav";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile, useIsAdmin } from "./hooks/useQueries";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";

export default function App() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [showAdmin, setShowAdmin] = useState(false);

  // Route to admin when admin tab selected
  useEffect(() => {
    if (activeTab === "admin") {
      setShowAdmin(true);
    }
  }, [activeTab]);

  const handleTabChange = (tab: NavTab) => {
    if (tab === "admin") {
      setShowAdmin(true);
    } else {
      setShowAdmin(false);
      setActiveTab(tab);
    }
  };

  const handleBackFromAdmin = () => {
    setShowAdmin(false);
    setActiveTab("home");
  };

  // Loading state while initializing auth
  if (isInitializing || loginStatus === "initializing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 195 / 0.2), oklch(0.7 0.2 300 / 0.2))",
              border: "1px solid oklch(0.75 0.18 195 / 0.3)",
            }}
          >
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Initializing…</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show auth screen
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen hasProfile={false} onProfileSaved={() => {}} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.19 0.025 265)",
              border: "1px solid oklch(0.28 0.04 265 / 0.6)",
              color: "oklch(0.95 0.01 260)",
            },
          }}
        />
      </>
    );
  }

  // Still loading profile
  if (profileLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  // Authenticated but no profile → show profile setup
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
              background: "oklch(0.19 0.025 265)",
              border: "1px solid oklch(0.28 0.04 265 / 0.6)",
              color: "oklch(0.95 0.01 260)",
            },
          }}
        />
      </>
    );
  }

  const principal = identity?.getPrincipal();

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Max-width container for main screens */}
        <div className={showAdmin ? "w-full" : "max-w-lg mx-auto"}>
          <AnimatePresence mode="wait">
            {showAdmin ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <AdminPage onBack={handleBackFromAdmin} />
              </motion.div>
            ) : activeTab === "home" ? (
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

        {/* Bottom Navigation — only when not in admin view */}
        {!showAdmin && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAdmin={isAdmin ?? false}
          />
        )}
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.19 0.025 265)",
            border: "1px solid oklch(0.28 0.04 265 / 0.6)",
            color: "oklch(0.95 0.01 260)",
          },
        }}
      />
    </>
  );
}
