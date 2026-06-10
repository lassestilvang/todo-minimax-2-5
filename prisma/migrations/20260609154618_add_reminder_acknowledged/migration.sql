-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME,
    "deadline" DATETIME,
    "reminder" DATETIME,
    "reminderAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "estimate" INTEGER,
    "actualTime" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'NONE',
    "recurringType" TEXT,
    "recurringCustom" TEXT,
    "attachmentUrl" TEXT,
    "listId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("actualTime", "attachmentUrl", "completed", "createdAt", "deadline", "description", "dueDate", "estimate", "id", "listId", "order", "priority", "recurringCustom", "recurringType", "reminder", "title", "updatedAt") SELECT "actualTime", "attachmentUrl", "completed", "createdAt", "deadline", "description", "dueDate", "estimate", "id", "listId", "order", "priority", "recurringCustom", "recurringType", "reminder", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_completed_idx" ON "Task"("completed");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_listId_idx" ON "Task"("listId");
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
