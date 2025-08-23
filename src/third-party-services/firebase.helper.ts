import { Service } from "typedi";
import dotenv from "dotenv";
import {
  initializeApp,
  cert,
  getApps,
  getApp,
  type App,
} from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Ensure env is loaded for local dev
dotenv.config();

function getOrInitFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_DATABASE_URL } =
    process.env as Record<string, string | undefined>;

  if (!FIREBASE_SERVICE_ACCOUNT) {
    throw new Error(
      "Missing Firebase service account env var: FIREBASE_SERVICE_ACCOUNT"
    );
  }

  // Support either raw JSON or base64-encoded JSON
  let svc: any;
  try {
    const raw = FIREBASE_SERVICE_ACCOUNT.trim();
    const jsonStr = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    svc = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(
      "Failed to parse FIREBASE_SERVICE_ACCOUNT (must be valid JSON or base64-encoded JSON)"
    );
  }

  const projectId = svc.project_id;
  const clientEmail = svc.client_email;
  const privateKey = (svc.private_key as string | undefined)?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is missing required fields: project_id, client_email, private_key"
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    } as any),
    databaseURL: FIREBASE_DATABASE_URL, // optional but recommended for RTDB
  });
}

export type FirebaseParticipant = {
  userId: string;
  isAdmin?: boolean;
  joinedAt?: number; // ms epoch
  lastReadAt?: number;
};

export type FirebaseChatRoomPayload = {
  id: string;
  type: "meetup" | "DM";
  meetupId?: string | null;
  participants?: FirebaseParticipant[]; // richer participant metadata
  createdAt: number; // ms epoch
  // any additional metadata can be added later
};

export type FirebaseChatMessagePayload = {
  chatId: string;
  senderUserId: string | null; // system messages may be null
  senderName?: string | null;
  kind: "text" | "system";
  body: string;
  createdAt: number; // ms epoch
};

@Service()
export class FirebaseHelper {
  private get app(): App {
    return getOrInitFirebaseApp();
  }

  getRTDB() {
    return getDatabase(this.app);
  }

  async roomExists(chatId: string): Promise<boolean> {
    try {
      const db = this.getRTDB();
      const roomRef = db.ref(`/chatRooms/${chatId}`);
      const snap = await roomRef.get();
      return snap.exists();
    } catch (error) {
      console.error("Error checking Firebase room existence:", error);
      // If there's an error, assume not exists to allow creation on acceptance.
      return false;
    }
  }

  async createChatRoom(payload: FirebaseChatRoomPayload) {
    try {
      console.log("Creating chat room in Firebase:", payload);
      const db = this.getRTDB();
      const roomRef = db.ref(`/chatRooms/${payload.id}`);

      // Base room metadata
      const base = {
        type: payload.type,
        meetupId: payload.meetupId ?? null,
        createdAt: payload.createdAt,
      } as const;

      await roomRef.set(base);

      // Write participants under the room with metadata. If none given, default to empty object
      const participants = payload.participants ?? [];
      if (participants.length > 0) {
        const participantsObj = participants.reduce<
          Record<
            string,
            { isAdmin: boolean; joinedAt: number; lastReadAt: number }
          >
        >((acc, p) => {
          acc[p.userId] = {
            isAdmin: !!p.isAdmin,
            joinedAt: p.joinedAt ?? Date.now(),
            lastReadAt: new Date().getTime() - 1000,
          };
          return acc;
        }, {});
        await roomRef.child("participants").set(participantsObj);
      } else {
        await roomRef.child("participants").set({});
      }

      return true;
    } catch (error) {
      console.error("Error creating chat room in Firebase:", error);
      throw new Error("Failed to create chat room in Firebase");
    }
  }

  // Adds or updates participants under chatRooms/{chatId}/participants without overwriting the entire list.
  async addParticipants(chatId: string, participants: FirebaseParticipant[]) {
    try {
      if (!participants || participants.length === 0) return true;
      const db = this.getRTDB();
      const updates: Record<
        string,
        { isAdmin: boolean; joinedAt: number; lastReadAt: number }
      > = {};
      for (const p of participants) {
        updates[p.userId] = {
          isAdmin: !!p.isAdmin,
          joinedAt: p.joinedAt ?? Date.now(),
          lastReadAt: new Date().getTime() - 1000,
        };
      }
      await db.ref(`/chatRooms/${chatId}/participants`).update(updates);
      return true;
    } catch (error) {
      console.error("Error adding participants in Firebase:", error);
      throw new Error("Failed to add participants in Firebase");
    }
  }

  // Adds a chat message under chatRooms/{chatId}/messages letting Firebase generate the message ID via push().
  // Returns the generated message ID (string).
  async addChatMessage(msg: FirebaseChatMessagePayload): Promise<string> {
    try {
      const db = this.getRTDB();
      const listRef = db.ref(`/chatRooms/${msg.chatId}/messages`);
      const newRef = listRef.push();
      await newRef.set({
        senderUserId: msg.senderUserId,
        senderName: msg.senderName ?? null,
        kind: msg.kind,
        body: msg.body,
        createdAt: msg.createdAt,
      });
      if (!newRef.key) {
        throw new Error("Failed to obtain Firebase message ID");
      }
      return newRef.key;
    } catch (error) {
      console.error("Error adding chat message in Firebase:", error);
      throw new Error("Failed to add chat message in Firebase");
    }
  }

  async removeParticipant(chatId: string, userId: string) {
    try {
      const db = this.getRTDB();
      const participantRef = db.ref(
        `/chatRooms/${chatId}/participants/${userId}`
      );
      await participantRef.remove();
      return true;
    } catch (error) {
      console.error("Error removing participant from Firebase:", error);
      throw new Error("Failed to remove participant from Firebase");
    }
  }
}
