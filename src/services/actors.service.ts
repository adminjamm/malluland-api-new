import { Service, Container } from 'typedi';
import { ActorsRepository } from '../repositories/actors.repository';

@Service()
export class ActorsService {
  private readonly repo: ActorsRepository;
  constructor() {
    this.repo = Container.get(ActorsRepository);
  }

  async getActors(page: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    return this.repo.list({ limit, offset });
  }
}
