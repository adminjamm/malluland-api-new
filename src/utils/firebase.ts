import { env } from "./env";
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    clientEmail: env.FIREBASE_SERVICE_ACCOUNT.client_email,
    privateKey: env.FIREBASE_SERVICE_ACCOUNT.private_key.replace(/\\n/g, "\n"),
    projectId: env.FIREBASE_SERVICE_ACCOUNT.project_id,
  }),
  databaseURL: env.FIREBASE_DATABASE_URL,
});

export const firebaseRtdb = admin.database();
export const firebaseAuth = admin.auth();
export const firebaseNotifications = admin.messaging();
