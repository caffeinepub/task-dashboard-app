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
import type { Submission, Task } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  getStatusClass,
  getStatusLabel,
  toObjectUrl,
  useAllSubmissions,
  useBlockUser,
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

// ─── Analytics User Card ────────────────────────────────────────────────────

function AnalyticsUserCard({
  principal,
  submissions,
  index,
}: {
  principal: Principal;
  submissions: Submission[];
  index: number;
}) {
  const { actor } = useActor();
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

  const userSubmissions = submissions.filter(
    (s) => s.userId.toString() === principalStr,
  );
  const approved = userSubmissions.filter(
    (s) => String(s.status) === "approved",
  ).length;
  const pending = userSubmissions.filter(
    (s) => String(s.status) === "pending",
  ).length;
  const displayName = userProfile?.email?.split("@")[0] ?? shortPrincipal;

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
            {userProfile?.email ?? shortPrincipal}
          </p>
          <p className="text-xs font-mono text-muted-foreground truncate">
            {shortPrincipal}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-2.5 text-center bg-secondary/40">
          <p className="font-bold text-foreground text-base">
            {userSubmissions.length}
          </p>
          <p className="text-muted-foreground text-[10px]">Total</p>
        </div>
        <div className="rounded-xl p-2.5 text-center bg-secondary/40">
          <p
            className="font-bold text-base"
            style={{ color: "oklch(var(--success))" }}
          >
            {approved}
          </p>
          <p className="text-muted-foreground text-[10px]">Approved</p>
        </div>
        <div className="rounded-xl p-2.5 text-center bg-secondary/40">
          <p
            className="font-bold text-base"
            style={{ color: "oklch(var(--warning))" }}
          >
            {pending}
          </p>
          <p className="text-muted-foreground text-[10px]">Pending</p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Page ─────────────────────────────────────────────────────────────

export function AdminPage({ onBack }: AdminPageProps) {
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: submissions, isLoading: subsLoading } = useAllSubmissions();

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
          <TabsContent value="payments" className="mt-0">
            <div
              data-ocid="admin.payments.panel"
              className="glass-card rounded-2xl p-6 flex flex-col items-center text-center gap-4"
              style={{ border: "1px solid oklch(0.82 0.18 85 / 0.1)" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "oklch(0.82 0.18 85 / 0.1)",
                  border: "1px solid oklch(0.82 0.18 85 / 0.2)",
                }}
              >
                <CreditCard
                  className="w-8 h-8"
                  style={{ color: "oklch(0.82 0.18 85 / 0.7)" }}
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-base mb-1">
                  Payment Processing
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Payment processing is coming soon. Withdrawal requests from
                  users will appear here for review.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Feature coming soon</span>
              </div>

              {/* Summary stats from submissions */}
              <div className="w-full grid grid-cols-3 gap-2 mt-2">
                {[
                  {
                    label: "Total Users",
                    value: uniqueUsers.length,
                    Icon: Users,
                  },
                  {
                    label: "Approved Tasks",
                    value:
                      submissions?.filter(
                        (s) => String(s.status) === "approved",
                      ).length ?? 0,
                    Icon: CheckCircle,
                  },
                  {
                    label: "Pending Review",
                    value: pendingSubmissions,
                    Icon: Clock,
                  },
                ].map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center bg-secondary/40"
                  >
                    <Icon
                      className="w-4 h-4 mx-auto mb-1.5"
                      style={{ color: "oklch(0.82 0.18 85 / 0.6)" }}
                    />
                    <p className="font-bold text-foreground text-lg">{value}</p>
                    <p className="text-muted-foreground text-[10px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics" className="space-y-4 mt-0">
            {/* Overall stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Users",
                  value: uniqueUsers.length,
                  Icon: Users,
                  color: "0.82 0.18 85",
                },
                {
                  label: "Total Submissions",
                  value: submissions?.length ?? 0,
                  Icon: Film,
                  color: "0.75 0.18 195",
                },
                {
                  label: "Approved",
                  value:
                    submissions?.filter((s) => String(s.status) === "approved")
                      .length ?? 0,
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

              {subsLoading ? (
                ["a1", "a2", "a3"].map((k) => (
                  <Skeleton
                    key={k}
                    className="h-24 rounded-2xl skeleton-shimmer mb-3"
                  />
                ))
              ) : uniqueUsers.length === 0 ? (
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
                  {uniqueUsers.map((principal, i) => (
                    <motion.div
                      key={principal.toString()}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <AnalyticsUserCard
                        principal={principal}
                        submissions={submissions ?? []}
                        index={i}
                      />
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
