import { Service, Container } from 'typedi';
import { PeopleRepository } from '../repositories/people.repository';

@Service()
export class PeopleService {
  private readonly repo: PeopleRepository;
  constructor() {
    this.repo = Container.get(PeopleRepository);
  }

  async getPeople(page: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    return this.repo.listApprovedActive({ limit, offset });
  }
}

