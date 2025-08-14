import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Container } from "typedi";
import { ActorsService, ActressesService } from "../services/actors.service";
import { paginate } from "../middleware/paginate";

export const actorsRouter = new Hono();

actorsRouter.get("/", paginate, async (c) => {
  const page = c.get("page");
  const size = c.get("size");
  const svc = Container.get(ActorsService);
  const data = await svc.getActors(Number(page), size);
  const countResult = await svc.count();
  return c.json({
    data,
    metadata: {
      count: Number(countResult[0].count),
      page,
      size,
    },
  });
});

actorsRouter.get("/female", paginate, async (c) => {
  const page = c.get("page");
  const size = c.get("size");
  const svc = Container.get(ActressesService);
  const data = await svc.getActresses(Number(page), size);
  const countResult = await svc.count();
  return c.json({
    data,
    metadata: {
      count: Number(countResult[0].count),
      page,
      size,
    },
  });
});
