import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Principal } from "@icp-sdk/core/principal";
import { HeadphonesIcon, Send, ShieldCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { backendInterface } from "../../backend.d";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CcaMessage {
  id: string;
  role: "user" | "admin";
  text: string;
  timestamp: number;
}

interface CCAChatProps {
  actor: backendInterface | null;
  uniqueId?: string;
  principal?: Principal;
}

// ── Bad Language Detection ────────────────────────────────────────────────────

const BAD_WORDS = [
  "sex",
  "porn",
  "nude",
  "naked",
  "fuck",
  "bitch",
  "kill",
  "murder",
  "suicide",
  "bomb",
  "rape",
  "hate",
  "terrorist",
  "slut",
  "whore",
  "nigger",
  "faggot",
];

function containsBadLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((word) => {
    // Use word boundary check to avoid false positives
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString("en-IN");
}

// ── CCA Chat Component ────────────────────────────────────────────────────────

export function CCAChat({ actor, uniqueId, principal }: CCAChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CcaMessage[]>([]);
  const [input, setInput] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageKey = uniqueId ? `cca_chat_${uniqueId}` : null;

  // Load messages from localStorage when opened
  useEffect(() => {
    if (open && storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        const stored: CcaMessage[] = raw ? JSON.parse(raw) : [];
        setMessages(stored);
      } catch {
        setMessages([]);
      }
    }
  }, [open, storageKey]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (storageKey && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll intent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isFrozen) return;
    setInput("");

    // Check for bad language
    if (containsBadLanguage(text)) {
      if (actor && principal) {
        try {
          await actor.blockUser(principal);
        } catch {
          /* ignore */
        }
      }
      setIsFrozen(true);
      const frozenMsg: CcaMessage = {
        id: genId(),
        role: "admin",
        text: "🚫 Your account has been suspended due to a policy violation. Hateful or harmful language is not permitted.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, frozenMsg]);
      return;
    }

    const userMsg: CcaMessage = {
      id: genId(),
      role: "user",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Count unread admin messages (shown as notification)
  const unreadAdminMessages = messages.filter((m) => m.role === "admin").length;

  return (
    <>
      {/* CCA FAB — teal colored, positioned to the left of AI Chat button */}
      <motion.button
        data-ocid="cca.open_modal_button"
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-lg"
        style={{
          bottom: "84px",
          right: "112px",
          background:
            "linear-gradient(135deg, oklch(0.72 0.18 155), oklch(0.62 0.15 155))",
          color: "oklch(0.08 0.01 155)",
          boxShadow:
            "0 4px 20px oklch(0.72 0.18 155 / 0.45), 0 2px 8px oklch(0 0 0 / 0.4)",
        }}
      >
        <HeadphonesIcon className="w-4 h-4" />
        <span>Support</span>
        {unreadAdminMessages > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              background: "oklch(0.82 0.18 85)",
              color: "oklch(0.1 0.02 85)",
            }}
          >
            {unreadAdminMessages > 9 ? "9+" : unreadAdminMessages}
          </span>
        )}
      </motion.button>

      {/* CCA Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          data-ocid="cca.sheet"
          side="bottom"
          className="rounded-t-3xl border-t-0 p-0 flex flex-col"
          style={{
            height: "calc(100vh - 56px)",
            background: "oklch(0.1 0.012 265)",
            border: "1px solid oklch(0.72 0.18 155 / 0.15)",
            borderBottom: "none",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
            style={{
              borderBottom: "1px solid oklch(0.72 0.18 155 / 0.12)",
              background: "oklch(0.11 0.015 265 / 0.95)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.18 155 / 0.3), oklch(0.62 0.15 155 / 0.2))",
                border: "1.5px solid oklch(0.72 0.18 155 / 0.5)",
              }}
            >
              <HeadphonesIcon
                className="w-4 h-4"
                style={{ color: "oklch(0.72 0.18 155)" }}
              />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-foreground text-sm leading-tight">
                CCA Support
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                  style={{ background: "oklch(0.72 0.18 155)" }}
                />
                Online · Admin typically replies within 24 hours
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {uniqueId && (
                <div
                  className="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold"
                  style={{
                    background: "oklch(0.72 0.18 155 / 0.1)",
                    color: "oklch(0.72 0.18 155)",
                    border: "1px solid oklch(0.72 0.18 155 / 0.2)",
                  }}
                >
                  ID: {uniqueId}
                </div>
              )}
              <button
                data-ocid="cca.close_button"
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                style={{ background: "oklch(0.15 0.02 265 / 0.5)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ overscrollBehavior: "contain" }}
          >
            {/* Welcome message */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 pr-8"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.18 155 / 0.25), oklch(0.62 0.15 155 / 0.18))",
                    border: "1px solid oklch(0.72 0.18 155 / 0.4)",
                  }}
                >
                  <ShieldCheck
                    className="w-3.5 h-3.5"
                    style={{ color: "oklch(0.72 0.18 155)" }}
                  />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-foreground leading-relaxed"
                  style={{
                    background: "oklch(0.14 0.02 265 / 0.9)",
                    border: "1px solid oklch(0.72 0.18 155 / 0.15)",
                    borderLeft: "2px solid oklch(0.72 0.18 155 / 0.6)",
                  }}
                >
                  <p>👋 Welcome to CCA Support! How can we help you today?</p>
                  {uniqueId && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Your ID:{" "}
                      <span
                        className="font-mono font-semibold"
                        style={{ color: "oklch(0.72 0.18 155)" }}
                      >
                        {uniqueId}
                      </span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2.5 ${
                    msg.role === "user" ? "flex-row-reverse pl-8" : "pr-8"
                  }`}
                >
                  {msg.role === "admin" && (
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.72 0.18 155 / 0.25), oklch(0.62 0.15 155 / 0.18))",
                        border: "1px solid oklch(0.72 0.18 155 / 0.4)",
                      }}
                    >
                      <ShieldCheck
                        className="w-3.5 h-3.5"
                        style={{ color: "oklch(0.72 0.18 155)" }}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              background:
                                "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.2), oklch(0.75 0.15 80 / 0.15))",
                              border: "1px solid oklch(0.82 0.18 85 / 0.25)",
                              color: "oklch(0.95 0.01 85)",
                            }
                          : {
                              background: "oklch(0.14 0.02 265 / 0.9)",
                              border: "1px solid oklch(0.72 0.18 155 / 0.15)",
                              borderLeft:
                                "2px solid oklch(0.72 0.18 155 / 0.6)",
                              color: "oklch(0.92 0.01 265)",
                            }
                      }
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1">
                      {relativeTime(msg.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Disclaimer */}
          <div
            className="px-4 py-2 flex-shrink-0"
            style={{ borderTop: "1px solid oklch(0.72 0.18 155 / 0.08)" }}
          >
            <p className="text-[10px] text-muted-foreground text-center">
              🔒 Secure · Admin typically replies within 24 hours · Be
              respectful
            </p>
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 pb-4 pt-2 flex-shrink-0"
            style={{ borderTop: "1px solid oklch(0.72 0.18 155 / 0.1)" }}
          >
            <Input
              data-ocid="cca.input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isFrozen ? "Account suspended" : "Type your message..."
              }
              disabled={isFrozen}
              className="flex-1 h-11 rounded-2xl text-sm"
              style={{
                background: "oklch(0.15 0.02 265 / 0.8)",
                border: "1px solid oklch(0.72 0.18 155 / 0.18)",
              }}
            />
            <Button
              data-ocid="cca.submit_button"
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isFrozen}
              size="icon"
              className="w-11 h-11 rounded-2xl flex-shrink-0"
              style={{
                background:
                  input.trim() && !isFrozen
                    ? "linear-gradient(135deg, oklch(0.72 0.18 155), oklch(0.62 0.15 155))"
                    : "oklch(0.16 0.02 265)",
                color:
                  input.trim() && !isFrozen
                    ? "oklch(0.08 0.01 155)"
                    : "oklch(0.4 0.03 265)",
                boxShadow:
                  input.trim() && !isFrozen
                    ? "0 0 12px oklch(0.72 0.18 155 / 0.35)"
                    : "none",
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
