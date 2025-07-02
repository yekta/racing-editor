import { renderRouter } from "@/server/trpc/api/render/router";
import { uploadRouter } from "@/server/trpc/api/upload/router";
import { createTRPCRouter } from "@/server/trpc/setup/trpc";
import { TRPCClient, TRPCClientErrorLike } from "@trpc/client";
import { inferReactQueryProcedureOptions } from "@trpc/react-query";
import {
  UseTRPCQueryResult,
  UseTRPCSuspenseQueryResult,
} from "@trpc/react-query/shared";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  upload: uploadRouter,
  render: renderRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type AppRouterReactQueryOptions =
  inferReactQueryProcedureOptions<AppRouter>;
export type AppRouterQueryClient = TRPCClient<AppRouter>;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;

export type AppRouterQueryResult<Output> = UseTRPCQueryResult<
  Output,
  TRPCClientErrorLike<AppRouter>
>;

export type AppRouterSuspenseQueryResult<Output> = UseTRPCSuspenseQueryResult<
  Output,
  TRPCClientErrorLike<AppRouter>
>;
