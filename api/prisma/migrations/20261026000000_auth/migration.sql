-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "SessionStage" AS ENUM ('MFA_PENDING', 'AUTHENTICATED');

-- CreateTable
CREATE TABLE "staff_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
    "passwordHash" TEXT NOT NULL,
    "mfaSecret" TEXT,
    "mfaLastUsedStep" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" "SessionStage" NOT NULL,
    "remember" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
