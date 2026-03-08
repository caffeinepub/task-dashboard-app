import type { Principal } from "@icp-sdk/core/principal";
import { Ban, Coins, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
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
import { getTaskLink } from "../lib/taskLinks";

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

    // Check localStorage first, then TASK_CONFIG fallback
    const effectiveLink = getTaskLink(index) ?? TASK_CONFIG[index]?.link;
    if (effectiveLink) {
      // External link tasks: open link + show upload page immediately
      setTimerTask({ task, link: effectiveLink });
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
      {/* Header — premium gradient border */}
      <header
        className="sticky top-0 z-40 px-4 py-3.5 flex items-center justify-between"
        style={{
          background: "oklch(0.09 0.01 260 / 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid oklch(0.82 0.18 85 / 0.18)",
          boxShadow: "0 1px 0 oklch(0.82 0.18 85 / 0.06)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{
              boxShadow: [
                "0 0 12px oklch(0.82 0.18 85 / 0.3)",
                "0 0 22px oklch(0.82 0.18 85 / 0.55)",
                "0 0 12px oklch(0.82 0.18 85 / 0.3)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.25), oklch(0.75 0.15 80 / 0.15))",
              border: "1.5px solid oklch(0.82 0.18 85 / 0.4)",
            }}
          >
            <Coins
              className="w-4.5 h-4.5"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
          </motion.div>
          <div>
            <span
              className="font-display font-black text-xl tracking-[-0.03em]"
              style={{
                color: "oklch(0.82 0.18 85)",
                letterSpacing: "-0.03em",
              }}
            >
              Dark Coin
            </span>
          </div>
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
            <motion.div
              whileTap={{ scale: 0.93 }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black cursor-pointer"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
                color: "oklch(0.1 0.02 85)",
                boxShadow: "0 0 12px oklch(0.82 0.18 85 / 0.35)",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-5 pb-28">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-5"
        >
          <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
            Welcome back,{" "}
            <span style={{ color: "oklch(0.82 0.18 85)" }}>{displayName}</span>{" "}
            👋
          </h2>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
            <TrendingUp
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.72 0.18 155)" }}
            />
            Complete tasks to unlock your earning potential
          </p>
        </motion.div>

        {/* Coin Balance — prominent radial glow card */}
        <motion.div
          data-ocid="home.coin_balance.card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="mb-5 rounded-3xl px-5 py-4 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.14 0.04 85 / 0.85), oklch(0.12 0.02 265 / 0.9))",
            border: "1px solid oklch(0.82 0.18 85 / 0.35)",
            backdropFilter: "blur(16px)",
            boxShadow:
              "0 0 28px oklch(0.82 0.18 85 / 0.16), inset 0 1px 0 oklch(0.82 0.18 85 / 0.1)",
          }}
        >
          {/* Radial glow background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 80% 50%, oklch(0.82 0.18 85 / 0.07) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 tracking-wide uppercase">
                Available Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-display font-black text-3xl tabular-nums leading-none"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                >
                  {coinBalance !== undefined
                    ? `₹${Number(coinBalance).toLocaleString("en-IN")}`
                    : "—"}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "oklch(0.82 0.18 85 / 0.55)" }}
                >
                  INR
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Earned from completed tasks
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.22), oklch(0.75 0.15 80 / 0.16))",
                border: "1.5px solid oklch(0.82 0.18 85 / 0.35)",
                boxShadow: "0 0 20px oklch(0.82 0.18 85 / 0.2)",
              }}
            >
              <Coins
                className="w-7 h-7"
                style={{ color: "oklch(0.82 0.18 85)" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Active Tasks section header */}
        {!tasksLoading && tasks && tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            className="flex items-center gap-2 mb-3"
          >
            <Sparkles
              className="w-4 h-4"
              style={{ color: "oklch(0.82 0.18 85)" }}
            />
            <h3
              className="font-display font-bold text-base"
              style={{ color: "oklch(0.82 0.18 85)" }}
            >
              Active Tasks
            </h3>
            <div
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "oklch(0.82 0.18 85 / 0.1)",
                color: "oklch(0.82 0.18 85 / 0.7)",
                border: "1px solid oklch(0.82 0.18 85 / 0.15)",
              }}
            >
              {tasks.length} tasks
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
