import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Principal } from "@icp-sdk/core/principal";
import {
  CheckCircle,
  Clock,
  Coins,
  MessageCircle,
  Send,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { backendInterface } from "../../backend.d";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  chips?: string[];
  timestamp: number;
}

interface UserData {
  principalId: string;
  email?: string;
  coinBalance: bigint;
  isBlocked?: boolean;
  bankName?: string;
  accountNumberMasked?: string;
  submissions: Array<{
    taskId: string;
    status: string;
    createdAt: bigint;
  }>;
  payments: Array<{
    orderId: string;
    amount: bigint;
    status: string;
    createdAt: bigint;
  }>;
}

interface AIChatBotProps {
  actor: backendInterface | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  return "●".repeat(account.length - 4) + account.slice(-4);
}

function isPrincipalLike(str: string): boolean {
  // ICP principal IDs have multiple "-" segments and are at least 20 chars
  const cleaned = str.trim();
  if (cleaned.length < 20) return false;
  const segments = cleaned.split("-");
  return segments.length >= 3;
}

function statusLabel(status: string): string {
  switch (status) {
    case "approved":
      return "Approved ✓";
    case "inPayment":
      return "In Payment";
    case "transferred":
      return "Transferred ✓";
    case "declined":
      return "Declined";
    default:
      return "Pending";
  }
}

// ── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "oklch(0.82 0.18 85 / 0.7)" }}
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Bot Message ───────────────────────────────────────────────────────────────

