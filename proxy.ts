import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon-.*).*)",
    "/((?!api|_next/static|_next/image|manifest.webmanifest|sw.js|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
