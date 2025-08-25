import {
  users,
  authIdentities,
  devices,
  userSettings,
  userLocation,
  socialLinks,
  userInterests,
  userTraits,
  userFavoriteActors,
  userFavoriteActresses,
  userFavoritesText,
  userPhotos,
  bookmarks,
  blockedUser,
  meetups,
  meetupRequests,
  meetupAttendees,
  chatRequests,
  chatRooms,
  chatRoomParticipants,
  chatMessages,
} from "../db/schema";
import { db } from "../db";
import { and, eq, exists, gte, inArray, or, sql } from "drizzle-orm";
import { subDays } from "date-fns/subDays";
import { firebaseRtdb } from "./firebase";

// Helper function to generate refid
const generateRefId = (name: string): string => {
  return name.replace(/\s+/g, "").substring(0, 6).toUpperCase();
};

export const SECONDARY_DUMMY_ACCOUNT = { email: "mallulandtest@gmail.com" };
export const DUMMY_ACCOUNTS = [
  {
    email: "iosmalluland@gmail.com",
    populateAccount: true,
  },
  {
    email: "mallulandmembers@gmail.com",
    populateAccount: true,
  },
  {
    email: SECONDARY_DUMMY_ACCOUNT.email,
    populateAccount: false,
  },
];

export const DUMMY_ACCOUNT_EMAILS = DUMMY_ACCOUNTS.map(
  (account) => account.email
);

export const primaryDummyAccountDetails = {
  name: "Priya Menon",
  dob: "1999-04-02",
  gender: "female",
  city: "Kochi",
  state: "Kerala",
  country: "India",
  refid: generateRefId("Priya Menon"),
  company: "Tech Startup",
  position: "Software Developer",
  bio: "Love exploring Kerala's culture and meeting new people! Always up for chai and conversations.",
  isProfileOnboardingCompleted: true,
  userState: "approved_free",
};

export const secondaryDummyAccountDetails = {
  name: "Anjali Nair",
  dob: "1996-04-01",
  gender: "female",
  city: "Thiruvananthapuram",
  state: "Kerala",
  country: "India",
  refid: generateRefId("Anjali Nair"),
  company: "Design Agency",
  position: "UI Designer",
  bio: "Passionate about Kerala's art and dance forms. Looking to connect with fellow Malayalis!",
  isProfileOnboardingCompleted: true,
  userState: "approved_free",
};

export const primaryDummyAccountPosts = {
  meetups: [],
};

export const secondaryDummyAccountPosts = {
  meetups: [
    {
      name: "Kerala Food Festival Meetup",
      guests: 4,
      whoPays: "attendance-fee-applicable",
      currencyCode: "inr",
      feeAmount: "500.00",
      locationText: "Marine Drive, Kochi",
      description:
        "Let's explore authentic Kerala cuisine together! Join us for a food adventure featuring traditional dishes.",
      startsAt: new Date("2050-12-31T13:30:00.000Z"),
      endsAt: new Date("2050-12-31T16:00:00.000Z"),
      mapUrl: "https://maps.google.com/?q=Marine+Drive+Kochi",
      meetupStatus: "active",
      city: "Kochi",
      state: "Kerala",
      country: "India",
    },
  ],
};

