import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

interface ErrorDetail {
  path: string;
  message: string;
}

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  VALIDATION_ERROR: 400,
  INVALID_JSON: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export function apiError(code: ApiErrorCode, message: string, details?: ErrorDetail[]) {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status: STATUS_BY_CODE[code] },
  );
}

export function apiSuccess<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}
