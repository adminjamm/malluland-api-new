import { Service, Container } from 'typedi';
import { ChatsRepository, type ChatRoomListItem } from '../repositories/chats.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { FirebaseHelper } from '../third-party-services/firebase.helper';
import { UsersRepository } from '../repositories/users.repository';

@Service()
export class ChatsService {
  private readonly repo: ChatsRepository;
  private readonly chatRepo: ChatRepository;
  private readonly firebase: FirebaseHelper;
  private readonly usersRepo: UsersRepository;
  constructor() {
    this.repo = Container.get(ChatsRepository);
    this.chatRepo = Container.get(ChatRepository);
    this.firebase = Container.get(FirebaseHelper);
    this.usersRepo = Container.get(UsersRepository);
  }

  async listRooms(userId: string, page: number): Promise<{ items: ChatRoomListItem[]; total: number; pageSize: number }> {
    const limit = 20;
    const offset = (page - 1) * limit;
    const { items, total } = await (this.repo as any).listRoomsForUserWithTotal(userId, limit, offset);
    return { items, total, pageSize: limit };
  }

  async listRoomsV2(userId: string, page: number, pageSize = 20): Promise<{ items: any[]; total: number; pageSize: number }> {
    const limit = pageSize;
    const offset = (page - 1) * limit;
    const { items, total } = await (this.repo as any).listRoomsV2WithTotal(userId, limit, offset);
    return { items, total, pageSize: limit };
  }

  getRoomV2(id: string): Promise<any | null> {
    return this.repo.getRoomDetailsV2(id);
  }

  async sendMessage(chatId: string, senderUserId: string, text: string) {
    const body = (text ?? '').trim();
    if (!body) throw new Error('Message text is required');

    const exists = await this.chatRepo.roomExists(chatId);
    if (!exists) throw new Error('Chat room not found');

    const isParticipant = await this.chatRepo.isActiveParticipant(chatId, senderUserId);
    if (!isParticipant) throw new Error('You are not a participant of this chat room');

    // Create DB message first
    const dbRows = await this.chatRepo.createTextMessage({ chatId, senderUserId, body });
    const dbMsg = dbRows[0];

    // Push to Firebase (best-effort)
    try {
      const [sender] = await this.usersRepo.getById(senderUserId);
      const senderName = sender?.name ?? null;
      await this.firebase.addChatMessage({ chatId, senderUserId, senderName, kind: 'text', body, createdAt: Date.now() });
    } catch (e) {
      console.error('[sendMessage] Firebase push failed (continuing):', e);
    }

    return dbMsg;
  }
}