// Profile data for primary dummy account
export const primaryDummyProfileData = {
  photos: [
    {
      originalUrl:
        "public/profiles/1755538389714-t8rWMBKTLI05L3jgi4_INZOHeF6W.jpg",
      imageType: "avatar",
      position: 1,
    },
    {
      originalUrl:
        "public/profiles/1755537801640-WfytNaUphIXwsDXfuPJaTaxTVzx1.jpg",
      imageType: "photo",
      position: 2,
    },
    {
      originalUrl:
        "public/profiles/1755537459194-DM2vRZL9pZ71DL6_U67O2ibxuAEG.jpg",
      imageType: "photo",
      position: 3,
    },
  ],
  favoritesText: [
    { category: "movies", textValue: "Drishyam", position: 1 },
    { category: "movies", textValue: "Premam", position: 2 },
    { category: "movies", textValue: "Bangalore Days", position: 3 },
    { category: "dishes", textValue: "Appam with Stew", position: 1 },
    { category: "dishes", textValue: "Fish Curry", position: 2 },
    { category: "dishes", textValue: "Puttu Kadala", position: 3 },
    { category: "musicians", textValue: "Shreya Ghoshal", position: 1 },
    { category: "musicians", textValue: "K.J. Yesudas", position: 2 },
    { category: "musicians", textValue: "Vineeth Sreenivasan", position: 3 },
    { category: "places", textValue: "Munnar", position: 1 },
    { category: "places", textValue: "Alleppey Backwaters", position: 2 },
    { category: "places", textValue: "Wayanad", position: 3 },
    { category: "sports", textValue: "Cricket", position: 1 },
    { category: "sports", textValue: "Football", position: 2 },
    { category: "sports", textValue: "Badminton", position: 3 },
    { category: "books", textValue: "Aadujeevitham", position: 1 },
    { category: "books", textValue: "Randamoozham", position: 2 },
    { category: "books", textValue: "Pathummayude Aadu", position: 3 },
  ],
  actors: [1, 2, 3], // Assuming IDs exist in catalog
  actresses: [1, 2, 3], // Assuming IDs exist in catalog
  interests: [1, 2, 3], // Assuming IDs exist in catalog
  traits: [1, 2, 3], // Assuming IDs exist in catalog
  socialLinks: [
    { platform: "instagram", handle: "@priya_menon_kochi", show_profile: true },
    { platform: "twitter", handle: "@priyamenon99", show_profile: true },
    { platform: "linkedin", handle: "priya-menon-dev", show_profile: false },
  ],
};

// Profile data for secondary dummy account
export const secondaryDummyProfileData = {
  photos: [
    {
      originalUrl:
        "public/profiles/1755538389714-t8rWMBKTLI05L3jgi4_INZOHeF6W.jpg",
      imageType: "avatar",
      position: 1,
    },
    {
      originalUrl:
        "public/profiles/1755537801640-WfytNaUphIXwsDXfuPJaTaxTVzx1.jpg",
      imageType: "photo",
      position: 2,
    },
    {
      originalUrl:
        "public/profiles/1755537459194-DM2vRZL9pZ71DL6_U67O2ibxuAEG.jpg",
      imageType: "photo",
      position: 3,
    },
  ],
  favoritesText: [
    { category: "movies", textValue: "Kumbakonam Gopals", position: 1 },
    { category: "movies", textValue: "Charlie", position: 2 },
    { category: "movies", textValue: "Ustad Hotel", position: 3 },
    { category: "dishes", textValue: "Sadhya", position: 1 },
    { category: "dishes", textValue: "Karimeen Curry", position: 2 },
    { category: "dishes", textValue: "Ela Ada", position: 3 },
    { category: "musicians", textValue: "Gopi Sundar", position: 1 },
    { category: "musicians", textValue: "M. Jayachandran", position: 2 },
    { category: "musicians", textValue: "Ilaiyaraaja", position: 3 },
    { category: "places", textValue: "Kumarakom", position: 1 },
    { category: "places", textValue: "Thekkady", position: 2 },
    { category: "places", textValue: "Kovalam", position: 3 },
    { category: "sports", textValue: "Kalaripayattu", position: 1 },
    { category: "sports", textValue: "Boat Racing", position: 2 },
    { category: "sports", textValue: "Volleyball", position: 3 },
    { category: "books", textValue: "Chemmeen", position: 1 },
    { category: "books", textValue: "Balyakalasakhi", position: 2 },
    { category: "books", textValue: "Naalukettu", position: 3 },
  ],
  actors: [4, 5, 6], // Different actor IDs
  actresses: [4, 5, 6], // Different actress IDs
  interests: [4, 5, 6], // Different interest IDs
  traits: [4, 5, 6], // Different trait IDs
  socialLinks: [
    { platform: "instagram", handle: "@anjali_designs", show_profile: true },
    { platform: "twitter", handle: "@anjalinair96", show_profile: true },
    { platform: "tiktok", handle: "@anjali_dance", show_profile: true },
  ],
};

