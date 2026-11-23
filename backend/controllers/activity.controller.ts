import type { NextRequest } from "next/server";
import * as activityService from "@/backend/services/activity.service";
import { requireAdmin } from "@/backend/utils/actor";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

/** GET /api/activity?role=&entity=&action=&before=&limit= — admins only. */
export const listActivity = asyncHandler(async (request: NextRequest) => {
  requireAdmin(request);
  const q = request.nextUrl.searchParams;
  const result = await activityService.listActivity({
    role: q.get("role"),
    entity: q.get("entity"),
    action: q.get("action"),
    before: q.get("before"),
    limit: Number(q.get("limit")) || undefined,
  });
  return success(result);
});
