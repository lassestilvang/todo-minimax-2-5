"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeTracker } from "@/components/time-tracker";
import { TimeLogList } from "@/components/time-log-list";
import {
  getTimeLogs,
  deleteTimeLog,
  addManualTimeEntry,
  stopTimer,
} from "@/app/actions";
import type { TimeLog } from "@/types";

interface TimeTrackingDialogProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function TimeTrackingDialog({
  taskId,
  isOpen,
  onClose,
  userId,
}: TimeTrackingDialogProps) {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);

  const fetchTimeLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const logs = await getTimeLogs(taskId);
      setTimeLogs(logs);
    } catch (error) {
      console.error("Failed to fetch time logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen) {
      fetchTimeLogs();
    }
  }, [isOpen, fetchTimeLogs]);

  const handleTimerStop = async () => {
    try {
      await stopTimer(taskId, userId);
      fetchTimeLogs();
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Delete this time log?")) return;
    try {
      await deleteTimeLog(id);
      fetchTimeLogs();
    } catch (error) {
      console.error("Failed to delete time log:", error);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const duration = parseInt(formData.get("duration") as string, 10);
    const notes = formData.get("notes") as string;

    if (!date || !duration) return;

    try {
      await addManualTimeEntry(taskId, date, duration, notes || undefined);
      setShowManualForm(false);
      fetchTimeLogs();
    } catch (error) {
      console.error("Failed to add manual time:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Time Tracking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timer */}
          <section>
            <h3 className="text-sm font-medium mb-3">Timer</h3>
            <TimeTracker
              taskId={taskId}
              userId={userId}
              onTimerStop={handleTimerStop}
            />
          </section>

          {/* Manual Entry */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Manual Entry</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowManualForm(!showManualForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {showManualForm && (
              <form onSubmit={handleManualSubmit} className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      name="date"
                      required
                      defaultValue={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      name="duration"
                      required
                      min="1"
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Input name="notes" placeholder="What did you work on?" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Entry</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </section>

          {/* Time Logs */}
          <section>
            {loadingLogs ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <TimeLogList timeLogs={timeLogs} onDelete={handleDeleteLog} />
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
