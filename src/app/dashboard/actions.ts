"use server";

import prisma from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function getProductivityData() {
  const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);

  const completedTasks = await prisma.task.findMany({
    where: {
      completed: true,
      updatedAt: { gte: thirtyDaysAgo },
    },
    select: { updatedAt: true },
  });

  const dailyData: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(startOfDay(new Date()), i), "yyyy-MM-dd");
    dailyData[date] = 0;
  }

  completedTasks.forEach((task) => {
    const date = format(task.updatedAt, "yyyy-MM-dd");
    if (dailyData[date] !== undefined) {
      dailyData[date]++;
    }
  });

  return Object.entries(dailyData)
    .map(([date, count]) => ({ date, count }))
    .reverse();
}

export async function getTimeTrackingData() {
  const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);
  const logs = await prisma.timeLog.findMany({
    where: {
      startTime: { gte: thirtyDaysAgo },
    },
    select: { duration: true, startTime: true },
  });

  const dailyData: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(startOfDay(new Date()), i), "yyyy-MM-dd");
    dailyData[date] = 0;
  }

  logs.forEach((log) => {
    if (log.duration) {
      const date = format(log.startTime, "yyyy-MM-dd");
      if (dailyData[date] !== undefined) {
        dailyData[date] += log.duration;
      }
    }
  });

  return Object.entries(dailyData)
    .map(([date, minutes]) => ({ date, minutes }))
    .reverse();
}
