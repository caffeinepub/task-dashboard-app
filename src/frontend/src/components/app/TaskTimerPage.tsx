/**
 * TaskTimerPage
 *
 * Shown when a user clicks "Start Task" on an external-link task.
 * Flow:
 *  1. Opens the external link immediately in a new tab.
 *  2. Upload section is available immediately — no timer required.
 */

import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Film,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Task } from "../../backend.d";
import { useSubmitTask } from "../../hooks/useQueries";

type UploadState = "idle" | "submitted";

interface TaskTimerPageProps {
  task: Task;
  taskLink: string;
  onClose: () => void;
}

export function TaskTimerPage({ task, taskLink, onClose }: TaskTimerPageProps) {
  const submitTask = useSubmitTask();

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Open external link immediately on mount
  useEffect(() => {
    window.open(taskLink, "_blank", "noopener,noreferrer");
  }, [taskLink]);

  // ── File handling ───────────────────────────────────────────────────────
  const handleFile = useCallback(
    (file: File) => {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an image or video file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be under 10MB");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setSubmitError(null);
    },
    [previewUrl],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !task) return;
    setSubmitError(null);
    try {
      const buffer = await selectedFile.arrayBuffer();
      await submitTask.mutateAsync({
        taskId: task.id,
        file: new Uint8Array(buffer),
      });
      setUploadState("submitted");
      toast.success("Proof submitted! Awaiting review.");
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  const isVideo = selectedFile?.type.startsWith("video/");

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      data-ocid="task_timer.page"
      className="fixed inset-0 z-50 flex flex-col bg-background overflow-y-auto"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.82 0.18 85 / 0.05) 0%, transparent 60%)",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "oklch(0.09 0.01 260 / 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid oklch(0.82 0.18 85 / 0.1)",
        }}
      >
        <h2
          className="font-display font-bold text-base truncate max-w-[200px]"
          style={{ color: "oklch(0.82 0.18 85)" }}
        >
          {task.title}
        </h2>
        <Button
          data-ocid="task_timer.close_button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl w-8 h-8 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-5">
        {/* ── SUBMITTED STATE ── */}
        <AnimatePresence>
          {uploadState === "submitted" && (
            <motion.div
              data-ocid="task_timer.success_state"
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
              style={{
                background: "oklch(0.15 0.03 155 / 0.6)",
                border: "1px solid oklch(0.55 0.18 155 / 0.4)",
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.55 0.18 155 / 0.15)" }}
              >
                <CheckCircle
                  className="w-8 h-8"
                  style={{ color: "oklch(0.65 0.18 155)" }}
                />
              </div>
              <div>
                <h3
                  className="font-display font-bold text-lg"
                  style={{ color: "oklch(0.7 0.18 155)" }}
                >
                  Proof Submitted!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your submission is being reviewed
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── IDLE STATE ── */}
        {uploadState === "idle" && (
          <>
            {/* Re-open link card */}
            <motion.div
              data-ocid="task_timer.card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{
                background: "oklch(0.13 0.02 85 / 0.5)",
                border: "1px solid oklch(0.82 0.18 85 / 0.25)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "oklch(0.82 0.18 85 / 0.15)",
                  border: "1px solid oklch(0.82 0.18 85 / 0.3)",
                }}
              >
                <ExternalLink
                  className="w-5 h-5"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                >
                  Task opened in new tab
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Complete the task, then upload your screenshot below
                </p>
              </div>
              <Button
                data-ocid="task_timer.reopen_button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(taskLink, "_blank", "noopener,noreferrer")
                }
                className="text-xs rounded-xl flex-shrink-0"
                style={{ color: "oklch(0.82 0.18 85)" }}
              >
                Reopen
              </Button>
            </motion.div>

            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.3 0.04 265 / 0.5)",
                background: "oklch(0.12 0.015 265 / 0.6)",
              }}
            >
              <div className="px-4 pt-4 pb-2">
                <h3 className="font-semibold text-sm text-foreground">
                  Upload Proof of Completion
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Take a screenshot showing task completion
                </p>
              </div>

              {/* Dropzone */}
              <div
                data-ocid="task_timer.dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`mx-4 mb-4 rounded-2xl border-2 border-dashed transition-all duration-200 ${
                  dragOver
                    ? "border-primary bg-primary/10"
                    : previewUrl
                      ? "border-primary/40 bg-secondary/30"
                      : "border-border/50 hover:border-primary/50 bg-secondary/20"
                }`}
              >
                {previewUrl ? (
                  <div className="p-3">
                    {isVideo ? (
                      <video
                        src={previewUrl}
                        className="w-full rounded-xl aspect-video object-cover"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full rounded-xl aspect-video object-cover"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-2 text-center truncate">
                      {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-3 p-6 cursor-pointer">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ background: "oklch(var(--primary) / 0.1)" }}
                    >
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Tap to upload screenshot
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        JPG, PNG, GIF, MP4 — max 10MB
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs">Image</span>
                      <Film className="w-4 h-4" />
                      <span className="text-xs">Video</span>
                    </div>
                    <input
                      data-ocid="task_timer.upload_button"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              {previewUrl && (
                <label className="block text-center cursor-pointer mb-3">
                  <span className="text-sm text-primary hover:underline">
                    Change file
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                </label>
              )}

              {submitError && (
                <div
                  data-ocid="task_timer.error_state"
                  className="mx-4 mb-3 flex items-center gap-2 px-4 py-3 rounded-2xl status-declined"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{submitError}</p>
                </div>
              )}

              <div className="px-4 pb-4">
                <Button
                  data-ocid="task_timer.submit_button"
                  onClick={handleSubmit}
                  disabled={!selectedFile || submitTask.isPending}
                  className="w-full h-12 font-semibold text-base rounded-2xl btn-glow"
                  style={
                    selectedFile
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                          color: "oklch(0.1 0.02 85)",
                        }
                      : undefined
                  }
                >
                  {submitTask.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Proof"
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
