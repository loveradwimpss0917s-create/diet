import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16では "proxy.ts" が新規約だが、常にNode.jsランタイムでコンパイルされ、
// Cloudflare(OpenNextアダプタ)がまだNode.jsランタイムのミドルウェアに対応していないため、
// 旧来の "middleware.ts" 規約（Edgeランタイムでコンパイルされる）を使用する。
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
