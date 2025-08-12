import { Service, Container } from 'typedi';
import { RequestsRepository, type RequestItem } from '../repositories/requests.repository';

@Service()
export class RequestsService {
  private readonly repo: RequestsRepository;
  constructor() { this.repo = Container.get(RequestsRepository); }

  list({ userId, filter, page }: { userId: string; filter: 'all' | 'meetups' | 'chats'; page: number }) {
    const limit = 21;
    const offset = (page - 1) * limit;
    if (filter === 'meetups') return this.repo.listMeetupReceived(userId, limit, offset);
    if (filter === 'chats') return this.repo.listChatReceived(userId, limit, offset);
    return this.repo.listAllReceived(userId, limit, offset);
  }

  judgeChat(id: string, toUserId: string, action: 'accept' | 'decline' | 'archive') {
    return this.repo.judgeChatRequest(id, toUserId, action);
  }
}
