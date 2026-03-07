import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle,
  Clock,
  Coins,
  CreditCard,
  Film,
  ImageOff,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PaymentRequest, Submission, Task } from "../backend.d";
import { useActor } from "../hooks/useActor";
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
  const [startLink, setStartLink] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<Uint8Array | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task.image && task.image.length > 0) {
      const url = toObjectUrl(task.image);
      setImageUrl(url);
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
    setImageUrl(null);
  }, [task.image]);

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
      await updateTask.mutateAsync({
        taskId: task.id,
        title,
        image: pendingImage,
      });
      setPendingImage(null);
      toast.success(`Task ${index + 1} updated`);
    } catch {
      toast.error("Failed to update task");
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start">
      {/* Image thumbnail */}
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

      {/* Fields */}
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
      {/* Header */}
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

      {/* File Preview */}
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

      {/* Action Buttons */}
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

// ─── User Row ───────────────────────────────────────────────────────────────

function UserRow({
  principal,
  index,
}: { principal: Principal; index: number }) {
  const { actor } = useActor();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", principal.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor,
  });

  const principalStr = principal.toString();
  const shortPrincipal = `${principalStr.slice(0, 8)}…${principalStr.slice(-6)}`;
  const isBlocked = userProfile?.isBlocked ?? false;

  const handleToggleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser.mutateAsync(principal);
        toast.success("User unblocked");
      } else {
        await blockUser.mutateAsync(principal);
        toast.success("User blocked");
      }
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const isPending = blockUser.isPending || unblockUser.isPending;

  return (
    <div
      data-ocid={`admin.user.item.${index + 1}`}
      className="glass-card rounded-2xl p-4 flex items-center gap-3"
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "oklch(0.82 0.18 85 / 0.1)" }}
      >
        <User
          className="w-5 h-5"
          style={{ color: "oklch(0.82 0.18 85 / 0.7)" }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {userProfile?.email ? (
          <p className="text-sm font-semibold text-foreground truncate">
            {userProfile.email}
          </p>
        ) : null}
        <p className="text-xs font-mono text-muted-foreground truncate">
          {shortPrincipal}
        </p>
        {isBlocked && (
          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full status-declined">
            Blocked
          </span>
        )}
      </div>

      {/* Block/Unblock */}
      <Button
        data-ocid={
          isBlocked
            ? `admin.user.unblock_button.${index + 1}`
            : `admin.user.block_button.${index + 1}`
        }
        size="sm"
        onClick={handleToggleBlock}
        disabled={isPending}
        className="rounded-xl h-8 text-xs font-semibold flex-shrink-0"
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
            Unblock
          </>
        ) : (
          <>
            <ShieldOff className="w-3 h-3 mr-1" />
            Block
          </>
        )}
      </Button>
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
      {/* Header */}
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

      {/* Action Buttons for pending */}
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

      {/* Settled state */}
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

// ─── Analytics User Card ────────────────────────────────────────────────────

