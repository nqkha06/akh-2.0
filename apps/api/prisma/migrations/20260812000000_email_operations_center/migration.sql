-- CreateTable
CREATE TABLE "email_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "provider" TEXT NOT NULL DEFAULT 'amazon_ses',
    "provider_status" TEXT NOT NULL DEFAULT 'incomplete',
    "aws_region" TEXT,
    "default_locale" TEXT NOT NULL DEFAULT 'vi',
    "transactional_enabled" BOOLEAN NOT NULL DEFAULT true,
    "marketing_enabled" BOOLEAN NOT NULL DEFAULT false,
    "global_reply_to_email" TEXT,
    "tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "open_tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "click_tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "email_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_senders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "email_address" TEXT,
    "domain" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "reply_to_email" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'amazon_ses',
    "provider_identity_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "verification_error" TEXT,
    "dns_records" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" DATETIME,
    "last_checked_at" DATETIME,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "email_senders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_senders_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT [],
    "sender_id" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "last_published_at" DATETIME,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "email_templates_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "email_senders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_template_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "sender_id" INTEGER,
    "published_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_preference_topics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_email_preferences" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "is_subscribed" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'default',
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_email_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_email_preferences_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "email_preference_topics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER,
    "campaign_id" TEXT,
    "template_id" INTEGER,
    "template_version" INTEGER,
    "sender_id" INTEGER,
    "provider" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "recipient_email" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "reply_to_email" TEXT,
    "subject" TEXT NOT NULL,
    "email_type" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "failure_code" TEXT,
    "failure_message" TEXT,
    "metadata" JSONB,
    "queued_at" DATETIME,
    "sent_at" DATETIME,
    "delivered_at" DATETIME,
    "opened_at" DATETIME,
    "clicked_at" DATETIME,
    "bounced_at" DATETIME,
    "complained_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "email_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "email_senders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_message_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email_message_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "payload" JSONB NOT NULL,
    "occurred_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_message_events_email_message_id_fkey" FOREIGN KEY ("email_message_id") REFERENCES "email_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_suppressions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email_address" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "last_email_message_id" TEXT,
    "suppressed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor_user_id" INTEGER,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "previous_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "email_settings_updated_by_idx" ON "email_settings"("updated_by");

-- CreateIndex
CREATE INDEX "email_senders_type_status_deleted_at_idx" ON "email_senders"("type", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "email_senders_domain_idx" ON "email_senders"("domain");

-- CreateIndex
CREATE INDEX "email_senders_is_default_type_idx" ON "email_senders"("is_default", "type");

-- CreateIndex
CREATE INDEX "email_senders_created_by_idx" ON "email_senders"("created_by");

-- CreateIndex
CREATE INDEX "email_senders_updated_by_idx" ON "email_senders"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_code_key" ON "email_templates"("code");

-- CreateIndex
CREATE INDEX "email_templates_category_status_deleted_at_idx" ON "email_templates"("category", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "email_templates_sender_id_idx" ON "email_templates"("sender_id");

-- CreateIndex
CREATE INDEX "email_templates_updated_at_idx" ON "email_templates"("updated_at");

-- CreateIndex
CREATE INDEX "email_templates_created_by_idx" ON "email_templates"("created_by");

-- CreateIndex
CREATE INDEX "email_templates_updated_by_idx" ON "email_templates"("updated_by");

-- CreateIndex
CREATE INDEX "email_template_versions_template_id_created_at_idx" ON "email_template_versions"("template_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_template_versions_template_id_version_key" ON "email_template_versions"("template_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "email_preference_topics_code_key" ON "email_preference_topics"("code");

-- CreateIndex
CREATE INDEX "email_preference_topics_category_is_enabled_display_order_idx" ON "email_preference_topics"("category", "is_enabled", "display_order");

-- CreateIndex
CREATE INDEX "user_email_preferences_topic_id_is_subscribed_idx" ON "user_email_preferences"("topic_id", "is_subscribed");

-- CreateIndex
CREATE INDEX "user_email_preferences_user_id_topic_id_idx" ON "user_email_preferences"("user_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_preferences_user_id_topic_id_key" ON "user_email_preferences"("user_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_messages_provider_message_id_key" ON "email_messages"("provider_message_id");

-- CreateIndex
CREATE INDEX "email_messages_status_created_at_idx" ON "email_messages"("status", "created_at");

-- CreateIndex
CREATE INDEX "email_messages_recipient_email_idx" ON "email_messages"("recipient_email");

-- CreateIndex
CREATE INDEX "email_messages_provider_message_id_idx" ON "email_messages"("provider_message_id");

-- CreateIndex
CREATE INDEX "email_messages_email_type_created_at_idx" ON "email_messages"("email_type", "created_at");

-- CreateIndex
CREATE INDEX "email_messages_template_id_created_at_idx" ON "email_messages"("template_id", "created_at");

-- CreateIndex
CREATE INDEX "email_messages_sender_id_created_at_idx" ON "email_messages"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "email_messages_user_id_idx" ON "email_messages"("user_id");

-- CreateIndex
CREATE INDEX "email_messages_campaign_id_idx" ON "email_messages"("campaign_id");

-- CreateIndex
CREATE INDEX "email_message_events_email_message_id_occurred_at_idx" ON "email_message_events"("email_message_id", "occurred_at");

-- CreateIndex
CREATE INDEX "email_message_events_event_type_occurred_at_idx" ON "email_message_events"("event_type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_message_events_provider_event_id_event_type_key" ON "email_message_events"("provider_event_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "email_suppressions_email_address_key" ON "email_suppressions"("email_address");

-- CreateIndex
CREATE INDEX "email_suppressions_reason_suppressed_at_idx" ON "email_suppressions"("reason", "suppressed_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_created_at_idx" ON "audit_logs"("resource_type", "resource_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
