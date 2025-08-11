import { Service, Container } from 'typedi';
import { MeetupsRepository } from '../repositories/meetups.repository';

@Service()
export class MeetupsService {
  private readonly repo: MeetupsRepository;
  constructor() {
    this.repo = Container.get(MeetupsRepository);
  }

  async getUpcoming(page: number, now: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    return this.repo.listUpcoming({ limit, offset, now });
  }
}

