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
    return this.repo.listActive(userId, { limit, offset });
  }
}

