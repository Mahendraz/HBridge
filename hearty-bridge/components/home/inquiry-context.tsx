"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { SERVICES, type ServiceId } from "@/lib/content/landing";

// H1 state lives at the page root so any section can open the inquiry panel
// with a topic already filled in. `serviceFocus` is the service selected in
// the services explorer, so the sticky CTA over #services can ask about it.
export type InquiryTopic =
  | { kind: "general" }
  | { kind: "service"; serviceId: ServiceId }
  | { kind: "partnership" };

interface InquiryContextValue {
  isOpen: boolean;
  topic: InquiryTopic;
  open: (topic?: InquiryTopic) => void;
  close: () => void;
  serviceFocus: ServiceId;
  setServiceFocus: (id: ServiceId) => void;
}

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState<InquiryTopic>({ kind: "general" });
  const [serviceFocus, setServiceFocus] = useState<ServiceId>(SERVICES[0].id);

  const open = useCallback((next: InquiryTopic = { kind: "general" }) => {
    setTopic(next);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, topic, open, close, serviceFocus, setServiceFocus }),
    [isOpen, topic, open, close, serviceFocus]
  );

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

export function useInquiry(): InquiryContextValue {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error("useInquiry must be used inside <InquiryProvider>");
  return ctx;
}
