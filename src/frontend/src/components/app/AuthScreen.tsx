import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useSaveProfile } from "../../hooks/useQueries";

interface AuthScreenProps {
  hasProfile: boolean;
  onProfileSaved: () => void;
}

export function AuthScreen({ hasProfile, onProfileSaved }: AuthScreenProps) {
  const { login, isLoggingIn, isInitializing, identity } =
    useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const saveProfile = useSaveProfile();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [setupStep, setSetupStep] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isConnected = !!identity;
  const isActorReady = !!actor && !actorFetching;

  const handleLogin = () => {
    login();
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!isActorReady) {
      toast.error(
        "Still connecting to the network, please wait a moment and try again.",
      );
      return;
    }

    setIsSaving(true);
    const profileData = {
      email: email.trim(),
      role: "user",
      isBlocked: false,
    };

    // Try up to 5 times with exponential backoff
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await saveProfile.mutateAsync(profileData);
        toast.success("Welcome to Dark Coin!");
        setShowSplash(true);
        setTimeout(() => {
          setShowSplash(false);
          onProfileSaved();
        }, 3500);
        setIsSaving(false);
        return; // success – exit
      } catch (err) {
        lastError = err;
        console.error(`Profile save attempt ${attempt} failed:`, err);
        if (attempt < 5) {
          // Exponential backoff: 1s, 2s, 3s, 4s
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }
    }

    setIsSaving(false);
    const errMsg =
      lastError instanceof Error ? lastError.message : String(lastError);
    // Show a more helpful error based on what went wrong
    if (errMsg.includes("connecting") || errMsg.includes("Not connected")) {
      toast.error(
        "Could not connect to the network. Please check your internet connection and try again.",
      );
    } else if (errMsg.includes("blocked")) {
      toast.error("Your account has been blocked. Please contact support.");
    } else {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  // After connection, show profile setup if no profile
  const showSetup = isConnected && !hasProfile && setupStep;

  // Auto-show setup step when connected without profile
  if (isConnected && !hasProfile && !setupStep) {
    setSetupStep(true);
  }

  // ── Splash screen (after profile save) ────────────────────────────────────
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.82 0.18 85 / 0.08) 0%, transparent 70%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          {/* Gold coin logo */}
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center gold-pulse"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.25), oklch(0.75 0.15 80 / 0.15))",
              border: "2px solid oklch(0.82 0.18 85 / 0.5)",
            }}
          >
            <Coins
              className="w-14 h-14"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
          </div>

          {/* App name */}
          <div className="text-center">
            <h1
              className="font-display text-4xl font-bold tracking-tight"
              style={{ color: "oklch(0.82 0.18 85)" }}
            >
              Dark Coin
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Complete tasks. Earn Dark Coin.
            </p>
          </div>

          {/* Circular loading indicator */}
          <div className="flex flex-col items-center gap-3 w-56">
            <div className="w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className="h-full rounded-full splash-progress"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.82 0.18 85), oklch(0.9 0.12 90))",
                }}
              />
            </div>
            <p className="text-muted-foreground text-xs tracking-wide animate-pulse">
              Loading your workspace…
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gold radial glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.18 85 / 0.07) 0%, transparent 65%)",
          }}
        />
        {/* Secondary accent */}
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.18 155 / 0.04) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.025]"
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
        {/* Logo / App name */}
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
            <Coins
              className="w-10 h-10"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl font-bold tracking-tight"
            style={{ color: "oklch(0.82 0.18 85)" }}
          >
            Dark Coin
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm mt-1.5"
          >
            Complete tasks. Earn Dark Coin.
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card rounded-3xl p-6"
          style={{
            border: "1px solid oklch(0.82 0.18 85 / 0.12)",
          }}
        >
          {!showSetup ? (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Welcome to Dark Coin
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {isConnected
                    ? "Setting up your account…"
                    : "Sign in to start earning rewards"}
                </p>
              </div>

              {/* Feature list */}
              {!isConnected && (
                <div className="space-y-3 mb-6">
                  {[
                    "Complete curated earning tasks",
                    "Upload proof of completion",
                    "Track your Dark Coin earnings",
                  ].map((feat, i) => (
                    <motion.div
                      key={feat}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <ShieldCheck
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "oklch(0.82 0.18 85)" }}
                      />
                      {feat}
                    </motion.div>
                  ))}
                </div>
              )}

              <Button
                data-ocid="auth.primary_button"
                onClick={handleLogin}
                disabled={isLoggingIn || isInitializing || isConnected}
                className="w-full h-12 font-bold text-base rounded-2xl btn-glow transition-all duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                  color: "oklch(0.1 0.02 85)",
                }}
              >
                {isLoggingIn || isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isInitializing ? "Initializing…" : "Connecting…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sign In with Internet Identity
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Secured by the Internet Computer Protocol
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Complete Your Profile
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Set up your account to start earning
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="displayName"
                    className="text-sm font-semibold text-foreground mb-1.5 block"
                  >
                    Display Name
                  </Label>
                  <Input
                    data-ocid="auth.input"
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                    className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-foreground mb-1.5 block"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                    className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                {/* Actor loading indicator */}
                {isConnected && actorFetching && (
                  <div className="flex items-center gap-2 justify-center py-1">
                    <Loader2
                      className="w-3 h-3 animate-spin"
                      style={{ color: "oklch(0.82 0.18 85 / 0.6)" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Connecting to network…
                    </span>
                  </div>
                )}

                <Button
                  data-ocid="auth.submit_button"
                  onClick={handleSaveProfile}
                  disabled={
                    isSaving ||
                    saveProfile.isPending ||
                    !email.trim() ||
                    !displayName.trim() ||
                    (isConnected && actorFetching)
                  }
                  className="w-full h-12 font-bold text-base rounded-2xl btn-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                    color: "oklch(0.1 0.02 85)",
                  }}
                >
                  {isSaving || saveProfile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : isConnected && actorFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    "Enter Dark Coin"
                  )}
                </Button>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer */}
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