export const populateDummyProfile = async (
  email: string,
  type: "primary" | "secondary"
) => {
  const dummyAccountDetails =
    type === "primary"
      ? primaryDummyAccountDetails
      : secondaryDummyAccountDetails;
  const dummyAccountPosts =
    type === "primary" ? primaryDummyAccountPosts : secondaryDummyAccountPosts;
  const profileData =
    type === "primary" ? primaryDummyProfileData : secondaryDummyProfileData;

  if (type === "secondary") {
    await deleteDummyAccount("secondary");
    await db.insert(users).values({
      email: SECONDARY_DUMMY_ACCOUNT.email,
    });
  }

  const dummyUsers = await db
    .update(users)
    .set(dummyAccountDetails)
    .where(eq(users.email, email))
    .returning();

  const userId = dummyUsers[0]?.id;
  if (!userId) throw new Error("Failed to create/update dummy user");

  // Create user settings
  await db.insert(userSettings).values({
    userId,
    chatAudience: "anyone",
    pushEnabled: true,
  });

  // Add user photos
  await db.insert(userPhotos).values(
    profileData.photos.map((photo) => ({
      userId,
      ...photo,
    }))
  );

  // Add favorite text entries
  await db.insert(userFavoritesText).values(
    profileData.favoritesText.map((favorite) => ({
      userId,
      category: favorite.category,
      textValue: favorite.textValue,
      position: favorite.position,
      createdAt: new Date(),
    }))
  );

  // Add favorite actors
  await db.insert(userFavoriteActors).values(
    profileData.actors.map((actorId, index) => ({
      userId,
      actorId,
      position: index + 1,
    }))
  );

  // Add favorite actresses
  await db.insert(userFavoriteActresses).values(
    profileData.actresses.map((actressId, index) => ({
      userId,
      actressId,
      position: index + 1,
    }))
  );

  // Add user interests
  await db.insert(userInterests).values(
    profileData.interests.map((interestId, index) => ({
      userId,
      interestId,
      position: index + 1,
    }))
  );

  // Add user traits
  await db.insert(userTraits).values(
    profileData.traits.map((traitId, index) => ({
      userId,
      traitId,
      position: index + 1,
    }))
  );

  // Add social links
  await db.insert(socialLinks).values(
    profileData.socialLinks.map((link) => ({
      userId,
      platform: link.platform,
      handle: link.handle,
      show_profile: link.show_profile,
    }))
  );

  // Create meetups if any
  if (dummyAccountPosts.meetups.length > 0) {
    await db.insert(meetups).values(
      dummyAccountPosts.meetups.map((meetup) => ({
        hostId: userId,
        activityId: 1,
        ...meetup,
      }))
    );
  }

  return dummyUsers[0];
};

