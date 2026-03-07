import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Film,
  ImageOff,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Upload,
  User,
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
      <div className="flex-1 w-full space-y-3">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs text-muted-foreground font-medium">
            Task {index + 1}
          </span>
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
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
            Change Image
          </Button>
          <Button
            data-ocid={`admin.task.save_button.${index + 1}`}
            size="sm"
            onClick={handleSave}
            disabled={updateTask.isPending}
            className="rounded-xl text-xs h-8 btn-glow"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 195), oklch(0.7 0.2 220))",
              color: "oklch(0.1 0.02 260)",
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
      // Try to detect if it's a video based on magic bytes
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
        style={{ background: "oklch(var(--accent) / 0.5)" }}
      >
        <User className="w-5 h-5 text-muted-foreground" />
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

  return (
    <div data-ocid="admin.page" className="page-enter min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{
          background: "oklch(0.13 0.02 260 / 0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.28 0.04 265 / 0.4)",
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
        <div>
          <h1 className="font-display font-bold text-lg text-foreground leading-none">
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage tasks and users
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-8">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="w-full rounded-2xl mb-4 h-10 p-1 bg-secondary/40">
            <TabsTrigger
              data-ocid="admin.tasks_tab"
              value="tasks"
              className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              data-ocid="admin.submissions_tab"
              value="submissions"
              className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Submissions
              {submissions && submissions.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-primary/20 text-primary font-bold">
                  {submissions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              data-ocid="admin.users_tab"
              value="users"
              className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Users
            </TabsTrigger>
          </TabsList>

          {/* ── Tasks Tab ── */}
          <TabsContent value="tasks" className="space-y-3 mt-0">
            {tasksLoading
              ? ["t1", "t2", "t3"].map((k) => (
                  <Skeleton
                    key={k}
                    className="h-28 rounded-2xl skeleton-shimmer"
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
        </Tabs>
      </div>
    </div>
  );
}
