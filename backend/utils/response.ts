import { NextResponse } from "next/server";

/** Every successful API response has this shape: { success: true, data }. */
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Every failed API response has this shape: { success: false, message }. */
export function failure(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status });
}
