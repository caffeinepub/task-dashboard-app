import { Home, ShieldAlert, User } from "lucide-react";
import { motion } from "motion/react";

export type NavTab = "home" | "profile" | "admin";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isAdmin: boolean;
}

const tabs = [
  { id: "home" as NavTab, label: "Home", Icon: Home },
  { id: "profile" as NavTab, label: "Profile", Icon: User },
  { id: "admin" as NavTab, label: "Admin", Icon: ShieldAlert },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const allTabs = tabs;

  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="max-w-lg mx-auto flex items-stretch h-16">
        {allTabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              data-ocid={
                id === "home"
                  ? "nav.home_link"
                  : id === "profile"
                    ? "nav.profile_link"
                    : "nav.admin_link"
              }
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-200 ${
                isActive
                  ? "nav-active"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={label}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-dot"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full nav-active-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
              />
              <span className="text-[10px] font-semibold leading-none tracking-wide">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
