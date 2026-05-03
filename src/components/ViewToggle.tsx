"use client";

import React, { memo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/types";

interface ViewToggleProps {
  currentView: ViewType;
}

const views: { id: ViewType; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Next 7 Days" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
];

function ViewToggleComponent({ currentView }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="View filters">
      {views.map((view) => (
        <Link
          key={view.id}
          href={`/?view=${view.id}`}
          role="tab"
          aria-selected={currentView === view.id}
          aria-controls="task-list"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            currentView === view.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {view.label}
        </Link>
      ))}
    </div>
  );
}

ViewToggleComponent.displayName = "ViewToggle";
export const ViewToggle = memo(ViewToggleComponent);
