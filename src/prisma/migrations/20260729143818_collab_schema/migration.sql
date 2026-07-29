/*
  Warnings:

  - You are about to drop the column `lastActiveWorkspaceId` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "blockedReason" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "lastActiveWorkspaceId";

-- CreateTable
CREATE TABLE "Collab" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Collab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_collabs" (
    "id" TEXT NOT NULL,
    "collabId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "project_collabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollabToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollabToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CollabToWorkspace" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollabToWorkspace_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_collabs_collabId_projectId_key" ON "project_collabs"("collabId", "projectId");

-- CreateIndex
CREATE INDEX "_CollabToProject_B_index" ON "_CollabToProject"("B");

-- CreateIndex
CREATE INDEX "_CollabToWorkspace_B_index" ON "_CollabToWorkspace"("B");

-- AddForeignKey
ALTER TABLE "project_collabs" ADD CONSTRAINT "project_collabs_collabId_fkey" FOREIGN KEY ("collabId") REFERENCES "Collab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collabs" ADD CONSTRAINT "project_collabs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollabToProject" ADD CONSTRAINT "_CollabToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Collab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollabToProject" ADD CONSTRAINT "_CollabToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollabToWorkspace" ADD CONSTRAINT "_CollabToWorkspace_A_fkey" FOREIGN KEY ("A") REFERENCES "Collab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollabToWorkspace" ADD CONSTRAINT "_CollabToWorkspace_B_fkey" FOREIGN KEY ("B") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
