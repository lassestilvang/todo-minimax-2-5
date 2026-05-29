import React, { memo } from "react";
import { Inbox } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyStateComponent({
  title = "No tasks yet",
  description = "Create your first task to get started",
  actionLabel = "Create Task",
  onAction,
}: EmptyStateProps) {
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
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="rounded-full bg-muted/80 dark:bg-muted/30 p-6 mb-4 shadow-sm border border-border/20"
      >
        <Inbox className="h-12 w-12 text-muted-foreground" />
      </motion.div>
      <h3 className="text-lg font-semibold mb-2 font-[family-name:var(--font-heading)]">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {onAction && (
        <Button onClick={onAction} className="shadow-sm">{actionLabel}</Button>
      )}
    </motion.div>
  );
}

EmptyStateComponent.displayName = "EmptyState";
export const EmptyState = memo(EmptyStateComponent);
