import type { NextRequest } from "next/server";
import { ApiError } from "@/backend/utils/ApiError";
import { failure } from "@/backend/utils/response";

type RouteHandler<Context> = (
  request: NextRequest,
  context: Context
) => Promise<Response>;

/**
 * Wraps a controller so every route handler gets the same error handling:
 * - ApiError -> its own status code and message
 * - Mongoose validation/cast errors -> 400 with the message
 * - anything else -> 500, logged server-side, generic message to the client
 */
export function asyncHandler<Context = unknown>(
  handler: RouteHandler<Context>
): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return failure(err.message, err.statusCode);
      }

      if (err instanceof Error && (err.name === "ValidationError" || err.name === "CastError")) {
        return failure(err.message, 400);
      }

      console.error(err);
      return failure("Something went wrong on the server", 500);
    }
  };
}
