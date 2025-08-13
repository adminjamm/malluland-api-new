import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Container } from "typedi";
import { UsersService } from "../services/users.service";
import { authorize } from "../middleware/auth";
import { db } from "../db";
import { userFavoritesText, userSelfie } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export const usersRouter = new Hono();

const svc = () => Container.get(UsersService);

// User profile
usersRouter.get(
  "/me",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;

    const [
      [user],
      photos,
      selfies,
      interests,
      traits,
      favoriteActors,
      favoriteActresses,
      favoritesText,
      links,
    ] = await Promise.all([
      svc().getUser(userId),
      await svc().listPhotos(userId),
      svc().listSelfies(userId).orderBy(desc(userSelfie.createdAt)).limit(1),
      svc().listInterests(userId),
      svc().listTraits(userId),
      svc().listFavoriteActors(userId),
      svc().listFavoriteActresses(userId),
      db
        .select({
          id: userFavoritesText.id,
          category: userFavoritesText.category,
          text: userFavoritesText.textValue,
          position: userFavoritesText.position,
        })
        .from(userFavoritesText)
        .where(eq(userFavoritesText.userId, userId)),
      svc().listSocialLinks(userId),
    ]);

    const avatar =
      photos
        .filter((p) => p.imageType === "avatar" && p.isActive === true)
        .sort((a, b) =>
          b.createdAt && a.createdAt
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : 0
        )[0] || [];

    const profilePhotos = photos.filter(
      (p) => p.imageType !== "avatar" && p.isActive === true
    );

    const favoritesGrouped = favoritesText
      .filter((item) => item.category !== null)
      .reduce((acc, item) => {
        const category = item.category!;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      }, {} as Record<string, typeof favoritesText>);

    if (!user) return c.json({ error: "Not found" }, 404);

    const profileData = {
      ...user,
      photos: profilePhotos,
      avatar,
      selfies,
      interests,
      traits,
      favoriteActors,
      favoriteActresses,
      favoritesGrouped,
      socialLinks: links,
    };
    return c.json({
      data: profileData,
    });
  }
);

// Users
usersRouter.get(
  "/:id",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const id = c.req.param("id");
    const [row] = await svc().getUser(id);
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  }
);

usersRouter.put(
  "/profile",
  authorize({ bypassOnboardingCheck: true }),
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      gender: z.string().optional(),
      dob: z.coerce
        .date()
        .optional()
        .refine(
          (date) => {
            if (!date) return true;
            const today = new Date();
            const birthDate = new Date(date);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
              age--;
            }
            return age >= 18;
          },
          { message: "You must be at least 18 years old" }
        )
        .transform((date) => date?.toDateString()),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      company: z.string().max(50).optional(),
      position: z.string().max(50).optional(),
      bio: z.string().max(150).optional(),
      avatar: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("profile").id;
    const body = c.req.valid("json");
    const user = await svc().updateUser(userId, body);
    return c.json({
      data: user,
    });
  }
);

// Photos
usersRouter.post(
  "/photos",
  authorize({ bypassOnboardingCheck: true }),
  zValidator(
    "json",
    z.object({
      originalUrl: z.string(),
      imageType: z.string(),
      position: z.number().int().nonnegative(),
    })
  ),
  async (c) => {
    const userId = c.get("profile").id;
    const data = c.req.valid("json");
    console.log(data);
    const row = await svc().addPhoto(userId, data);
    return c.json({
      data: row,
    });
  }
);
usersRouter.get(
  "/photos",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;
    const rows = await svc().listPhotos(userId);
    return c.json({ data: rows });
  }
);

// Selfies
usersRouter.post(
  "/selfies",
  authorize({ bypassOnboardingCheck: true }),
  zValidator(
    "json",
    z.object({ selfieUrl: z.string().url(), status: z.string().optional() })
  ),
  async (c) => {
    const userId = c.get("profile").id;
    const { selfieUrl } = c.req.valid("json");
    const row = await svc().addSelfie(userId, selfieUrl);
    return c.json({ data: row });
  }
);
usersRouter.get(
  "/selfies",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;
    const rows = await svc().listSelfies(userId);
    return c.json({ data: rows });
  }
);

