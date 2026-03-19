import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  Lock,
  Play,
  Sparkles,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Submission, Task } from "../../backend.d";
import { toObjectUrl } from "../../hooks/useQueries";
import { getTaskLink } from "../../lib/taskLinks";

// Task-specific configuration: links and default images per task index (0-based)
export const TASK_CONFIG: Record<
  number,
  { link?: string; defaultImage?: string }
> = {
  0: {
    link: "https://indrummy1.com/?code=R9AEQ7E4346&t=1772949207",
    defaultImage: "/assets/uploads/file_000000002808720bb614ca6f7dbd0ea8-1.png",
  },
};

interface TaskCardProps {
  task: Task;
  index: number;
  submission?: Submission;
  onStart: (task: Task) => void;
}

// Premium gradient palettes per task slot
const CARD_GRADIENTS = [
  { from: "oklch(0.22 0.08 85)", to: "oklch(0.14 0.04 265)" },
  { from: "oklch(0.18 0.06 195)", to: "oklch(0.12 0.03 265)" },
  { from: "oklch(0.20 0.07 155)", to: "oklch(0.13 0.03 265)" },
  { from: "oklch(0.18 0.07 300)", to: "oklch(0.12 0.03 265)" },
  { from: "oklch(0.20 0.06 25)", to: "oklch(0.13 0.03 265)" },
  { from: "oklch(0.18 0.06 240)", to: "oklch(0.12 0.03 265)" },
];

const PLACEHOLDER_INITIALS_COLORS = [
  "oklch(0.82 0.18 85)",
  "oklch(0.75 0.18 195)",
  "oklch(0.72 0.18 155)",
  "oklch(0.70 0.20 300)",
  "oklch(0.70 0.20 25)",
  "oklch(0.70 0.18 240)",
];

