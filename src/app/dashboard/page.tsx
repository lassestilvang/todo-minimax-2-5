import React from "react";
import { getProductivityData } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const data = await getProductivityData();
  const maxTasks = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Productivity Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tasks Completed (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-64 mt-4">
            {data.map((day, i) => (
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
    </div>
  );
}
