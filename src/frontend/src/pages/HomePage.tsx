import type { Principal } from "@icp-sdk/core/principal";
import { Ban, Coins, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Task, UserProfile } from "../backend.d";
import {
  TASK_CONFIG,
  TaskCard,
  TaskCardSkeleton,
} from "../components/app/TaskCard";
import { TaskDetailSheet } from "../components/app/TaskDetailSheet";
import { TaskTimerPage } from "../components/app/TaskTimerPage";
import {
  useGetCoinBalance,
  useTasks,
  useUserSubmissions,
} from "../hooks/useQueries";

interface HomePageProps {
  profile: UserProfile | null;
  isAdmin: boolean;
  principal: Principal | undefined;
}

export function HomePage({ profile, isAdmin, principal }: HomePageProps) {
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: submissions } = useUserSubmissions(principal);
  const { data: coinBalance } = useGetCoinBalance(principal);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [timerTask, setTimerTask] = useState<{
    task: Task;
    link: string;
  } | null>(null);

  const handleStartTask = (task: Task, index: number) => {
    // Block re-access if user already submitted this task
    const existingSubmission = getSubmission(task.id);
    if (existingSubmission) return;

    const taskConfig = TASK_CONFIG[index];
    if (taskConfig?.link) {
      // External link tasks: open link + show upload page immediately
      setTimerTask({ task, link: taskConfig.link });
    } else {
      setSelectedTask(task);
      setSheetOpen(true);
    }
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

  // Derive display name
  const displayName = profile?.email?.split("@")[0] ?? "Earner";

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
          background: "oklch(0.09 0.01 260 / 0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid oklch(0.82 0.18 85 / 0.1)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "oklch(0.82 0.18 85 / 0.15)",
              border: "1px solid oklch(0.82 0.18 85 / 0.3)",
            }}
          >
            <Coins
              className="w-4 h-4"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
          </div>
          <span
            className="font-display font-bold text-lg tracking-tight"
            style={{ color: "oklch(0.82 0.18 85)" }}
          >
            Dark Coin
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "oklch(0.82 0.18 85 / 0.12)",
                color: "oklch(0.82 0.18 85)",
                border: "1px solid oklch(0.82 0.18 85 / 0.25)",
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
                  "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                color: "oklch(0.1 0.02 85)",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
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
            Welcome back, {displayName} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tasks && !tasksLoading
              ? `${tasks.length} tasks available`
              : "Loading your tasks…"}
          </p>
        </motion.div>

        {/* Coin Balance Mini Bar */}
        <motion.div
          data-ocid="home.coin_balance.card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="mb-4 rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{
            background: "oklch(0.13 0.02 85 / 0.7)",
            border: "1px solid oklch(0.82 0.18 85 / 0.35)",
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 0 16px oklch(0.82 0.18 85 / 0.12), inset 0 1px 0 oklch(0.82 0.18 85 / 0.08)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.82 0.18 85 / 0.18)",
                border: "1px solid oklch(0.82 0.18 85 / 0.3)",
              }}
            >
              <Coins
                className="w-4 h-4"
                style={{ color: "oklch(0.82 0.18 85)" }}
              />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Your Balance
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-display font-bold text-xl tabular-nums"
              style={{ color: "oklch(0.82 0.18 85)" }}
            >
              {coinBalance !== undefined
                ? Number(coinBalance).toLocaleString()
                : "—"}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "oklch(0.82 0.18 85 / 0.65)" }}
            >
              DC
            </span>
          </div>
        </motion.div>

        {/* Earnings banner */}
        {!tasksLoading && tasks && tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mb-5 rounded-2xl p-4 flex items-center gap-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.1), oklch(0.75 0.15 80 / 0.06))",
              border: "1px solid oklch(0.82 0.18 85 / 0.2)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.82 0.18 85 / 0.2)",
              }}
            >
              <Coins
                className="w-5 h-5"
                style={{ color: "oklch(0.82 0.18 85)" }}
              />
            </div>
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: "oklch(0.82 0.18 85)" }}
              >
                Start Earning Today
              </p>
              <p className="text-muted-foreground text-xs">
                Complete tasks below and submit proof to earn rewards
              </p>
            </div>
          </motion.div>
        )}

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
                  onStart={(t) => handleStartTask(t, i)}
                />
              ))}
        </div>

        {/* Empty state */}
        {!tasksLoading && (!tasks || tasks.length === 0) && (
          <div
            data-ocid="task.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "oklch(0.82 0.18 85 / 0.1)",
                border: "1px solid oklch(0.82 0.18 85 / 0.2)",
              }}
            >
              <Coins
                className="w-8 h-8"
                style={{ color: "oklch(0.82 0.18 85 / 0.5)" }}
              />
            </div>
            <p className="text-muted-foreground">No tasks available yet.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Check back soon for new earning opportunities.
            </p>
          </div>
        )}
      </main>

      {/* Task Detail Sheet (non-external-link tasks) */}
      <TaskDetailSheet
        task={selectedTask}
        submission={selectedSubmission}
        open={sheetOpen}
        onClose={handleCloseSheet}
      />

      {/* Task Upload Page (external-link tasks — upload available immediately) */}
      {timerTask && (
        <TaskTimerPage
          task={timerTask.task}
          taskLink={timerTask.link}
          onClose={() => setTimerTask(null)}
        />
      )}
    </div>
  );
}
