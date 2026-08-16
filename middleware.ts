import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

// API routes handle their own auth() checks and return 401 JSON — middleware
// only gates the actual app pages, so a redirect never gets returned to a fetch call.
export const config = {
  matcher: ["/((?!api|login|register|_next/static|_next/image|favicon.ico).*)"],
};