export function TaskCard({ task, index, submission, onStart }: TaskCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const colorIdx = index % CARD_GRADIENTS.length;
  const taskConfig = TASK_CONFIG[index];

  // Effective link: localStorage first, then TASK_CONFIG fallback
  const effectiveLink = getTaskLink(index) ?? taskConfig?.link;

  useEffect(() => {
    if (task.image && task.image.length > 0) {
      const url = toObjectUrl(task.image);
      setImageUrl(url);
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
    if (taskConfig?.defaultImage) {
      setImageUrl(taskConfig.defaultImage);
      return;
    }
    setImageUrl(null);
  }, [task.image, taskConfig?.defaultImage]);

  // Detect "empty" tasks: no backend image, default title pattern ("Task N"), no link
  // Backend initialises tasks as "Task 1" ... "Task 6" (1-indexed)
  const hasBackendImage = !!(task.image && task.image.length > 0);
  const hasDefaultTitle = /^Task \d+$/.test(task.title);
  const hasConfigLink = !!effectiveLink;
  const isEmpty = !hasBackendImage && hasDefaultTitle && !hasConfigLink;

  const handleClick = () => {
    if (hasSubmission || isEmpty) return;
    onStart(task);
  };

  const status = submission?.status ?? null;
  const hasSubmission = !!submission;
  const statusStr = status ? String(status) : null;
  const isApproved = statusStr === "approved";
  const isDeclined = statusStr === "declined";
  const isPending = statusStr === "pending";

  const gradient = CARD_GRADIENTS[colorIdx];
  const accentColor = PLACEHOLDER_INITIALS_COLORS[colorIdx];

  return (
    <motion.div
      data-ocid={`task.card.${index + 1}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      whileHover={
        !hasSubmission && !isEmpty
          ? {
              y: -3,
              transition: { duration: 0.2, ease: "easeOut" },
            }
          : undefined
      }
      className={`group relative rounded-2xl overflow-hidden flex flex-col ${
        hasSubmission || isEmpty ? "cursor-default" : "cursor-pointer"
      }`}
      style={{
        background: `linear-gradient(160deg, ${gradient.from}, ${gradient.to})`,
        border: "1px solid oklch(0.82 0.18 85 / 0.12)",
        boxShadow: hasSubmission
          ? "0 2px 12px oklch(0 0 0 / 0.4)"
          : "0 4px 20px oklch(0 0 0 / 0.45), 0 1px 0 oklch(0.82 0.18 85 / 0.08) inset",
      }}
      onClick={handleClick}
    >
      {/* ── Hover glow overlay ── */}
      {!hasSubmission && !isEmpty && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.82 0.18 85 / 0.08) 0%, transparent 70%)",
          }}
        />
      )}

      {/* ── Image area ── */}
      <div className="relative aspect-[3/2] overflow-hidden">
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${gradient.from}, oklch(0.11 0.015 265))`,
                }}
              />
            )}
            <img
              src={imageUrl}
              alt={task.title}
              className={`w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              } ${hasSubmission ? "brightness-50 saturate-50" : "group-hover:scale-[1.03]"}`}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${
              hasSubmission ? "opacity-50" : ""
            }`}
            style={{
              background: `linear-gradient(135deg, ${gradient.from}, oklch(0.11 0.015 265))`,
            }}
          >
            {/* Abstract pattern background */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 30% 40%, ${accentColor} 0%, transparent 50%),
                  radial-gradient(circle at 70% 60%, ${accentColor} 0%, transparent 40%)
                `,
              }}
            />
            {/* Large initial letter */}
            <span
              className="font-display font-black text-5xl relative z-10 select-none"
              style={{
                color: accentColor,
                opacity: 0.7,
                textShadow: `0 0 40px ${accentColor}`,
              }}
            >
              {task.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Bottom gradient overlay — blends image into card body */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${gradient.to} 0%, transparent 100%)`,
            opacity: 0.9,
          }}
        />

        {/* ── Task number badge (top-left) ── */}
        <div className="absolute top-2 left-2 z-20">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase"
            style={{
              background: "oklch(0.08 0.01 265 / 0.75)",
              border: "1px solid oklch(0.82 0.18 85 / 0.3)",
              color: "oklch(0.82 0.18 85)",
              backdropFilter: "blur(8px)",
            }}
          >
            Task {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* ── Reward badge (top-right) — only for unsubmitted, non-empty tasks with reward > 0 ── */}
        {!hasSubmission && !isEmpty && task.reward > BigInt(0) && (
          <div className="absolute top-2 right-2 z-20">
            <span
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.25), oklch(0.75 0.15 80 / 0.2))",
                border: "1px solid oklch(0.82 0.18 85 / 0.45)",
                color: "oklch(0.92 0.1 88)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Sparkles className="w-2.5 h-2.5" />₹
              {Number(task.reward).toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* ── Coming Soon overlay for empty tasks ── */}
        {isEmpty && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            style={{
              background: "oklch(0.08 0.01 265 / 0.55)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              className="px-3 py-1.5 rounded-xl select-none flex items-center gap-1.5"
              style={{
                background: "oklch(0.15 0.02 265 / 0.85)",
                border: "1px solid oklch(0.82 0.18 85 / 0.2)",
              }}
            >
              <Lock
                className="w-3 h-3"
                style={{ color: "oklch(0.82 0.18 85 / 0.6)" }}
              />
              <span
                className="font-display font-bold text-xs tracking-wider uppercase"
                style={{ color: "oklch(0.82 0.18 85 / 0.65)" }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        )}

        {/* ── APPROVED stamp ── */}
        {isApproved && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className="px-3 py-1.5 rounded-lg rotate-[-12deg] select-none"
              style={{
                border: "3px solid oklch(0.65 0.18 155)",
                boxShadow:
                  "0 0 20px oklch(0.65 0.18 155 / 0.6), 0 0 40px oklch(0.65 0.18 155 / 0.3)",
              }}
            >
              <span
                className="font-display font-black text-xl tracking-[0.2em] uppercase"
                style={{
                  color: "oklch(0.72 0.18 155)",
                  textShadow:
                    "0 0 12px oklch(0.65 0.18 155 / 0.8), 0 0 24px oklch(0.65 0.18 155 / 0.5)",
                }}
              >
                APPROVED
              </span>
            </div>
          </div>
        )}

        {/* ── DECLINED stamp ── */}
        {isDeclined && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className="px-3 py-1.5 rounded-lg rotate-[-12deg] select-none"
              style={{
                border: "3px solid oklch(0.55 0.2 25)",
                boxShadow:
                  "0 0 20px oklch(0.55 0.2 25 / 0.6), 0 0 40px oklch(0.55 0.2 25 / 0.3)",
              }}
            >
              <span
                className="font-display font-black text-xl tracking-[0.2em] uppercase"
                style={{
                  color: "oklch(0.65 0.2 25)",
                  textShadow:
                    "0 0 12px oklch(0.55 0.2 25 / 0.8), 0 0 24px oklch(0.55 0.2 25 / 0.5)",
                }}
              >
                DECLINED
              </span>
            </div>
          </div>
        )}

        {/* ── Pending pulsing badge ── */}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 12px oklch(0.82 0.18 85 / 0.4)",
                  "0 0 28px oklch(0.82 0.18 85 / 0.7)",
                  "0 0 12px oklch(0.82 0.18 85 / 0.4)",
                ],
              }}
              transition={{
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="px-3 py-1.5 rounded-xl select-none"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.25), oklch(0.75 0.15 80 / 0.2))",
                border: "2px solid oklch(0.82 0.18 85 / 0.6)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="font-display font-bold text-sm tracking-wider uppercase flex items-center gap-1.5"
                style={{ color: "oklch(0.92 0.1 88)" }}
              >
                <Clock className="w-3.5 h-3.5" />
                Under Review
              </span>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Card Body ── */}
      <div className="relative z-10 px-3 pt-2.5 pb-3 flex flex-col gap-2.5 flex-1">
        {/* Task title */}
        <div>
          <p
            className="font-display font-bold text-foreground text-sm leading-snug line-clamp-2"
            style={{ letterSpacing: "-0.01em" }}
          >
            {task.title}
          </p>
          {!hasSubmission && !isEmpty && (
            <p
              className="text-[10px] mt-0.5 font-medium"
              style={{ color: "oklch(0.82 0.18 85 / 0.55)" }}
            >
              Earn ₹ rewards
            </p>
          )}
        </div>

        {/* ── CTA Button ── */}
        <Button
          data-ocid={`task.start_button.${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={hasSubmission || isEmpty}
          size="sm"
          className="w-full rounded-xl h-9 text-xs font-bold mt-auto transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
          style={
            isEmpty
              ? {
                  background: "oklch(0.15 0.02 265 / 0.6)",
                  color: "oklch(0.82 0.18 85 / 0.4)",
                  border: "1px solid oklch(0.82 0.18 85 / 0.1)",
                }
              : isApproved
                ? {
                    background: "oklch(0.55 0.18 155 / 0.18)",
                    color: "oklch(0.72 0.18 155)",
                    border: "1px solid oklch(0.55 0.18 155 / 0.4)",
                  }
                : isDeclined
                  ? {
                      background: "oklch(0.55 0.2 25 / 0.18)",
                      color: "oklch(0.65 0.2 25)",
                      border: "1px solid oklch(0.55 0.2 25 / 0.4)",
                    }
                  : isPending
                    ? {
                        background: "oklch(0.82 0.18 85 / 0.1)",
                        color: "oklch(0.82 0.18 85 / 0.7)",
                        border: "1px solid oklch(0.82 0.18 85 / 0.2)",
                      }
                    : {
                        background:
                          "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.78 0.17 82))",
                        color: "oklch(0.1 0.02 85)",
                        boxShadow: "0 0 16px oklch(0.82 0.18 85 / 0.35)",
                      }
          }
        >
          {/* Shimmer effect on hover for active CTA */}
          {!hasSubmission && !isEmpty && (
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.15) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmerSlide 1.5s ease-in-out infinite",
              }}
            />
          )}
          {isEmpty ? (
            <>
              <Lock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              Coming Soon
            </>
          ) : isApproved ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              Approved
            </>
          ) : isDeclined ? (
            <>
              <XCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              Declined
            </>
          ) : isPending ? (
            <>
              <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              Under Review
            </>
          ) : effectiveLink ? (
            <>
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              Start Task
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 fill-current" />
              Start Task
            </>
          )}
        </Button>
      </div>

      {/* Shimmer keyframes injected once */}
      <style>{`
        @keyframes shimmerSlide {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
}

export function TaskCardSkeleton({ index }: { index: number }) {
  const colorIdx = index % CARD_GRADIENTS.length;
  const gradient = CARD_GRADIENTS[colorIdx];
  return (
    <div
      data-ocid={`task.card.${index + 1}`}
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${gradient.from}, ${gradient.to})`,
        border: "1px solid oklch(0.82 0.18 85 / 0.08)",
      }}
    >
      <Skeleton
        className="aspect-[3/2] w-full skeleton-shimmer rounded-none"
        style={{ opacity: 0.3 }}
      />
      <div className="px-3 pt-2.5 pb-3 space-y-2">
        <Skeleton
          className="h-3.5 w-4/5 skeleton-shimmer rounded-md"
          style={{ opacity: 0.3 }}
        />
        <Skeleton
          className="h-9 w-full skeleton-shimmer rounded-xl"
          style={{ opacity: 0.2 }}
        />
      </div>
    </div>
  );
}
