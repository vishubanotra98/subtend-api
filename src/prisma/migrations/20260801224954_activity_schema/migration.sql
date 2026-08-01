/*
  Warnings:

  - You are about to drop the column `entityTitle` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `Activity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "entityTitle",
DROP COLUMN "user",
ADD COLUMN     "actor" JSONB;
