"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  BabyIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  HandshakeIcon,
  InfoIcon,
  LockIcon,
  MailIcon,
  MessageCircleHeartIcon,
  XIcon,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useInquiry } from "@/components/home/inquiry-context";
import { cn } from "@/lib/utils";
import {
  COLLABORATION,
  COMPANY,
  CONTACT,
  CONTACT_COPY,
  HERO,
  SERVICES,
  serviceInquiryName,
  whatsappText,
  whatsappUrl,
  type ServiceId,
} from "@/lib/content/landing";

// H1 inquiry panel + B4 input lock. Always mounted; `useInquiry().isOpen`
// slides it in (right drawer on md+, bottom sheet on mobile). There is no
// backend: submitting only composes a message and hands it to WhatsApp or
// the visitor's email app, and the copy says so honestly.

/** id of the dialog element, for `aria-controls` on buttons that open it. */
export const INQUIRY_PANEL_ID = "inquiry-panel";

type Mode = "konsultasi" | "kerjasama";

const UNSURE_SERVICE = "belum-tahu";
const UNSURE_SERVICE_LABEL = "Belum tahu, ingin konsultasi dulu";
type ServiceChoice = ServiceId | typeof UNSURE_SERVICE;

const PLACES = [
  { id: "center", label: "Datang ke center" },
  { id: "homecare", label: "Homecare" },
  { id: "belum-tahu", label: "Belum tahu" },
] as const;
type Place = (typeof PLACES)[number]["id"] | "";

const HOMECARE_NOTE = SERVICES.find((s) => s.id === "homecare")?.description ?? "";

interface ConsultValues {
  parentName: string;
  childName: string;
  childAge: string;
  service: ServiceChoice;
  place: Place;
  story: string;
}

interface PartnerValues {
  name: string;
  org: string;
  form: string;
  message: string;
}

type ConsultErrors = Partial<Record<"parentName" | "childAge", string>>;
type PartnerErrors = Partial<Record<"name" | "org", string>>;

type Status = { channel: "whatsapp" | "email"; url: string } | null;

const EMPTY_CONSULT: ConsultValues = {
  parentName: "",
  childName: "",
  childAge: "",
  service: UNSURE_SERVICE,
  place: "",
  story: "",
};

const EMPTY_PARTNER: PartnerValues = { name: "", org: "", form: "", message: "" };

