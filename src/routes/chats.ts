import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Container } from 'typedi';
import { ChatsService } from '../services/chats.service';
import { authorize } from '../middleware/auth';

export const chatsRouter = new Hono();

chatsRouter.get(
  '/rooms',
  authorize({ bypassOnboardingCheck: true }),
  zValidator('query', z.object({ page: z.coerce.number().int().positive().default(1) })),
  async (c) => {
    const { page } = c.req.valid('query');
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'x-user-id header required' }, 400);


  //     const where = and(
  //   isNull(chatroom.deletedAt),
  //   exists(
  //     db
  //       .select({ _: sql`1` })
  //       .from(chatroomParticipant)
  //       .where(
  //         and(
  //           eq(chatroomParticipant.chatroomId, chatroom.id),
  //           eq(chatroomParticipant.participantId, userId),
  //           eq(chatroomParticipant.status, "active"),
  //         ),
  //       ),
  //   ),
  //   gt(
  //     sql`(select count(*) 
  //         from chatroom_participant 
  //         where chatroom_id = ${chatroom.id} 
  //       )`,
  //     1,
  //   ),
  //   or(
  //     not(eq(chatroom.type, "dm")),
  //     not(
  //       exists(
  //         sql`(
  //           SELECT 1 
  //           FROM chatroom_participant cp1 
  //           JOIN chatroom_participant cp2 ON 
  //             cp1.chatroom_id = cp2.chatroom_id 
  //             AND cp1.participant_id != cp2.participant_id 
  //           JOIN block_profile bp ON 
  //             (bp.profile_id = cp1.participant_id AND bp.blocked_profile_id = cp2.participant_id)
  //             OR 
  //             (bp.profile_id = cp2.participant_id AND bp.blocked_profile_id = cp1.participant_id)
  //           WHERE cp1.chatroom_id = ${chatroom.id}
  //             AND bp.unblocked_at IS NULL
  //         )`,
  //       ),
  //     ),
  //   ),
  // );
  
    const items = await Container.get(ChatsService).listRooms(userId, page);
    return c.json({ page, pageSize: 20, items });
  }
);
