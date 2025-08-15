import { Service, Container } from 'typedi';
import { PeopleRepository, type Center, type PersonRow } from '../repositories/people.repository';

function computeAge(dob: Date | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function bioSnippet(bio: string | null, max = 100): string | null {
  if (!bio) return null;
  if (bio.length <= max) return bio;
  return bio.slice(0, max);
}

@Service()
export class PeopleService {
  private readonly repo: PeopleRepository;
  constructor() {
    this.repo = Container.get(PeopleRepository);
  }

  async getPeople(params: { viewerId: string; page: number; center?: Center; gender?: 'all' | 'male' | 'female' | 'other'; ageMin?: number; ageMax?: number; interestIds?: number[]; maxDistanceKm?: number }): Promise<{ items: Array<{ id: string; avatar: string | null; name: string | null; age: number | null; bioSnippet: string | null }> }> {
    const { viewerId, page, center, gender = 'all', ageMin, ageMax, interestIds, maxDistanceKm } = params;
    const pageSize = 20;

    // Determine center
    let ctr = center;
    if (!ctr) {
      const derived = await this.repo.getViewerCenter(viewerId);
      if (!derived) throw new Error('Location not set for user');
      ctr = derived;
    }

    const maleOffset = (page - 1) * 10;
    const femaleOffset = (page - 1) * 10;

    let combined: PersonRow[] = [];

    const distance = maxDistanceKm ?? 30;

    if (gender && gender !== 'all') {
      // Single gender query with limit 20
      combined = await this.repo.fetchGenderBucket({ viewerId, gender, center: ctr!, limit: 20, offset: (page - 1) * 20, maxDistanceKm: distance, ageMin, ageMax, interestIds });
    } else {
      const [males, females] = await Promise.all([
        this.repo.fetchGenderBucket({ viewerId, gender: 'male', center: ctr!, limit: 10, offset: maleOffset, maxDistanceKm: distance, ageMin, ageMax, interestIds }),
        this.repo.fetchGenderBucket({ viewerId, gender: 'female', center: ctr!, limit: 10, offset: femaleOffset, maxDistanceKm: distance, ageMin, ageMax, interestIds }),
      ]);
      combined = [...males, ...females];

      // Backfill if one side has fewer than 10
      if (males.length < 10) {
        const deficit = 10 - males.length;
        if (deficit > 0) {
          const extraFemales = await this.repo.fetchGenderBucket({ viewerId, gender: 'female', center: ctr!, limit: deficit, offset: femaleOffset + 10, maxDistanceKm: distance, ageMin, ageMax, interestIds });
          combined = [...males, ...females, ...extraFemales];
        }
      }
      if (females.length < 10) {
        const deficit = 10 - females.length;
        if (deficit > 0) {
          const extraMales = await this.repo.fetchGenderBucket({ viewerId, gender: 'male', center: ctr!, limit: deficit, offset: maleOffset + 10, maxDistanceKm: distance, ageMin, ageMax, interestIds });
          combined = [...males, ...females, ...combined, ...extraMales];
        }
      }
    }


    // Sort by approval_at desc (nulls last)
    combined.sort((a, b) => {
      const atA = a.approval_at ? new Date(a.approval_at).getTime() : -1;
      const atB = b.approval_at ? new Date(b.approval_at).getTime() : -1;
      return atB - atA;
    });

    // Trim to 20 in case overfilled
    if (combined.length > pageSize) combined = combined.slice(0, pageSize);

    // Shape response: Avatar, Name + Age, Short Bio snippet (first 100 chars)
    const items = combined.map((p) => ({
      id: p.id,
      avatar: p.avatar_url ?? null,
      name: p.name ?? null,
      age: computeAge(p.dob ?? null),
      bioSnippet: bioSnippet(p.bio ?? null, 100),
    }));

    return { items };
  }
}

