/*
  Warnings:

  - You are about to drop the column `issueId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Activity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "issueId",
DROP COLUMN "projectId",
DROP COLUMN "teamId",
DROP COLUMN "userId",
ADD COLUMN     "issue" JSONB,
ADD COLUMN     "project" JSONB,
ADD COLUMN     "team" JSONB,
ADD COLUMN     "user" JSONB;
