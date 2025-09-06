-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FAILED', 'STOPPED');

-- CreateTable
CREATE TABLE "public"."stock_prices" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "volume" BIGINT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."symbol_configs" (
    "symbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkInterval" INTEGER NOT NULL DEFAULT 60000,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symbol_configs_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "public"."scheduler_jobs" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduler_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_prices_symbol_timestamp_idx" ON "public"."stock_prices"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "stock_prices_timestamp_idx" ON "public"."stock_prices"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "scheduler_jobs_symbol_key" ON "public"."scheduler_jobs"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "scheduler_jobs_jobId_key" ON "public"."scheduler_jobs"("jobId");

-- CreateIndex
CREATE INDEX "symbol_configs_isActive_idx" ON "public"."symbol_configs"("isActive");

-- AddForeignKey
ALTER TABLE "public"."stock_prices" ADD CONSTRAINT "stock_prices_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "public"."symbol_configs"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduler_jobs" ADD CONSTRAINT "scheduler_jobs_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "public"."symbol_configs"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;
