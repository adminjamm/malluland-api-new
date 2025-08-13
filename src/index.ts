import "dotenv/config";
import "reflect-metadata";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { Container } from "typedi";
import { peopleRouter } from "./routes/people";
import { meetupsRouter } from "./routes/meetups";
import { bookmarksRouter } from "./routes/bookmarks";
import { usersRouter } from "./routes/users";
import { actorsRouter } from "./routes/actors";
import { requestsRouter } from "./routes/requests";
import { storageRouter } from "./routes/storage";
// import { createDb } from "./infra/db";
import { env } from "./utils/env";
import { authRouter } from "./routes/auth";
import { db } from "./db";

const app = new Hono();
app.use("*", logger());

// Dependencies
// const db = createDb(env.DATABASE_URL);
Container.set("db", db);

app.get("/health", (c) => c.json({ ok: true }));

app.route("/auth", authRouter);
app.route("/people", peopleRouter);
app.route("/meetups", meetupsRouter);
app.route("/bookmarks", bookmarksRouter);
app.route("/users", usersRouter);
app.route("/actors", actorsRouter);
app.route("/requests", requestsRouter);
app.route("/storage", storageRouter);

const port = env.PORT ?? 8787;
console.log(`Server listening on http://localhost:${port}`);

// Serve OpenAPI spec
app.get("/openapi.yaml", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const p = path.resolve(process.cwd(), "openapi.yaml");
  const yaml = fs.readFileSync(p, "utf-8");
  return new Response(yaml, {
    headers: { "content-type": "text/yaml; charset=utf-8" },
  });
});

// Simple Swagger UI hosted via CDN
app.get("/docs", () => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Malluland API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.10/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.10/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
});

serve({ fetch: app.fetch, port });
