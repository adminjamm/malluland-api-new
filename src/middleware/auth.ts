import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { users } from "../db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { JwtPayloadSchema, type Profile } from "../types";
import { env } from "../utils/env";

interface OptionalAuthVariables {
  Variables: {
    profile: Profile | null;
  };
}

interface AuthVariables {
  Variables: {
    profile: Profile;
  };
}

const getProfileFromToken = async (
  token: string
): Promise<Profile | undefined> => {
  const jwtToken = token.replace(/^Bearer\s+/, "");
  const decoded = JwtPayloadSchema.parse(jwt.verify(jwtToken, env.JWT_SECRET));

  const profileData = await db.query.users.findFirst({
    where: and(
      eq(users.id, decoded.id),
      // eq(users.userState, "approved"),
      isNull(users.deletedAt)
    ),
  });

  if (!profileData) {
    return undefined;
  }

  return {
    ...profileData,
    isDummyAccount: decoded.isDummyAccount,
  };
};

export const authorizeOptional = () => {
  return createMiddleware<OptionalAuthVariables>(async (c, next) => {
    const idToken = c.req.header("Authorization");

    if (idToken) {
      const profile = await getProfileFromToken(idToken);
      c.set("profile", profile ?? null);

      return next();
    }

    c.set("profile", null);
    return next();
  });
};

export const authorize = ({
  bypassOnboardingCheck = false,
}: {
  bypassOnboardingCheck?: boolean;
} = {}) => {
  return createMiddleware<AuthVariables>(async (c, next) => {
    // Check if auth token exists
    if(bypassOnboardingCheck) {
      return next();
    }
    
    const authToken = c.req.header("Authorization");
    if (!authToken) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    // Validate auth token and get profile
    const profile = await getProfileFromToken(authToken);
    if (!profile) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    if (!bypassOnboardingCheck && !profile.isProfileOnboardingCompleted) {
      return c.json({ message: "Onboarding not completed" }, 401);
    }

    // Set profile and continue
    c.set("profile", profile);
    return next();
  });
};
