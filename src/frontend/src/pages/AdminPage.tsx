import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  ArrowRightLeft,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  CreditCard,
  Film,
  ImageOff,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PaymentRequest, Submission, Task } from "../backend.d";
import { TASK_CONFIG } from "../components/app/TaskCard";
import {
  getStatusClass,
  getStatusLabel,
  toObjectUrl,
  useAllPayments,
  useAllSubmissions,
  useAllUsersAnalytics,
  useBlockUser,
  useReviewPayment,
  useReviewSubmission,
  useTasks,
  useUnblockUser,
  useUpdateTask,
} from "../hooks/useQueries";

interface AdminPageProps {
  onBack: () => void;
}

// ─── Task Row ──────────────────────────────────────────────────────────────

function AdminTaskRow({ task, index }: { task: Task; index: number }) {
  const updateTask = useUpdateTask();
  const [title, setTitle] = useState(task.title);
  const taskConfig = TASK_CONFIG[index];
  const [startLink, setStartLink] = useState(taskConfig?.link ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<Uint8Array | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const img = task.image as Uint8Array | undefined;
    if (img && img.length > 0) {
      const url = toObjectUrl(img);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    setPendingImage(data);
    const url = URL.createObjectURL(new Blob([data]));
    setImageUrl(url);
  };

  const handleSave = async () => {
    try {
      const existingImage = task.image as Uint8Array | undefined;
      const imageToSave: Uint8Array | null =
        pendingImage !== null
          ? pendingImage
          : existingImage && existingImage.length > 0
            ? existingImage
            : null;
      await updateTask.mutateAsync({
        taskId: task.id,
        title,
        image: imageToSave,
      });
      setPendingImage(null);
      toast.success(`Task ${index + 1} updated`);
    } catch (err) {
      console.error("updateTask error:", err);
      toast.error("Failed to update task");
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start">
      <div className="w-full sm:w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={task.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
            <ImageOff className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 w-full space-y-2.5">
        <div className="flex items-center gap-1 mb-0.5">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.82 0.18 85 / 0.12)",
              color: "oklch(0.82 0.18 85)",
            }}
          >
            Task {index + 1}
          </span>
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="h-9 rounded-xl bg-secondary/40 border-border/40 text-sm"
        />
        <Input
          value={startLink}
          onChange={(e) => setStartLink(e.target.value)}
          placeholder="Start link (URL)"
          className="h-9 rounded-xl bg-secondary/40 border-border/40 text-sm"
        />
        <div className="flex gap-2">
          <Button
            data-ocid={`admin.task.upload_button.${index + 1}`}
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl text-xs h-8 border-border/40"
          >
            <Upload className="w-3 h-3 mr-1.5" />
            Image
          </Button>
          <Button
            data-ocid={`admin.task.save_button.${index + 1}`}
            size="sm"
            onClick={handleSave}
            disabled={updateTask.isPending}
            className="rounded-xl text-xs h-8 btn-glow"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
              color: "oklch(0.1 0.02 85)",
            }}
          >
            {updateTask.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Check className="w-3 h-3 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="sr-only"
        />
      </div>
    </div>
  );
}

// ─── Submission Row ─────────────────────────────────────────────────────────

