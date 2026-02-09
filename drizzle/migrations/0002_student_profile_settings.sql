ALTER TABLE "student_profiles" ADD COLUMN "verification_status" varchar(50) DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "verification_notes" text;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "verification_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint

CREATE TABLE "student_profile_audits" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "profile_id" uuid,
    "action" varchar(100) NOT NULL,
    "field" varchar(100),
    "old_value" text,
    "new_value" text,
    "ip_address" varchar(45),
    "user_agent" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "student_profile_audits" ADD CONSTRAINT "student_profile_audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile_audits" ADD CONSTRAINT "student_profile_audits_profile_id_student_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "idx_profile_audit_user" ON "student_profile_audits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_audit_profile" ON "student_profile_audits" USING btree ("profile_id");--> statement-breakpoint
