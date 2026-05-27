"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

function SkeletonComponent({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
}

SkeletonComponent.displayName = "Skeleton";
export const Skeleton = memo(SkeletonComponent);

interface TaskSkeletonProps {
  count?: number;
}

function TaskSkeletonListComponent({ count = 5 }: TaskSkeletonProps) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading tasks">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card dark:bg-[#1a1a1a] p-4"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center gap-3 pt-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading tasks...</span>
    </div>
  );
}

TaskSkeletonListComponent.displayName = "TaskSkeletonList";
export const TaskSkeletonList = memo(TaskSkeletonListComponent);

export function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
      </div>
      <div className="mt-6">
        <TaskSkeletonList count={4} />
      </div>
    </div>
  );
}