function SubmissionRow({ sub, index }: { sub: Submission; index: number }) {
  const reviewSubmission = useReviewSubmission();
  const { data: tasks } = useTasks();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  useEffect(() => {
    if (sub.file && sub.file.length > 0) {
      const header = sub.file.slice(0, 4);
      const isVid =
        (header[0] === 0x00 && header[1] === 0x00 && header[2] === 0x00) ||
        (header[0] === 0x1a && header[1] === 0x45);
      setIsVideo(isVid);
      const url = toObjectUrl(sub.file);
      setFileUrl(url);
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [sub.file]);

  const taskName =
    tasks?.find((t) => t.id === sub.taskId)?.title ??
    `Task ${String(sub.taskId)}`;
  const principalStr = sub.userId.toString();
  const shortPrincipal = `${principalStr.slice(0, 8)}…${principalStr.slice(-6)}`;

  const handleReview = async (approve: boolean) => {
    try {
      await reviewSubmission.mutateAsync({ submissionId: sub.id, approve });
      toast.success(approve ? "Submission approved!" : "Submission declined");
    } catch {
      toast.error("Failed to update submission");
    }
  };

  return (
    <div
      data-ocid={`admin.submission.item.${index + 1}`}
      className="glass-card rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {taskName}
          </p>
          <p className="text-muted-foreground text-xs font-mono truncate">
            {shortPrincipal}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusClass(String(sub.status))}`}
        >
          {getStatusLabel(String(sub.status))}
        </span>
      </div>

      {fileUrl && (
        <div className="rounded-xl overflow-hidden aspect-video bg-secondary/30">
          {isVideo ? (
            <video
              src={fileUrl}
              className="w-full h-full object-cover"
              controls
              muted
            />
          ) : (
            <img
              src={fileUrl}
              alt="Submission"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {String(sub.status) === "pending" && (
        <div className="flex gap-2">
          <Button
            data-ocid={`admin.submission.approve_button.${index + 1}`}
            size="sm"
            onClick={() => handleReview(true)}
            disabled={reviewSubmission.isPending}
            className="flex-1 rounded-xl h-9 text-xs font-semibold"
            style={{
              background: "oklch(var(--success) / 0.15)",
              color: "oklch(var(--success))",
              border: "1px solid oklch(var(--success) / 0.3)",
            }}
          >
            {reviewSubmission.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Check className="w-3 h-3 mr-1" />
                Approve
              </>
            )}
          </Button>
          <Button
            data-ocid={`admin.submission.decline_button.${index + 1}`}
            size="sm"
            onClick={() => handleReview(false)}
            disabled={reviewSubmission.isPending}
            className="flex-1 rounded-xl h-9 text-xs font-semibold"
            style={{
              background: "oklch(var(--destructive) / 0.15)",
              color: "oklch(var(--destructive))",
              border: "1px solid oklch(var(--destructive) / 0.3)",
            }}
          >
            <X className="w-3 h-3 mr-1" />
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Expandable User Card ───────────────────────────────────────────────────

function ExpandableUserCard({
  entry,
  index,
  allSubmissions,
  allPayments,
}: {
  entry: {
    userId: Principal;
    email: string;
    lastLogin?: bigint;
    tasksCompleted: bigint;
    totalSubmissions: bigint;
  };
  index: number;
  allSubmissions: Submission[];
  allPayments: PaymentRequest[];
}) {
  const [expanded, setExpanded] = useState(false);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const reviewSubmission = useReviewSubmission();
  const reviewPayment = useReviewPayment();

  // Get block status from the analytics (no direct isBlocked in analytics)
  // We'll default to false and let block/unblock toasts confirm changes
  const [isBlocked, setIsBlocked] = useState(false);

  const principalStr = entry.userId.toString();
  const shortPrincipal = `${principalStr.slice(0, 8)}…${principalStr.slice(-6)}`;
  const displayName = entry.email ? entry.email.split("@")[0] : shortPrincipal;
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const lastSeenLabel = (() => {
    if (!entry.lastLogin) return "Never";
    const ms = Number(entry.lastLogin) / 1_000_000;
    const diffMs = Date.now() - ms;
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    return new Date(ms).toLocaleDateString();
  })();

  // Filter last 3 submissions for this user
  const userSubmissions = allSubmissions
    .filter((s) => s.userId.toString() === principalStr)
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 3);

  // Filter last 3 payments for this user
  const userPayments = allPayments
    .filter((p) => p.userId.toString() === principalStr)
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 3);

  const handleToggleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser.mutateAsync(entry.userId);
        setIsBlocked(false);
        toast.success("User unblocked");
      } else {
        await blockUser.mutateAsync(entry.userId);
        setIsBlocked(true);
        toast.success("User frozen");
      }
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const handleReviewSubmission = async (
    submissionId: bigint,
    approve: boolean,
  ) => {
    try {
      await reviewSubmission.mutateAsync({ submissionId, approve });
      toast.success(approve ? "Submission approved!" : "Submission declined");
    } catch {
      toast.error("Failed to update submission");
    }
  };

  const handleReviewPayment = async (paymentId: bigint, approve: boolean) => {
    try {
      await reviewPayment.mutateAsync({ paymentId, approve });
      toast.success(approve ? "Payment accepted!" : "Payment declined");
    } catch {
      toast.error("Failed to update payment");
    }
  };

  const isPending = blockUser.isPending || unblockUser.isPending;

  return (
    <div
      data-ocid={`admin.user.item.${index + 1}`}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Collapsed row */}
      <div className="p-4 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{
            background: "oklch(0.82 0.18 85 / 0.15)",
            color: "oklch(0.82 0.18 85)",
          }}
        >
          {avatarLetter}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">
              {entry.email || shortPrincipal}
            </p>
            {isBlocked && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{
                  background: "oklch(var(--destructive) / 0.15)",
                  color: "oklch(var(--destructive))",
                }}
              >
                Frozen
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs font-mono text-muted-foreground truncate">
              {shortPrincipal}
            </p>
            <span
              className="text-xs font-semibold"
              style={{ color: "oklch(0.82 0.18 85)" }}
            >
              {Number(entry.tasksCompleted)} tasks
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            data-ocid={
              isBlocked
                ? `admin.user.unblock_button.${index + 1}`
                : `admin.user.block_button.${index + 1}`
            }
            size="sm"
            onClick={handleToggleBlock}
            disabled={isPending}
            className="rounded-xl h-7 text-[10px] font-semibold px-2"
            style={
              isBlocked
                ? {
                    background: "oklch(var(--success) / 0.15)",
                    color: "oklch(var(--success))",
                    border: "1px solid oklch(var(--success) / 0.3)",
                  }
                : {
                    background: "oklch(var(--destructive) / 0.15)",
                    color: "oklch(var(--destructive))",
                    border: "1px solid oklch(var(--destructive) / 0.3)",
                  }
            }
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isBlocked ? (
              <>
                <ShieldCheck className="w-3 h-3 mr-1" />
                Unfreeze
              </>
            ) : (
              <>
                <ShieldOff className="w-3 h-3 mr-1" />
                Freeze
              </>
            )}
          </Button>
          <Button
            data-ocid={`admin.user.expand_button.${index + 1}`}
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((p) => !p)}
            className="rounded-xl w-7 h-7 text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              data-ocid={`admin.user.panel.${index + 1}`}
              className="px-4 pb-4 space-y-4"
              style={{
                borderTop: "1px solid oklch(0.82 0.18 85 / 0.08)",
              }}
            >
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 pt-3">
                {[
                  {
                    label: "Tasks Done",
                    value: Number(entry.tasksCompleted),
                    color: "oklch(0.82 0.18 85)",
                  },
                  {
                    label: "Submissions",
                    value: Number(entry.totalSubmissions),
                    color: "oklch(0.75 0.18 195)",
                  },
                  {
                    label: "Last Active",
                    value: lastSeenLabel,
                    color: "oklch(0.72 0.18 155)",
                    small: true,
                  },
                ].map(({ label, value, color, small }) => (
                  <div
                    key={label}
                    className="rounded-xl p-2.5 text-center bg-secondary/30"
                  >
                    <p
                      className={`font-bold ${small ? "text-xs" : "text-base"} leading-tight`}
                      style={{ color }}
                    >
                      {value}
                    </p>
                    <p className="text-muted-foreground text-[9px] mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Full principal */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">
                  Principal ID
                </p>
                <p className="text-xs font-mono text-foreground/60 break-all leading-relaxed">
                  {principalStr}
                </p>
              </div>

              {/* Recent Submissions */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Film
                    className="w-3 h-3"
                    style={{ color: "oklch(0.75 0.18 195)" }}
                  />
                  Recent Submissions
                </p>
                {userSubmissions.length === 0 ? (
                  <p className="text-muted-foreground text-xs py-2 pl-1">
                    No submissions yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {userSubmissions.map((sub) => {
                      const statusStr = String(sub.status);
                      const isPendingSub = statusStr === "pending";
                      return (
                        <div
                          key={String(sub.id)}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
                          style={{
                            background: "oklch(0.11 0.015 265 / 0.6)",
                            border: "1px solid oklch(0.82 0.18 85 / 0.06)",
                          }}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              Task {String(sub.taskId)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(
                                Number(sub.createdAt) / 1_000_000,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getStatusClass(statusStr)}`}
                            >
                              {getStatusLabel(statusStr)}
                            </span>
                            {isPendingSub && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleReviewSubmission(sub.id, true)
                                  }
                                  disabled={reviewSubmission.isPending}
                                  className="rounded-lg h-6 text-[10px] px-1.5"
                                  style={{
                                    background: "oklch(var(--success) / 0.15)",
                                    color: "oklch(var(--success))",
                                    border:
                                      "1px solid oklch(var(--success) / 0.3)",
                                  }}
                                >
                                  <Check className="w-2.5 h-2.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleReviewSubmission(sub.id, false)
                                  }
                                  disabled={reviewSubmission.isPending}
                                  className="rounded-lg h-6 text-[10px] px-1.5"
                                  style={{
                                    background:
                                      "oklch(var(--destructive) / 0.15)",
                                    color: "oklch(var(--destructive))",
                                    border:
                                      "1px solid oklch(var(--destructive) / 0.3)",
                                  }}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Payments */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <CreditCard
                    className="w-3 h-3"
                    style={{ color: "oklch(0.82 0.18 85)" }}
                  />
                  Recent Withdrawals
                </p>
                {userPayments.length === 0 ? (
                  <p className="text-muted-foreground text-xs py-2 pl-1">
                    No withdrawal requests
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {userPayments.map((pmt) => {
                      const statusStr = String(pmt.status);
                      const isPendingPmt = statusStr === "pending";
                      const paymentStatusConfig: Record<
                        string,
                        { label: string; color: string; bg: string }
                      > = {
                        pending: {
                          label: "Pending",
                          color: "oklch(0.82 0.18 85)",
                          bg: "oklch(0.82 0.18 85 / 0.12)",
                        },
                        accepted: {
                          label: "Accepted",
                          color: "oklch(0.72 0.18 155)",
                          bg: "oklch(0.72 0.18 155 / 0.12)",
                        },
                        declined: {
                          label: "Declined",
                          color: "oklch(var(--destructive))",
                          bg: "oklch(var(--destructive) / 0.12)",
                        },
                      };
                      const pmtCfg =
                        paymentStatusConfig[statusStr] ??
                        paymentStatusConfig.pending;
                      return (
                        <div
                          key={String(pmt.id)}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
                          style={{
                            background: "oklch(0.11 0.015 265 / 0.6)",
                            border: "1px solid oklch(0.82 0.18 85 / 0.06)",
                          }}
                        >
                          <div className="min-w-0">
                            <p
                              className="text-xs font-bold tabular-nums"
                              style={{ color: "oklch(0.82 0.18 85)" }}
                            >
                              {Number(pmt.amount).toLocaleString()} DC
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(
                                Number(pmt.createdAt) / 1_000_000,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{
                                background: pmtCfg.bg,
                                color: pmtCfg.color,
                              }}
                            >
                              {pmtCfg.label}
                            </span>
                            {isPendingPmt && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleReviewPayment(pmt.id, true)
                                  }
                                  disabled={reviewPayment.isPending}
                                  className="rounded-lg h-6 text-[10px] px-1.5"
                                  style={{
                                    background: "oklch(0.72 0.18 155 / 0.15)",
                                    color: "oklch(0.72 0.18 155)",
                                    border:
                                      "1px solid oklch(0.72 0.18 155 / 0.3)",
                                  }}
                                >
                                  <Check className="w-2.5 h-2.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleReviewPayment(pmt.id, false)
                                  }
                                  disabled={reviewPayment.isPending}
                                  className="rounded-lg h-6 text-[10px] px-1.5"
                                  style={{
                                    background:
                                      "oklch(var(--destructive) / 0.15)",
                                    color: "oklch(var(--destructive))",
                                    border:
                                      "1px solid oklch(var(--destructive) / 0.3)",
                                  }}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Payment Row ────────────────────────────────────────────────────────────

function PaymentRow({
  payment,
  index,
}: { payment: PaymentRequest; index: number }) {
  const reviewPayment = useReviewPayment();

  const principalStr = payment.userId.toString();
  const shortPrincipal = `${principalStr.slice(0, 8)}…${principalStr.slice(-6)}`;
  const statusStr = String(payment.status) as string;

  const isPending = statusStr === "pending";
  const isAccepted = statusStr === "accepted";

  const statusStyles: Record<
    string,
    { bg: string; color: string; label: string }
  > = {
    pending: {
      bg: "oklch(0.82 0.18 85 / 0.12)",
      color: "oklch(0.82 0.18 85)",
      label: "Pending",
    },
    accepted: {
      bg: "oklch(0.72 0.18 155 / 0.12)",
      color: "oklch(0.72 0.18 155)",
      label: "Accepted",
    },
    declined: {
      bg: "oklch(var(--destructive) / 0.12)",
      color: "oklch(var(--destructive))",
      label: "Declined",
    },
  };
  const style = statusStyles[statusStr] ?? statusStyles.pending;

  const createdDate = new Date(
    Number(payment.createdAt) / 1_000_000,
  ).toLocaleDateString();

  const handleReview = async (approve: boolean) => {
    try {
      await reviewPayment.mutateAsync({ paymentId: payment.id, approve });
      toast.success(approve ? "Payment accepted!" : "Payment declined");
    } catch {
      toast.error("Failed to update payment");
    }
  };

  return (
    <div
      data-ocid={`admin.payment.item.${index + 1}`}
      className="glass-card rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.82 0.18 85 / 0.1)" }}
            >
              <User
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.82 0.18 85 / 0.7)" }}
              />
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {shortPrincipal}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-baseline gap-1">
              <span
                className="font-display font-bold text-xl"
                style={{ color: "oklch(0.82 0.18 85)" }}
              >
                {Number(payment.amount).toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs">coins</span>
            </div>
            <span className="text-muted-foreground text-xs">{createdDate}</span>
          </div>
        </div>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ background: style.bg, color: style.color }}
        >
          {style.label}
        </span>
      </div>

      {isPending && (
        <div className="flex gap-2">
          <Button
            data-ocid={`admin.payment.approve_button.${index + 1}`}
            size="sm"
            onClick={() => handleReview(true)}
            disabled={reviewPayment.isPending}
            className="flex-1 rounded-xl h-9 text-xs font-semibold"
            style={{
              background: "oklch(0.72 0.18 155 / 0.15)",
              color: "oklch(0.72 0.18 155)",
              border: "1px solid oklch(0.72 0.18 155 / 0.3)",
            }}
          >
            {reviewPayment.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Check className="w-3 h-3 mr-1" />
                Accept
              </>
            )}
          </Button>
          <Button
            data-ocid={`admin.payment.decline_button.${index + 1}`}
            size="sm"
            onClick={() => handleReview(false)}
            disabled={reviewPayment.isPending}
            className="flex-1 rounded-xl h-9 text-xs font-semibold"
            style={{
              background: "oklch(var(--destructive) / 0.15)",
              color: "oklch(var(--destructive))",
              border: "1px solid oklch(var(--destructive) / 0.3)",
            }}
          >
            <X className="w-3 h-3 mr-1" />
            Decline
          </Button>
        </div>
      )}

      {!isPending && (
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{
            color: isAccepted
              ? "oklch(0.72 0.18 155)"
              : "oklch(var(--destructive))",
          }}
        >
          {isAccepted ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          <span>{isAccepted ? "Payment accepted" : "Payment declined"}</span>
        </div>
      )}
    </div>
  );
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

type ActivityEvent = {
  id: string;
  type: "login" | "submission" | "payment";
  description: string;
  userIdentifier: string;
  timestamp: number;
};

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(ms).toLocaleDateString();
}

function ActivityTab({
  submissions,
  payments,
  analyticsData,
  onRefresh,
  isRefreshing,
}: {
  submissions: Submission[];
  payments: PaymentRequest[];
  analyticsData: Array<{
    userId: Principal;
    email: string;
    lastLogin?: bigint;
    tasksCompleted: bigint;
    totalSubmissions: bigint;
  }>;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const events: ActivityEvent[] = [];

  // Submission events
  for (const sub of submissions) {
    const principalStr = sub.userId.toString();
    const shortP = `${principalStr.slice(0, 8)}…${principalStr.slice(-5)}`;
    events.push({
      id: `sub-${String(sub.id)}`,
      type: "submission",
      description: `Submitted Task ${String(sub.taskId)} proof`,
      userIdentifier: shortP,
      timestamp: Number(sub.createdAt) / 1_000_000,
    });
  }

  // Payment events
  for (const pmt of payments) {
    const principalStr = pmt.userId.toString();
    const shortP = `${principalStr.slice(0, 8)}…${principalStr.slice(-5)}`;
    events.push({
      id: `pmt-${String(pmt.id)}`,
      type: "payment",
      description: `Requested withdrawal of ${Number(pmt.amount).toLocaleString()} coins`,
      userIdentifier: shortP,
      timestamp: Number(pmt.createdAt) / 1_000_000,
    });
  }

  // Login events
  for (const entry of analyticsData) {
    if (!entry.lastLogin) continue;
    const principalStr = entry.userId.toString();
    const identifier =
      entry.email || `${principalStr.slice(0, 8)}…${principalStr.slice(-5)}`;
    events.push({
      id: `login-${principalStr}`,
      type: "login",
      description: "Logged in",
      userIdentifier: identifier,
      timestamp: Number(entry.lastLogin) / 1_000_000,
    });
  }

  // Sort newest first, limit 50
  events.sort((a, b) => b.timestamp - a.timestamp);
  const topEvents = events.slice(0, 50);

  const eventConfig = {
    login: {
      Icon: LogIn,
      color: "oklch(0.75 0.18 195)",
      bg: "oklch(0.75 0.18 195 / 0.12)",
      border: "oklch(0.75 0.18 195 / 0.4)",
    },
    submission: {
      Icon: Film,
      color: "oklch(0.82 0.18 85)",
      bg: "oklch(0.82 0.18 85 / 0.12)",
      border: "oklch(0.82 0.18 85 / 0.4)",
    },
    payment: {
      Icon: ArrowRightLeft,
      color: "oklch(0.72 0.18 155)",
      bg: "oklch(0.72 0.18 155 / 0.12)",
      border: "oklch(0.72 0.18 155 / 0.4)",
    },
  };

  return (
    <div className="space-y-3">
      {/* Refresh button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {topEvents.length} events (newest first)
        </p>
        <Button
          data-ocid="admin.activity.refresh_button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-xl h-8 text-xs border-border/40"
        >
          {isRefreshing ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1.5" />
          )}
          Refresh
        </Button>
      </div>

      {topEvents.length === 0 ? (
        <div
          data-ocid="admin.activity.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Activity className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">No activity yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            User logins, submissions, and withdrawals will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topEvents.map((event, i) => {
            const cfg = eventConfig[event.type];
            return (
              <motion.div
                key={event.id}
                data-ocid={`admin.activity.item.${i + 1}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                className="flex items-start gap-3 p-3 rounded-2xl relative overflow-hidden"
                style={{
                  background: "oklch(0.12 0.015 265 / 0.6)",
                  border: "1px solid oklch(0.82 0.18 85 / 0.06)",
                  borderLeft: `3px solid ${cfg.border}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: cfg.bg }}
                >
                  <cfg.Icon
                    className="w-3.5 h-3.5"
                    style={{ color: cfg.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90 font-medium leading-tight">
                    {event.description}
                  </p>
                  <p
                    className="text-xs font-mono mt-0.5"
                    style={{ color: `${cfg.color}99` }}
                  >
                    {event.userIdentifier}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                  {relativeTime(event.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Admin Page ─────────────────────────────────────────────────────────────

export function AdminPage({ onBack }: AdminPageProps) {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: submissions, isLoading: subsLoading } = useAllSubmissions();
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  const { data: analyticsData, isLoading: analyticsLoading } =
    useAllUsersAnalytics();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const pendingSubmissions =
    submissions?.filter((s) => String(s.status) === "pending").length ?? 0;

  const pendingPayments =
    payments?.filter((p) => String(p.status) === "pending").length ?? 0;

  const handleRefreshActivity = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["allSubmissions"] }),
      queryClient.invalidateQueries({ queryKey: ["allPayments"] }),
      queryClient.invalidateQueries({ queryKey: ["allUsersAnalytics"] }),
    ]);
    setIsRefreshing(false);
  };

  return (
    <div data-ocid="admin.page" className="page-enter min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{
          background: "oklch(0.09 0.01 260 / 0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid oklch(0.82 0.18 85 / 0.12)",
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-xl w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "oklch(0.82 0.18 85 / 0.15)",
              border: "1px solid oklch(0.82 0.18 85 / 0.3)",
            }}
          >
            <Coins
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-none">
              Admin Panel
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dark Coin management
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-8">
        <Tabs defaultValue="tasks" className="w-full">
          {/* Tab list — scrollable on mobile */}
          <div className="overflow-x-auto mb-4 -mx-4 px-4">
            <TabsList className="flex w-max min-w-full rounded-2xl h-10 p-1 bg-secondary/40 gap-0.5">
              <TabsTrigger
                data-ocid="admin.tasks_tab"
                value="tasks"
                className="flex-1 min-w-[60px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Tasks
                </span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.submissions_tab"
                value="submissions"
                className="flex-1 min-w-[75px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  Proofs
                  {pendingSubmissions > 0 && (
                    <span
                      className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={{
                        background: "oklch(0.82 0.18 85 / 0.2)",
                        color: "oklch(0.82 0.18 85)",
                      }}
                    >
                      {pendingSubmissions}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.users_tab"
                value="users"
                className="flex-1 min-w-[60px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Users
                </span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.payments_tab"
                value="payments"
                className="flex-1 min-w-[70px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Payments
                  {pendingPayments > 0 && (
                    <span
                      className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={{
                        background: "oklch(0.82 0.18 85 / 0.2)",
                        color: "oklch(0.82 0.18 85)",
                      }}
                    >
                      {pendingPayments}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.activity.tab"
                value="activity"
                className="flex-1 min-w-[65px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Activity
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Tasks Tab ── */}
          <TabsContent value="tasks" className="space-y-3 mt-0">
            {tasksLoading
              ? ["t1", "t2", "t3"].map((k) => (
                  <Skeleton
                    key={k}
                    className="h-36 rounded-2xl skeleton-shimmer"
                  />
                ))
              : tasks?.map((task, i) => (
                  <motion.div
                    key={String(task.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <AdminTaskRow task={task} index={i} />
                  </motion.div>
                ))}
          </TabsContent>

          {/* ── Submissions Tab ── */}
          <TabsContent value="submissions" className="space-y-3 mt-0">
            {subsLoading ? (
              ["s1", "s2", "s3"].map((k) => (
                <Skeleton
                  key={k}
                  className="h-40 rounded-2xl skeleton-shimmer"
                />
              ))
            ) : !submissions || submissions.length === 0 ? (
              <div
                data-ocid="admin.submission.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <Film className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">
                  No submissions yet
                </p>
              </div>
            ) : (
              submissions.map((sub, i) => (
                <motion.div
                  key={String(sub.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <SubmissionRow sub={sub} index={i} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* ── Users Tab (Full Rebuild) ── */}
          <TabsContent value="users" className="space-y-3 mt-0">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                {
                  label: "Total Users",
                  value: analyticsData?.length ?? 0,
                  Icon: Users,
                  color: "0.82 0.18 85",
                },
                {
                  label: "Tasks Done",
                  value: analyticsData
                    ? analyticsData.reduce(
                        (sum, u) => sum + Number(u.tasksCompleted),
                        0,
                      )
                    : 0,
                  Icon: CheckCircle,
                  color: "0.72 0.18 155",
                },
                {
                  label: "Submissions",
                  value: analyticsData
                    ? analyticsData.reduce(
                        (sum, u) => sum + Number(u.totalSubmissions),
                        0,
                      )
                    : 0,
                  Icon: Film,
                  color: "0.75 0.18 195",
                },
              ].map(({ label, value, Icon, color }) => (
                <div
                  key={label}
                  className="glass-card rounded-2xl p-3 text-center"
                >
                  <Icon
                    className="w-4 h-4 mx-auto mb-1"
                    style={{ color: `oklch(${color} / 0.8)` }}
                  />
                  <p className="font-bold text-foreground text-base">{value}</p>
                  <p className="text-muted-foreground text-[10px]">{label}</p>
                </div>
              ))}
            </div>

            {analyticsLoading ? (
              ["u1", "u2", "u3"].map((k) => (
                <Skeleton
                  key={k}
                  className="h-16 rounded-2xl skeleton-shimmer"
                />
              ))
            ) : !analyticsData || analyticsData.length === 0 ? (
              <div
                data-ocid="admin.user.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <User className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No users yet</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Users appear here when they log in
                </p>
              </div>
            ) : (
              analyticsData.map((entry, i) => (
                <motion.div
                  key={entry.userId.toString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ExpandableUserCard
                    entry={entry}
                    index={i}
                    allSubmissions={submissions ?? []}
                    allPayments={payments ?? []}
                  />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* ── Payments Tab ── */}
          <TabsContent value="payments" className="space-y-3 mt-0">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                {
                  label: "Total",
                  value: payments?.length ?? 0,
                  Icon: CreditCard,
                  color: "0.82 0.18 85",
                },
                {
                  label: "Pending",
                  value: pendingPayments,
                  Icon: Clock,
                  color: "0.82 0.18 80",
                },
                {
                  label: "Accepted",
                  value:
                    payments?.filter((p) => String(p.status) === "accepted")
                      .length ?? 0,
                  Icon: CheckCircle,
                  color: "0.72 0.18 155",
                },
              ].map(({ label, value, Icon, color }) => (
                <div
                  key={label}
                  className="glass-card rounded-2xl p-3 text-center"
                >
                  <Icon
                    className="w-4 h-4 mx-auto mb-1.5"
                    style={{ color: `oklch(${color} / 0.8)` }}
                  />
                  <p className="font-bold text-foreground text-lg">{value}</p>
                  <p className="text-muted-foreground text-[10px]">{label}</p>
                </div>
              ))}
            </div>

            {paymentsLoading ? (
              ["p1", "p2", "p3"].map((k) => (
                <Skeleton
                  key={k}
                  className="h-28 rounded-2xl skeleton-shimmer"
                />
              ))
            ) : !payments || payments.length === 0 ? (
              <div
                data-ocid="admin.payment.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <CreditCard className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">
                  No payment requests yet
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  User withdrawal requests will appear here
                </p>
              </div>
            ) : (
              payments.map((payment, i) => (
                <motion.div
                  key={String(payment.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <PaymentRow payment={payment} index={i} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* ── Activity Tab ── */}
          <TabsContent value="activity" className="mt-0">
            {subsLoading || paymentsLoading || analyticsLoading ? (
              <div className="space-y-2">
                {["a1", "a2", "a3", "a4", "a5"].map((k) => (
                  <Skeleton
                    key={k}
                    className="h-14 rounded-2xl skeleton-shimmer"
                  />
                ))}
              </div>
            ) : (
              <ActivityTab
                submissions={submissions ?? []}
                payments={payments ?? []}
                analyticsData={analyticsData ?? []}
                onRefresh={handleRefreshActivity}
                isRefreshing={isRefreshing}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