export const deleteDummyAccount = async (type: "primary" | "secondary") => {
  const targetEmail =
    type === "primary"
      ? DUMMY_ACCOUNTS[0]?.email
      : SECONDARY_DUMMY_ACCOUNT.email;

  if (!targetEmail) return;

  return await db.transaction(async (tx) => {
    const dummyUser = await tx.query.users.findFirst({
      where: eq(users.email, targetEmail),
    });

    if (!dummyUser) return;

    const userId = dummyUser.id;

    // Find chat room participants first
    const userChatParticipants = await tx.query.chatRoomParticipants.findMany({
      where: eq(chatRoomParticipants.userId, userId),
    });

    const chatRoomIds = userChatParticipants
      .map((participant) => participant.chatRoomId)
      .filter((id): id is string => id != null);

    // Find user's meetups
    const userMeetups = await tx.query.meetups.findMany({
      where: eq(meetups.hostId, userId),
    });

    const meetupIds = userMeetups.map((m) => m.id);

    // Delete chat messages in user's rooms
    if (chatRoomIds.length > 0) {
      await tx
        .delete(chatMessages)
        .where(inArray(chatMessages.chatId, chatRoomIds));
    }

    // Delete chat room participants
    await tx
      .delete(chatRoomParticipants)
      .where(
        or(
          eq(chatRoomParticipants.userId, userId),
          chatRoomIds.length > 0
            ? inArray(chatRoomParticipants.chatRoomId, chatRoomIds)
            : sql`false`
        )
      );

    // Delete chat rooms
    if (chatRoomIds.length > 0) {
      await tx.delete(chatRooms).where(inArray(chatRooms.id, chatRoomIds));
    }

    // Clean up Firebase RTDB
    for (const id of chatRoomIds) {
      const chatroomRef = firebaseRtdb.ref(`chatRooms/${id}`);
      await chatroomRef.remove();
      const unreadCountsRef = firebaseRtdb.ref(
        `users/${dummyUser.id}/unreadCounts/chats/${id}`
      );
      await unreadCountsRef.remove();
    }

    const userRef = firebaseRtdb.ref(`users/${dummyUser.id}`);
    await userRef.remove();

    // Delete chat requests
    await tx
      .delete(chatRequests)
      .where(
        or(
          eq(chatRequests.fromUserId, userId),
          eq(chatRequests.toUserId, userId)
        )
      );

    // Delete meetup requests
    await tx
      .delete(meetupRequests)
      .where(
        or(
          eq(meetupRequests.senderUserId, userId),
          meetupIds.length > 0
            ? inArray(meetupRequests.meetupId, meetupIds)
            : sql`false`
        )
      );

    // Delete meetup attendees
    await tx
      .delete(meetupAttendees)
      .where(
        or(
          eq(meetupAttendees.senderUserId, userId),
          meetupIds.length > 0
            ? inArray(meetupAttendees.meetupId, meetupIds)
            : sql`false`
        )
      );

    // Delete meetups hosted by user
    await tx.delete(meetups).where(eq(meetups.hostId, userId));

    // Delete user relationships
    await tx
      .delete(bookmarks)
      .where(
        or(eq(bookmarks.userId, userId), eq(bookmarks.bookmarkedUserId, userId))
      );

    await tx
      .delete(blockedUser)
      .where(
        or(
          eq(blockedUser.userId, userId),
          eq(blockedUser.blockedUserId, userId)
        )
      );

    // Delete user profile data
    await tx.delete(userPhotos).where(eq(userPhotos.userId, userId));
    await tx.delete(socialLinks).where(eq(socialLinks.userId, userId));
    await tx.delete(userInterests).where(eq(userInterests.userId, userId));
    await tx.delete(userTraits).where(eq(userTraits.userId, userId));
    await tx
      .delete(userFavoriteActors)
      .where(eq(userFavoriteActors.userId, userId));
    await tx
      .delete(userFavoriteActresses)
      .where(eq(userFavoriteActresses.userId, userId));
    await tx
      .delete(userFavoritesText)
      .where(eq(userFavoritesText.userId, userId));
    await tx.delete(userSettings).where(eq(userSettings.userId, userId));
    await tx.delete(userLocation).where(eq(userLocation.userId, userId));
    await tx.delete(devices).where(eq(devices.userId, userId));
    await tx.delete(authIdentities).where(eq(authIdentities.userId, userId));

    // Finally delete the user
    await tx.delete(users).where(eq(users.id, userId));

    return;
  });
};

