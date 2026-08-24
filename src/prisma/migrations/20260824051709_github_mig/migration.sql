/*
  Warnings:

  - You are about to drop the column `repos_name` on the `GithubIntegration` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GithubIntegration_id_key";

-- AlterTable
ALTER TABLE "GithubIntegration" DROP COLUMN "repos_name",
ADD COLUMN     "repo_name" TEXT;
