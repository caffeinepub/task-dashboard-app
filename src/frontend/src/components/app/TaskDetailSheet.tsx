import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  CheckCircle,
  Film,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Submission, Task } from "../../backend.d";
import {
  getStatusClass,
  getStatusLabel,
  toObjectUrl,
  useSubmitTask,
} from "../../hooks/useQueries";

interface TaskDetailSheetProps {
  task: Task | null;
  submission?: Submission;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailSheet({
  task,
  submission,
  open,
  onClose,
}: TaskDetailSheetProps) {
  const submitTask = useSubmitTask();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [taskImageUrl, setTaskImageUrl] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Create task image URL
  useEffect(() => {
    if (task?.image && task.image.length > 0) {
      const url = toObjectUrl(task.image);
      setTaskImageUrl(url);
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
    setTaskImageUrl(null);
  }, [task?.image]);

  // Cleanup on close - intentionally only runs when open changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on open change
  useEffect(() => {
    if (!open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSubmitSuccess(false);
      setSubmitError(null);
    }
  }, [open]);

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
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(url);
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
      const blob = new Uint8Array(buffer);
      await submitTask.mutateAsync({ taskId: task.id, file: blob });
      setSubmitSuccess(true);
      toast.success("Proof submitted! Awaiting review.");
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  const isVideo = selectedFile?.type.startsWith("video/");

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        data-ocid="task_detail.sheet"
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[90vh] overflow-y-auto border-0"
        style={{
          background: "oklch(0.17 0.025 265)",
          borderTop: "1px solid oklch(0.28 0.04 265 / 0.6)",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border/50" />
        </div>

        <SheetHeader className="px-5 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-lg font-bold text-foreground">
              {task.title}
            </SheetTitle>
            <Button
              data-ocid="task_detail.close_button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl w-8 h-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="px-5 pb-8 space-y-4">
          {/* Task Image */}
          {taskImageUrl && (
            <div className="rounded-2xl overflow-hidden aspect-video">
              <img
                src={taskImageUrl}
                alt={task.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Existing Submission Status */}
          {submission && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl ${getStatusClass(String(submission.status))}`}
            >
              {String(submission.status) === "approved" ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {getStatusLabel(String(submission.status))}
                </p>
                <p className="text-xs opacity-80">
                  {String(submission.status) === "pending"
                    ? "Your submission is under review"
                    : String(submission.status) === "approved"
                      ? "Your submission was approved!"
                      : "Your submission was declined."}
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          <AnimatePresence>
            {submitSuccess && (
              <motion.div
                data-ocid="task_detail.success_state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-6 text-center"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(var(--success) / 0.15)" }}
                >
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <p className="font-display font-bold text-lg text-foreground">
                  Proof Submitted!
                </p>
                <p className="text-muted-foreground text-sm">
                  Your submission is being reviewed
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Area — blocked if submission already exists */}
          {!submitSuccess && !submission && (
            <>
              {/* Instructions */}
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  Upload Proof of Completion
                </h3>
                <p className="text-muted-foreground text-xs">
                  Take a screenshot or record a video showing task completion
                </p>
              </div>

              {/* Dropzone */}
              <div
                data-ocid="task_detail.dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
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
                  <label className="flex flex-col items-center gap-3 p-8 cursor-pointer">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "oklch(var(--primary) / 0.1)" }}
                    >
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Drop file here or tap to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, GIF, MP4, WebM — max 10MB
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs">Image</span>
                      <Film className="w-4 h-4" />
                      <span className="text-xs">Video</span>
                    </div>
                    <input
                      data-ocid="task_detail.upload_button"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              {/* Change file button if preview exists */}
              {previewUrl && (
                <label className="block text-center cursor-pointer">
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

              {/* Error State */}
              {submitError && (
                <div
                  data-ocid="task_detail.error_state"
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl status-declined"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                data-ocid="task_detail.submit_button"
                onClick={handleSubmit}
                disabled={!selectedFile || submitTask.isPending}
                className="w-full h-12 font-semibold text-base rounded-2xl btn-glow"
                style={{
                  background: selectedFile
                    ? "linear-gradient(135deg, oklch(0.75 0.18 195), oklch(0.7 0.2 220))"
                    : undefined,
                  color: selectedFile ? "oklch(0.1 0.02 260)" : undefined,
                }}
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