function AnalyticsUserCard({
  entry,
  index,
}: {
  entry: {
    userId: Principal;
    email: string;
    lastLogin?: bigint;
    tasksCompleted: bigint;
    totalSubmissions: bigint;
  };
  index: number;
}) {
  const principalStr = entry.userId.toString();
  const shortPrincipal = `${principalStr.slice(0, 8)}…${principalStr.slice(-6)}`;
  const displayName = entry.email ? entry.email.split("@")[0] : shortPrincipal;

  const lastSeenLabel = (() => {
    if (!entry.lastLogin) return "Never";
    const ms = Number(entry.lastLogin) / 1_000_000;
    const diffDays = Math.floor((Date.now() - ms) / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    return new Date(ms).toLocaleDateString();
  })();

  return (
    <div
      data-ocid={`admin.analytics.item.${index + 1}`}
      className="glass-card rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{
            background: "oklch(0.82 0.18 85 / 0.15)",
            color: "oklch(0.82 0.18 85)",
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {entry.email || shortPrincipal}
          </p>
          <p className="text-xs font-mono text-muted-foreground truncate">
            {shortPrincipal}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Last seen: {lastSeenLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2.5 text-center bg-secondary/40">
          <p
            className="font-bold text-base"
            style={{ color: "oklch(0.82 0.18 85)" }}
          >
            {Number(entry.tasksCompleted)}
          </p>
          <p className="text-muted-foreground text-[10px]">Tasks Done</p>
        </div>
        <div className="rounded-xl p-2.5 text-center bg-secondary/40">
          <p
            className="font-bold text-base"
            style={{ color: "oklch(0.75 0.18 195)" }}
          >
            {Number(entry.totalSubmissions)}
          </p>
          <p className="text-muted-foreground text-[10px]">Submissions</p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Page ─────────────────────────────────────────────────────────────

export function AdminPage({ onBack }: AdminPageProps) {
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: submissions, isLoading: subsLoading } = useAllSubmissions();
  const { data: payments, isLoading: paymentsLoading } = useAllPayments();
  const { data: analyticsData, isLoading: analyticsLoading } =
    useAllUsersAnalytics();

  // Deduplicate users from submissions
  const uniqueUsers = submissions
    ? [
        ...new Map(
          submissions.map((s) => [s.userId.toString(), s.userId]),
        ).values(),
      ]
    : [];

  const pendingSubmissions =
    submissions?.filter((s) => String(s.status) === "pending").length ?? 0;

  const pendingPayments =
    payments?.filter((p) => String(p.status) === "pending").length ?? 0;

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
                className="flex-1 min-w-[70px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
                style={
                  {
                    "--active-bg": "oklch(0.82 0.18 85)",
                  } as React.CSSProperties
                }
              >
                <span className="flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Tasks
                </span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.submissions_tab"
                value="submissions"
                className="flex-1 min-w-[90px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
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
                className="flex-1 min-w-[70px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Users
                </span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.payments_tab"
                value="payments"
                className="flex-1 min-w-[80px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
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
                data-ocid="admin.analytics_tab"
                value="analytics"
                className="flex-1 min-w-[80px] rounded-xl text-xs font-semibold data-[state=active]:text-primary-foreground whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Analytics
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

          {/* ── Users Tab ── */}
          <TabsContent value="users" className="space-y-3 mt-0">
            {subsLoading ? (
              ["u1", "u2", "u3"].map((k) => (
                <Skeleton
                  key={k}
                  className="h-16 rounded-2xl skeleton-shimmer"
                />
              ))
            ) : uniqueUsers.length === 0 ? (
              <div
                data-ocid="admin.user.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <User className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No users yet</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Users appear here when they submit tasks
                </p>
              </div>
            ) : (
              uniqueUsers.map((principal, i) => (
                <motion.div
                  key={principal.toString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <UserRow principal={principal} index={i} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* ── Payments Tab ── */}
          <TabsContent value="payments" className="space-y-3 mt-0">
            {/* Summary stats */}
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

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics" className="space-y-4 mt-0">
            {/* Overall stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Users",
                  value: analyticsData?.length ?? uniqueUsers.length,
                  Icon: Users,
                  color: "0.82 0.18 85",
                },
                {
                  label: "Total Submissions",
                  value: analyticsData
                    ? analyticsData.reduce(
                        (sum, u) => sum + Number(u.totalSubmissions),
                        0,
                      )
                    : (submissions?.length ?? 0),
                  Icon: Film,
                  color: "0.75 0.18 195",
                },
                {
                  label: "Tasks Completed",
                  value: analyticsData
                    ? analyticsData.reduce(
                        (sum, u) => sum + Number(u.tasksCompleted),
                        0,
                      )
                    : (submissions?.filter(
                        (s) => String(s.status) === "approved",
                      ).length ?? 0),
                  Icon: CheckCircle,
                  color: "0.72 0.18 155",
                },
                {
                  label: "Pending",
                  value: pendingSubmissions,
                  Icon: Clock,
                  color: "0.82 0.18 80",
                },
              ].map(({ label, value, Icon, color }) => (
                <div
                  key={label}
                  className="glass-card rounded-2xl p-4 text-center"
                >
                  <Icon
                    className="w-5 h-5 mx-auto mb-2"
                    style={{ color: `oklch(${color} / 0.8)` }}
                  />
                  <p className="font-display font-bold text-2xl text-foreground">
                    {value}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* User breakdown */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3 px-1 flex items-center gap-2">
                <BarChart3
                  className="w-4 h-4"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                />
                User Activity
              </h3>

              {analyticsLoading ? (
                ["a1", "a2", "a3"].map((k) => (
                  <Skeleton
                    key={k}
                    className="h-28 rounded-2xl skeleton-shimmer mb-3"
                  />
                ))
              ) : !analyticsData || analyticsData.length === 0 ? (
                <div
                  data-ocid="admin.analytics.empty_state"
                  className="glass-card rounded-2xl flex flex-col items-center justify-center py-12 text-center"
                >
                  <BarChart3 className="w-8 h-8 text-muted-foreground mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">
                    No activity data yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyticsData.map((entry, i) => (
                    <motion.div
                      key={entry.userId.toString()}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <AnalyticsUserCard entry={entry} index={i} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
