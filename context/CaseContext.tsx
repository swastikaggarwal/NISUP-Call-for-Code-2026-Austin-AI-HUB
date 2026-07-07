"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ChatMessage, Evidence } from "@/lib/types";
import { randomId } from "@/lib/utils";

// Holds the live conversation + attached evidence in React state ONLY.
// Nothing here is persisted to localStorage — Quick Exit wipes it instantly.
interface CaseContextValue {
  messages: ChatMessage[];
  attachments: Evidence[];
  addMessage: (m: ChatMessage) => void;
  addAttachment: (e: Omit<Evidence, "id" | "addedAt">) => void;
  reset: () => void;
}

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<Evidence[]>([]);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => [...prev, m]);
  }, []);

  const addAttachment = useCallback(
    (e: Omit<Evidence, "id" | "addedAt">) => {
      setAttachments((prev) => [
        ...prev,
        { ...e, id: randomId("ev"), addedAt: new Date().toISOString() },
      ]);
    },
    []
  );

  // Called by Quick Exit and by "Start over" — clears everything.
  const reset = useCallback(() => {
    setMessages([]);
    setAttachments([]);
  }, []);

  const value = useMemo(
    () => ({ messages, attachments, addMessage, addAttachment, reset }),
    [messages, attachments, addMessage, addAttachment, reset]
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase must be used within CaseProvider");
  return ctx;
}
