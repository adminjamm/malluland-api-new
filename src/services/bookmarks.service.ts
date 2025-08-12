import { Service, Container } from 'typedi';
import { BookmarksRepository } from '../repositories/bookmarks.repository';

@Service()
export class BookmarksService {
  private readonly repo: BookmarksRepository;
  constructor() {
    this.repo = Container.get(BookmarksRepository);
  }

  async getBookmarks(userId: string, page: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    return this.repo.list(userId, { limit, offset });
  }

  async addBookmark(userId: string, bookmarkedUserId: string) {
    if (userId === bookmarkedUserId) throw new Error('Cannot bookmark yourself');
    const cap = 7;
    const count = await this.repo.countForUser(userId);
    if (count >= cap) throw new Error('Bookmark limit reached');
    const exists = await this.repo.exists(userId, bookmarkedUserId);
    if (exists) return { ok: true, alreadyBookmarked: true } as const;
    const row = await this.repo.add(userId, bookmarkedUserId);
    return row[0];
  }

  async removeBookmark(userId: string, bookmarkedUserId: string) {
    const res = await this.repo.remove(userId, bookmarkedUserId);
    return { ok: res.length > 0 } as const;
  }
}

