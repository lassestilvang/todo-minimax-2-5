import React from "react";
import { getProductivityData, getTimeTrackingData } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const [taskData, timeData] = await Promise.all([
    getProductivityData(),
    getTimeTrackingData(),
  ]);

  const maxTasks = Math.max(...taskData.map(d => d.count), 1);
  const maxMinutes = Math.max(...timeData.map(d => d.minutes), 1);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Productivity Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks Completed (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-64 mt-4">
              {taskData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-primary rounded-t-sm hover:bg-primary/80 transition-all"
                    style={{ height: `${(day.count / maxTasks) * 100}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-2 rotate-45 origin-top-left">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Focus Time (Minutes, 30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-64 mt-4">
              {timeData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-indigo-500 rounded-t-sm hover:bg-indigo-600 transition-all"
                    style={{ height: `${(day.minutes / maxMinutes) * 100}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-2 rotate-45 origin-top-left">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
