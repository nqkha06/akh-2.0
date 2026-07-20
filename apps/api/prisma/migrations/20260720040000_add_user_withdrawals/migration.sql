ALTER TABLE "users" ADD COLUMN "balance" DECIMAL NOT NULL DEFAULT 0;

CREATE TABLE "user_withdrawals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "user_payment_method_id" INTEGER,
    "amount" DECIMAL NOT NULL,
    "fee_amount" DECIMAL NOT NULL DEFAULT 0,
    "net_amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_snapshot" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status_reason" TEXT,
    "processed_by_id" INTEGER,
    "processed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_withdrawals_user_payment_method_id_fkey" FOREIGN KEY ("user_payment_method_id") REFERENCES "user_payment_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "user_withdrawals_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "user_withdrawals_idempotency_key_key" ON "user_withdrawals"("idempotency_key");
CREATE INDEX "user_withdrawals_user_id_created_at_idx" ON "user_withdrawals"("user_id", "created_at");
CREATE INDEX "user_withdrawals_status_created_at_idx" ON "user_withdrawals"("status", "created_at");
CREATE INDEX "user_withdrawals_processed_by_id_idx" ON "user_withdrawals"("processed_by_id");
