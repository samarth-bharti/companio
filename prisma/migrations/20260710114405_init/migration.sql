-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending_payment', 'upcoming', 'completed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "DocVerifyStatus" AS ENUM ('pending', 'verified', 'failed', 'manual');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "MessageFrom" AS ENUM ('me', 'them');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'nonbinary', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "PurchaseKind" AS ENUM ('booking', 'credits', 'unlock', 'plus');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('created', 'paid');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'companion', 'admin');

-- CreateEnum
CREATE TYPE "SpinPrize" AS ENUM ('none', 'discount10', 'discount20', 'plus_month');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('companion', 'user');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewing', 'actioned', 'dismissed');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'paid');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "gender" "Gender",
    "city" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "companionId" TEXT,
    "welcomed" BOOLEAN NOT NULL DEFAULT false,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "quizMatchId" TEXT,
    "lastSpinAt" TIMESTAMP(3),
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" TIMESTAMP(3),
    "banReason" TEXT,
    "messageBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 2,
    "used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "maskedName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "age" INTEGER,
    "activities" TEXT[],
    "languages" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "ratePerMeeting" INTEGER NOT NULL,
    "hourlyRate" INTEGER NOT NULL DEFAULT 50000,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT NOT NULL,
    "suggestions" TEXT[],
    "photo" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "sameGenderNote" BOOLEAN NOT NULL DEFAULT false,
    "topMatch" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" TIMESTAMP(3),
    "banReason" TEXT,
    "payoutUpi" TEXT,
    "availableNow" BOOLEAN NOT NULL DEFAULT false,
    "availability" TEXT NOT NULL DEFAULT 'Available tomorrow',
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "matchScore" INTEGER NOT NULL DEFAULT 70,
    "reviewsList" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "dateISO" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'upcoming',
    "usedCredit" BOOLEAN NOT NULL DEFAULT false,
    "hours" INTEGER NOT NULL DEFAULT 1,
    "pricePaid" INTEGER NOT NULL DEFAULT 0,
    "commissionPaise" INTEGER NOT NULL DEFAULT 0,
    "payoutPaise" INTEGER NOT NULL DEFAULT 0,
    "surgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "spinDiscountPct" INTEGER NOT NULL DEFAULT 0,
    "discountCode" TEXT,
    "review" JSONB,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "razorpaySubId" TEXT,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PurchaseKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "bookingId" TEXT,
    "spinResultId" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'created',
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "invoiceNo" TEXT,
    "gstPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "from" "MessageFrom" NOT NULL,
    "text" TEXT NOT NULL,
    "ts" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ts" BIGINT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("userId","companionId")
);

-- CreateTable
CREATE TABLE "companion_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "activities" TEXT[],
    "rate" INTEGER NOT NULL,
    "bio" TEXT NOT NULL,
    "idUploaded" BOOLEAN NOT NULL DEFAULT false,
    "backgroundConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'draft',
    "idDocType" TEXT,
    "idDocMasked" TEXT,
    "idHash" TEXT,
    "photoHash" TEXT,
    "idVerifyStatus" "DocVerifyStatus" NOT NULL DEFAULT 'pending',
    "photoVerifyStatus" "DocVerifyStatus" NOT NULL DEFAULT 'pending',
    "ocrMatched" BOOLEAN,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prize" "SpinPrize" NOT NULL,
    "discountPct" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "companionId" TEXT,
    "targetUserId" TEXT,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_payouts" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surge_periods" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surge_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL DEFAULT 'percentage',
    "value" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_companionId_key" ON "users"("companionId");

-- CreateIndex
CREATE INDEX "users_city_idx" ON "users"("city");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "credit_ledger_walletId_createdAt_idx" ON "credit_ledger"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "companions_city_availableNow_idx" ON "companions"("city", "availableNow");

-- CreateIndex
CREATE INDEX "companions_city_matchScore_idx" ON "companions"("city", "matchScore");

-- CreateIndex
CREATE INDEX "bookings_userId_status_idx" ON "bookings"("userId", "status");

-- CreateIndex
CREATE INDEX "bookings_companionId_dateISO_idx" ON "bookings"("companionId", "dateISO");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_razorpayOrderId_key" ON "purchases"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_invoiceNo_key" ON "purchases"("invoiceNo");

-- CreateIndex
CREATE INDEX "purchases_userId_status_idx" ON "purchases"("userId", "status");

-- CreateIndex
CREATE INDEX "messages_threadId_createdAt_idx" ON "messages"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "companion_applications_userId_key" ON "companion_applications"("userId");

-- CreateIndex
CREATE INDEX "companion_applications_idHash_idx" ON "companion_applications"("idHash");

-- CreateIndex
CREATE INDEX "spin_results_userId_createdAt_idx" ON "spin_results"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "reports_status_createdAt_idx" ON "reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "reports_companionId_idx" ON "reports"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_payouts_bookingId_key" ON "companion_payouts"("bookingId");

-- CreateIndex
CREATE INDEX "companion_payouts_companionId_status_idx" ON "companion_payouts"("companionId", "status");

-- CreateIndex
CREATE INDEX "surge_periods_active_startsAt_endsAt_idx" ON "surge_periods"("active", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_active_expiresAt_idx" ON "discount_codes"("active", "expiresAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_adminId_createdAt_idx" ON "admin_audit_logs"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_targetType_targetId_idx" ON "admin_audit_logs"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_applications" ADD CONSTRAINT "companion_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_results" ADD CONSTRAINT "spin_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_payouts" ADD CONSTRAINT "companion_payouts_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_payouts" ADD CONSTRAINT "companion_payouts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
