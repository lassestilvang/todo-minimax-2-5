"use client";

import React, { memo } from "react";
import { format } from "date-fns";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimeLog } from "@/types";

interface TimeLogListProps {
  timeLogs: TimeLog[];
  onDelete?: (id: string) => void;
}

function TimeLogListComponent({ timeLogs, onDelete }: TimeLogListProps) {
  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return "0m";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (date: Date) => format(new Date(date), "MMM d, yyyy HH:mm");

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Time Logs
      </h4>
      {timeLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No time logs yet</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Date</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Duration</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Notes</th>
                {onDelete && <th scope="col" className="px-3 py-2 w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {timeLogs.map((log) => (
                <tr key={log.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">
                    <div>{formatDateTime(log.startTime)}</div>
                    {log.endTime && (
                      <div className="text-xs text-muted-foreground">
                        to {format(new Date(log.endTime), "HH:mm")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {formatDuration(log.duration)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {log.notes || "-"}
                  </td>
                  {onDelete && (
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDelete(log.id)}
                        aria-label="Delete time log"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

TimeLogListComponent.displayName = "TimeLogList";
export const TimeLogList = memo(TimeLogListComponent);
