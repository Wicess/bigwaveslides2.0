"use client";

import { useEffect } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import {
  ProfileFrame,
  useProfileBack,
} from "@/components/account/profile-frame";
import { closeChat } from "@/lib/chat/chat-ui";

/** The chat, full screen inside the profile (as on MIMOSALSD). */
export function AccountChat() {
  const back = useProfileBack();

  // One conversation on screen at a time: the floating chat closes while this is open.
  useEffect(() => {
    closeChat();
  }, []);

  return (
    <ProfileFrame current="chat">
      <ChatPanel open variant="page" onClose={back} />
    </ProfileFrame>
  );
}
