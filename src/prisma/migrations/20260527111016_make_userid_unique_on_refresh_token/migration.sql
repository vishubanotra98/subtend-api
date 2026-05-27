/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `refresh_tokens` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_userId_key" ON "refresh_tokens"("userId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
