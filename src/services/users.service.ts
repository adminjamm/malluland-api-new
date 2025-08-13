import { Service, Container } from "typedi";
import { UsersRepository } from "../repositories/users.repository";

@Service()
export class UsersService {
  private readonly repo: UsersRepository;
  constructor() {
    this.repo = Container.get(UsersRepository);
  }

  getUser(id: string) {
    return this.repo.getById(id);
  }
  updateUser(id: string, data: any) {
    return this.repo.updateById(id, data);
  }

  addPhoto(
    userId: string,
    input: {
      originalUrl: string;
      imageType: string;
      position: number;
      optimizedUrl?: string | null;
    }
  ) {
    return this.repo.addPhoto(userId, input);
  }
  listPhotos(userId: string) {
    return this.repo.listPhotos(userId);
  }

  addSelfie(userId: string, selfieUrl: string) {
    return this.repo.addSelfie(userId, selfieUrl);
  }
  listSelfies(userId: string) {
    return this.repo.listSelfies(userId);
  }

  replaceInterests(userId: string, interestIds: number[]) {
    return this.repo.replaceInterests(userId, interestIds);
  }
  listInterests(userId: string) {
    return this.repo.listInterests(userId);
  }

  replaceTraits(userId: string, traitIds: number[]) {
    return this.repo.replaceTraits(userId, traitIds);
  }
  listTraits(userId: string) {
    return this.repo.listTraits(userId);
  }

  replaceFavoriteActors(userId: string, actorIds: number[]) {
    return this.repo.replaceFavoriteActors(userId, actorIds);
  }
  listFavoriteActors(userId: string) {
    return this.repo.listFavoriteActors(userId);
  }

  replaceFavoriteActresses(userId: string, actressIds: number[]) {
    return this.repo.replaceFavoriteActresses(userId, actressIds);
  }
  listFavoriteActresses(userId: string) {
    return this.repo.listFavoriteActresses(userId);
  }

  replaceSocialLinks(
    userId: string,
    links: { platform: string; handle: string; show_profile: boolean }[]
  ) {
    return this.repo.replaceSocialLinks(userId, links);
  }
  listSocialLinks(userId: string) {
    return this.repo.listSocialLinks(userId);
  }

  replaceUserFavoritesText(userId: string, category: string, values: string[]) {
    return this.repo.replaceUserFavoritesText(userId, category, values);
  }

  listUserFavorites(userId: string, category?: string) {
    return this.repo.listUserFavorites(userId, category);
  }
}
