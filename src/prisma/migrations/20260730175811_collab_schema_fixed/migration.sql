/*
  Warnings:

  - You are about to drop the `_CollabToProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CollabToWorkspace` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Collab` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Collab` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_CollabToProject" DROP CONSTRAINT "_CollabToProject_A_fkey";

-- DropForeignKey
ALTER TABLE "_CollabToProject" DROP CONSTRAINT "_CollabToProject_B_fkey";

-- DropForeignKey
ALTER TABLE "_CollabToWorkspace" DROP CONSTRAINT "_CollabToWorkspace_A_fkey";

-- DropForeignKey
ALTER TABLE "_CollabToWorkspace" DROP CONSTRAINT "_CollabToWorkspace_B_fkey";

-- AlterTable
ALTER TABLE "Collab" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "collabId" TEXT;

-- AlterTable
ALTER TABLE "project_collabs" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "_CollabToProject";

-- DropTable
DROP TABLE "_CollabToWorkspace";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_collabId_fkey" FOREIGN KEY ("collabId") REFERENCES "Collab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collab" ADD CONSTRAINT "Collab_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
