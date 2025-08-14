CREATE TYPE "public"."chatroom_participant_role" AS ENUM('admin', 'member');--> statement-breakpoint
ALTER TABLE "chat_room_participants" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "chat_room_participants" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "chatroom_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "sender_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "message" json NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_requests" ADD COLUMN "chat_room_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD COLUMN "chatroom_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD COLUMN "participant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD COLUMN "role" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "meetups" ADD COLUMN "chat_room_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chatroom_id_chat_rooms_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_requests" ADD CONSTRAINT "chat_requests_chat_room_id_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD CONSTRAINT "chat_room_participants_chatroom_id_chat_rooms_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD CONSTRAINT "chat_room_participants_participant_id_users_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetups" ADD CONSTRAINT "meetups_chat_room_id_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" DROP COLUMN "chat_id";--> statement-breakpoint
ALTER TABLE "chat_messages" DROP COLUMN "sender_user_id";--> statement-breakpoint
ALTER TABLE "chat_room_participants" DROP COLUMN "chat_room_id";--> statement-breakpoint
ALTER TABLE "chat_room_participants" DROP COLUMN "user_id";