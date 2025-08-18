import { Service, Container } from 'typedi';
import { ChatsRepository, type ChatRoomListItem } from '../repositories/chats.repository';

@Service()
export class ChatsService {
  private readonly repo: ChatsRepository;
  constructor() { this.repo = Container.get(ChatsRepository); }

  listRooms(userId: string, page: number): Promise<ChatRoomListItem[]> {
    const limit = 20;
    const offset = (page - 1) * limit;
    return this.repo.listRoomsForUser(userId, limit, offset);
  }

  listRoomsV2(userId: string, page: number, pageSize = 20): Promise<any[]> {
    const limit = pageSize;
    const offset = (page - 1) * limit;
    return this.repo.listRoomsV2(userId, limit, offset);
  }
}
