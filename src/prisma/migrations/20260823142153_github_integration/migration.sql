-- CreateTable
CREATE TABLE "GithubIntegration" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "accessTokenExpireAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpireAt" TIMESTAMP(3) NOT NULL,
    "repos_name" TEXT,
    "projectId" TEXT,

    CONSTRAINT "GithubIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubIntegration_id_key" ON "GithubIntegration"("id");
