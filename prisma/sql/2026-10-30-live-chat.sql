-- CreateTable
CREATE TABLE "SupportThread" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "subject" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "visitorId" TEXT,
    "publicId" TEXT,
    "displayName" TEXT,
    "name" TEXT,
    "lastIp" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageText" TEXT,
    "lastSender" TEXT,
    "unreadForAdmin" INTEGER NOT NULL DEFAULT 0,
    "unreadForCustomer" INTEGER NOT NULL DEFAULT 0,
    "customerLastSeenAt" TIMESTAMP(3),
    "adminLastSeenAt" TIMESTAMP(3),
    "customerTypingAt" TIMESTAMP(3),
    "customerTypingText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "fromCustomer" BOOLEAN NOT NULL,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "attachmentKey" TEXT,
    "attachmentType" TEXT,
    "attachmentName" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedIp" (
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "threadId" TEXT,
    "publicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "BlockedIp_pkey" PRIMARY KEY ("ip")
);

-- CreateTable
CREATE TABLE "AdminPresence" (
    "adminId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPresence_pkey" PRIMARY KEY ("adminId")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "visitorId" TEXT,
    "platform" TEXT,
    "installed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),
    "failures" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushKey" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportThread_publicId_key" ON "SupportThread"("publicId");

-- CreateIndex
CREATE INDEX "SupportThread_isOpen_updatedAt_idx" ON "SupportThread"("isOpen", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportThread_visitorId_idx" ON "SupportThread"("visitorId");

-- CreateIndex
CREATE INDEX "SupportThread_lastMessageAt_idx" ON "SupportThread"("lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportThread_email_idx" ON "SupportThread"("email");

-- CreateIndex
CREATE INDEX "SupportMessage_threadId_createdAt_idx" ON "SupportMessage"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "BlockedIp_createdAt_idx" ON "BlockedIp"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_visitorId_idx" ON "PushSubscription"("visitorId");

-- CreateIndex
CREATE INDEX "PushSubscription_createdAt_idx" ON "PushSubscription"("createdAt");

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SupportThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