// Interests
usersRouter.post(
  "/interests",
  authorize({ bypassOnboardingCheck: true }),
  zValidator(
    "json",
    z.object({ interestIds: z.array(z.number().int()).min(1) })
  ),
  async (c) => {
    const userId = c.get("profile").id;
    const { interestIds } = c.req.valid("json");
    await svc().replaceInterests(userId, interestIds);
    const rows = await svc().listInterests(userId);
    return c.json({ data: rows });
  }
);
usersRouter.get(
  "/interests",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;
    const rows = await svc().listInterests(userId);
    return c.json({ data: rows });
  }
);

// Traits
usersRouter.post(
  "/traits",
  authorize({ bypassOnboardingCheck: true }),
  zValidator("json", z.object({ traitIds: z.array(z.number().int()).min(1) })),
  async (c) => {
    const userId = c.get("profile").id;
    const { traitIds } = c.req.valid("json");
    await svc().replaceTraits(userId, traitIds);
    const rows = await svc().listTraits(userId);
    return c.json({ data: rows });
  }
);
usersRouter.get(
  "/traits",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;
    const rows = await svc().listTraits(userId);
    return c.json({ data: rows });
  }
);

// Favorite actors
usersRouter.post(
  "/favorite-actors",
  authorize({ bypassOnboardingCheck: true }),
  zValidator("json", z.object({ actorIds: z.array(z.number().int()).min(1) })),
  async (c) => {
    const userId = c.get("profile").id;
    const { actorIds } = c.req.valid("json");
    await svc().replaceFavoriteActors(userId, actorIds);
    const rows = await svc().listFavoriteActors(userId);
    return c.json({ data: rows });
  }
);
usersRouter.get(
  "/favorite-actors",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;
    const rows = await svc().listFavoriteActors(userId);
    return c.json({ data: rows });
  }
);

// Favorite actresses
usersRouter.post(
  "/favorite-actresses",
  authorize({ bypassOnboardingCheck: true }),
  zValidator(
    "json",
    z.object({ actressIds: z.array(z.number().int()).min(1) })
  ),
  async (c) => {
    const userId = c.get("profile").id;
    const { actressIds } = c.req.valid("json");
    await svc().replaceFavoriteActresses(userId, actressIds);
    const rows = await svc().listFavoriteActresses(userId);
    return c.json({ data: rows });
  }
);
usersRouter.get(
  "/favorite-actresses",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;
    const rows = await svc().listFavoriteActresses(userId);
    return c.json({ data: rows });
  }
);

// Social links
usersRouter.post(
  "/social-links",
  authorize({ bypassOnboardingCheck: true }),
  zValidator(
    "json",
    z.object({
      links: z.array(
        z.object({
          platform: z.string(),
          handle: z.string(),
          show_profile: z.boolean(),
        })
      ),
    })
  ),
  async (c) => {
    const userId = c.get("profile").id;
    const { links } = c.req.valid("json");
    await svc().replaceSocialLinks(userId, links);
    const rows = await svc().listSocialLinks(userId);
    return c.json({ data: rows });
  }
);
usersRouter.get(
  "/social-links",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;
    const rows = await svc().listSocialLinks(userId);
    return c.json({ data: rows });
  }
);

const userFavoritesTextSchema = z.object({
  category: z.string(),
  values: z.array(z.string().max(150)).min(1),
});

usersRouter.post(
  "/user-favorites",
  authorize({ bypassOnboardingCheck: true }),
  zValidator("json", userFavoritesTextSchema),
  async (c) => {
    const userId = c.get("profile").id;
    const { category, values } = c.req.valid("json");

    const rows = await svc().replaceUserFavoritesText(userId, category, values);
    return c.json({ data: rows });
  }
);

usersRouter.get(
  "/user-favorites",
  authorize({ bypassOnboardingCheck: true }),
  async (c) => {
    const userId = c.get("profile").id;
    const category = c.req.query("category");

    const rows = await svc().listUserFavorites(userId, category);
    return c.json({ data: rows });
  }
);
