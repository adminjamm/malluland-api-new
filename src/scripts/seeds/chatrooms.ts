import { getDb } from "./_db";
import { chatRooms, chatRoomParticipants, users } from "../../db/schema";
import { randomUUID } from "node:crypto";

export async function seedChatrooms() {
  const db = getDb();

  // First, get some existing users to create chatrooms between
  const existingUsers = await db.select({ id: users.id }).from(users).limit(6);

  if (existingUsers.length < 2) {
    console.log("Need at least 2 users to create chatrooms");
    return;
  }

  // Create some DM chatrooms
  const dmChatrooms = [
    {
      id: randomUUID(),
      type: "DM",
      meetupId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      type: "DM",
      meetupId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      type: "DM",
      meetupId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Create some meetup chatrooms
  const meetupChatrooms = [
    {
      id: randomUUID(),
      type: "meetup",
      meetupId: randomUUID(), // This would reference an actual meetup
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      type: "meetup",
      meetupId: randomUUID(), // This would reference an actual meetup
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const allChatrooms = [...dmChatrooms, ...meetupChatrooms];

  // Insert chatrooms
  await db.insert(chatRooms).values(allChatrooms);
  console.log(`Created ${allChatrooms.length} chatrooms`);

  // Create chatroom participants
  const participants = [];

  // DM chatroom 1: User 1 and User 2
  participants.push(
    {
      id: randomUUID(),
      chatroomId: dmChatrooms[0]?.id,
      participantId: existingUsers[0]?.id,
      lastReadMessageId: null,
      unreadCount: 0,
      joinedAt: new Date(),
      role: "member",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      chatroomId: dmChatrooms[0]?.id,
      participantId: existingUsers[1]?.id,
      lastReadMessageId: null,
      unreadCount: 2,
      joinedAt: new Date(),
      role: "member",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  // DM chatroom 2: User 2 and User 3
  if (existingUsers.length >= 3) {
    participants.push(
      {
        id: randomUUID(),
        chatroomId: dmChatrooms[1].id,
        participantId: existingUsers[1].id,
        lastReadMessageId: null,
        unreadCount: 0,
        joinedAt: new Date(),
        role: "member",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        chatroomId: dmChatrooms[1].id,
        participantId: existingUsers[2].id,
        lastReadMessageId: null,
        unreadCount: 1,
        joinedAt: new Date(),
        role: "member",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  // DM chatroom 3: User 1 and User 3
  if (existingUsers.length >= 3) {
    participants.push(
      {
        id: randomUUID(),
        chatroomId: dmChatrooms[2].id,
        participantId: existingUsers[0].id,
        lastReadMessageId: null,
        unreadCount: 0,
        joinedAt: new Date(),
        role: "member",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        chatroomId: dmChatrooms[2].id,
        participantId: existingUsers[2].id,
        lastReadMessageId: null,
        unreadCount: 0,
        joinedAt: new Date(),
        role: "member",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  // Meetup chatroom 1: Multiple users
  participants.push(
    {
      id: randomUUID(),
      chatroomId: meetupChatrooms[0].id,
      participantId: existingUsers[0].id,
      lastReadMessageId: null,
      unreadCount: 0,
      joinedAt: new Date(),
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      chatroomId: meetupChatrooms[0].id,
      participantId: existingUsers[1].id,
      lastReadMessageId: null,
      unreadCount: 3,
      joinedAt: new Date(),
      role: "member",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  // Meetup chatroom 2: Multiple users
  participants.push(
    {
      id: randomUUID(),
      chatroomId: meetupChatrooms[1].id,
      participantId: existingUsers[1].id,
      lastReadMessageId: null,
      unreadCount: 0,
      joinedAt: new Date(),
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      chatroomId: meetupChatrooms[1].id,
      participantId: existingUsers[0].id,
      lastReadMessageId: null,
      unreadCount: 1,
      joinedAt: new Date(),
      role: "member",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  // Insert participants
  await db.insert(chatRoomParticipants).values(participants);
  console.log(`Created ${participants.length} chatroom participants`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedChatrooms().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
