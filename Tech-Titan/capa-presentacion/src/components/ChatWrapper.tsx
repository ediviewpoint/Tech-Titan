"use client";

import { useState } from "react";
import { AIChatAssistant } from "./AIChatAssistant";

// Wrapper cliente que mantiene el estado open/closed del chat
// sin contaminar el Server Component del layout
export function ChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  return <AIChatAssistant isOpen={isOpen} onToggle={() => setIsOpen((o) => !o)} />;
}
