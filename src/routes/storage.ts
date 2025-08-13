import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Container } from "typedi";
import { S3Helper } from "../helpers/s3.helper";
import { createPresignedPostUrl } from "../utils/s3Util";
import { authorize } from "../middleware/auth";

export const storageRouter = new Hono();

const s3 = () => Container.get(S3Helper);

// Generate a pre-signed PUT URL
storageRouter.post(
  "/presign/put",
  zValidator(
    "json",
    z.object({
      key: z.string().optional(),
      contentType: z.string().optional(),
      expiresInSeconds: z
        .number()
        .int()
        .positive()
        .max(7 * 24 * 60 * 60)
        .optional(), // up to 7 days
      acl: z.enum(["private", "public-read"]).optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const result = await s3().presignPut(body);
    return c.json(result);
  }
);

// Generate a pre-signed GET URL
storageRouter.post(
  "/presign/get",
  zValidator(
    "json",
    z.object({
      key: z.string(),
      expiresInSeconds: z
        .number()
        .int()
        .positive()
        .max(7 * 24 * 60 * 60)
        .optional(),
      responseContentType: z.string().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const result = await s3().presignGet(body);
    return c.json(result);
  }
);

storageRouter.put(
  "/presigned-url",
  zValidator(
    "json",
    z.object({
      fileName: z.string().min(0),
      mimeType: z.string().min(0),
    })
  ),
  authorize({
    bypassOnboardingCheck: true,
  }),
  async (c) => {
    const { fileName, mimeType } = c.req.valid("json");

    if (!fileName || !mimeType) {
      return c.json(
        {
          message: "fileName, mimeType and type are required",
        },
        400
      );
    }

    const { signedUrl, fields } = await createPresignedPostUrl({
      filename: fileName,
      contentType: mimeType,
    });

    return c.json(
      {
        message: "Media uploaded successfully",
        data: {
          signedUrl,
          fields,
        },
      },
      200
    );
  }
);