const MODES: { id: Mode; label: string; icon: typeof BabyIcon }[] = [
  { id: "konsultasi", label: "Konsultasi anak", icon: BabyIcon },
  { id: "kerjasama", label: "Kerja sama", icon: HandshakeIcon },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

const CONTROL =
  "block w-full min-h-11 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-xs placeholder:text-gray-500 transition-colors hover:border-gray-400 aria-[invalid=true]:border-brand-coral aria-[invalid=true]:bg-brand-coral-tint/40 " +
  FOCUS_RING;

// ── Validation & message building ─────────────────────────────────────────

function validateConsult(v: ConsultValues): ConsultErrors {
  const errors: ConsultErrors = {};
  if (!v.parentName.trim()) errors.parentName = "Mohon isi nama orang tua.";
  if (!v.childAge.trim()) errors.childAge = "Mohon isi usia anak, mis. 2 tahun 4 bulan.";
  return errors;
}

function validatePartner(v: PartnerValues): PartnerErrors {
  const errors: PartnerErrors = {};
  if (!v.name.trim()) errors.name = "Mohon isi nama Anda.";
  if (!v.org.trim()) errors.org = "Mohon isi nama instansi atau komunitas.";
  return errors;
}

function findService(choice: ServiceChoice) {
  if (choice === UNSURE_SERVICE) return null;
  return SERVICES.find((s) => s.id === choice) ?? null;
}

function joinLines(lines: (string | null)[], block?: { label: string; text: string }): string {
  const out = lines.filter((l): l is string => l !== null);
  if (block && block.text.trim()) out.push("", `${block.label}:`, block.text.trim());
  out.push("", `(Disusun lewat formulir di ${COMPANY.domain})`);
  return out.join("\n");
}

function buildConsultMessage(v: ConsultValues): { text: string; subject: string } {
  const found = findService(v.service);
  // Full name for the "Layanan yang diminati" line; `inquiry` reads well
  // after "layanan" in a sentence ("layanan homecare", not "layanan Layanan Homecare").
  const service = found?.name ?? null;
  const inquiry = found ? serviceInquiryName(found) : null;
  const place = PLACES.find((p) => p.id === v.place)?.label ?? null;
  const parent = v.parentName.trim();
  const child = v.childName.trim();

  const text = joinLines(
    [
      whatsappText(inquiry ? { kind: "service", serviceName: inquiry } : { kind: "general" }),
      "",
      `Nama orang tua: ${parent}`,
      child ? `Nama panggilan anak: ${child}` : null,
      `Usia anak: ${v.childAge.trim()}`,
      `Layanan yang diminati: ${service ?? UNSURE_SERVICE_LABEL}`,
      place ? `Preferensi tempat: ${place}` : null,
    ],
    { label: "Cerita singkat", text: v.story }
  );

  const subject = `${inquiry ? `Pertanyaan layanan ${inquiry}` : "Konsultasi tumbuh kembang anak"} – ${parent}`;
  return { text, subject };
}

function buildPartnerMessage(v: PartnerValues): { text: string; subject: string } {
  const org = v.org.trim();
  const text = joinLines(
    [
      whatsappText({ kind: "partnership" }),
      "",
      `Nama: ${v.name.trim()}`,
      `Instansi / komunitas: ${org}`,
      v.form ? `Bentuk kerja sama: ${v.form}` : null,
    ],
    { label: "Pesan", text: v.message }
  );
  return { text, subject: `Pengajuan kerja sama – ${org}` };
}

function mailtoUrl(subject: string, text: string): string {
  // RFC 6068: line breaks in a mailto body are CRLF.
  const body = text.replace(/\n/g, "\r\n");
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ── Small field primitives ────────────────────────────────────────────────

function FieldLabel({ htmlFor, optional, children }: { htmlFor: string; optional?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-800">
      {children}
      {optional && <span className="ml-1 font-normal text-gray-500">(opsional)</span>}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-brand-coral">
      <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDownIcon
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-500"
        aria-hidden="true"
      />
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────

export function InquiryPanel() {
  const { isOpen, topic, close } = useInquiry();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const titleId = id("title");
  const descId = id("desc");

  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const [mode, setMode] = useState<Mode>("konsultasi");
  const [consult, setConsult] = useState<ConsultValues>(EMPTY_CONSULT);
  const [partner, setPartner] = useState<PartnerValues>(EMPTY_PARTNER);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  // What a service CTA filled in (not the visitor). A later general open
  // clears these again unless the visitor changed them in the meantime.
  const [preselect, setPreselect] = useState<{ service: ServiceChoice | null; place: Place | null } | null>(null);

  // Sync mode + preselected service from the topic each time the panel opens
  // (adjust-state-during-render, so the first paint is already correct).
  // Typed values survive a close/reopen so a parent does not lose a draft.
  const [syncedOpen, setSyncedOpen] = useState(isOpen);
  if (isOpen !== syncedOpen) {
    setSyncedOpen(isOpen);
    if (isOpen) {
      setMode(topic.kind === "partnership" ? "kerjasama" : "konsultasi");
      let next = consult;
      if (preselect) {
        next = {
          ...next,
          service: preselect.service !== null && next.service === preselect.service ? UNSURE_SERVICE : next.service,
          place: preselect.place !== null && next.place === preselect.place ? "" : next.place,
        };
      }
      if (topic.kind === "service") {
        const serviceId = topic.serviceId;
        const autoPlace: Place | null = serviceId === "homecare" && !next.place ? "homecare" : null;
        next = { ...next, service: serviceId, place: autoPlace ?? next.place };
        setPreselect({ service: serviceId, place: autoPlace });
      } else if (preselect) {
        setPreselect(null);
      }
      if (next !== consult) setConsult(next);
      setSubmitted(false);
      setStatus(null);
    }
  }

  const consultErrors = submitted && mode === "konsultasi" ? validateConsult(consult) : {};
  const partnerErrors = submitted && mode === "kerjasama" ? validatePartner(partner) : {};

  // B4: lock page scroll while open; compensate for the scrollbar so the
  // page behind does not shift sideways. Restores the previous inline values.
  // Only <html> gets overflow: hidden (it propagates to the viewport). Setting
  // it on <body> too would turn body into its own scroll container and
  // un-stick the sticky header and journey stage while the panel is open.
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollbar = window.innerWidth - html.clientWidth;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };
    const basePadding = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    html.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${basePadding + scrollbar}px`;
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.paddingRight = prev.bodyPaddingRight;
    };
  }, [isOpen]);

  // Remember the last control the visitor pressed or focused outside the
  // panel. document.activeElement alone is unreliable here: Safari does not
  // focus buttons on click, and a trigger that turns inert while the panel
  // is open (the sticky CTA) loses focus before our effect runs.
  useEffect(() => {
    const remember = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element) || panelRef.current?.contains(target)) return;
      const control = target.closest<HTMLElement>(FOCUSABLE);
      if (control) lastTriggerRef.current = control;
    };
    document.addEventListener("pointerdown", remember, true);
    document.addEventListener("focusin", remember, true);
    return () => {
      document.removeEventListener("pointerdown", remember, true);
      document.removeEventListener("focusin", remember, true);
    };
  }, []);

  // Focus: first field on open, back to the opener on close.
  useEffect(() => {
    if (!isOpen) return;
    const active = document.activeElement;
    restoreFocusRef.current =
      active instanceof HTMLElement && active !== document.body && !panelRef.current?.contains(active)
        ? active
        : lastTriggerRef.current;
    const raf = window.requestAnimationFrame(() => {
      (firstFieldRef.current ?? panelRef.current)?.focus({ preventScroll: true });
    });
    return () => {
      window.cancelAnimationFrame(raf);
      const opener = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  // B4: Esc closes, Tab stays inside the panel. Capture phase so it runs
  // before any page-level key handlers.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, close]);

  // B4: key presses inside the overlay stop here, so the header's window-level
  // Escape handler does not also fire.
  const stopKeys = (e: ReactKeyboardEvent) => e.stopPropagation();

  const updateConsult = <K extends keyof ConsultValues>(key: K, value: ConsultValues[K]) => {
    setConsult((v) => ({ ...v, [key]: value }));
    setStatus(null);
    // A value the visitor picked is theirs; a later general open keeps it.
    if (key === "service" || key === "place") {
      setPreselect((p) => (p ? { ...p, [key]: null } : p));
    }
  };
  const updatePartner = <K extends keyof PartnerValues>(key: K, value: PartnerValues[K]) => {
    setPartner((v) => ({ ...v, [key]: value }));
    setStatus(null);
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setSubmitted(false);
    setStatus(null);
  };

  // Returns the composed message, or null (and focuses the first invalid
  // field) when required fields are missing.
  const prepare = (): { text: string; subject: string } | null => {
    // Render aria-invalid + the error text before moving focus, so screen
    // readers announce the message together with the field.
    flushSync(() => setSubmitted(true));
    if (mode === "konsultasi") {
      const errors = validateConsult(consult);
      const firstInvalid = (["parentName", "childAge"] as const).find((k) => errors[k]);
      if (firstInvalid) {
        document.getElementById(id(firstInvalid))?.focus();
        return null;
      }
      return buildConsultMessage(consult);
    }
    const errors = validatePartner(partner);
    const firstInvalid = (["name", "org"] as const).find((k) => errors[k]);
    if (firstInvalid) {
      document.getElementById(id(`p-${firstInvalid}`))?.focus();
      return null;
    }
    return buildPartnerMessage(partner);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const msg = prepare();
    if (!msg) return;
    const url = whatsappUrl(msg.text);
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus({ channel: "whatsapp", url });
  };

  const onEmail = () => {
    const msg = prepare();
    if (!msg) return;
    const url = mailtoUrl(msg.subject, msg.text);
    window.location.href = url;
    setStatus({ channel: "email", url });
  };

  const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

  // Reduced motion: CSS variants (not useReducedMotion) keep SSR and client
  // class names identical; the final state then applies instantly.
  const transition = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] overflow-hidden transition-[visibility] duration-0",
        isOpen ? "visible delay-0" : "pointer-events-none invisible delay-300 motion-reduce:delay-0"
      )}
      inert={!isOpen}
      aria-hidden={isOpen ? undefined : true}
      onKeyDown={stopKeys}
    >
      {/* Backdrop: blurs + tints the page; click closes. Esc and the close
          button are the keyboard equivalents, so it stays out of the a11y tree. */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "absolute inset-0 bg-gray-950/40 backdrop-blur-[14px] transition-opacity",
          transition,
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        ref={panelRef}
        id={INQUIRY_PANEL_ID}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[90svh] flex-col rounded-t-3xl bg-white shadow-2xl shadow-gray-900/20 focus:outline-none",
          "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-full md:max-w-md md:rounded-none md:rounded-l-3xl",
          "transition-transform",
          transition,
          isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0"
        )}
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-3 sm:px-6 md:pt-6">
          <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200 md:hidden" />
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-coral-tint text-brand-coral"
            >
              <MessageCircleHeartIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-bold tracking-tight text-gray-900 text-balance sm:text-xl">
                {CONTACT_COPY.inquiryCta}
              </h2>
              <p id={descId} className="mt-1 text-sm text-gray-600 text-pretty">
                {mode === "konsultasi"
                  ? "Isi singkat tentang si kecil. Pesannya kami susun rapi, lalu Anda kirim sendiri lewat WhatsApp atau email."
                  : "Ceritakan rencana kerja sama Anda. Pesannya kami susun rapi, lalu Anda kirim sendiri lewat WhatsApp atau email."}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup formulir"
              className={cn(
                "-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",
                FOCUS_RING
              )}
            >
              <XIcon className="size-5" aria-hidden="true" />
            </button>
          </div>

          {/* Mode switch */}
          <div role="group" aria-label="Jenis pesan" className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1">
            {MODES.map(({ id: modeId, label, icon: Icon }) => {
              const active = mode === modeId;
              return (
                <button
                  key={modeId}
                  type="button"
                  aria-pressed={active}
                  onClick={() => switchMode(modeId)}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors",
                    FOCUS_RING,
                    active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Icon
                    className={cn("size-4", active ? (modeId === "konsultasi" ? "text-brand-coral" : "text-teal-700") : "")}
                    aria-hidden="true"
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Scrollable fields */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {mode === "konsultasi" ? (
              <div className="space-y-4">
                <ul className="flex flex-wrap gap-2">
                  {[HERO.trustChips[0], HERO.trustChips[2]].map((chip) => (
                    <li
                      key={chip}
                      className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800"
                    >
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                      {chip}
                    </li>
                  ))}
                </ul>

                <div>
                  <FieldLabel htmlFor={id("parentName")}>Nama orang tua</FieldLabel>
                  <input
                    ref={firstFieldRef}
                    id={id("parentName")}
                    type="text"
                    autoComplete="name"
                    maxLength={80}
                    value={consult.parentName}
                    onChange={(e) => updateConsult("parentName", e.target.value)}
                    aria-required="true"
                    aria-invalid={consultErrors.parentName ? true : undefined}
                    aria-describedby={describedBy(consultErrors.parentName && id("parentName-error"))}
                    className={CONTROL}
                  />
                  <FieldError id={id("parentName-error")} message={consultErrors.parentName} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                  <div>
                    <FieldLabel htmlFor={id("childName")} optional>
                      Nama panggilan anak
                    </FieldLabel>
                    <input
                      id={id("childName")}
                      type="text"
                      autoComplete="off"
                      maxLength={60}
                      value={consult.childName}
                      onChange={(e) => updateConsult("childName", e.target.value)}
                      className={CONTROL}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={id("childAge")}>Usia anak</FieldLabel>
                    <input
                      id={id("childAge")}
                      type="text"
                      autoComplete="off"
                      maxLength={40}
                      placeholder="mis. 2 tahun 4 bulan"
                      value={consult.childAge}
                      onChange={(e) => updateConsult("childAge", e.target.value)}
                      aria-required="true"
                      aria-invalid={consultErrors.childAge ? true : undefined}
                      aria-describedby={describedBy(consultErrors.childAge && id("childAge-error"))}
                      className={CONTROL}
                    />
                    <FieldError id={id("childAge-error")} message={consultErrors.childAge} />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor={id("service")}>Layanan yang diminati</FieldLabel>
                  <SelectShell>
                    <select
                      id={id("service")}
                      value={consult.service}
                      onChange={(e) => updateConsult("service", e.target.value as ServiceChoice)}
                      className={cn(CONTROL, "appearance-none pr-10")}
                    >
                      <option value={UNSURE_SERVICE}>{UNSURE_SERVICE_LABEL}</option>
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </SelectShell>
                </div>

                <fieldset>
                  <legend className="mb-1.5 block text-sm font-medium text-gray-800">
                    Preferensi tempat<span className="ml-1 font-normal text-gray-500">(opsional)</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {PLACES.map((p) => (
                      <label
                        key={p.id}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 transition-colors hover:border-gray-400",
                          "has-checked:border-brand-coral has-checked:bg-brand-coral-tint has-checked:text-gray-900",
                          "has-focus-visible:ring-2 has-focus-visible:ring-brand-coral has-focus-visible:ring-offset-2"
                        )}
                      >
                        <input
                          type="radio"
                          name={id("place")}
                          value={p.id}
                          checked={consult.place === p.id}
                          onChange={() => updateConsult("place", p.id)}
                          className="size-4 accent-brand-coral focus-visible:outline-none"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                  {consult.place === "homecare" && HOMECARE_NOTE && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-teal-800">
                      <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      {HOMECARE_NOTE}
                    </p>
                  )}
                </fieldset>

                <div>
                  <FieldLabel htmlFor={id("story")} optional>
                    Cerita singkat / keluhan
                  </FieldLabel>
                  <textarea
                    id={id("story")}
                    rows={4}
                    maxLength={1000}
                    placeholder="Apa yang ingin Anda ceritakan tentang si kecil?"
                    value={consult.story}
                    onChange={(e) => updateConsult("story", e.target.value)}
                    className={cn(CONTROL, "resize-y")}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 text-pretty">
                  {COLLABORATION.leadQuote}
                </p>

                <div>
                  <FieldLabel htmlFor={id("p-name")}>Nama</FieldLabel>
                  <input
                    ref={firstFieldRef}
                    id={id("p-name")}
                    type="text"
                    autoComplete="name"
                    maxLength={80}
                    value={partner.name}
                    onChange={(e) => updatePartner("name", e.target.value)}
                    aria-required="true"
                    aria-invalid={partnerErrors.name ? true : undefined}
                    aria-describedby={describedBy(partnerErrors.name && id("p-name-error"))}
                    className={CONTROL}
                  />
                  <FieldError id={id("p-name-error")} message={partnerErrors.name} />
                </div>

                <div>
                  <FieldLabel htmlFor={id("p-org")}>Instansi / komunitas</FieldLabel>
                  <input
                    id={id("p-org")}
                    type="text"
                    autoComplete="organization"
                    maxLength={120}
                    value={partner.org}
                    onChange={(e) => updatePartner("org", e.target.value)}
                    aria-required="true"
                    aria-invalid={partnerErrors.org ? true : undefined}
                    aria-describedby={describedBy(partnerErrors.org && id("p-org-error"))}
                    className={CONTROL}
                  />
                  <FieldError id={id("p-org-error")} message={partnerErrors.org} />
                </div>

                <div>
                  <FieldLabel htmlFor={id("p-form")} optional>
                    Bentuk kerja sama
                  </FieldLabel>
                  <SelectShell>
                    <select
                      id={id("p-form")}
                      value={partner.form}
                      onChange={(e) => updatePartner("form", e.target.value)}
                      className={cn(CONTROL, "appearance-none pr-10")}
                    >
                      <option value="">Belum ditentukan, ingin diskusi dulu</option>
                      {COLLABORATION.forms.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </SelectShell>
                </div>

                <div>
                  <FieldLabel htmlFor={id("p-message")} optional>
                    Pesan
                  </FieldLabel>
                  <textarea
                    id={id("p-message")}
                    rows={4}
                    maxLength={1000}
                    placeholder="Ceritakan singkat rencana atau kebutuhan kerja samanya."
                    value={partner.message}
                    onChange={(e) => updatePartner("message", e.target.value)}
                    className={cn(CONTROL, "resize-y")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions, pinned to the bottom of the panel */}
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
            <div role="status" aria-live="polite">
              {status && (
                <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <p className="flex items-start gap-2 text-pretty">
                    <InfoIcon className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
                    <span>
                      {status.channel === "whatsapp"
                        ? "Kami mencoba membuka WhatsApp di tab baru. Pesan baru terkirim setelah Anda menekan kirim di WhatsApp."
                        : "Aplikasi email Anda seharusnya terbuka dengan pesan ini. Pesan baru terkirim setelah Anda menekan kirim di aplikasi email."}
                    </span>
                  </p>
                  <p className="mt-1 pl-6">
                    {status.channel === "whatsapp" ? "Tab tidak terbuka? " : "Tidak terbuka? Kirim ke "}
                    <a
                      href={status.url}
                      {...(status.channel === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="rounded font-semibold text-brand-coral underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral"
                    >
                      {status.channel === "whatsapp" ? "Buka WhatsApp" : CONTACT.email}
                    </a>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <button
                type="submit"
                className={cn(
                  "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-coral px-5 text-base font-semibold text-white shadow-md shadow-brand-coral/20 transition-colors hover:bg-[#a81a2d]",
                  FOCUS_RING
                )}
              >
                <WhatsAppIcon className="size-5" />
                Kirim lewat WhatsApp
              </button>
              <button
                type="button"
                onClick={onEmail}
                className={cn(
                  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50",
                  FOCUS_RING
                )}
              >
                <MailIcon className="size-4" aria-hidden="true" />
                Kirim lewat email
              </button>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500 text-pretty">
              <LockIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              Data di formulir ini tidak disimpan oleh website ini. Isinya hanya masuk ke pesan WhatsApp atau email yang
              Anda kirim sendiri.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
