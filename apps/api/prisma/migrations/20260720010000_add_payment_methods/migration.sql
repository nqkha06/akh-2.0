CREATE TABLE "payment_methods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "withdraw_fee" DECIMAL NOT NULL DEFAULT 0,
    "min_withdraw_amount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE "payment_method_translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "locale" TEXT NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "name" TEXT,
    "fields" TEXT,
    CONSTRAINT "payment_method_translations_payment_method_id_fkey"
      FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "user_payment_methods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_payment_methods_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_payment_methods_payment_method_id_fkey"
      FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "payment_methods_status_idx"
ON "payment_methods"("status");

CREATE UNIQUE INDEX "payment_method_translations_payment_method_id_locale_key"
ON "payment_method_translations"("payment_method_id", "locale");

CREATE INDEX "payment_method_translations_locale_idx"
ON "payment_method_translations"("locale");

CREATE INDEX "user_payment_methods_user_id_idx"
ON "user_payment_methods"("user_id");

CREATE INDEX "user_payment_methods_payment_method_id_idx"
ON "user_payment_methods"("payment_method_id");
