import { projectRouter } from "~/server/api/routers/project";
import { taskRouter } from "~/server/api/routers/task";
import { tagRouter } from "~/server/api/routers/tag";
import { authRouter } from "~/server/api/routers/auth";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { historyRouter } from "~/server/api/routers/history";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  project: projectRouter,
  task: taskRouter,
  tag: tagRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  history: historyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.project.list();
 */
export const createCaller = createCallerFactory(appRouter);
