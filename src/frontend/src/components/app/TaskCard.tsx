import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, ImageOff, Play, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Submission, Task } from "../../backend.d";
import {
  getStatusClass,
  getStatusLabel,
  toObjectUrl,
} from "../../hooks/useQueries";

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

  useEffect(() => {
    if (task.image && task.image.length > 0) {
      const url = toObjectUrl(task.image);
      setImageUrl(url);
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [task.image]);

  const status = submission?.status ?? null;
  const hasSubmission = !!submission;

  return (
    <motion.div
      data-ocid={`task.card.${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer active:scale-[0.98] transition-transform duration-150"
      onClick={() => onStart(task)}
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
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${PLACEHOLDER_COLORS[colorIdx]} flex items-center justify-center`}
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

        {/* Status overlay badge */}
        {hasSubmission && status && (
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(String(status))}`}
            >
              <StatusIcon status={String(status)} />
              {getStatusLabel(String(status))}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
            onStart(task);
          }}
          size="sm"
          className="w-full rounded-xl h-8 text-xs font-semibold mt-auto transition-all duration-200"
          style={
            hasSubmission && status === "approved"
              ? {
                  background: "oklch(var(--success) / 0.15)",
                  color: "oklch(var(--success))",
                  border: "1px solid oklch(var(--success) / 0.3)",
                }
              : {
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.9), oklch(0.75 0.15 80 / 0.9))",
                  color: "oklch(0.1 0.02 85)",
                }
          }
        >
          <Play className="w-3 h-3 mr-1.5 fill-current" />
          {hasSubmission ? "View / Resubmit" : "Start Task"}
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
