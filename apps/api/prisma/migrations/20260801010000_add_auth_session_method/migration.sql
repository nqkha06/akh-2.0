ALTER TABLE "auth_sessions"
ADD COLUMN "auth_method" TEXT NOT NULL DEFAULT 'password';
