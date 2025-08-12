import { createMiddleware } from "hono/factory";

interface PaginationVariables {
  Variables: {
    page: number;
    size: number;
  };
}

export const paginate = createMiddleware<PaginationVariables>(
  async (c, next) => {
    const { page, size } = c.req.query();

    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = size ? parseInt(size) : 20;

    c.set("page", pageNumber);
    c.set("size", limitNumber);

    return next();
  },
);
