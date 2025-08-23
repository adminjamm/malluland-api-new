ALTER TABLE "chat_requests" ADD COLUMN "chat_room_id" uuid;--> statement-breakpoint
ALTER TABLE "meetup_requests" ADD COLUMN "chat_room_id" uuid;