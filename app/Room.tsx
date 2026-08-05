"use client";

import { LiveMap } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";

import Loader from "@/components/Loader";
import { RoomProvider } from "@/liveblocks.config";

// roomId comes from the server (the editor page already resolved the project
// + session via middleware-guaranteed auth()) — no client-side session-fetch
// race here. Every project gets its own room now (previously every user
// shared one hardcoded room, meaning every brand's canvas was the same
// canvas). initialObjects only matters the very first time this room is ever
// connected to (e.g. a project just created from a template) — Liveblocks
// persists room storage server-side after that, which is what makes an open
// project autosave with no explicit "Save" button.
const Room = ({
  roomId,
  initialObjects,
  children,
}: {
  roomId: string;
  initialObjects?: Array<{ objectId: string } & Record<string, unknown>>;
  children: React.ReactNode;
}) => {
  return (
    <RoomProvider
      id={roomId}
      /**
       * initialPresence is used to initialize the presence of the current
       * user in the room.
       *
       * initialPresence: https://liveblocks.io/docs/api-reference/liveblocks-react#RoomProvider
       */
      initialPresence={{ cursor: null, cursorColor: null, editingText: null }}
      /**
       * initialStorage is used to initialize the storage of the room.
       *
       * initialStorage: https://liveblocks.io/docs/api-reference/liveblocks-react#RoomProvider
       */
      initialStorage={{
        /**
         * We're using a LiveMap to store the canvas objects
         *
         * LiveMap: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap
         */
        canvasObjects: new LiveMap(initialObjects?.map((obj) => [obj.objectId, obj]) as any ?? []),
      }}
    >
      <ClientSideSuspense fallback={<Loader />}>
        {() => children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}

export default Room;