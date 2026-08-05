import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

// API routes handle their own auth() checks and return 401 JSON — middleware
// only gates the actual app pages, so a redirect never gets returned to a fetch call.
export const config = {
  matcher: ["/((?!api|login|register|_next/static|_next/image|favicon.ico).*)"],
};
