"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShaderOrb } from "@/components/assistant/ShaderOrb";
import { MessageBubble } from "@/components/assistant/MessageBubble";
import { EvidenceSheet } from "@/components/assistant/EvidenceSheet";
import { HamburgerMenu } from "@/components/assistant/HamburgerMenu";
import { SurvivorCard, MatchCard, WitnessCard, NexusCard } from "@/components/assistant/Cards";
import { ReportSheet } from "@/components/assistant/ReportSheet";
import { ShareStorySheet } from "@/components/assistant/ShareStorySheet";
import { PathChooser } from "@/components/assistant/PathChooser";
import { useCase } from "@/context/CaseContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSpeechRecognition, speak, stopSpeaking } from "@/lib/speech";
import { sendChat, extractCase, findMatches, findNexusLive, fileReport } from "@/lib/api";
import { uiStrings } from "@/lib/languages";
import type { CaseRecord, ChatMessage, Match, NexusLink, UserType } from "@/lib/types";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

export default function AssistantPage() {
  const router = useRouter();
  const { messages, addMessage, attachments, reset } = useCase();
  const { language } = useLanguage();
  const strings = uiStrings(language.code);

  const [mode, setMode] = useState<"voice" | "typing">("voice");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [readAloud, setReadAloud] = useState(true);
  const [typed, setTyped] = useState("");

  const [showEvidence, setShowEvidence] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [shareAs, setShareAs] = useState<UserType | null>(null);

  const [extracted, setExtracted] = useState<Omit<CaseRecord, "id"> | null>(null);
  const [alertMatches, setAlertMatches] = useState<Match[]>([]);
  const [nexusLinks, setNexusLinks] = useState<NexusLink[]>([]);
  const [anonymous, setAnonymous] = useState(true);
  const [noteSaved, setNoteSaved] = useState<string | null>(null); // note ref id

  const { listening, interim, supported, start, stop } = useSpeechRecognition(
    language.speechLocale
  );
  // Hands-free (Siri-like) conversation: after NISUP speaks, it listens again.
  const [handsFree, setHandsFree] = useState(true);
  const kickedOff = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Refs so the TTS onEnd callback can auto-listen without stale state.
  const handsFreeRef = useRef(true);
  const modeRef = useRef<"voice" | "typing">("voice");
  const supportedRef = useRef(false);
  const sheetsOpenRef = useRef(false);
  const beginListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    supportedRef.current = supported;
  }, [supported]);
  useEffect(() => {
    sheetsOpenRef.current =
      showEvidence || showMenu || showReport || shareAs !== null;
  }, [showEvidence, showMenu, showReport, shareAs]);

  // Latest understood case (ref so runTurn can read it without stale closure).
  const extractedRef = useRef<Omit<CaseRecord, "id"> | null>(null);
  useEffect(() => {
    extractedRef.current = extracted;
  }, [extracted]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  // After a reply, resume listening automatically in hands-free voice mode.
  const maybeAutoListen = useCallback(() => {
    if (
      handsFreeRef.current &&
      modeRef.current === "voice" &&
      supportedRef.current &&
      !sheetsOpenRef.current
    ) {
      // small gap so the mic doesn't catch the tail of NISUP's own voice
      setTimeout(() => beginListeningRef.current?.(), 400);
    }
  }, []);

  const speakReply = useCallback(
    (text: string, opts?: { autoListen?: boolean }) => {
      const autoListen = opts?.autoListen !== false;
      if (!readAloud) {
        setOrbState("idle");
        if (autoListen) maybeAutoListen();
        return;
      }
      setOrbState("speaking");
      speak(text, language.speechLocale, {
        onEnd: () => {
          setOrbState("idle");
          if (autoListen) maybeAutoListen();
        },
      });
    },
    [readAloud, language.speechLocale, maybeAutoListen]
  );

  const runTurn = useCallback(
    async (visibleUser: string) => {
      const userMsg: ChatMessage = { role: "user", content: visibleUser };
      const history: ChatMessage[] = [...messages, userMsg];
      addMessage(userMsg);

      // Does the user want to file? Either a direct request, OR an agreement
      // right after NISUP offered to report. Opens the report flow (→ Case ID).
      const lastAsst = [...messages].reverse().find((m) => m.role === "assistant");
      const wasOffered = lastAsst
        ? /(report|complaint|authorit|file|track)/i.test(lastAsst.content)
        : false;
      const explicitReportRequest =
        /\b(report (it|this|the|my|a)|file (it|a|the|this|my)|make (a|the) report|lodge (a )?complaint|register (a|the|my) case|please report|please file|report my case|file my case)\b/i.test(
          visibleUser
        );
      const affirmed =
        /\b(yes|yeah|yep|yup|ok|okay|sure|please|go ahead|do it|yes please|please do|report it|file it|submit|send it|lodge)\b/i.test(
          visibleUser
        );

      setOrbState("thinking");
      const reply = await sendChat(history, language.code, {
        riskBand: extractedRef.current?.riskBand,
        redFlags: extractedRef.current?.redFlags,
      });
      addMessage({ role: "assistant", content: reply });
      speakReply(reply);

      // Open the report screen when the user wants to file. The report sheet
      // extracts + builds the draft itself, so we don't require a known type.
      if (explicitReportRequest || (wasOffered && affirmed)) {
        setShowReport(true);
      }

      refreshCase([...history, { role: "assistant", content: reply }]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, language.code, speakReply, addMessage]
  );

  const refreshCase = useCallback(
    async (history: ChatMessage[]) => {
      const userTurns = history.filter((m) => m.role === "user").length;
      if (userTurns < 1) return; // surface the right card after the first message
      try {
        const rec = await extractCase(history, language.code);
        setExtracted(rec);
        if (
          (rec.userType === "at_risk" || rec.userType === "victim") &&
          rec.situationType &&
          rec.situationType !== "Unknown" &&
          alertMatches.length === 0
        ) {
          const m = await findMatches("alert", rec.situationType, rec.location);
          setAlertMatches(m);
        }
        // Nexus: only even look when the user has actually named a specific
        // person, organisation, or contact — never on a vague message. And only
        // show STRONG matches (shared email/phone/org/image). Always reset so a
        // stale match can't linger.
        const hasIdentifier =
          (!!rec.contacts && rec.contacts !== "Unknown") ||
          (!!rec.peopleInvolved &&
            rec.peopleInvolved !== "Unknown" &&
            !/^(unknown|anonymous|n\/a|none)/i.test(rec.peopleInvolved.trim()));
        if (!hasIdentifier) {
          setNexusLinks([]);
        } else {
          const links = await findNexusLive({ ...rec, transcript: history });
          // Only surface a confident match to the person mid-conversation.
          setNexusLinks(links.filter((l) => l.matchPercent >= 55));
        }
      } catch {
        /* non-fatal */
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language.code, alertMatches.length]
  );

  // Instant opening greeting (no wait on the LLM) so the bot is present at once.
  useEffect(() => {
    if (kickedOff.current) return;
    kickedOff.current = true;
    if (messages.length === 0) {
      addMessage({ role: "assistant", content: strings.greeting });
      // Do NOT auto-listen after the greeting — the user taps to begin, so the
      // mic never opens on its own and can't catch stray audio.
      speakReply(strings.greeting, { autoListen: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, alertMatches, extracted]);

  const beginListening = useCallback(() => {
    if (!supported) {
      setMode("typing");
      return;
    }
    if (listening) {
      stop();
      return;
    }
    stopSpeaking(); // barge-in: interrupt NISUP if it's still speaking
    setOrbState("listening");
    start((text) => {
      setOrbState("thinking");
      runTurn(text);
    });
  }, [supported, listening, stop, start, runTurn]);

  useEffect(() => {
    beginListeningRef.current = beginListening;
  }, [beginListening]);

  // If listening ends with no speech, settle the orb back to idle.
  useEffect(() => {
    if (!listening && orbState === "listening") setOrbState("idle");
  }, [listening, orbState]);

  const handleSendTyped = () => {
    const text = typed.trim();
    if (!text) return;
    setTyped("");
    runTurn(text);
  };

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  // Tapping the NISUP logo starts fresh: clears the conversation + cards and
  // shows the greeting and path chooser again, so users can choose differently.
  const handleReset = () => {
    stopSpeaking();
    reset();
    setExtracted(null);
    setAlertMatches([]);
    setNexusLinks([]);
    setNoteSaved(null);
    setTyped("");
    setMode("voice");
    setOrbState("idle");
    addMessage({ role: "assistant", content: strings.greeting });
    speakReply(strings.greeting, { autoListen: false });
  };

  // Path chooser: survivors & witnesses jump straight into the share/record
  // flow; victims & at-risk people start a guided conversation.
  const handleChoosePath = (type: UserType) => {
    if (type === "survivor" || type === "witness") {
      setShareAs(type);
      return;
    }
    const seed =
      type === "victim"
        ? "I need help and justice. Something happened to me and I don't know who to contact."
        : "I feel that something is wrong and I'm worried about my safety.";
    runTurn(seed);
  };

  // Green-band option: save the conversation as a dated PRIVATE note (not a
  // case — never shown to authorities). Useful evidence if things change later.
  const handleSaveNote = async () => {
    try {
      const res = await fileReport({
        ...(extractedRef.current ?? {}),
        userType: extractedRef.current?.userType ?? "unknown",
        situationType: extractedRef.current?.situationType ?? "Unknown",
        summary:
          extractedRef.current?.summary && extractedRef.current.summary !== "Unknown"
            ? extractedRef.current.summary
            : "Private note from a NISUP conversation.",
        urgency: extractedRef.current?.urgency ?? "Low",
        riskBand: extractedRef.current?.riskBand ?? "green",
        redFlags: extractedRef.current?.redFlags ?? [],
        transcript: messages,
        attachments,
        isNote: true,
      });
      setNoteSaved(res.referenceId);
    } catch {
      /* non-fatal */
    }
  };

  const showSurvivorCard = extracted?.userType === "survivor";
  const showWitnessCard = extracted?.userType === "witness";
  const riskBand = extracted?.riskBand;
  // Report CTA: never for green (just a doubt — no case needed). For red it
  // renders as the firm variant below.
  const showReportCta =
    !!extracted &&
    riskBand !== "green" &&
    extracted.userType !== "witness" &&
    extracted.userType !== "survivor" &&
    extracted.situationType &&
    extracted.situationType !== "Unknown";
  // Green: after a real exchange, offer to save a private note instead.
  const showNoteCard =
    riskBand === "green" && userMessageCount >= 2 && !noteSaved;

  const statusText = listening
    ? strings.listening
    : orbState === "thinking"
      ? "Thinking about what you shared…"
      : orbState === "speaking"
        ? "Speaking…"
        : strings.takeYourTime;

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background font-body-md text-on-background">
      {/* Header (Back replaces Quick Exit) */}
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-background/80 px-6 py-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMenu(true)}
            aria-label="Menu"
            className="rounded-full p-2 transition-colors hover:bg-surface-container active:scale-95"
          >
            <span className="material-symbols-outlined text-primary">menu</span>
          </button>
          <button
            onClick={handleReset}
            aria-label="Start over"
            title="Start over"
            className="text-xl font-bold tracking-wide text-primary transition-opacity hover:opacity-70 active:scale-95"
          >
            NISUP
          </button>
        </div>
        <div className="absolute left-1/2 hidden -translate-x-1/2 text-center sm:block">
          <span className="flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Live Voice Intelligence
          </span>
        </div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 rounded-full border-2 border-outline-variant/40 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-all hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
      </header>

      {/* Main */}
      <main
        ref={scrollRef}
        className="relative flex flex-1 flex-col items-center overflow-y-auto px-6 pb-40 pt-28"
      >
        {mode === "voice" ? (
          <div className="flex w-full max-w-lg flex-col items-center gap-6 py-2">
            {/* Assistant reply card */}
            {lastAssistant && (
              <div className="mb-10 w-full animate-float">
                <div className="flex gap-4 rounded-3xl border border-primary/5 bg-secondary-container/30 p-6 shadow-[0_20px_40px_rgba(15,110,86,0.04)] backdrop-blur-md">
                  <div className="mt-1 flex-shrink-0">
                    <span
                      className={`material-symbols-outlined text-[20px] text-primary ${
                        orbState === "speaking" ? "animate-pulse" : ""
                      }`}
                    >
                      volume_up
                    </span>
                  </div>
                  <p className="flex-1 font-body-lg text-body-lg leading-relaxed text-primary">
                    {lastAssistant.content}
                  </p>
                </div>
              </div>
            )}

            {/* Path chooser — a gentle menu shown before the first message */}
            {userMessageCount === 0 && (
              <PathChooser onChoose={handleChoosePath} />
            )}

            {/* Central shader orb */}
            <button
              onClick={beginListening}
              aria-label={listening ? "Stop listening" : "Tap to speak"}
              className="relative flex h-72 w-72 items-center justify-center focus:outline-none"
            >
              <div className="absolute inset-0 scale-150 rounded-full bg-[radial-gradient(circle,rgba(15,110,86,0.05)_0%,transparent_70%)] opacity-60 blur-3xl" />
              <div className="relative z-10 h-full w-full">
                <ShaderOrb />
              </div>
              {listening && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/20 [animation-duration:3s]" />
                  <div className="absolute inset-0 animate-ping rounded-full border border-primary/10 [animation-delay:1.5s] [animation-duration:4s]" />
                </>
              )}
            </button>

            {/* Status / interim */}
            <p className="mt-6 max-w-xs text-center font-body-md text-on-surface-variant/80">
              {interim ? `“${interim}”` : statusText}
            </p>

            {/* Quick reply chips */}
            <div className="mt-8 flex w-full max-w-md flex-wrap justify-center gap-stack-gap-sm">
              <button
                onClick={() => runTurn("Tell me more about how you can help.")}
                className="rounded-full border border-outline-variant/30 bg-surface-container-low px-6 py-3 font-label-md text-label-md text-on-surface-variant transition-all hover:bg-surface-container-high active:scale-95"
              >
                Tell me more
              </button>
              {showReportCta && riskBand !== "red" && (
                <button
                  onClick={() => setShowReport(true)}
                  className="rounded-full border border-outline-variant/30 bg-surface-container-low px-6 py-3 font-label-md text-label-md text-on-surface-variant transition-all hover:bg-surface-container-high active:scale-95"
                >
                  I want to report this
                </button>
              )}
            </div>

            {/* Cards */}
            <div className="mt-8 flex w-full max-w-md flex-col gap-3">
              {riskBand === "red" && showReportCta && (
                <RedFlagCta
                  flags={extracted?.redFlags ?? []}
                  onFile={() => setShowReport(true)}
                />
              )}
              {showSurvivorCard && (
                <SurvivorCard
                  anonymous={anonymous}
                  onToggleAnonymous={setAnonymous}
                  onShareStory={() => setShareAs("survivor")}
                />
              )}
              {showWitnessCard && (
                <WitnessCard
                  onAddEvidence={() => setShareAs("witness")}
                  onReport={() => setShowReport(true)}
                />
              )}
              {nexusLinks.length > 0 && <NexusCard links={nexusLinks} />}
              {alertMatches.length > 0 && (
                <MatchCard kind="alert" matches={alertMatches} />
              )}
              {showNoteCard && <NoteCard onSave={handleSaveNote} />}
              {noteSaved && <NoteSavedChip refId={noteSaved} />}
            </div>
          </div>
        ) : (
          // Typing mode
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
            {/* Shrunk orb + Listening label */}
            <div className="mb-4 mt-2 flex flex-col items-center">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute z-20 h-8 w-8 rounded-full bg-primary-container shadow-lg" />
                <div
                  className="orb-breath absolute z-10 h-12 w-12 rounded-full bg-secondary/20"
                  style={{ animationDelay: "0.5s" }}
                />
                <div className="orb-breath absolute z-0 h-16 w-16 rounded-full bg-primary/5" />
              </div>
              <p className="mt-2 font-label-sm text-label-sm uppercase tracking-widest text-outline">
                {listening ? "Listening" : "NISUP"}
              </p>
            </div>

            <section className="flex flex-1 flex-col gap-6 py-2">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              <div className="flex w-full max-w-md flex-col gap-3 self-center">
                {showSurvivorCard && (
                  <SurvivorCard
                    anonymous={anonymous}
                    onToggleAnonymous={setAnonymous}
                    onShareStory={() => setShareAs("survivor")}
                  />
                )}
                {showWitnessCard && (
                  <WitnessCard
                    onAddEvidence={() => setShareAs("witness")}
                    onReport={() => setShowReport(true)}
                  />
                )}
                {nexusLinks.length > 0 && <NexusCard links={nexusLinks} />}
                {alertMatches.length > 0 && (
                  <MatchCard kind="alert" matches={alertMatches} />
                )}
                {riskBand === "red" && showReportCta ? (
                  <RedFlagCta
                    flags={extracted?.redFlags ?? []}
                    onFile={() => setShowReport(true)}
                  />
                ) : (
                  showReportCta && (
                    <button
                      onClick={() => setShowReport(true)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-secondary-container/30 px-5 py-4 font-label-md text-label-md text-primary transition-all active:scale-[0.99]"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        description
                      </span>
                      Would you like me to report this to the right authority?
                    </button>
                  )
                )}
                {showNoteCard && <NoteCard onSave={handleSaveNote} />}
                {noteSaved && <NoteSavedChip refId={noteSaved} />}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Attachments chips */}
      {attachments.length > 0 && (
        <div className="fixed bottom-24 left-1/2 z-40 flex max-w-md -translate-x-1/2 flex-wrap justify-center gap-2 px-4">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="flex items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-xs text-primary"
            >
              <span className="material-symbols-outlined text-[14px]">
                attach_file
              </span>
              {a.label.length > 22 ? a.label.slice(0, 22) + "…" : a.label}
            </span>
          ))}
        </div>
      )}

      {/* Bottom floating input bar */}
      <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-48px)] max-w-lg -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full bg-surface-container-lowest/80 p-2 shadow-[0_20px_40px_rgba(15,110,86,0.08)] backdrop-blur-3xl">
          <div className="flex items-center gap-1 pl-2">
            <IconBtn label="Add photo" onClick={() => setShowEvidence(true)}>
              add_photo_alternate
            </IconBtn>
            <IconBtn label="Add link" onClick={() => setShowEvidence(true)}>
              link
            </IconBtn>
            <IconBtn label="Attach file" onClick={() => setShowEvidence(true)}>
              attach_file
            </IconBtn>
          </div>

          {mode === "voice" ? (
            <button
              onClick={() => setMode("typing")}
              className="h-12 flex-1 select-none px-4 text-left font-body-md text-on-surface-variant/50"
            >
              Message Assistant…
            </button>
          ) : (
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTyped()}
              placeholder={strings.typePlaceholder}
              className="h-12 min-w-0 flex-1 bg-transparent px-4 font-body-md text-on-surface outline-none placeholder:text-on-surface-variant/50"
              autoFocus
            />
          )}

          {mode === "typing" && typed.trim() ? (
            <button
              onClick={handleSendTyped}
              aria-label="Send"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform active:scale-90"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
            </button>
          ) : (
            <button
              onClick={beginListening}
              aria-label="Speak"
              className={`flex h-12 w-12 items-center justify-center rounded-full text-on-primary shadow-lg transition-transform active:scale-90 ${
                listening ? "bg-error" : "bg-primary"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mic
              </span>
            </button>
          )}
        </div>

        {/* Toggles: conversation (hands-free) + read-aloud */}
        <div className="mt-3 flex justify-center gap-2">
          <button
            onClick={() => setHandsFree((v) => !v)}
            title="When on, NISUP keeps listening after it replies — like a hands-free call."
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              handsFree
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {handsFree ? "graphic_eq" : "pause_circle"}
            </span>
            Conversation {handsFree ? "on" : "off"}
          </button>
          <button
            onClick={() => {
              if (readAloud) stopSpeaking();
              setReadAloud((v) => !v);
            }}
            className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              {readAloud ? "volume_up" : "volume_off"}
            </span>
            Read aloud {readAloud ? "on" : "off"}
          </button>
        </div>
      </div>

      {/* Sheets */}
      {showEvidence && <EvidenceSheet onClose={() => setShowEvidence(false)} />}
      {showMenu && <HamburgerMenu onClose={() => setShowMenu(false)} />}
      {showReport && <ReportSheet onClose={() => setShowReport(false)} />}
      {shareAs && (
        <ShareStorySheet userType={shareAs} onClose={() => setShareAs(null)} />
      )}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-high active:scale-90"
    >
      <span className="material-symbols-outlined">{children}</span>
    </button>
  );
}

// RED band: firm, clear filing offer — names the warning signs, keeps consent.
function RedFlagCta({
  flags,
  onFile,
}: {
  flags: string[];
  onFile: () => void;
}) {
  return (
    <div className="w-full rounded-[24px] border-l-4 border-[#993C1D] bg-[#993C1D]/5 p-5">
      <div className="mb-2 flex items-center gap-2 text-[#993C1D]">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          flag
        </span>
        <span className="font-label-md text-label-md uppercase tracking-wider">
          Serious warning signs
        </span>
      </div>
      {flags.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1">
          {flags.slice(0, 4).map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-on-surface">
              <span className="mt-0.5 text-[#993C1D]">🚩</span>
              {f}
            </li>
          ))}
        </ul>
      )}
      <p className="mb-3 font-body-md leading-relaxed text-on-surface">
        This is not your fault. I can file this report for you right now — you
        won&apos;t have to face any office yourself, and you&apos;ll get a case number
        with live tracking.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onFile}
          className="flex items-center gap-2 rounded-full bg-[#993C1D] px-5 py-2.5 font-label-md text-label-md text-white transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          Yes, file my case
        </button>
        <a
          href="/emergency"
          className="flex items-center gap-2 rounded-full border border-[#993C1D]/40 px-5 py-2.5 font-label-md text-label-md text-[#993C1D] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">emergency</span>
          Emergency help
        </a>
      </div>
    </div>
  );
}

// GREEN band: gentle close — save the conversation as a dated private note.
function NoteCard({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-outline-variant/40 bg-surface-container-lowest p-4">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined mt-0.5 text-primary">
          bookmark_add
        </span>
        <p className="font-label-sm text-label-sm leading-relaxed text-on-surface-variant">
          Want me to save this as a <b>private note</b> — not a case — so if
          anything changes later, we can pick up right where we left off?
        </p>
      </div>
      <button
        onClick={onSave}
        className="shrink-0 rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary active:scale-95"
      >
        Save note
      </button>
    </div>
  );
}

function NoteSavedChip({ refId }: { refId: string }) {
  return (
    <div className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary-container/40 px-4 py-2.5">
      <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
        check_circle
      </span>
      <span className="font-label-sm text-label-sm text-on-surface">
        Saved privately as note <b>{refId}</b> — only you can see it.
      </span>
    </div>
  );
}
