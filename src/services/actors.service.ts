import { Service, Container } from "typedi";
import {
  ActorsRepository,
  ActressesRepository,
} from "../repositories/actors.repository";

@Service()
export class ActorsService {
  private readonly repo: ActorsRepository;
  constructor() {
    this.repo = Container.get(ActorsRepository);
  }

  async getActors(page: number, size?: number) {
    const limit = size ?? 20;
    const offset = (page - 1) * limit;
    return this.repo.list({ limit, offset });
  }
  async count() {
    return this.repo.count();
  }
}

@Service()
export class ActressesService {
  private readonly repo: ActressesRepository;
  constructor() {
    this.repo = Container.get(ActressesRepository);
  }

  async getActresses(page: number, size?: number) {
    const limit = size ?? 20;
    const offset = (page - 1) * limit;
    return this.repo.list({ limit, offset });
  }
  async count() {
    return this.repo.count();
  }
}
