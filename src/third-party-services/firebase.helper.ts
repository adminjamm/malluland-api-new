import { Service } from 'typedi';
import dotenv from 'dotenv';
import { initializeApp, cert, getApps, getApp, type App } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Ensure env is loaded for local dev
dotenv.config();

function getOrInitFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_DATABASE_URL } = process.env as Record<string, string | undefined>;

  if (!FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Missing Firebase service account env var: FIREBASE_SERVICE_ACCOUNT');
  }

  // Support either raw JSON or base64-encoded JSON
  let svc: any;
  try {
    const raw = FIREBASE_SERVICE_ACCOUNT.trim();
    const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    svc = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT (must be valid JSON or base64-encoded JSON)');
  }

  const projectId = svc.project_id;
  const clientEmail = svc.client_email;
  const privateKey = (svc.private_key as string | undefined)?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing required fields: project_id, client_email, private_key');
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

export type FirebaseChatRoomPayload = {
  id: string;
  type: 'meetup' | 'DM';
  meetupId?: string | null;
  participants?: string[]; // userIds
  createdAt: number; // ms epoch
  // any additional metadata can be added later
};

export type FirebaseChatMessagePayload = {
  chatId: string;
  senderUserId: string | null; // system messages may be null
  senderName?: string | null;
  kind: 'text' | 'system';
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

  async createChatRoom(payload: FirebaseChatRoomPayload) {
    try {
      console.log('Creating chat room in Firebase:', payload);
      const db = this.getRTDB();
      const ref = db.ref(`/chatRooms/${payload.id}`);
      return await ref.set({
        type: payload.type,
        meetupId: payload.meetupId ?? null,
        participants: payload.participants ?? [],
        createdAt: payload.createdAt,
      });
    } catch (error) {
      console.error('Error creating chat room in Firebase:', error);
      throw new Error('Failed to create chat room in Firebase');
    }
  }

  // Adds a chat message letting Firebase generate the message ID via push().
  // Returns the generated message ID (string).
  async addChatMessage(msg: FirebaseChatMessagePayload): Promise<string> {
    const db = this.getRTDB();
    const listRef = db.ref(`/messages/${msg.chatId}`);
    const newRef = listRef.push();
    await newRef.set({
      senderUserId: msg.senderUserId,
      senderName: msg.senderName ?? null,
      kind: msg.kind,
      body: msg.body,
      createdAt: msg.createdAt,
    });
    if (!newRef.key) {
      throw new Error('Failed to obtain Firebase message ID');
    }
    return newRef.key;
  }
}
