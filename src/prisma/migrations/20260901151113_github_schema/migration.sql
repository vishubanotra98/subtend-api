-- CreateEnum
CREATE TYPE "GitHistoryType" AS ENUM ('PUSH', 'PULL_REQUEST');

-- AlterTable
ALTER TABLE "Issue" ALTER COLUMN "ticket_num" DROP DEFAULT;
DROP SEQUENCE "Issue_ticket_num_seq";

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "nextTicketNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "git_history" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "repoId" INTEGER NOT NULL,
    "type" "GitHistoryType" NOT NULL,
    "pullReqId" INTEGER,
    "title" TEXT,
    "closedAt" TIMESTAMP(3),
    "head" TEXT,
    "base" TEXT,
    "pushHead" TEXT,
    "pushedAt" TIMESTAMP(3),
    "commits" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "git_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "git_history_issueId_idx" ON "git_history"("issueId");

-- CreateIndex
CREATE INDEX "git_history_projectId_idx" ON "git_history"("projectId");

-- CreateIndex
CREATE INDEX "git_history_repoId_idx" ON "git_history"("repoId");

-- AddForeignKey
ALTER TABLE "git_history" ADD CONSTRAINT "git_history_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "git_history" ADD CONSTRAINT "git_history_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
