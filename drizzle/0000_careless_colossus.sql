CREATE TABLE IF NOT EXISTS "admin_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"user_id" uuid,
	"action_type" text,
	"cms_page" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text,
	"email" text,
	"password" text,
	"role" text,
	"last_login" timestamp,
	"is_deleted" boolean,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "airports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"region_name" text,
	"iata" text,
	"country_code" text,
	"icao" text,
	"airport_name" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "all_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"email_verified" boolean,
	"state" text,
	"phone_verified" boolean,
	"date_dob" text,
	"month_dob" text,
	"year_dob" text,
	"admin_status" text,
	"profession" text,
	"company_name" text,
	"avatar" text,
	"bio" text,
	"social_linkedin" text,
	"social_instagram" text,
	"social_twitter" text,
	"social_tiktok" text,
	"last_lat" double precision,
	"last_lng" double precision,
	"city" text,
	"created_at" bigint,
	"updated_at" bigint,
	"gender" text,
	"is_premium" boolean DEFAULT false,
	"db_age" integer,
	"activity_slugs" text,
	"trait_slugs" text,
	"status" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text,
	"value" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_identities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"provider" text,
	"provider_user_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "block_and_report" (
	"id" uuid PRIMARY KEY NOT NULL,
	"option_text" text,
	"display_order" integer,
	"is_active" boolean,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blocked_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"blocked_user_id" uuid,
	"reason_blocked" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookmarks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"bookmarked_user_id" uuid,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalog_activities" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"is_active" boolean,
	"slug" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalog_actors" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"is_active" boolean,
	"slug" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalog_actresses" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"is_active" boolean,
	"slug" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalog_traits" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"is_active" boolean,
	"slug" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid,
	"sender_user_id" uuid,
	"kind" text,
	"body" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"from_user_id" uuid,
	"to_user_id" uuid,
	"message" text,
	"status" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_room_participants" (
	"chat_room_id" uuid,
	"user_id" uuid,
	"last_read_message_id" uuid,
	"unread_count" integer,
	"joined_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	"status" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_rooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text,
	"meetup_id" uuid,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "currencies" (
	"code" text PRIMARY KEY NOT NULL,
	"symbol" text,
	"name" text,
	"priority_order" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"platform" text,
	"push_token" text,
	"app_version" text,
	"last_seen_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finerprint" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"fingerprint_visitor_id" text,
	"fingerprint_data" jsonb,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jamms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"host_id" uuid,
	"max_num_guests" integer,
	"name" text,
	"status" text,
	"location" text,
	"description" text,
	"from_timestamp" bigint,
	"to_timestamp" bigint,
	"num_guests" integer,
	"city" text,
	"activity_slug" text,
	"start_time" bigint,
	"end_time" bigint,
	"created_at" bigint,
	"updated_at" bigint,
	"whos_paying" text,
	"fees_currency" text,
	"fees" integer,
	"map_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meetup_attendees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meetup_id" uuid,
	"sender_user_id" uuid,
	"chat_room_id" uuid,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meetup_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meetup_id" uuid,
	"sender_user_id" uuid,
	"message" text,
	"status" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meetups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"host_id" uuid,
	"name" text,
	"activity_id" integer,
	"guests" integer,
	"who_pays" text,
	"currency_code" text,
	"fee_amount" numeric(10, 2),
	"location_text" text,
	"description" text,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"map_url" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"meetup_status" text,
	"lat" double precision,
	"lng" double precision,
	"city" text,
	"state" text,
	"country" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_links" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"platform" text,
	"handle" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_bookmarks" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"bookmarked_user_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favorite_actors" (
	"user_id" uuid,
	"actor_id" integer,
	"position" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favorite_actresses" (
	"user_id" uuid,
	"actress_id" integer,
	"position" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favorites_text" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"category" text,
	"text" text,
	"position" integer,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_firebase_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"token" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_interests" (
	"user_id" uuid,
	"interest_id" integer,
	"position" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_location" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"closest_airport_code" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_network_observations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"created_at" timestamp,
	"ip" text,
	"ip_version" text,
	"asn" text,
	"isp" text,
	"org" text,
	"ipapi_response" jsonb,
	"city" text,
	"state" text,
	"country" text,
	"country_code" text,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"original_url" text NOT NULL,
	"optimized_url" text,
	"kraken_id" text,
	"kraken_response" json,
	"image_type" text NOT NULL,
	"position" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"optimization_status" text DEFAULT 'pending',
	"optimization_attempts" integer DEFAULT 0,
	"optimized_at" timestamp,
	"deactivated_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_selfie" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"selfie_url" text,
	"status" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"chat_audience" text,
	"push_enabled" boolean,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_states" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_traits" (
	"user_id" uuid,
	"trait_id" integer,
	"position" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"dob" date,
	"gender" text,
	"city" text,
	"state" text,
	"country" text,
	"user_state" text,
	"refid" text,
	"company" text,
	"position" text,
	"bio" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
