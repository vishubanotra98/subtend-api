/*
  Warnings:

  - You are about to drop the column `projectId` on the `GithubIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `repo_name` on the `GithubIntegration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GithubIntegration" DROP COLUMN "projectId",
DROP COLUMN "repo_name";

-- CreateTable
CREATE TABLE "project_repos" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "githubIntegrationId" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "repoId" INTEGER NOT NULL,
    "webhookId" TEXT,

    CONSTRAINT "project_repos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_repos_repoId_key" ON "project_repos"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "project_repos_projectId_repoId_key" ON "project_repos"("projectId", "repoId");

-- AddForeignKey
ALTER TABLE "GithubIntegration" ADD CONSTRAINT "GithubIntegration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_repos" ADD CONSTRAINT "project_repos_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_repos" ADD CONSTRAINT "project_repos_githubIntegrationId_fkey" FOREIGN KEY ("githubIntegrationId") REFERENCES "GithubIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
