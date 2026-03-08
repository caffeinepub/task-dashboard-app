import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  ImageOff,
  Play,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Submission, Task } from "../../backend.d";
import {
  getStatusClass,
  getStatusLabel,
  toObjectUrl,
} from "../../hooks/useQueries";

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

const PLACEHOLDER_COLORS = [
  "from-cyan-500/20 to-teal-500/20",
  "from-violet-500/20 to-purple-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-emerald-500/20 to-green-500/20",
  "from-rose-500/20 to-pink-500/20",
  "from-blue-500/20 to-indigo-500/20",
];

const ICON_COLORS = [
  "text-cyan-400",
  "text-violet-400",
  "text-amber-400",
  "text-emerald-400",
  "text-rose-400",
  "text-blue-400",
];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <CheckCircle className="w-3 h-3" />;
    case "declined":
      return <XCircle className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
}

export function TaskCard({ task, index, submission, onStart }: TaskCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const colorIdx = index % PLACEHOLDER_COLORS.length;
  const taskConfig = TASK_CONFIG[index];

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

  const handleClick = () => {
    // Block interaction if user already submitted this task
    if (hasSubmission) return;
    onStart(task);
  };

  const status = submission?.status ?? null;
  const hasSubmission = !!submission;
  const statusStr = status ? String(status) : null;
  const isApproved = statusStr === "approved";
  const isDeclined = statusStr === "declined";
  const isPending = statusStr === "pending";

  return (
    <motion.div
      data-ocid={`task.card.${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`glass-card rounded-2xl overflow-hidden flex flex-col transition-transform duration-150 ${hasSubmission ? "cursor-default opacity-90" : "group cursor-pointer active:scale-[0.98]"}`}
      onClick={handleClick}
    >
      {/* Task Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 skeleton-shimmer" />
            )}
            <img
              src={imageUrl}
              alt={task.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"} ${hasSubmission ? "brightness-75" : ""}`}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${PLACEHOLDER_COLORS[colorIdx]} flex items-center justify-center ${hasSubmission ? "brightness-75" : ""}`}
          >
            <div className="flex flex-col items-center gap-2">
              <ImageOff
                className={`w-8 h-8 ${ICON_COLORS[colorIdx]} opacity-60`}
              />
              <span
                className={`text-2xl font-display font-bold ${ICON_COLORS[colorIdx]} opacity-80`}
              >
                {task.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* APPROVED stamp */}
        {isApproved && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="border-4 rounded-lg px-3 py-1.5 rotate-[-15deg] select-none"
              style={{
                borderColor: "oklch(0.65 0.18 155)",
                boxShadow: "0 0 12px oklch(0.65 0.18 155 / 0.5)",
              }}
            >
              <span
                className="font-display font-black text-lg tracking-widest uppercase"
                style={{
                  color: "oklch(0.65 0.18 155)",
                  textShadow: "0 0 8px oklch(0.65 0.18 155 / 0.7)",
                }}
              >
                APPROVED
              </span>
            </div>
          </div>
        )}

        {/* DECLINED stamp */}
        {isDeclined && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="border-4 rounded-lg px-3 py-1.5 rotate-[-15deg] select-none"
              style={{
                borderColor: "oklch(0.55 0.2 25)",
                boxShadow: "0 0 12px oklch(0.55 0.2 25 / 0.5)",
              }}
            >
              <span
                className="font-display font-black text-lg tracking-widest uppercase"
                style={{
                  color: "oklch(0.65 0.2 25)",
                  textShadow: "0 0 8px oklch(0.55 0.2 25 / 0.7)",
                }}
              >
                DECLINED
              </span>
            </div>
          </div>
        )}

        {/* Pending badge (small, top-right) */}
        {isPending && (
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClass("pending")}`}
            >
              <StatusIcon status="pending" />
              {getStatusLabel("pending")}
            </span>
          </div>
        )}

        {/* Hover overlay — only for non-submitted */}
        {!hasSubmission && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </div>

      {/* Card Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-2">
          {task.title}
        </p>

        <Button
          data-ocid={`task.start_button.${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={hasSubmission}
          size="sm"
          className="w-full rounded-xl h-8 text-xs font-semibold mt-auto transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={
            isApproved
              ? {
                  background: "oklch(0.55 0.18 155 / 0.15)",
                  color: "oklch(0.65 0.18 155)",
                  border: "1px solid oklch(0.55 0.18 155 / 0.3)",
                }
              : isDeclined
                ? {
                    background: "oklch(0.55 0.2 25 / 0.15)",
                    color: "oklch(0.65 0.2 25)",
                    border: "1px solid oklch(0.55 0.2 25 / 0.3)",
                  }
                : isPending
                  ? {
                      background: "oklch(0.55 0.18 55 / 0.15)",
                      color: "oklch(0.72 0.18 55)",
                      border: "1px solid oklch(0.55 0.18 55 / 0.3)",
                    }
                  : {
                      background:
                        "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.9), oklch(0.75 0.15 80 / 0.9))",
                      color: "oklch(0.1 0.02 85)",
                    }
          }
        >
          {isApproved ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1.5" />
              Approved
            </>
          ) : isDeclined ? (
            <>
              <XCircle className="w-3 h-3 mr-1.5" />
              Declined
            </>
          ) : isPending ? (
            <>
              <Clock className="w-3 h-3 mr-1.5" />
              Under Review
            </>
          ) : taskConfig?.link ? (
            <>
              <ExternalLink className="w-3 h-3 mr-1.5" />
              Start Task
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1.5 fill-current" />
              Start Task
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function TaskCardSkeleton({ index }: { index: number }) {
  return (
    <div
      data-ocid={`task.card.${index + 1}`}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <Skeleton className="aspect-[4/3] w-full skeleton-shimmer rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 skeleton-shimmer rounded-lg" />
        <Skeleton className="h-8 w-full skeleton-shimmer rounded-xl" />
      </div>
    </div>
  );
}
