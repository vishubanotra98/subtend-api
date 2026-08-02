-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_assigneeId_fkey";

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "blocked_at" TIMESTAMP(3),
ADD COLUMN     "target_date" TIMESTAMP(3),
ALTER COLUMN "assigneeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "projectOverview" TEXT,
ADD COLUMN     "target_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Status" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInitial" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
