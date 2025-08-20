import jwt from "jsonwebtoken";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { firebaseAuth } from "./firebase";
import { decodeBase64IgnorePadding } from "@oslojs/encoding";
import { Google, Apple, generateCodeVerifier, decodeIdToken } from "arctic";
import type { JwtPayload } from "../types";
import { env } from "./env";

const codeVerifier = generateCodeVerifier();

const google = new Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIECT_URL
);

const APPLE_PRIVATE_KEY = decodeBase64IgnorePadding(
  env.APPLE_PRIVATE_KEY.replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim()
);

const apple = new Apple(
  env.APPLE_CLIENT_ID,
  env.APPLE_TEAM_ID,
  env.APPLE_KEY_ID,
  APPLE_PRIVATE_KEY,
  env.APPLE_REDIRECT_URL
);

export const getGoogleAuthUrl = (requestedFrom: string) => {
  const scopes = ["openid", "profile", "email"];
  const state = encodeURIComponent(JSON.stringify({ requestedFrom }));

  return google.createAuthorizationURL(state, codeVerifier, scopes);
};

export const getGoogleAccessToken = async (code: string) => {
  const tokens = await google.validateAuthorizationCode(code, codeVerifier);
  return tokens;
};

export const getGoogleUser = async (accessToken: string) => {
  const response = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  type GoogleUserProfile = {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
  };

  const user = (await response.json()) as GoogleUserProfile;
  return user;
};

export const getAppleAuthUrl = (requestedFrom: string) => {
  const scopes = ["name", "email"];
  const state = encodeURIComponent(JSON.stringify({ requestedFrom }));

  const url = apple.createAuthorizationURL(state, scopes);

  url.searchParams.set("response_mode", "form_post");

  return url;
};

export const getAppleAccessToken = async (code: string) => {
  const tokens = await apple.validateAuthorizationCode(code);
  return tokens;
};

export type DecodedIdToken = {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  at_hash: string;
  email: string;
  email_verified: boolean;
  auth_time: number;
  nonce_supported: boolean;
};

export type AppleScopeUser = {
  email: string;
  name: {
    firstName: string;
    lastName: string;
  };
};

export const decodeAppleIdToken = async (idToken: string) => {
  const decoded = decodeIdToken(idToken);
  return decoded as DecodedIdToken;
};

export async function getAppleProfileName(
  decodedIdToken: DecodedIdToken,
  scopeUser?: AppleScopeUser
) {
  if (scopeUser) {
    return `${scopeUser.name.firstName} ${scopeUser.name.lastName}`;
  }

  const userInDb = await db.query.users.findFirst({
    where: eq(users.email, decodedIdToken.email),
  });

  return userInDb?.name || "";
}

type Users = typeof users.$inferSelect;

export const generateAuthTokens = async (
  user: Users,
  // sessionId: string,
  isDummyAccount = false
) => {
  const firebasetoken = await firebaseAuth.createCustomToken(user.id);
  const jwtPayload: JwtPayload = {
    id: user.id,
    name: user.name!,
    isDummyAccount,
  };
  const jwttoken = jwt.sign(jwtPayload, env.JWT_SECRET, {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  });

  return {
    firebasetoken,
    jwttoken,
  };
};
