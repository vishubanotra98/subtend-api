/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId]` on the table `GithubIntegration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GithubIntegration_workspaceId_key" ON "GithubIntegration"("workspaceId");