export const linkToSecondaryDummyAccount = async (primaryEmail: string) => {
  const primaryDummyAccount = await db.query.users.findFirst({
    where: eq(users.email, primaryEmail),
  });
  const secondaryDummyAccount = await db.query.users.findFirst({
    where: eq(users.email, SECONDARY_DUMMY_ACCOUNT.email),
  });

  if (!primaryDummyAccount || !secondaryDummyAccount) return;

  // Create a bookmark relationship
  await db.insert(bookmarks).values({
    userId: primaryDummyAccount.id,
    bookmarkedUserId: secondaryDummyAccount.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Send meetup request to secondary dummy account
  const meetupToJoin = await db.query.meetups.findFirst({
    where: and(
      eq(meetups.hostId, secondaryDummyAccount.id),
      gte(meetups.startsAt, sql`now()`)
    ),
  });

  if (meetupToJoin) {
    // Create chat room for meetup
    const meetupcChatRoom = await db
      .insert(chatRooms)
      .values({
        type: "meetup",
        meetupId: meetupToJoin.id,
      })
      .returning();

    const meetupChatRoomId = meetupcChatRoom[0]?.id;
    if (!meetupChatRoomId) return;

    const [newMeetupRequest] = await db
      .insert(meetupRequests)
      .values({
        meetupId: meetupToJoin.id,
        senderUserId: primaryDummyAccount.id,
        message:
          "Excited to join the Kerala Food Festival Meetup! Looking forward to tasting authentic dishes and meeting everyone.",
        status: "accepted",
        createdAt: subDays(new Date(), 2),
        updatedAt: subDays(new Date(), 1),
      })
      .returning();

    // Add meetup attendee
    await db.insert(meetupAttendees).values({
      meetupId: meetupToJoin.id,
      senderUserId: primaryDummyAccount.id,
      chatRoomId: meetupChatRoomId,
    });

    const meetupParticipants = [
      {
        chatRoomId: meetupChatRoomId,
        userId: primaryDummyAccount.id,
        unreadCount: 0,
        joinedAt: new Date(),
        status: "active",
      },
      {
        chatRoomId: meetupChatRoomId,
        userId: secondaryDummyAccount.id,
        unreadCount: 0,
        joinedAt: new Date(),
        status: "active",
      },
    ];

    // Add both users to chat room
    await db.insert(chatRoomParticipants).values(meetupParticipants);

    // Create chat in RTDB
    const meetupChatroomRef = firebaseRtdb.ref(`chatRooms/${meetupChatRoomId}`);

    for (const participant of meetupParticipants) {
      await meetupChatroomRef
        .child("participants")
        .child(participant.userId)
        .set({
          isAdmin: participant.userId === secondaryDummyAccount.id,
        });
    }

    await meetupChatroomRef.child("messages").push({
      senderUserId: newMeetupRequest?.senderUserId,
      senderName: primaryDummyAccount.name,
      body: newMeetupRequest?.message,
      kind: "text",
      createdAt: new Date().getTime(),
    });
  }

  // Create an accepted chat request
  const chatRoom = await db
    .insert(chatRooms)
    .values({
      type: "DM",
    })
    .returning();

  const chatRoomId = chatRoom[0]?.id;
  if (!chatRoomId) return;

  const [newChatRequest] = await db
    .insert(chatRequests)
    .values({
      fromUserId: primaryDummyAccount.id,
      toUserId: secondaryDummyAccount.id,
      message: "Hey! Fellow Malayali here. Would love to connect!",
      status: "accepted",
      chatRoomId,
      createdAt: subDays(new Date(), 2),
      updatedAt: subDays(new Date(), 1),
    })
    .returning();

  const chatParticipants = [
    {
      chatRoomId,
      userId: primaryDummyAccount.id,
      unreadCount: 0,
      joinedAt: subDays(new Date(), 2),
      status: "active",
    },
    {
      chatRoomId,
      userId: secondaryDummyAccount.id,
      unreadCount: 1,
      joinedAt: subDays(new Date(), 2),
      status: "active",
    },
  ];

  // Add both users to the DM chat room
  await db.insert(chatRoomParticipants).values(chatParticipants);

  // Add initial message
  await db.insert(chatMessages).values({
    chatId: chatRoomId,
    senderUserId: primaryDummyAccount.id,
    kind: "text",
    body: "Hey! Fellow Malayali here. Would love to connect!",
    createdAt: subDays(new Date(), 1),
    updatedAt: subDays(new Date(), 1),
  });

  // Create chat in RTDB
  const chatroomRef = firebaseRtdb.ref(`chatRooms/${chatRoomId}`);

  for (const participant of chatParticipants) {
    await chatroomRef
      .child("participants")
      .child(participant.userId)
      .set({
        isAdmin: participant.userId === secondaryDummyAccount.id,
      });
  }

  await chatroomRef.child("messages").push({
    senderUserId: newChatRequest?.fromUserId,
    senderName: primaryDummyAccount.name,
    body: newChatRequest?.message,
    kind: "text",
    createdAt: new Date().getTime(),
  });
};
