import React, { memo } from "react";
import { Inbox, Sparkles, CalendarCheck, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  viewType?: string;
  hasList?: boolean;
  hasLabel?: boolean;
}

function EmptyStateComponent({
  title,
  description,
  actionLabel = "Create Task",
  onAction,
  viewType,
  hasList,
  hasLabel,
}: EmptyStateProps) {
  const emoji = viewType === "today" ? "🌸" : viewType === "week" ? "🚀" : hasList ? "📋" : hasLabel ? "🏷️" : "🎯";

  const contextualTitle = title || (() => {
    if (viewType === "today") return "Nothing due today";
    if (viewType === "week") return "Clear week ahead";
    if (viewType === "upcoming") return "No upcoming tasks";
    if (hasList) return "This list is empty";
    if (hasLabel) return "No tasks with this label";
    return "No tasks yet";
  })();

  const contextualDescription = description || (() => {
    if (viewType === "today") return "Enjoy your day! Everything is under control.";
    if (viewType === "week") return "Your next 7 days are completely free. Time to plan something great!";
    if (viewType === "upcoming") return "Nothing on the horizon. Use this calm to get ahead.";
    if (hasList) return "Drop your first task into this list to get organized.";
    if (hasLabel) return "Tag a task with this label to see it here.";
    return "Your journey to ultimate productivity starts with a single task.";
  })();

  const IconComponent = (() => {
    if (viewType === "today") return CalendarCheck;
    if (viewType === "week") return Timer;
    return Inbox;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <motion.div
        animate={{
          y: [0, -6, 0],
          rotate: [0, -3, 0, 3, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="rounded-full bg-muted/80 dark:bg-muted/30 p-6 mb-4 shadow-sm border border-border/20 relative"
      >
        <IconComponent className="h-12 w-12 text-muted-foreground" />
        <motion.span
          className="absolute -top-1 -right-1 text-lg"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {emoji}
        </motion.span>
      </motion.div>
      <h3 className="text-lg font-semibold mb-2 font-[family-name:var(--font-heading)]">{contextualTitle}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6 leading-relaxed">
        {contextualDescription}
      </p>
      {onAction && (
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={onAction} className="shadow-sm gap-2">
            <Sparkles className="h-4 w-4" />
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

EmptyStateComponent.displayName = "EmptyState";
export const EmptyState = memo(EmptyStateComponent);
