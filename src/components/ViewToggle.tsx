"use client";

import React from "react";
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

export function ViewToggle({ currentView }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {views.map((view) => (
        <Link
          key={view.id}
          href={`/?view=${view.id}`}
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
