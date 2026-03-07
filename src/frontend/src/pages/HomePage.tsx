import type { Principal } from "@icp-sdk/core/principal";
import { Ban, ShieldAlert, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Task } from "../backend.d";
import type { UserProfile } from "../backend.d";
import { TaskCard, TaskCardSkeleton } from "../components/app/TaskCard";
import { TaskDetailSheet } from "../components/app/TaskDetailSheet";
import { useTasks, useUserSubmissions } from "../hooks/useQueries";

interface HomePageProps {
  profile: UserProfile | null;
  isAdmin: boolean;
  principal: Principal | undefined;
}

export function HomePage({ profile, isAdmin, principal }: HomePageProps) {
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: submissions } = useUserSubmissions(principal);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleStartTask = (task: Task) => {
    setSelectedTask(task);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setTimeout(() => setSelectedTask(null), 300);
  };

  // Find submission for a task
  const getSubmission = (taskId: bigint) =>
    submissions?.find((s) => s.taskId === taskId);

  // Selected task submission
  const selectedSubmission = selectedTask
    ? getSubmission(selectedTask.id)
    : undefined;

  if (profile?.isBlocked) {
    return (
      <div
        data-ocid="home.page"
        className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-6 text-center"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: "oklch(var(--destructive) / 0.15)" }}
        >
          <Ban className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Account Blocked
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Your account has been blocked by an administrator. Please contact
          support if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div data-ocid="home.page" className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{
          background: "oklch(0.13 0.02 260 / 0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.28 0.04 265 / 0.4)",
        }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground tracking-tight">
            TaskFlow
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "oklch(0.7 0.2 300 / 0.15)",
                color: "oklch(0.7 0.2 300)",
                border: "1px solid oklch(0.7 0.2 300 / 0.3)",
              }}
            >
              <ShieldAlert className="w-3 h-3" />
              Admin
            </span>
          )}
          {profile?.email && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.75 0.18 195), oklch(0.7 0.2 220))",
                color: "oklch(0.1 0.02 260)",
              }}
            >
              {profile.email.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-4 pb-24">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5"
        >
          <h2 className="font-display text-2xl font-bold text-foreground">
            {profile?.email
              ? `Hello, ${profile.email.split("@")[0]} 👋`
              : "Your Tasks"}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tasks && !tasksLoading
              ? `${tasks.length} tasks available`
              : "Loading your tasks…"}
          </p>
        </motion.div>

        {/* Task Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tasksLoading
            ? [0, 1, 2, 3, 4, 5].map((i) => (
                <TaskCardSkeleton key={`sk-${i}`} index={i} />
              ))
            : tasks?.map((task, i) => (
                <TaskCard
                  key={String(task.id)}
                  task={task}
                  index={i}
                  submission={getSubmission(task.id)}
                  onStart={handleStartTask}
                />
              ))}
        </div>

        {/* Empty state */}
        {!tasksLoading && (!tasks || tasks.length === 0) && (
          <div
            data-ocid="task.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <p className="text-muted-foreground">No tasks available yet.</p>
          </div>
        )}
      </main>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        submission={selectedSubmission}
        open={sheetOpen}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
