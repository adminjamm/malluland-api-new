ALTER TABLE "meetups" ADD COLUMN "chat_room_id" uuid;--> statement-breakpoint
ALTER TABLE "meetup_requests" DROP COLUMN "chat_room_id";