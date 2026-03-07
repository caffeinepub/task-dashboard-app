import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useSaveProfile } from "../../hooks/useQueries";

interface AuthScreenProps {
  hasProfile: boolean;
  onProfileSaved: () => void;
}

export function AuthScreen({ hasProfile, onProfileSaved }: AuthScreenProps) {
  const { login, isLoggingIn, isInitializing, identity } =
    useInternetIdentity();
  const saveProfile = useSaveProfile();
  const [email, setEmail] = useState("");
  const [setupStep, setSetupStep] = useState(false);

  const isConnected = !!identity;

  const handleLogin = () => {
    login();
  };

  const handleSaveProfile = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        email: email.trim(),
        role: "user",
        isBlocked: false,
      });
      toast.success("Profile saved! Welcome aboard.");
      onProfileSaved();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  // After connection, show profile setup if no profile
  const showSetup = isConnected && !hasProfile && setupStep;

  // Auto-show setup step when connected without profile
  if (isConnected && !hasProfile && !setupStep) {
    setSetupStep(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 195) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.2 300) 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm relative"
      >
        {/* Logo / App name */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 195 / 0.2), oklch(0.7 0.2 300 / 0.2))",
              border: "1px solid oklch(0.75 0.18 195 / 0.3)",
              boxShadow: "0 0 24px oklch(0.75 0.18 195 / 0.2)",
            }}
          >
            <Zap className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl font-bold text-foreground tracking-tight"
          >
            TaskFlow
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm mt-1"
          >
            Complete tasks. Earn rewards.
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card rounded-3xl p-6"
        >
          {!showSetup ? (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {isConnected ? "Setting up your account…" : "Get Started"}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {isConnected
                    ? "Just a moment"
                    : "Connect your Internet Identity to continue"}
                </p>
              </div>

              {/* Feature list */}
              {!isConnected && (
                <div className="space-y-3 mb-6">
                  {[
                    "Complete curated tasks",
                    "Upload proof of completion",
                    "Track your progress",
                  ].map((feat, i) => (
                    <motion.div
                      key={feat}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                      {feat}
                    </motion.div>
                  ))}
                </div>
              )}

              <Button
                data-ocid="auth.primary_button"
                onClick={handleLogin}
                disabled={isLoggingIn || isInitializing || isConnected}
                className="w-full h-12 font-semibold text-base rounded-2xl btn-glow transition-all duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.18 195), oklch(0.7 0.2 220))",
                  color: "oklch(0.1 0.02 260)",
                }}
              >
                {isLoggingIn || isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isInitializing ? "Initializing…" : "Connecting…"}
                  </>
                ) : (
                  "Sign In with Internet Identity"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Secured by the Internet Computer Protocol
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Complete Your Profile
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Add your email to personalize your experience
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground mb-1.5 block"
                  >
                    Email Address
                  </Label>
                  <Input
                    data-ocid="auth.input"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                    className="h-11 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <Button
                  data-ocid="auth.submit_button"
                  onClick={handleSaveProfile}
                  disabled={saveProfile.isPending || !email.trim()}
                  className="w-full h-12 font-semibold text-base rounded-2xl btn-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.75 0.18 195), oklch(0.7 0.2 220))",
                    color: "oklch(0.1 0.02 260)",
                  }}
                >
                  {saveProfile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Continue to TaskFlow"
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
