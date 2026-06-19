'use client';

import { useState, useEffect } from 'react';

const DRAFT_KEY = 'hearty-bridge:report-draft';

export interface ReportDraftData {
  title: string;
  description: string;
  content: string;
  type?: string;
  status: string;
  childId: string;
  childName: string;
  dueDate: string;
  tags?: string;
  /** Present when editing an existing report; undefined when creating new */
  editingId?: string;
  /** ISO timestamp of when the draft was last saved */
  savedAt: string;
}

export function useReportDraft() {
  const [draft, setDraft] = useState<ReportDraftData | null>(null);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ReportDraftData;
        setDraft(parsed);
      }
    } catch {
      // Corrupt data – ignore
    }
  }, []);

  const save = (data: ReportDraftData) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setDraft(data);
    } catch {
      // Storage full or unavailable – ignore
    }
  };

  const clear = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setDraft(null);
    } catch {
      // ignore
    }
  };

  return {
    draft,
    hasDraft: draft !== null,
    save,
    clear,
  };
}
