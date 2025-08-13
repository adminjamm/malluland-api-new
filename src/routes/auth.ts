import { Hono, type Context } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
// import { UAParser } from "ua-parser-js";
import {
  generateAuthTokens,
  getGoogleAccessToken,
  getGoogleAuthUrl,
  getGoogleUser,
  //   getAppleAuthUrl,
  //   getAppleAccessToken,
  //   decodeAppleIdToken,
  //   type AppleScopeUser,
  //   getAppleProfileName,
} from "../utils/auth";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { authIdentities, users } from "../db/schema";
// import { firebaseRtdb } from "@/api/utils/firebase";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
// import { lookupIp, type IpInfoResponse } from "../utils/ip";
import type { ConnInfo } from "hono/conninfo";
// import {
//   deleteDummyAccount,
//   DUMMY_ACCOUNT_EMAILS,
//   DUMMY_ACCOUNTS,
//   linkToSecondaryDummyAccount,
//   populateDummyProfile,
//   SECONDARY_DUMMY_ACCOUNT,
// } from "../utils/dummyAccount";
import { env } from "../utils/env";

const authRouter = new Hono();

const authCallbackSchema = z.object({
  code: z.string(),
});

authRouter.get(
  "/google/url",

  async (c) => {
    const url = getGoogleAuthUrl("mobile");

    return c.json({ data: url.toString() });
  }
);

authRouter.get(
  "/google/callback",
  zValidator("query", authCallbackSchema),
  async (c) => {
    const { code } = c.req.valid("query");
    const tokens = await getGoogleAccessToken(code);
    const user = await getGoogleUser(tokens?.accessToken());
    console.log("user", user);
    return handleOAuthCallback({
      context: c,
      user,
      provider: "google",
    });
  }
);

// authRouter.get(
//   "/apple/url",
//   zValidator("query", getUrlQuerySchema),
//   async (c) => {
//     const { requestedFrom } = c.req.valid("query");
//     const url = getAppleAuthUrl(requestedFrom);

//     return c.json({ data: url.toString() });
//   }
// );

// authRouter.post(
//   "/apple/callback",
//   zValidator(
//     "form",
//     authCallbackSchema.extend({
//       user: z
//         .string()
//         .transform((str) => {
//           try {
//             return JSON.parse(str) as AppleScopeUser;
//           } catch {
//             throw new Error("Invalid user data format");
//           }
//         })
//         .optional(),
//     })
//   ),
//   async (c) => {
//     const { state, code, user: scopeUser } = c.req.valid("form");

//     const tokens = await getAppleAccessToken(code);
//     const decodedIdToken = await decodeAppleIdToken(tokens?.idToken());
//     const name = await getAppleProfileName(decodedIdToken, scopeUser);

//     const oauthUser: OAuthUser = {
//       email: decodedIdToken.email,
//       sub: decodedIdToken.sub,
//       name,
//     };

//     console.log({ oauthUser, name, decodedIdToken, scopeUser });

//     return handleOAuthCallback({
//       context: c,
//       user: oauthUser,
//       provider: "apple",
//       state,
//     });
//   }
// );

type OAuthUser = {
  email?: string;
  sub: string;
  name?: string;
};

async function handleOAuthCallback({
  context,
  user,
  provider,
}: {
  context: Context;
  user: OAuthUser;
  provider: "google" | "apple";
}) {
  if (!user.email) {
    throw new Error("Email is required for authentication");
  }

  //   const userAgent = UAParser(context.req.header("User-Agent"));
  const userEmail = user.email;

  let new_account = "false";
  let isDummyAccount = false;
  let isDummyProfileOnboardingComplete = false;
  //   const isDummyAccountFlow = DUMMY_ACCOUNT_EMAILS.includes(user.email);

  //   if (isDummyAccountFlow) {
  //     await deleteDummyAccount("primary");
  //     await populateDummyProfile(SECONDARY_DUMMY_ACCOUNT.email, "secondary");

  //     isDummyAccount = true;
  //   }

  let userInDb = await db.query.users.findFirst({
    where: eq(users.email, userEmail),
  });

  if (!userInDb) {
    userInDb = await db.transaction(async (tx) => {
      const newName = isDummyAccount ? "" : user.name;

      const newUser = await tx
        .insert(users)
        .values({
          name: newName,
          email: userEmail,
        })
        .returning();

      if (!newUser[0]) {
        throw new Error("Failed to create user");
      }

      await tx.insert(authIdentities).values({
        userId: newUser[0].id,
        provider,
        providerUserId: user.sub,
      });

      new_account = "true";

      return newUser[0];
    });

    // const usersRef = firebaseRtdb.ref(`users/${userInDb.id}`);
    // await usersRef.set({
    //   name: userInDb.name,
    //   username: userInDb.username,
    //   unreadCounts: {
    //     chats: {},
    //     notifications: 0,
    //     requests: 0,
    //     follows: 0,
    //   },
    // });
  }

  // linking of the primary and secondary dummy account needs
  // to be called after creating the new user
  //   if (isDummyAccountFlow) {
  //     const dummyAccountItem = DUMMY_ACCOUNTS.find(
  //       (account) => account.email === user.email
  //     );

  //     if (dummyAccountItem?.populateAccount) {
  //       await populateDummyProfile(user.email, "primary");
  //       await linkToSecondaryDummyAccount(user.email);
  //       isDummyProfileOnboardingComplete = true;
  //     }
  //   }
  //   let ipInfo: IpInfoResponse | null = null;
  let connInfo: ConnInfo | null = null;

  try {
    connInfo = getConnInfo(context);
    console.log("connInfo", connInfo);

    const ip = context.req.header("X-Forwarded-For");
    console.log("ip", ip);

    // if (ip) {
    //   ipInfo = await lookupIp(ip);
    //   console.log("ipInfo", ipInfo);
    // } else if (connInfo?.remote?.address) {
    //   ipInfo = await lookupIp(connInfo.remote.address);
    //   console.log("ipInfo", ipInfo);
    // }
  } catch (error) {
    console.log("Error while looking up IP address", error);
  }

  //   const newSession = await db
  //     .insert(activeSession)
  //     .values({
  //       profileId: userInDb.id,
  //       ipAddress: ipInfo?.ip ?? connInfo?.remote?.address,
  //       latitude: ipInfo?.latitude?.toString(),
  //       longitude: ipInfo?.longitude?.toString(),
  //       city: ipInfo?.city,
  //       country: ipInfo?.country_name,
  //       deviceType: `${userAgent?.device?.type ?? ""} ${
  //         userAgent?.device?.vendor ?? ""
  //       } ${userAgent?.device?.model ?? ""}`,
  //       osVersion: userAgent?.os?.version,
  //       asn: ipInfo?.connection?.asn,
  //     })
  //     .returning();

  const { jwttoken } = await generateAuthTokens(
    userInDb!
    // newSession[0].id
  );

  const callbackUrl = env.AUTH_CALLBACK_URL;

  const url = new URL(callbackUrl);
  url.searchParams.set("token", jwttoken);
  //   url.searchParams.set("firebasetoken", firebasetoken);
  url.searchParams.set("new_account", String(new_account));

  //   if (isDummyProfileOnboardingComplete) {
  //     url.searchParams.set(
  //       "is_onboarding_complete",
  //       String(isDummyProfileOnboardingComplete)
  //     );
  //   }

  return context.redirect(url.toString());
}

export { authRouter };
