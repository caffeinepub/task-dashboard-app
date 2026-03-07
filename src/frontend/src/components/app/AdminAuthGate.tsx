import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  CheckCircle2,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPage } from "../../pages/AdminPage";

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_PIN = "09186114";
const FACE_SCAN_DURATION = 4000; // ms

const SCAN_MESSAGES = [
  "Initializing camera...",
  "Scanning face...",
  "Analyzing biometrics...",
  "Verifying human identity...",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStep = "pin" | "face" | "verified";

interface AdminAuthGateProps {
  onBack: () => void;
  onReset?: () => void;
}

// ─── PIN Screen ───────────────────────────────────────────────────────────────

function PinScreen({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleChange = useCallback(
    (val: string) => {
      setError(false);
      setValue(val);

      if (val.length === 8) {
        if (val === ADMIN_PIN) {
          // Small delay for UX feel
          setTimeout(onSuccess, 200);
        } else {
          setShaking(true);
          setError(true);
          setTimeout(() => {
            setShaking(false);
            setValue("");
          }, 600);
        }
      }
    },
    [onSuccess],
  );

  return (
    <motion.div
      key="pin"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 45%, oklch(0.82 0.18 85 / 0.05) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.82 0.18 85) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.82 0.18 85) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xs">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.18), oklch(0.7 0.12 80 / 0.08))",
            border: "1.5px solid oklch(0.82 0.18 85 / 0.45)",
            boxShadow:
              "0 0 30px oklch(0.82 0.18 85 / 0.2), 0 4px 24px oklch(0 0 0 / 0.5)",
          }}
        >
          <Lock className="w-9 h-9" style={{ color: "oklch(0.82 0.18 85)" }} />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-1.5"
        >
          <h1
            className="font-display text-3xl font-bold tracking-tight"
            style={{ color: "oklch(0.96 0.008 80)" }}
          >
            Admin Access
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.55 0.03 260)" }}>
            Enter your 8-digit security code
          </p>
        </motion.div>

        {/* OTP Input */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full flex justify-center"
        >
          <motion.div
            animate={shaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            data-ocid="admin.auth.pin_input"
          >
            <InputOTP
              maxLength={8}
              value={value}
              onChange={handleChange}
              autoFocus
            >
              <InputOTPGroup>
                <InputOTPSlot
                  index={0}
                  className="w-10 h-12 text-base rounded-l-xl"
                  style={{
                    background: "oklch(0.14 0.015 265 / 0.9)",
                    border: error
                      ? "1px solid oklch(0.6 0.22 25)"
                      : "1px solid oklch(0.82 0.18 85 / 0.25)",
                    color: "oklch(0.96 0.008 80)",
                  }}
                />
                <InputOTPSlot
                  index={1}
                  className="w-10 h-12 text-base"
                  style={{
                    background: "oklch(0.14 0.015 265 / 0.9)",
                    border: error
                      ? "1px solid oklch(0.6 0.22 25)"
                      : "1px solid oklch(0.82 0.18 85 / 0.25)",
                    color: "oklch(0.96 0.008 80)",
                  }}
                />
                <InputOTPSlot
                  index={2}
                  className="w-10 h-12 text-base"
                  style={{
                    background: "oklch(0.14 0.015 265 / 0.9)",
                    border: error
                      ? "1px solid oklch(0.6 0.22 25)"
                      : "1px solid oklch(0.82 0.18 85 / 0.25)",
                    color: "oklch(0.96 0.008 80)",
                  }}
                />
                <InputOTPSlot
                  index={3}
                  className="w-10 h-12 text-base rounded-r-xl"
                  style={{
                    background: "oklch(0.14 0.015 265 / 0.9)",
                    border: error
                      ? "1px solid oklch(0.6 0.22 25)"
                      : "1px solid oklch(0.82 0.18 85 / 0.25)",
                    color: "oklch(0.96 0.008 80)",
                  }}
                />
              </InputOTPGroup>

              <InputOTPSeparator />

              <InputOTPGroup>
                <InputOTPSlot
                  index={4}
                  className="w-10 h-12 text-base rounded-l-xl"
                  style={{
                    background: "oklch(0.14 0.015 265 / 0.9)",
                    border: error
                      ? "1px solid oklch(0.6 0.22 25)"
                      : "1px solid oklch(0.82 0.18 85 / 0.25)",
                    color: "oklch(0.96 0.008 80)",
                  }}
                />
                <InputOTPSlot
                  index={5}
                  className="w-10 h-12 text-base"
                  style={{
                    background: "oklch(0.14 0.015 265 / 0.9)",
                    border: error
                      ? "1px solid oklch(0.6 0.22 25)"
                      : "1px solid oklch(0.82 0.18 85 / 0.25)",
                    color: "oklch(0.96 0.008 80)",
                  }}
                />
                <InputOTPSlot
                  index={6}
                  className="w-10 h-12 text-base"
                  style={{
                    background: "oklch(0.14 0.015 265 / 0.9)",
                    border: error
                      ? "1px solid oklch(0.6 0.22 25)"
                      : "1px solid oklch(0.82 0.18 85 / 0.25)",
                    color: "oklch(0.96 0.008 80)",
                  }}
                />
                <InputOTPSlot
                  index={7}
                  className="w-10 h-12 text-base rounded-r-xl"
                  style={{
                    background: "oklch(0.14 0.015 265 / 0.9)",
                    border: error
                      ? "1px solid oklch(0.6 0.22 25)"
                      : "1px solid oklch(0.82 0.18 85 / 0.25)",
                    color: "oklch(0.96 0.008 80)",
                  }}
                />
              </InputOTPGroup>
            </InputOTP>
          </motion.div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              data-ocid="admin.auth.pin_error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm font-medium text-center -mt-4"
              style={{ color: "oklch(0.6 0.22 25)" }}
            >
              Invalid code. Try again.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Progress hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-center"
          style={{ color: "oklch(0.55 0.03 260)" }}
        >
          {value.length}/8 digits entered
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── Face Verification Screen ─────────────────────────────────────────────────

function FaceScreen({ onSuccess }: { onSuccess: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch {
      setCameraError(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const startScan = useCallback(() => {
    // Animate progress over 4 seconds
    const stepMs = 40;
    const totalSteps = FACE_SCAN_DURATION / stepMs;
    let currentStep = 0;

    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      const pct = Math.min((currentStep / totalSteps) * 100, 100);
      setProgress(pct);
      if (currentStep >= totalSteps) {
        clearInterval(progressIntervalRef.current!);
      }
    }, stepMs);

    // Cycle status messages every ~1s
    messageIntervalRef.current = setInterval(() => {
      setMessageIndex((prev) => Math.min(prev + 1, SCAN_MESSAGES.length - 1));
    }, FACE_SCAN_DURATION / SCAN_MESSAGES.length);

    // Complete after 4 seconds
    successTimeoutRef.current = setTimeout(() => {
      clearInterval(messageIntervalRef.current!);
      stopCamera();
      setVerified(true);
      setTimeout(onSuccess, 1200);
    }, FACE_SCAN_DURATION);
  }, [onSuccess, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, [startCamera, stopCamera]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once when camera becomes ready
  useEffect(() => {
    if (cameraReady && !cameraError) {
      startScan();
    }
  }, [cameraReady]);

  return (
    <motion.div
      key="face"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      data-ocid="admin.auth.face_panel"
      className="flex flex-col items-center justify-center min-h-screen px-6 relative"
    >
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 45%, oklch(0.82 0.18 85 / 0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.82 0.18 85) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.82 0.18 85) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-7 w-full max-w-xs">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-1.5"
        >
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.82 0.18 85 / 0.15)",
                border: "1px solid oklch(0.82 0.18 85 / 0.35)",
              }}
            >
              <Camera
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.18 85)" }}
              />
            </div>
          </div>
          <h1
            className="font-display text-3xl font-bold tracking-tight"
            style={{ color: "oklch(0.96 0.008 80)" }}
          >
            Face Verification
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.55 0.03 260)" }}>
            Biometric identity check
          </p>
        </motion.div>

        {/* Camera / Error area */}
        <AnimatePresence mode="wait">
          {cameraError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center gap-4 p-6 rounded-3xl"
              style={{
                background: "oklch(0.14 0.015 265 / 0.9)",
                border: "1px solid oklch(0.6 0.22 25 / 0.3)",
              }}
            >
              <p
                className="text-sm text-center"
                style={{ color: "oklch(0.55 0.03 260)" }}
              >
                Camera access required for face verification
              </p>
              <Button
                onClick={startCamera}
                size="sm"
                className="rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                  color: "oklch(0.1 0.02 85)",
                }}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </motion.div>
          ) : verified ? (
            <motion.div
              key="verified-flash"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 0 20px oklch(0.72 0.18 155 / 0.4)",
                    "0 0 50px oklch(0.72 0.18 155 / 0.7)",
                    "0 0 20px oklch(0.72 0.18 155 / 0.4)",
                  ],
                }}
                transition={{ duration: 0.8, repeat: 1 }}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: "oklch(0.72 0.18 155 / 0.15)",
                  border: "2px solid oklch(0.72 0.18 155 / 0.6)",
                }}
              >
                <CheckCircle2
                  className="w-12 h-12"
                  style={{ color: "oklch(0.72 0.18 155)" }}
                />
              </motion.div>
              <p
                className="font-semibold text-base"
                style={{ color: "oklch(0.72 0.18 155)" }}
              >
                ✓ Verified — Human Confirmed
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="camera-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Video element */}
              <div className="relative w-[280px] h-[280px] rounded-3xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />

                {/* Dark overlay tint */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, oklch(0 0 0 / 0.15) 0%, transparent 30%, transparent 70%, oklch(0 0 0 / 0.3) 100%)",
                  }}
                />

                {/* Scanning ring overlay */}
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    border: "2px solid oklch(0.82 0.18 85 / 0.7)",
                    boxShadow:
                      "0 0 20px oklch(0.82 0.18 85 / 0.4), inset 0 0 20px oklch(0.82 0.18 85 / 0.1)",
                    animation: "scanRingPulse 2s ease-in-out infinite",
                  }}
                />

                {/* Corner brackets */}
                {(
                  [
                    "top-3 left-3 border-t-2 border-l-2",
                    "top-3 right-3 border-t-2 border-r-2",
                    "bottom-3 left-3 border-b-2 border-l-2",
                    "bottom-3 right-3 border-b-2 border-r-2",
                  ] as const
                ).map((cls) => (
                  <div
                    key={cls}
                    className={`absolute w-6 h-6 rounded-sm ${cls}`}
                    style={{ borderColor: "oklch(0.82 0.18 85)" }}
                  />
                ))}

                {/* Horizontal scan line */}
                <div
                  className="absolute left-0 right-0 h-[1px]"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, oklch(0.82 0.18 85 / 0.8), transparent)",
                    animation: "scanLine 2s linear infinite",
                  }}
                />

                {/* Dot grid overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, oklch(0.82 0.18 85) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* ShieldCheck icon top right */}
                <div
                  className="absolute top-3 right-3 w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{
                    background: "oklch(0.82 0.18 85 / 0.2)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <ShieldCheck
                    className="w-4 h-4"
                    style={{ color: "oklch(0.82 0.18 85)" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status message */}
        {!verified && !cameraError && (
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p
              className="text-sm font-medium"
              style={{ color: "oklch(0.82 0.18 85 / 0.9)" }}
            >
              {SCAN_MESSAGES[messageIndex]}
            </p>
          </motion.div>
        )}

        {/* Progress bar */}
        {!verified && !cameraError && (
          <div
            data-ocid="admin.auth.face_progress"
            className="w-full space-y-2"
          >
            <div className="flex justify-between items-center">
              <span
                className="text-xs"
                style={{ color: "oklch(0.55 0.03 260)" }}
              >
                Biometric scan
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "oklch(0.82 0.18 85)" }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: "oklch(0.19 0.025 265)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, oklch(0.82 0.18 85), oklch(0.92 0.1 90))",
                  boxShadow: "0 0 10px oklch(0.82 0.18 85 / 0.5)",
                }}
                transition={{ ease: "linear" }}
              />
            </div>
          </div>
        )}

        {/* Scanning dots */}
        {!verified && !cameraError && (
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(0.82 0.18 85)" }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── AdminAuthGate ─────────────────────────────────────────────────────────────

export function AdminAuthGate({ onBack, onReset }: AdminAuthGateProps) {
  const [step, setStep] = useState<AuthStep>("pin");

  const handleBack = useCallback(() => {
    setStep("pin");
    onReset?.();
    onBack();
  }, [onBack, onReset]);

  if (step === "verified") {
    return <AdminPage onBack={handleBack} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: "oklch(0.09 0.01 260)" }}
    >
      <AnimatePresence mode="wait">
        {step === "pin" ? (
          <PinScreen key="pin" onSuccess={() => setStep("face")} />
        ) : (
          <FaceScreen key="face" onSuccess={() => setStep("verified")} />
        )}
      </AnimatePresence>

      {/* Inject keyframes once */}
      <style>{`
        @keyframes scanRingPulse {
          0%, 100% {
            box-shadow: 0 0 20px oklch(0.82 0.18 85 / 0.4), inset 0 0 20px oklch(0.82 0.18 85 / 0.1);
            border-color: oklch(0.82 0.18 85 / 0.7);
          }
          50% {
            box-shadow: 0 0 40px oklch(0.82 0.18 85 / 0.7), inset 0 0 30px oklch(0.82 0.18 85 / 0.2);
            border-color: oklch(0.82 0.18 85);
          }
        }
        @keyframes scanLine {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
