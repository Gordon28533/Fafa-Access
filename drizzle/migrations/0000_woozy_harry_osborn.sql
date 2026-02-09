CREATE TYPE "public"."user_role" AS ENUM('STUDENT', 'SRC', 'ADMIN', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('PENDING_SRC', 'SRC_APPROVED', 'SRC_REJECTED', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'DELIVERY_ASSIGNED', 'DELIVERED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'FLAGGED', 'ESCALATED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('COLLECTED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('INITIAL_70', 'FINAL_30');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('PENDING', 'EARNED', 'READY_FOR_PAYOUT', 'PAID', 'CANCELLED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('PENDING', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "src_officers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"university_id" uuid NOT NULL,
	"position" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "src_officers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"university_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"ghana_card_ref" varchar(255) NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"commission_rate" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "universities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "university_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"balance" real DEFAULT 0 NOT NULL,
	"total_earned" real DEFAULT 0 NOT NULL,
	"total_paid" real DEFAULT 0 NOT NULL,
	"pending_commissions" real DEFAULT 0 NOT NULL,
	"earned_commissions" real DEFAULT 0 NOT NULL,
	"last_payout_date" timestamp,
	"last_payout_amount" real DEFAULT 0,
	"payouts_frozen" boolean DEFAULT false NOT NULL,
	"freeze_reason" text,
	"frozen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "university_wallets_university_id_unique" UNIQUE("university_id")
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"changed_by" varchar(255) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"laptop_id" uuid,
	"status" "application_status" DEFAULT 'PENDING_SRC' NOT NULL,
	"reference" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" varchar(20) NOT NULL,
	"course" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"student_id_doc" varchar(255),
	"admission_letter_ref" varchar(255),
	"ghana_card_ref" varchar(255) NOT NULL,
	"total_price" real DEFAULT 0 NOT NULL,
	"commission_earned" real DEFAULT 0 NOT NULL,
	"commission_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "applications_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "laptops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"price" real NOT NULL,
	"university_id" uuid NOT NULL,
	"assigned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "laptops_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "verification_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"ghana_card_number" varchar(50) NOT NULL,
	"front_image_hash" varchar(255) NOT NULL,
	"back_image_hash" varchar(255) NOT NULL,
	"selfie_hash" varchar(255) NOT NULL,
	"status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"flagged_fraud" boolean DEFAULT false NOT NULL,
	"fraud_reason" text,
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_statuses_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"staff_name" varchar(255) NOT NULL,
	"delivery_date" timestamp NOT NULL,
	"location" varchar(500) NOT NULL,
	"delivered" boolean DEFAULT false NOT NULL,
	"delivery_photo_ref" varchar(255),
	"student_signature_ref" varchar(255),
	"payment_confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deliveries_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"amount" real NOT NULL,
	"type" "payment_type" NOT NULL,
	"status" "payment_status" NOT NULL,
	"collected_by" varchar(255),
	"collected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "src_commission_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"commission_rate" real DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"notes" text,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "src_commission_configs_university_id_unique" UNIQUE("university_id")
);
--> statement-breakpoint
CREATE TABLE "src_commission_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"application_ref" varchar(50) NOT NULL,
	"university_id" uuid NOT NULL,
	"src_officer_id" uuid,
	"laptop_price" real NOT NULL,
	"commission_rate" real NOT NULL,
	"commission_amount" real NOT NULL,
	"status" "commission_status" DEFAULT 'PENDING' NOT NULL,
	"earned_at" timestamp,
	"ready_at" timestamp,
	"paid_at" timestamp,
	"payout_reference" varchar(255),
	"payout_channel" varchar(50),
	"paid_batch_id" varchar(255),
	"payout_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "src_commission_records_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "src_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"payout_ref" varchar(50) NOT NULL,
	"total_amount" real NOT NULL,
	"commission_count" real NOT NULL,
	"payment_method" varchar(100),
	"payment_reference" varchar(255),
	"status" "payout_status" DEFAULT 'PENDING' NOT NULL,
	"scheduled_date" timestamp,
	"processed_date" timestamp,
	"processed_by" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "src_payouts_payout_ref_unique" UNIQUE("payout_ref")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(100) NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"details" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"application_id" uuid
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"recipient_id" uuid,
	"recipient_role" varchar(50),
	"event_name" varchar(100) NOT NULL,
	"channel" varchar(50) NOT NULL,
	"title" varchar(255),
	"message" text NOT NULL,
	"message_id" varchar(255),
	"status" varchar(50) NOT NULL,
	"correlation_id" varchar(255),
	"application_id" uuid,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "src_officers" ADD CONSTRAINT "src_officers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "src_officers" ADD CONSTRAINT "src_officers_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "university_wallets" ADD CONSTRAINT "university_wallets_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_laptop_id_laptops_id_fk" FOREIGN KEY ("laptop_id") REFERENCES "public"."laptops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_statuses" ADD CONSTRAINT "verification_statuses_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "src_commission_configs" ADD CONSTRAINT "src_commission_configs_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "src_commission_records" ADD CONSTRAINT "src_commission_records_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "src_commission_records" ADD CONSTRAINT "src_commission_records_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "src_commission_records" ADD CONSTRAINT "src_commission_records_src_officer_id_src_officers_id_fk" FOREIGN KEY ("src_officer_id") REFERENCES "public"."src_officers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "src_payouts" ADD CONSTRAINT "src_payouts_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "status_history_application_id_idx" ON "application_status_history" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "status_history_status_idx" ON "application_status_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_student_id_idx" ON "applications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_reference_idx" ON "applications" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "applications_ghana_card_idx" ON "applications" USING btree ("ghana_card_ref");--> statement-breakpoint
CREATE INDEX "applications_phone_idx" ON "applications" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "deliveries_application_id_idx" ON "deliveries" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "deliveries_staff_name_idx" ON "deliveries" USING btree ("staff_name");--> statement-breakpoint
CREATE INDEX "payments_application_id_idx" ON "payments" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "payments_type_idx" ON "payments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "commission_configs_university_id_idx" ON "src_commission_configs" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "commission_configs_is_active_idx" ON "src_commission_configs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "commission_records_application_id_idx" ON "src_commission_records" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "commission_records_application_ref_idx" ON "src_commission_records" USING btree ("application_ref");--> statement-breakpoint
CREATE INDEX "commission_records_university_id_idx" ON "src_commission_records" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "commission_records_src_officer_id_idx" ON "src_commission_records" USING btree ("src_officer_id");--> statement-breakpoint
CREATE INDEX "commission_records_status_idx" ON "src_commission_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "commission_records_payout_id_idx" ON "src_commission_records" USING btree ("payout_id");--> statement-breakpoint
CREATE INDEX "payouts_university_id_idx" ON "src_payouts" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX "payouts_payout_ref_idx" ON "src_payouts" USING btree ("payout_ref");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "src_payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payouts_scheduled_date_idx" ON "src_payouts" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_application_id_idx" ON "audit_logs" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "notification_logs_recipient_role_idx" ON "notification_logs" USING btree ("recipient_role");--> statement-breakpoint
CREATE INDEX "notification_logs_application_id_idx" ON "notification_logs" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "notification_logs_event_name_idx" ON "notification_logs" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "notification_logs_channel_idx" ON "notification_logs" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notification_logs_status_idx" ON "notification_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_logs_sent_at_idx" ON "notification_logs" USING btree ("sent_at");