function BotMessage({
  message,
  onChipClick,
}: {
  message: Message;
  onChipClick?: (chip: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-2.5 pr-8"
    >
      {/* Bot avatar */}
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.25), oklch(0.75 0.15 80 / 0.18))",
          border: "1px solid oklch(0.82 0.18 85 / 0.35)",
        }}
      >
        <Coins
          className="w-3.5 h-3.5"
          style={{ color: "oklch(0.82 0.18 85)" }}
        />
      </div>

      <div className="flex-1 space-y-2">
        {/* Message bubble */}
        <div
          className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-foreground leading-relaxed"
          style={{
            background: "oklch(0.14 0.02 265 / 0.9)",
            border: "1px solid oklch(0.82 0.18 85 / 0.12)",
            borderLeft: "2px solid oklch(0.82 0.18 85 / 0.5)",
          }}
        >
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {message.text}
          </pre>
        </div>

        {/* Quick reply chips */}
        {message.chips && message.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onChipClick?.(chip)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150"
                style={{
                  background: "oklch(0.82 0.18 85 / 0.08)",
                  border: "1px solid oklch(0.82 0.18 85 / 0.25)",
                  color: "oklch(0.82 0.18 85)",
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── User Message ──────────────────────────────────────────────────────────────

function UserMessage({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-2.5 pl-8 justify-end"
    >
      <div
        className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm leading-relaxed"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.2), oklch(0.75 0.15 80 / 0.15))",
          border: "1px solid oklch(0.82 0.18 85 / 0.25)",
          color: "oklch(0.95 0.01 85)",
        }}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

// ── Main AIChatBot Component ──────────────────────────────────────────────────

export function AIChatBot({ actor }: AIChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionState, setSessionState] = useState<
    | "greet"
    | "awaiting_principal"
    | "lookup"
    | "awaiting_question"
    | "answering"
  >("greet");
  const [userData, setUserData] = useState<UserData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrolling on message/typing state changes is intentional
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Initialize chat when opened
  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      startGreeting();
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const addBotMessage = (text: string, chips?: string[], delayMs = 800) => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        const msg: Message = {
          id: genId(),
          role: "bot",
          text,
          chips,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, msg]);
        resolve();
      }, delayMs);
    });
  };

  const addUserMessage = (text: string) => {
    const msg: Message = {
      id: genId(),
      role: "user",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const startGreeting = async () => {
    setSessionState("awaiting_principal");
    await addBotMessage(
      "👋 Hello! I'm Dark Coin Support.\n\nTo help you, I need to verify your identity. Please share your Principal ID below.",
      undefined,
      400,
    );
  };

  const resetChat = async () => {
    setMessages([]);
    setUserData(null);
    setInput("");
    setSessionState("greet");
    setTimeout(() => {
      startGreeting();
    }, 100);
  };

  const lookupUser = async (principalIdStr: string) => {
    if (!actor) {
      await addBotMessage(
        "⚠️ Connection issue. Please refresh the page and try again.",
      );
      return;
    }

    setSessionState("lookup");
    await addBotMessage("🔍 Looking up your account...", undefined, 300);
    setIsTyping(true);

    try {
      const principalObj = Principal.fromText(principalIdStr.trim());
      const [profile, submissionsRaw, paymentsRaw, balance, bankDetails] =
        await Promise.all([
          actor.getUserProfile(principalObj),
          actor.getUserSubmissions(principalObj),
          actor.getUserPayments(principalObj),
          actor.getCoinBalance(principalObj),
          actor.getBankDetails(principalObj),
        ]);

      setIsTyping(false);

      if (!profile) {
        setSessionState("awaiting_principal");
        await addBotMessage(
          "❌ I couldn't find an account with that Principal ID.\n\nPlease double-check and try again.",
          ["Try again"],
        );
        return;
      }

      const data: UserData = {
        principalId: principalIdStr.trim(),
        email: profile.email || undefined,
        coinBalance: balance,
        isBlocked: profile.isBlocked,
        bankName: bankDetails?.bankName,
        accountNumberMasked: bankDetails
          ? maskAccount(bankDetails.accountNumber)
          : undefined,
        submissions: submissionsRaw.map((s) => ({
          taskId: String(s.taskId),
          status: String(s.status),
          createdAt: s.createdAt,
        })),
        payments: paymentsRaw.map((p) => ({
          orderId: p.orderId,
          amount: p.amount,
          status: String(p.status),
          createdAt: p.createdAt,
        })),
      };

      setUserData(data);
      setSessionState("awaiting_question");

      const displayName = profile.email ? profile.email.split("@")[0] : "there";
      await addBotMessage(
        `✅ Found your account, ${displayName}!\n\nHow can I help you today?`,
        [
          "Check my balance",
          "Withdrawal status",
          "Task status",
          "Bank details",
          "Contact support",
        ],
        600,
      );
    } catch (err) {
      setIsTyping(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("principal")
      ) {
        setSessionState("awaiting_principal");
        await addBotMessage(
          "⚠️ That doesn't look like a valid Principal ID format.\n\nPlease copy your Principal ID from the Profile page and paste it here.",
          ["Try again"],
        );
      } else {
        setSessionState("awaiting_principal");
        await addBotMessage(
          "⚠️ Something went wrong looking up your account. Please try again.",
          ["Try again"],
        );
      }
    }
  };

  const answerQuestion = async (question: string) => {
    if (!userData) return;
    setSessionState("answering");

    const q = question.toLowerCase();

    if (
      q.includes("balance") ||
      q.includes("coin") ||
      q.includes("money") ||
      q.includes("earning")
    ) {
      const balance = Number(userData.coinBalance);
      await addBotMessage(
        `💰 Your current balance:\n\n₹${balance.toLocaleString("en-IN")} INR\n\n${
          balance === 0
            ? "Complete tasks to start earning."
            : "You can request a withdrawal from the Profile page."
        }`,
        ["Withdrawal status", "Task status", "Ask another question"],
      );
    } else if (
      q.includes("withdraw") ||
      q.includes("payment") ||
      q.includes("payout") ||
      q.includes("order")
    ) {
      const payments = userData.payments;
      if (payments.length === 0) {
        await addBotMessage(
          "💳 You haven't made any withdrawal requests yet.\n\nComplete tasks and earn rewards, then request a payout from the Profile page.",
          ["Check my balance", "Task status", "Ask another question"],
        );
      } else {
        const sorted = [...payments].sort(
          (a, b) => Number(b.createdAt) - Number(a.createdAt),
        );
        const lines = sorted.slice(0, 3).map((p) => {
          const date = new Date(
            Number(p.createdAt) / 1_000_000,
          ).toLocaleDateString("en-IN");
          return `• ₹${Number(p.amount).toLocaleString("en-IN")} — ${statusLabel(p.status)} (${date})\n  Order #${p.orderId}`;
        });
        await addBotMessage(
          `📋 Your recent withdrawal requests:\n\n${lines.join("\n\n")}${
            payments.length > 3 ? `\n\n...and ${payments.length - 3} more` : ""
          }\n\nFor any concerns, copy your Order ID and contact our support team.`,
          ["Check my balance", "Contact support", "Ask another question"],
        );
      }
    } else if (
      q.includes("task") ||
      q.includes("submission") ||
      q.includes("proof") ||
      q.includes("status")
    ) {
      const subs = userData.submissions;
      if (subs.length === 0) {
        await addBotMessage(
          "📝 You haven't submitted any tasks yet.\n\nGo to the Home page, tap 'Start Task', complete the task, and upload your screenshot proof.",
          ["Check my balance", "Ask another question"],
        );
      } else {
        const sorted = [...subs].sort(
          (a, b) => Number(b.createdAt) - Number(a.createdAt),
        );
        const lines = sorted.slice(0, 4).map((s) => {
          const icon =
            s.status === "approved"
              ? "✅"
              : s.status === "declined"
                ? "❌"
                : "⏳";
          return `${icon} Task ${s.taskId} — ${statusLabel(s.status)}`;
        });
        const approved = subs.filter((s) => s.status === "approved").length;
        const pending = subs.filter((s) => s.status === "pending").length;
        await addBotMessage(
          `📊 Your task submissions:\n\n${lines.join("\n")}\n\n✅ ${approved} approved  ⏳ ${pending} pending`,
          ["Check my balance", "Withdrawal status", "Ask another question"],
        );
      }
    } else if (
      q.includes("bank") ||
      q.includes("account") ||
      q.includes("ifsc")
    ) {
      if (!userData.bankName || !userData.accountNumberMasked) {
        await addBotMessage(
          "🏦 No bank details found on your account.\n\nPlease set up your bank account from the Profile page before requesting withdrawals.",
          ["Contact support", "Ask another question"],
        );
      } else {
        await addBotMessage(
          `🏦 Your linked bank account:\n\nBank: ${userData.bankName}\nAccount: ${userData.accountNumberMasked}\n\nYour bank details are permanent. Only an admin can update them.`,
          ["Contact support", "Ask another question"],
        );
      }
    } else if (
      q.includes("support") ||
      q.includes("contact") ||
      q.includes("help") ||
      q.includes("issue") ||
      q.includes("problem")
    ) {
      await addBotMessage(
        "📞 To contact our support team:\n\n1. Copy your Order ID from Withdrawal History\n2. Email: support@darkcoin.app\n3. Include your Principal ID and Order ID in the message\n\nWe respond within 24 hours.",
        ["Check my balance", "Withdrawal status", "Ask another question"],
      );
    } else if (q.includes("try again") || q.includes("another")) {
      setSessionState("awaiting_principal");
      setUserData(null);
      await addBotMessage(
        "Sure! Please share your Principal ID to start fresh.",
      );
      return;
    } else {
      await addBotMessage(
        "I can help you with:\n\n• Checking your balance\n• Withdrawal status & order IDs\n• Task submission status\n• Bank account details\n• Contacting support\n\nWhat would you like to know?",
        [
          "Check my balance",
          "Withdrawal status",
          "Task status",
          "Contact support",
        ],
      );
    }

    setSessionState("awaiting_question");
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    addUserMessage(text);

    if (sessionState === "awaiting_principal" || sessionState === "greet") {
      // Validate principal-like format
      if (isPrincipalLike(text)) {
        await lookupUser(text);
      } else {
        await addBotMessage(
          "⚠️ That doesn't look like a valid Principal ID.\n\nYour Principal ID is a long string with hyphens — you can find it on the Profile page.",
          ["Try again"],
        );
      }
    } else if (
      sessionState === "awaiting_question" ||
      sessionState === "answering"
    ) {
      await answerQuestion(text);
    }
  };

  const handleChipClick = async (chip: string) => {
    addUserMessage(chip);
    setInput("");

    if (chip === "Try again") {
      setSessionState("awaiting_principal");
      await addBotMessage(
        "Please share your Principal ID to look up your account.",
      );
      return;
    }

    if (sessionState === "awaiting_question" || sessionState === "answering") {
      await answerQuestion(chip);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      {/* FAB — floating action button */}
      <motion.button
        data-ocid="chatbot.open_modal_button"
        type="button"
        onClick={handleOpen}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-lg"
        style={{
          bottom: "84px",
          right: "16px",
          background:
            "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))",
          color: "oklch(0.1 0.02 85)",
          boxShadow:
            "0 4px 20px oklch(0.82 0.18 85 / 0.45), 0 2px 8px oklch(0 0 0 / 0.4)",
        }}
      >
        <MessageCircle className="w-4 h-4" />
        Chat
      </motion.button>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          data-ocid="chatbot.sheet"
          side="bottom"
          className="rounded-t-3xl border-t-0 p-0 flex flex-col"
          style={{
            height: "calc(100vh - 56px)",
            background: "oklch(0.1 0.012 265)",
            border: "1px solid oklch(0.82 0.18 85 / 0.12)",
            borderBottom: "none",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
            style={{
              borderBottom: "1px solid oklch(0.82 0.18 85 / 0.1)",
              background: "oklch(0.11 0.015 265 / 0.95)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.25), oklch(0.75 0.15 80 / 0.18))",
                border: "1.5px solid oklch(0.82 0.18 85 / 0.4)",
              }}
            >
              <Shield
                className="w-4 h-4"
                style={{ color: "oklch(0.82 0.18 85)" }}
              />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-foreground text-sm leading-tight">
                Dark Coin Support
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: "oklch(0.72 0.18 155)" }}
                />
                AI Assistant · Secure
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={resetChat}
                title="Reset chat"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg"
                style={{ background: "oklch(0.15 0.02 265 / 0.5)" }}
              >
                Reset
              </button>
              <button
                data-ocid="chatbot.close_button"
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                style={{ background: "oklch(0.15 0.02 265 / 0.5)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message list */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            style={{ overscrollBehavior: "contain" }}
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) =>
                msg.role === "bot" ? (
                  <BotMessage
                    key={msg.id}
                    message={msg}
                    onChipClick={handleChipClick}
                  />
                ) : (
                  <UserMessage key={msg.id} message={msg} />
                ),
              )}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5 pr-8">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.25), oklch(0.75 0.15 80 / 0.18))",
                    border: "1px solid oklch(0.82 0.18 85 / 0.35)",
                  }}
                >
                  <Coins
                    className="w-3.5 h-3.5"
                    style={{ color: "oklch(0.82 0.18 85)" }}
                  />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm"
                  style={{
                    background: "oklch(0.14 0.02 265 / 0.9)",
                    border: "1px solid oklch(0.82 0.18 85 / 0.12)",
                    borderLeft: "2px solid oklch(0.82 0.18 85 / 0.5)",
                  }}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>

          {/* Security notice */}
          <div
            className="px-4 py-2 flex-shrink-0"
            style={{ borderTop: "1px solid oklch(0.82 0.18 85 / 0.06)" }}
          >
            <p className="text-[10px] text-muted-foreground text-center">
              🔒 Secure · Your data is only used to answer your queries
            </p>
          </div>

          {/* Input area */}
          <div
            className="flex items-center gap-2 px-3 pb-4 pt-2 flex-shrink-0"
            style={{ borderTop: "1px solid oklch(0.82 0.18 85 / 0.08)" }}
          >
            <Input
              data-ocid="chatbot.input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                sessionState === "awaiting_principal" ||
                sessionState === "greet"
                  ? "Paste your Principal ID here…"
                  : "Type your question…"
              }
              disabled={isTyping || sessionState === "lookup"}
              className="flex-1 h-11 rounded-2xl text-sm"
              style={{
                background: "oklch(0.15 0.02 265 / 0.8)",
                border: "1px solid oklch(0.82 0.18 85 / 0.15)",
              }}
            />
            <Button
              data-ocid="chatbot.submit_button"
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isTyping || sessionState === "lookup"}
              size="icon"
              className="w-11 h-11 rounded-2xl flex-shrink-0"
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.75 0.15 80))"
                  : "oklch(0.16 0.02 265)",
                color: input.trim()
                  ? "oklch(0.1 0.02 85)"
                  : "oklch(0.4 0.03 265)",
                boxShadow: input.trim()
                  ? "0 0 12px oklch(0.82 0.18 85 / 0.3)"
                  : "none",
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden icons for status visuals (imported but rendered inline) */}
      <span className="hidden">
        <CheckCircle />
        <XCircle />
        <Clock />
      </span>
    </>
  );
}
