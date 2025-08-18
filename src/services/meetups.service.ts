import { Service, Container } from 'typedi';
import { MeetupsRepository } from '../repositories/meetups.repository';
import { FirebaseHelper } from '../third-party-services/firebase.helper';
import { ChatRepository } from '../repositories/chat.repository';
import { UsersRepository } from '../repositories/users.repository';

@Service()
export class MeetupsService {
  private readonly repo: MeetupsRepository;
  private readonly firebase: FirebaseHelper;
  private readonly chatRepo: ChatRepository;
  private readonly usersRepo: UsersRepository;
  constructor() {
    this.repo = Container.get(MeetupsRepository);
    this.firebase = Container.get(FirebaseHelper);
    this.chatRepo = Container.get(ChatRepository);
    this.usersRepo = Container.get(UsersRepository);
  }

  private nowIST(): Date {
    // IST is UTC+5:30; compute now in Date but we use for comparisons as wall clock.
    return new Date();
  }

  private dayWindowIST(now = new Date()): { start: Date; end: Date } {
    // Reset at 04:30 IST. For simplicity without tz lib: assume server clock ~UTC; we apply offset math.
    // Compute IST time by adding 5h30m.
    const offsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + offsetMs);
    const start = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 4, 30, 0));
    // Convert back by subtracting offset to get UTC-equivalent Date for DB comparisons
    const startUtc = new Date(start.getTime() - offsetMs);
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1000);
    return { start: startUtc, end: endUtc };
  }

  private weekRangeIST(now = new Date()): { start: Date; end: Date } {
    const offsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + offsetMs);
    const day = istNow.getUTCDay(); // 0 Sun ... 6 Sat
    const diffToMon = (day + 6) % 7; // days since Monday
    const monday = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - diffToMon, 0, 0, 0));
    const sundayEnd = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000);
    return { start: new Date(now - offsetMs), end: new Date(sundayEnd.getTime() - offsetMs) };
  }

  private weekendRangeIST(now = new Date()): { start: Date; end: Date } {
    const offsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + offsetMs);
    const day = istNow.getUTCDay();
    const saturday = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + ((6 - day + 7) % 7), 0, 0, 0));
    const sundayEnd = new Date(saturday.getTime() + 2 * 24 * 60 * 60 * 1000 - 1000);
    return { start: new Date(saturday.getTime() - offsetMs), end: new Date(sundayEnd.getTime() - offsetMs) };
  }

  getDiscovery({ filter, page, city, activityId, excludeHostId, requestUserId }: { filter: 'upcoming' | 'this-week' | 'this-weekend'; page: number; city?: string; activityId?: number; excludeHostId?: string; requestUserId?: string }) {
    const limit = 20;
  const offset = (page - 1) * limit;
    const now = this.nowIST();
    let range;
    if (filter === 'this-week') range = this.weekRangeIST(now);
    else if (filter === 'this-weekend') range = this.weekendRangeIST(now);
    else range = { start: now };
    return this.repo.listInRange({ range, limit, offset, onlyActive: true, city, activityId, excludeHostId, requestUserId });
  }

  getMyMeetups({ userId, page, includePast }: { userId: string; page: number; includePast?: boolean }) {
    const limit = 20;
    const offset = (page - 1) * limit;
    const now = this.nowIST();
    return this.repo.listByHost({ hostId: userId, includePast, now, limit, offset });
  }

  createMeetup(hostId: string, data: any) {
    // Basic server-side constraints could be validated here too
    return this.repo.create(hostId, data);
  }

  updateMeetup(id: string, hostId: string, data: any) {
    return this.repo.update(id, hostId, data);
  }

  deleteMeetup(id: string, hostId: string) {
    return this.repo.softDelete(id, hostId);
  }

  listAttendees(meetupId: string) {
    return this.repo.listAttendees(meetupId);
  }

  async requestToJoin(meetupId: string, senderUserId: string, message: string) {
    console.log("Request to join meetup", { meetupId, senderUserId, message });
    const [m] = await this.repo.getById(meetupId);
    console.log("Meetup found:", m);
    if (!m) throw new Error('Meetup not found');
    if (m.hostId === senderUserId) throw new Error('Cannot request your own meetup');
    const now = this.nowIST();
    if (!(m.meetupStatus === 'active') || !(m.startsAt && m.startsAt > now)) throw new Error('Meetup not open for requests');

    // Rate limit window 3/day from 4:30 IST
    const { start, end } = this.dayWindowIST(now);
    const rows = await this.repo.countRequestsInWindow(senderUserId, start, end);
    console.log("Requests in window:", rows.length);
    if (rows.length >= 3) throw new Error('Daily request limit reached');

    const exists = await this.repo.hasExistingRequest(meetupId, senderUserId);
    if (exists) throw new Error('Request already exists');

    const req = { id: crypto.randomUUID(), meetupId, senderUserId, message, status: 'pending', createdAt: new Date(), updatedAt: new Date() } as any;
    try {
      return this.repo.insertRequest(req);
    } catch (e) {
      console.error("Error inserting request", e);
      throw new Error('Failed to send request');
    }
  }

  async judgeRequest(id: string, hostId: string, action: 'accept' | 'decline') {
    const [req] = await this.repo.getRequestById(id);
    if (!req) throw new Error('Request not found');
    const [m] = await this.repo.getById(req.meetupId);
    if (!m || m.hostId !== hostId) throw new Error('Not authorized');
    if (action === 'accept') {
      const updated = await this.repo.approveRequest(id);

      // Check for existing chat room between host and requester for this meetup
      const existing = await this.chatRepo.findMeetupRoomByParticipants(req.meetupId, hostId, req.senderUserId);

      let roomId: string;
      if (existing) {
        roomId = existing.id;

        // Ensure first message exists; if room has no messages and request had a message, seed it
        if (req.message && req.message.trim().length > 0) {
          const hasMessages = await this.chatRepo.hasAnyMessages(roomId);
          if (!hasMessages) {
            // Let Firebase generate the message ID, then persist the same ID in DB
            const [sender] = await this.usersRepo.getById(req.senderUserId);
            const senderName = sender?.name ?? null;
            await this.firebase.addChatMessage({ chatId: roomId, senderUserId: req.senderUserId, senderName, kind: 'text', body: req.message, createdAt: Date.now() });
            await this.chatRepo.createTextMessage({ chatId: roomId, senderUserId: req.senderUserId, body: req.message });
          }
        }
      } else {
        // Create chat room: Firebase RTDB + DB chat_rooms
        roomId = crypto.randomUUID();

        await this.firebase.createChatRoom({
          id: roomId,
          type: 'meetup',
          meetupId: req.meetupId,
          participants: [
            { userId: hostId, isAdmin: true },
            { userId: req.senderUserId, isAdmin: false },
          ],
          createdAt: Date.now(),
        });

        await this.chatRepo.createChatRoom({ id: roomId, type: 'meetup', meetupId: req.meetupId });

        // Add both host and requester as participants
        await this.chatRepo.addParticipants(roomId, [hostId, req.senderUserId]);

        // Seed the first chat message from the original request message, if present
        if (req.message && req.message.trim().length > 0) {
          // Let Firebase generate the message ID, then persist the same ID in DB
          const [sender] = await this.usersRepo.getById(req.senderUserId);
          const senderName = sender?.name ?? null;
          await this.firebase.addChatMessage({ chatId: roomId, senderUserId: req.senderUserId, senderName, kind: 'text', body: req.message, createdAt: Date.now() });
          await this.chatRepo.createTextMessage({ chatId: roomId, senderUserId: req.senderUserId, body: req.message });
        }
      }

      await this.repo.addAttendeeWithChatRoomId(req.meetupId, req.senderUserId, roomId);

      return updated;
    } else {
      return this.repo.declineRequest(id);
    }
  }

  listSentRequests(userId: string, page: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    return this.repo.listSentRequests(userId, limit, offset);
  }

  listReceivedRequests(userId: string, page: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    return this.repo.listReceivedRequests(userId, limit, offset);
  }
}

