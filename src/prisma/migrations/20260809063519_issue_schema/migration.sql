-- AlterTable
ALTER TABLE "Status" ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInReview" BOOLEAN NOT NULL DEFAULT false;
