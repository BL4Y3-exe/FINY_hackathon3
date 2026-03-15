import { router } from "@/server/trpc";
import { communityRouter } from "./routers/community";
import { matchRouter } from "./routers/match";
import { helpRouter } from "./routers/help";
import { profileRouter } from "./routers/profile";
import { graphRouter } from "./routers/graph";

export const appRouter = router({
  community: communityRouter,
  match: matchRouter,
  help: helpRouter,
  profile: profileRouter,
  graph: graphRouter,
});

export type AppRouter = typeof appRouter;
