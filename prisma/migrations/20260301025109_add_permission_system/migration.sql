-- CreateEnum
CREATE TYPE "PermissionCategory" AS ENUM ('CRUD', 'FEATURE');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "permissionGroupId" TEXT;

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "category" "PermissionCategory" NOT NULL DEFAULT 'CRUD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "baseRole" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_permission" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission_override" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "user_permission_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "permissionId" TEXT,
    "permissionName" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "permission_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permission_name_key" ON "permission"("name");

-- CreateIndex
CREATE INDEX "permission_resource_action_idx" ON "permission"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "permission_group_name_key" ON "permission_group"("name");

-- CreateIndex
CREATE INDEX "group_permission_groupId_idx" ON "group_permission"("groupId");

-- CreateIndex
CREATE INDEX "group_permission_permissionId_idx" ON "group_permission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "group_permission_groupId_permissionId_key" ON "group_permission"("groupId", "permissionId");

-- CreateIndex
CREATE INDEX "user_permission_override_userId_idx" ON "user_permission_override"("userId");

-- CreateIndex
CREATE INDEX "user_permission_override_permissionId_idx" ON "user_permission_override"("permissionId");

-- CreateIndex
CREATE INDEX "user_permission_override_expiresAt_idx" ON "user_permission_override"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_override_userId_permissionId_key" ON "user_permission_override"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "permission_audit_log_targetType_targetId_idx" ON "permission_audit_log"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "permission_audit_log_createdBy_idx" ON "permission_audit_log"("createdBy");

-- CreateIndex
CREATE INDEX "permission_audit_log_createdAt_idx" ON "permission_audit_log"("createdAt");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_permissionGroupId_fkey" FOREIGN KEY ("permissionGroupId") REFERENCES "permission_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_permission" ADD CONSTRAINT "group_permission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "permission_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_permission" ADD CONSTRAINT "group_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_override" ADD CONSTRAINT "user_permission_override_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_override" ADD CONSTRAINT "user_permission_override_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
