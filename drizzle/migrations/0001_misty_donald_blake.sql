CREATE TYPE "public"."account_status" AS ENUM('PENDING_EMAIL', 'ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TABLE "login_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"success" boolean NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"failure_reason" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(500) NOT NULL,
	"family_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp,
	"replaced_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" varchar(500),
	"ip_address" varchar(45),
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "document_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" text NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"ip_restriction" varchar(45),
	CONSTRAINT "document_access_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "document_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"document_id" text,
	"document_type" varchar(50),
	"user_role" varchar(20),
	"file_hash" varchar(64),
	"mime_type" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text,
	"error" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_quarantines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"document_id" text NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"severity" varchar(20) NOT NULL,
	"quarantined_by" uuid NOT NULL,
	"quarantined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution" varchar(20),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "document_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"storage_id" text NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"mime_type" varchar(50) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb,
	CONSTRAINT "document_references_storage_id_unique" UNIQUE("storage_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "account_status" DEFAULT 'PENDING_EMAIL' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_ip" varchar(45);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_secret" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_backup_codes" text;--> statement-breakpoint
ALTER TABLE "login_audit_log" ADD CONSTRAINT "login_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_token_doc_id" ON "document_access_tokens" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_token_expires" ON "document_access_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_token_revoked" ON "document_access_tokens" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "idx_audit_user_id" ON "document_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_app_id" ON "document_audit_logs" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "document_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_doc_id" ON "document_audit_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_audit_timestamp" ON "document_audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_user_role" ON "document_audit_logs" USING btree ("user_role");--> statement-breakpoint
CREATE INDEX "idx_quarantine_app_id" ON "document_quarantines" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_quarantine_severity" ON "document_quarantines" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_quarantine_date" ON "document_quarantines" USING btree ("quarantined_at");--> statement-breakpoint
CREATE INDEX "idx_quarantine_resolved" ON "document_quarantines" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX "idx_doc_ref_app_id" ON "document_references" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_doc_ref_type" ON "document_references" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_doc_ref_uploaded" ON "document_references" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_doc_ref_expires" ON "document_references" USING btree ("expires_at");