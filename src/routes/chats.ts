import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Container } from "typedi";
import { ChatsService } from "../services/chats.service";
import { authorize } from "../middleware/auth";
import { paginate } from "../middleware/paginate";
import {
  and,
  count,
  desc,
  eq,
  exists,
  gt,
  isNull,
  not,
  or,
  sql,
} from "drizzle-orm";
import { chatRoomParticipants, chatRooms } from "../db/schema";
import { db } from "../db";

export const chatsRouter = new Hono();

chatsRouter.get(
  "/rooms",
  authorize({ bypassOnboardingCheck: true }),
  paginate,
  async (c) => {
    const userId = c.get("profile").id;

    const onlyIds = c.req.query("onlyIds") === "true";

    const page = c.get("page");
    const size = c.get("size");

    const where = and(
      isNull(chatRooms.deletedAt),
      exists(
        db
          .select({ _: sql`1` })
          .from(chatRoomParticipants)
          .where(
            and(
              eq(chatRoomParticipants.chatroomId, chatRooms.id),
              eq(chatRoomParticipants.participantId, userId),
              eq(chatRoomParticipants.status, "active")
            )
          )
      ),
      gt(
        sql`(select count(*) 
          from chat_room_participants
          where chatroom_id = chat_rooms.id
        )`,
        1
      ),
      or(
        not(eq(chatRooms.type, "dm")),
        not(
          exists(
            sql`(
            SELECT 1 
            FROM chat_room_participants cp1 
            JOIN chat_room_participants cp2 ON 
              cp1.chatroom_id = cp2.chatroom_id 
              AND cp1.participant_id != cp2.participant_id 
            JOIN blocked_user bp ON 
              (bp.user_id = cp1.participant_id AND bp.blocked_user_id = cp2.participant_id)
              OR 
              (bp.user_id = cp2.participant_id AND bp.blocked_user_id = cp1.participant_id)
            WHERE cp1.chatroom_id = ${chatRooms.id}
              -- AND bp.unblocked_at IS NULL
          )`
          )
        )
      )
    );

    if (onlyIds) {
      const chatrooms = await db.query.chatRooms.findMany({
        where,
        columns: { id: true },
      });
      return c.json({
        data: { chatrooms: chatrooms.map((chatroom) => chatroom.id) },
      });
    }

    const [chatrooms, totalCount] = await Promise.all([
      db.query.chatRooms.findMany({
        where,
        offset: (page - 1) * size,
        limit: size,
        orderBy: desc(chatRooms.createdAt),
        with: {
          chatRequests: {
            with: {
              requestor: {
                columns: { name: true },
              },
            },
          },
          meetup: {
            with: {
              creator: {
                columns: { id: true },
              },
            },
          },
        },
      }),
      db.select({ count: count() }).from(chatRooms).where(where),
    ]);

    return c.json({
      data: { chatrooms },
      metadata: {
        count: totalCount[0]?.count,
        page,
        size,
      },
    });
  }
);
