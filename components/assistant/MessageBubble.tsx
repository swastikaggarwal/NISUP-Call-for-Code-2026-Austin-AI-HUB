"use client";

import type { ChatMessage } from "@/lib/types";

// Chat bubbles ported from Stitch "nisup_typing_mode": NISUP replies in soft
// teal (#E1F5EE) on the left, the user in surface-container on the right.
export function MessageBubble({
  message,
  time = "Just now",
}: {
  message: ChatMessage;
  time?: string;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="message-entrance flex flex-col items-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-[#eeeeeb] p-4 text-on-surface">
          <p className="font-body-md text-body-md">{message.content}</p>
        </div>
        <span className="mr-1 mt-1 text-[10px] text-outline-variant">
          You • {time}
        </span>
      </div>
    );
  }

  return (
    <div className="message-entrance flex flex-col items-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-[#E1F5EE] p-4 text-on-surface shadow-sm">
        <p className="font-body-md text-body-md leading-relaxed">
          {message.content}
        </p>
      </div>
      <span className="ml-1 mt-1 text-[10px] text-outline-variant">
        NISUP • {time}
      </span>
    </div>
  );
}
