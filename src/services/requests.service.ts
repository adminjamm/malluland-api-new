import { Service, Container } from "typedi";
import {
  RequestsRepository,
  type RequestItem,
} from "../repositories/requests.repository";
import { ChatRepository } from "../repositories/chat.repository";
import { FirebaseHelper } from "../third-party-services/firebase.helper";
import { UsersRepository } from "../repositories/users.repository";

@Service()
export class RequestsService {
  private readonly repo: RequestsRepository;
  private readonly chatRepo: ChatRepository;
  private readonly firebase: FirebaseHelper;
  private readonly usersRepo: UsersRepository;
  constructor() {
    this.repo = Container.get(RequestsRepository);
    this.chatRepo = Container.get(ChatRepository);
    this.firebase = Container.get(FirebaseHelper);
    this.usersRepo = Container.get(UsersRepository);
  }

  list({
    userId,
    filter,
    page,
  }: {
    userId: string;
    filter: "all" | "meetups" | "chats";
    page: number;
  }) {
    const limit = 21;
    const offset = (page - 1) * limit;
    if (filter === "meetups")
      return this.repo.listMeetupReceived(userId, limit, offset);
    if (filter === "chats")
      return this.repo.listChatReceived(userId, limit, offset);
    return this.repo.listAllReceived(userId, limit, offset);
  }

  listChatSent(userId: string, page: number) {
    const limit = 21;
    const offset = (page - 1) * limit;
    return this.repo.listChatSent(userId, limit, offset);
  }

  async createChatRequest(
    fromUserId: string,
    toUserId: string,
    message: string
  ) {
    // Insert the chat request first
    const rows = await this.repo.createChatRequest(
      fromUserId,
      toUserId,
      message
    );
    const req = rows[0];

    // Ensure a DB DM chat room exists between the two users (no Firebase yet)
    let roomId: string;
    const existing = await this.chatRepo.findDmRoomByParticipants(
      fromUserId,
      toUserId
    );
    if (existing) {
      roomId = existing.id;
    } else {
      roomId = crypto.randomUUID();
      await this.chatRepo.createChatRoom({
        id: roomId,
        type: "DM",
        meetupId: null,
      });
      await this.chatRepo.addParticipants(roomId, [fromUserId, toUserId]);
    }

    // Link the room to the chat request
    await this.repo.setChatRequestRoom(req.id, roomId);

    // Return the updated request row
    const res: any = await this.repo.getChatRequestById(req.id);
    const updated = Array.isArray(res) ? res[0] : (res as any).rows?.[0];
    return [updated] as any;
  }

  async judgeChat(
    id: string,
    toUserId: string,
    action: "accept" | "decline" | "archive"
  ) {
    // Load and authorize
    const res: any = await this.repo.getChatRequestById(id);
    const rows = Array.isArray(res) ? res : res.rows;
    const req = rows?.[0];
    if (!req) throw new Error("Request not found");
    if (req.to_user_id !== toUserId) throw new Error("Not authorized");

    if (action === "accept") {
      // Ensure DM room exists (DB only); reuse if present
      let roomId: string;
      const existing = await this.chatRepo.findDmRoomByParticipants(
        req.from_user_id,
        req.to_user_id
      );
      if (existing) {
        roomId = existing.id;
      } else {
        roomId = crypto.randomUUID();
        await this.chatRepo.createChatRoom({
          id: roomId,
          type: "DM",
          meetupId: null,
        });
        await this.chatRepo.addParticipants(roomId, [
          req.from_user_id,
          req.to_user_id,
        ]);
      }

      // Only now (on acceptance) create the Firebase RTDB room entry
      await this.firebase.createChatRoom({
        id: roomId,
        type: "DM",
        meetupId: null,
        participants: [
          { userId: req.from_user_id, isAdmin: false },
          { userId: req.to_user_id, isAdmin: false },
        ],
        createdAt: Date.now(),
      });

      // Seed first message from original request, if present
      if (req.message && String(req.message).trim().length > 0) {
        const [sender] = await this.usersRepo.getById(req.from_user_id);
        const senderName = sender?.name ?? null;
        await this.firebase.addChatMessage({
          chatId: roomId,
          senderUserId: req.from_user_id,
          senderName,
          kind: "text",
          body: req.message,
          createdAt: Date.now(),
        });
        await this.chatRepo.createTextMessage({
          chatId: roomId,
          senderUserId: req.from_user_id,
          body: req.message,
        });
      }

      // Update status to accepted
      const updated = await this.repo.judgeChatRequest(id, toUserId, "accept");
      return updated;
    } else {
      return this.repo.judgeChatRequest(id, toUserId, action);
    }
  }
}
