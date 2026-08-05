import dynamic from "next/dynamic";

import { auth } from "@/lib/auth";
import Room from "./Room";

/**
 * disable ssr to avoid pre-rendering issues of Next.js
 *
 * we're doing this because we're using a canvas element that can't be pre-rendered by Next.js on the server
 */
const App = dynamic(() => import("./App"), { ssr: false });

export default async function HomePage() {
  // middleware.ts already guarantees a session exists for this route, so this
  // is just reading it — no client-side session-fetch race like useSession() had.
  const session = await auth();

  return (
    <Room roomId={`user-room-${session!.user.id}`}>
      <App />
    </Room>
  );
}
