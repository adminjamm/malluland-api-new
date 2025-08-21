import { Service, Container } from "typedi";
import { MeetupsRepository } from "../repositories/meetups.repository";
import { FirebaseHelper } from "../third-party-services/firebase.helper";
import { ChatRepository } from "../repositories/chat.repository";
import { UsersRepository } from "../repositories/users.repository";

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
    const start = new Date(
      Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate(),
        4,
        30,
        0
      )
    );
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
    const monday = new Date(
      Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate() - diffToMon,
        0,
        0,
        0
      )
    );
    const sundayEnd = new Date(
      monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000
    );
    return {
      start: new Date(now.getTime() - offsetMs),
      end: new Date(sundayEnd.getTime() - offsetMs),
    };
  }

  private weekendRangeIST(now = new Date()): { start: Date; end: Date } {
    const offsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + offsetMs);
    const day = istNow.getUTCDay();
    const saturday = new Date(
      Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate() + ((6 - day + 7) % 7),
        0,
        0,
        0
      )
    );
    const sundayEnd = new Date(
      saturday.getTime() + 2 * 24 * 60 * 60 * 1000 - 1000
    );
    return {
      start: new Date(saturday.getTime() - offsetMs),
      end: new Date(sundayEnd.getTime() - offsetMs),
    };
  }

  getDiscovery({
    filter,
    page,
    city,
    activityId,
    excludeHostId,
    requestUserId,
  }: {
    filter: "upcoming" | "this-week" | "this-weekend";
    page: number;
    city?: string;
    activityId?: number;
    excludeHostId?: string;
    requestUserId?: string;
  }) {
    const limit = 20;
    const offset = (page - 1) * limit;
    const now = this.nowIST();
    let range;
    if (filter === "this-week") range = this.weekRangeIST(now);
    else if (filter === "this-weekend") range = this.weekendRangeIST(now);
    else range = { start: now };
    return this.repo.listInRange({
      range,
      limit,
      offset,
      onlyActive: true,
      city,
      activityId,
      excludeHostId,
      requestUserId,
    });
  }

  getMyMeetups({
    userId,
    page,
    includePast,
  }: {
    userId: string;
    page: number;
    includePast?: boolean;
  }) {
    const limit = 20;
    const offset = (page - 1) * limit;
    const now = this.nowIST();
    return this.repo.listByHost({
      hostId: userId,
      includePast,
      now,
      limit,
      offset,
    });
  }

  async createMeetup(hostId: string, data: any) {
    // Generate a chat room id to store on the meetup row
    const roomId = crypto.randomUUID();
    // Create the meetup with chatRoomId persisted
    const rows = await this.repo.create(hostId, data, roomId);
    const meetup = rows[0];
    // Create a DB chat room for this meetup id and add host as participant
    await this.chatRepo.createChatRoom({
      id: roomId,
      type: "meetup",
      meetupId: meetup.id,
    });
    await this.chatRepo.addParticipants(roomId, [hostId]);
    // Create Firebase room immediately with host participant to avoid overwriting later
    await this.firebase.createChatRoom({
      id: roomId,
      type: "meetup",
      meetupId: meetup.id,
      participants: [{ userId: hostId, isAdmin: true }],
      createdAt: Date.now(),
    });
    return rows;
  }

  updateMeetup(id: string, hostId: string, data: any) {
    return this.repo.update(id, hostId, data);
  }

  deleteMeetup(id: string, hostId: string) {
    return this.repo.softDelete(id, hostId);
  }

  getMeetupById(id: string, requestUserId?: string) {
    return this.repo.getDetailsById(id, requestUserId);
  }

  listAttendees(meetupId: string) {
    return this.repo.listAttendees(meetupId);
  }

  async requestToJoin(meetupId: string, senderUserId: string, message: string) {
    console.log("Request to join meetup", { meetupId, senderUserId, message });
    const [m] = await this.repo.getById(meetupId);
    console.log("Meetup found:", m);
    if (!m) throw new Error("Meetup not found");
    if (!m.hostId) throw new Error("Meetup host not set");
    if (m.hostId === senderUserId)
      throw new Error("Cannot request your own meetup");
    const now = this.nowIST();
    if (!(m.meetupStatus === "active") || !(m.startsAt && m.startsAt > now))
      throw new Error("Meetup not open for requests");

    // Rate limit window 3/day from 4:30 IST
    const { start, end } = this.dayWindowIST(now);
    const rows = await this.repo.countRequestsInWindow(
      senderUserId,
      start,
      end
    );
    console.log("Requests in window:", rows.length);
    if (rows.length >= 3) throw new Error("Daily request limit reached");

    const exists = await this.repo.hasExistingRequest(meetupId, senderUserId);
    if (exists) throw new Error("Request already exists");

    const req = {
      id: crypto.randomUUID(),
      meetupId,
      senderUserId,
      message,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    try {
      // Insert the meetup request and return
      const inserted = await this.repo.insertRequest(req);
      return inserted as any;
    } catch (e) {
      console.error("Error handling request creation", e);
      throw new Error("Failed to send request");
    }
  }

  async judgeRequest(id: string, hostId: string, action: "accept" | "decline") {
    const [req] = await this.repo.getRequestById(id);
    if (!req) throw new Error("Request not found");
    if (!req.meetupId) throw new Error("Request missing meetupId");
    if (!req.senderUserId) throw new Error("Request missing sender");
    const [m] = await this.repo.getById(req.meetupId);
    if (!m || !m.hostId || m.hostId !== hostId)
      throw new Error("Not authorized");
    if (action === "accept") {
      const updated = await this.repo.approveRequest(id);

      // Use the meetup's chat room created at meetup creation time
      let roomId: string;
      const byMeetup = await this.chatRepo.findMeetupRoomByMeetupId(
        req.meetupId
      );
      if (byMeetup) {
        roomId = byMeetup.id;
        await this.chatRepo.addParticipants(roomId, [req.senderUserId]);
      } else {
        // Fallback: create the room if missing
        roomId = crypto.randomUUID();
        await this.chatRepo.createChatRoom({
          id: roomId,
          type: "meetup",
          meetupId: req.meetupId,
        });
        await this.chatRepo.addParticipants(roomId, [hostId, req.senderUserId]);
      }
      // Add requester as participant now (host was added at meetup creation). If room was newly created, add host too.

      // For Firebase: on first creation at meetup creation, host is already present.
      // If somehow room doesn't exist (fallback), create with both; otherwise add only the requester.
      const exists = await this.firebase.roomExists(roomId);
      if (!exists) {
        await this.firebase.createChatRoom({
          id: roomId,
          type: "meetup",
          meetupId: req.meetupId,
          participants: [
            { userId: hostId, isAdmin: true },
            { userId: req.senderUserId, isAdmin: false },
          ],
          createdAt: Date.now(),
        });
      } else {
        await this.firebase.addParticipants(roomId, [
          { userId: req.senderUserId, isAdmin: false },
        ]);
      }

      // Seed the first chat message from the original request message, if present
      if (req.message && req.message.trim().length > 0) {
        // Let Firebase generate the message ID, then persist the same ID in DB
        const [sender] = await this.usersRepo.getById(req.senderUserId);
        const senderName = sender?.name ?? null;
        await this.firebase.addChatMessage({
          chatId: roomId,
          senderUserId: req.senderUserId,
          senderName,
          kind: "text",
          body: req.message,
          createdAt: Date.now(),
        });
        await this.chatRepo.createTextMessage({
          chatId: roomId,
          senderUserId: req.senderUserId,
          body: req.message,
        });
      }

      await this.repo.addAttendeeWithChatRoomId(
        req.meetupId,
        req.senderUserId,
        roomId
      );

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

  async leaveMeetup(meetupId: string, userId: string) {
    // Verify the meetup exists and user is not the host
    const [meetup] = await this.repo.getById(meetupId);
    if (!meetup) throw new Error("Meetup not found");
    if (meetup.hostId === userId)
      throw new Error("Host cannot leave their own meetup");

    // Check if user is actually an attendee
    const attendees = await this.repo.listAttendees(meetupId);
    const attendee = attendees.find((a) => a.senderUserId === userId);
    if (!attendee) throw new Error("You are not an attendee of this meetup");

    // Remove from attendees table
    await this.repo.removeAttendee(meetupId, userId);

    // Update chat room participants status to 'left'
    if (meetup.chatRoomId) {
      await this.chatRepo.updateParticipantStatus(
        meetup.chatRoomId,
        userId,
        "left"
      );
    }

    // Remove from Firebase chat room if it exists
    if (meetup.chatRoomId) {
      try {
        await this.firebase.removeParticipant(meetup.chatRoomId, userId);
      } catch (e) {
        console.warn(
          "Failed to remove participant from Firebase chat room:",
          e
        );
        // Continue execution - DB removal is more important
      }
    }

    return { success: true };
  }

  async removeParticipant(
    meetupId: string,
    hostId: string,
    participantId: string
  ) {
    // Verify the meetup exists and requester is the host
    const [meetup] = await this.repo.getById(meetupId);
    if (!meetup) throw new Error("Meetup not found");
    if (meetup.hostId !== hostId)
      throw new Error("Only the host can remove participants");
    if (hostId === participantId)
      throw new Error("Host cannot remove themselves");

    // Check if participant is actually an attendee
    const attendees = await this.repo.listAttendees(meetupId);
    const attendee = attendees.find((a) => a.senderUserId === participantId);
    if (!attendee) throw new Error("User is not an attendee of this meetup");

    // Remove from attendees table
    await this.repo.removeAttendee(meetupId, participantId);

    // Update chat room participants status to 'removed'
    if (meetup.chatRoomId) {
      await this.chatRepo.updateParticipantStatus(
        meetup.chatRoomId,
        participantId,
        "removed"
      );
    }

    // Remove from Firebase chat room if it exists
    if (meetup.chatRoomId) {
      try {
        await this.firebase.removeParticipant(meetup.chatRoomId, participantId);
      } catch (e) {
        console.warn(
          "Failed to remove participant from Firebase chat room:",
          e
        );
        // Continue execution - DB removal is more important
      }
    }

    return { success: true };
  }
}
