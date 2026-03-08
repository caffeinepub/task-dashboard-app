import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Camera,
  CheckCircle2,
  Eye,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPage } from "../../pages/AdminPage";

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_PIN = "09186114";
const REQUIRED_BLINKS = 4;

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

// ─── Face Verification Screen (Blink Detection) ───────────────────────────────

function FaceScreen({ onSuccess }: { onSuccess: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  // Blink detection state refs (avoid re-render per frame)
  const eyesClosedRef = useRef(false);
  const blinkCountRef = useRef(0);
  const verifiedRef = useRef(false);
  const lastBrightnessRef = useRef<number[]>([]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  // Sample average brightness of a pixel region in canvas
  const sampleBrightness = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
    ): number => {
      try {
        const data = ctx.getImageData(x, y, w, h).data;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Luminance = 0.299R + 0.587G + 0.114B
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        return total / (data.length / 4);
      } catch {
        return 128;
      }
    },
    [],
  );

  const detectBlinks = useCallback(() => {
    if (verifiedRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectBlinks);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(detectBlinks);
      return;
    }

    const W = 160;
    const H = 120;
    canvas.width = W;
    canvas.height = H;

    // Draw current video frame (mirrored to match display)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -W, 0, W, H);
    ctx.restore();

    // Face region: centre 40% width, 30–80% height
    const faceX = Math.round(W * 0.3);
    const faceY = Math.round(H * 0.15);
    const faceW = Math.round(W * 0.4);
    const faceH = Math.round(H * 0.6);
    const faceBrightness = sampleBrightness(ctx, faceX, faceY, faceW, faceH);

    // Detect if a face-like region is present (brighter than background threshold)
    const backgroundBrightness = sampleBrightness(ctx, 0, 0, W, 10);
    const hasFace =
      Math.abs(faceBrightness - backgroundBrightness) > 8 ||
      faceBrightness > 60;
    setFaceDetected(hasFace);

    // Eye regions (approximate): at ~35–42% from top, 25–45% and 55–75% from left
    const eyeY = Math.round(H * 0.32);
    const eyeH = 10;
    const leftEyeX = Math.round(W * 0.28);
    const rightEyeX = Math.round(W * 0.55);
    const eyeW = Math.round(W * 0.18);

    const leftEyeBrightness = sampleBrightness(ctx, leftEyeX, eyeY, eyeW, eyeH);
    const rightEyeBrightness = sampleBrightness(
      ctx,
      rightEyeX,
      eyeY,
      eyeW,
      eyeH,
    );
    const avgEyeBrightness = (leftEyeBrightness + rightEyeBrightness) / 2;

    // Keep a rolling history of brightness values (last 6 frames)
    lastBrightnessRef.current.push(avgEyeBrightness);
    if (lastBrightnessRef.current.length > 6) {
      lastBrightnessRef.current.shift();
    }

    if (lastBrightnessRef.current.length >= 4) {
      const recent = lastBrightnessRef.current;
      const maxRecent = Math.max(...recent.slice(0, 3));
      const minRecent = Math.min(...recent.slice(-3));

      // Detect eye closure: brightness drops by >30% from recent max
      const eyesClosed = maxRecent > 20 && minRecent < maxRecent * 0.7;

      if (eyesClosed && !eyesClosedRef.current) {
        // Eyes just closed
        eyesClosedRef.current = true;
      } else if (!eyesClosed && eyesClosedRef.current) {
        // Eyes just opened (blink completed)
        eyesClosedRef.current = false;
        blinkCountRef.current += 1;
        setBlinkCount(blinkCountRef.current);

        if (blinkCountRef.current >= REQUIRED_BLINKS) {
          verifiedRef.current = true;
          stopCamera();
          setVerified(true);
          setTimeout(onSuccess, 1200);
          return;
        }
      }
    }

    rafRef.current = requestAnimationFrame(detectBlinks);
  }, [sampleBrightness, stopCamera, onSuccess]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      setCameraReady(false);
      setBlinkCount(0);
      blinkCountRef.current = 0;
      eyesClosedRef.current = false;
      verifiedRef.current = false;
      lastBrightnessRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch {
      setCameraError(true);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Start blink detection loop once camera is ready
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once when camera becomes ready
  useEffect(() => {
    if (cameraReady && !cameraError) {
      // Small delay to let video stabilize
      const t = setTimeout(() => {
        rafRef.current = requestAnimationFrame(detectBlinks);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [cameraReady, detectBlinks]);

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

      {/* Hidden canvas for pixel analysis */}
      <canvas ref={canvasRef} className="sr-only" />

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
            Blink 4 times to verify
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

                {/* Face-focus outline — green if face detected, amber otherwise */}
                <div
                  className="absolute inset-0 rounded-3xl transition-all duration-300"
                  style={{
                    border: `2px solid ${faceDetected ? "oklch(0.72 0.18 155 / 0.8)" : "oklch(0.82 0.18 85 / 0.6)"}`,
                    boxShadow: faceDetected
                      ? "0 0 20px oklch(0.72 0.18 155 / 0.3), inset 0 0 20px oklch(0.72 0.18 155 / 0.05)"
                      : "0 0 20px oklch(0.82 0.18 85 / 0.3), inset 0 0 20px oklch(0.82 0.18 85 / 0.05)",
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
                    style={{
                      borderColor: faceDetected
                        ? "oklch(0.72 0.18 155)"
                        : "oklch(0.82 0.18 85)",
                    }}
                  />
                ))}

                {/* Eye focus indicator lines */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "35%",
                    left: "25%",
                    width: "20%",
                    height: "2px",
                    background: faceDetected
                      ? "oklch(0.72 0.18 155 / 0.7)"
                      : "oklch(0.82 0.18 85 / 0.5)",
                    borderRadius: "1px",
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "35%",
                    right: "25%",
                    width: "20%",
                    height: "2px",
                    background: faceDetected
                      ? "oklch(0.72 0.18 155 / 0.7)"
                      : "oklch(0.82 0.18 85 / 0.5)",
                    borderRadius: "1px",
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

        {/* Face focus hint */}
        {!verified && !cameraError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: faceDetected
                  ? "oklch(0.72 0.18 155)"
                  : "oklch(0.82 0.18 85 / 0.5)",
                boxShadow: faceDetected
                  ? "0 0 6px oklch(0.72 0.18 155)"
                  : "none",
              }}
            />
            <p
              className="text-sm font-medium"
              style={{
                color: faceDetected
                  ? "oklch(0.72 0.18 155)"
                  : "oklch(0.82 0.18 85 / 0.7)",
              }}
            >
              {faceDetected
                ? "Face focused — blink slowly"
                : "Focus your face in the frame"}
            </p>
          </motion.div>
        )}

        {/* Blink counter — prominent display */}
        {!verified && !cameraError && (
          <div data-ocid="admin.auth.blink_counter" className="w-full">
            <div
              className="flex flex-col items-center gap-3 p-4 rounded-3xl"
              style={{
                background: "oklch(0.13 0.018 265 / 0.9)",
                border: "1px solid oklch(0.82 0.18 85 / 0.15)",
              }}
            >
              {/* Blink count display */}
              <div className="flex items-center gap-3">
                <Eye
                  className="w-5 h-5"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                />
                <motion.span
                  key={blinkCount}
                  initial={{ scale: 1.4, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="font-display font-bold text-3xl tabular-nums"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                >
                  {blinkCount}
                </motion.span>
                <span
                  className="font-bold text-lg"
                  style={{ color: "oklch(0.4 0.03 260)" }}
                >
                  / {REQUIRED_BLINKS}
                </span>
              </div>

              <p
                className="text-xs font-medium"
                style={{ color: "oklch(0.55 0.03 260)" }}
              >
                Blinks detected
              </p>

              {/* Blink progress dots */}
              <div className="flex items-center gap-2">
                {Array.from(
                  { length: REQUIRED_BLINKS },
                  (_, i) => `blink-dot-${i}`,
                ).map((dotKey, i) => (
                  <motion.div
                    key={dotKey}
                    animate={
                      i < blinkCount
                        ? {
                            scale: [1, 1.3, 1],
                            background: [
                              "oklch(0.82 0.18 85 / 0.3)",
                              "oklch(0.82 0.18 85)",
                              "oklch(0.82 0.18 85)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 0.3 }}
                    className="w-4 h-4 rounded-full"
                    style={{
                      background:
                        i < blinkCount
                          ? "oklch(0.82 0.18 85)"
                          : "oklch(0.22 0.025 265)",
                      border: `1.5px solid ${i < blinkCount ? "oklch(0.82 0.18 85)" : "oklch(0.35 0.03 265)"}`,
                      boxShadow:
                        i < blinkCount
                          ? "0 0 8px oklch(0.82 0.18 85 / 0.5)"
                          : "none",
                    }}
                  />
                ))}
              </div>
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
