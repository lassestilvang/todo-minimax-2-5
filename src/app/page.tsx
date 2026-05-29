import React, { Suspense } from "react";
import { PageSkeleton } from "@/components/Skeleton";
import { HomeClient } from "./HomeClient";
import { getLists, getLabels, getTasks, getOrCreateInbox } from "./actions";
import type { ViewType } from "@/types";

interface PageProps {
  searchParams: Promise<{
    view?: string;
    list?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentView = (params.view as ViewType) || "all";
  const currentListId = params.list || undefined;

  return (
    <Suspense fallback={<FallbackLayout />}>
      <HomeServerContent currentView={currentView} currentListId={currentListId} />
    </Suspense>
  );
}

async function HomeServerContent({
  currentView,
  currentListId,
}: {
  currentView: ViewType;
  currentListId?: string;
}) {
  const [listsData, labelsData, tasksResult] = await Promise.all([
    getLists(),
    getLabels(),
    getTasks(currentView, currentListId),
  ]);

  // Ensure inbox exists
  const inbox = await getOrCreateInbox();
  const lists = [...listsData];
  if (!lists.find((l) => l.id === inbox.id)) {
    lists.unshift(inbox);
  }

  const tasks = Array.isArray(tasksResult) ? tasksResult : tasksResult.tasks;

  return (
    <HomeClient
      initialTasks={tasks}
      initialLists={lists}
      initialLabels={labelsData}
    />
  );
}

function FallbackLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block md:w-72 flex-shrink-0 bg-card dark:bg-[#1a1a1a] border-r border-border dark:border-zinc-800" />
      <main className="flex-1 overflow-y-auto">
        <PageSkeleton />
      </main>
    </div>
  );
}
