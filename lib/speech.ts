"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ────────────────────────────────────────────────────────────────────────────
// Minimal ambient typings for the browser Web Speech API (not in lib.dom for
// all TS configs). We only type what we use.
// ────────────────────────────────────────────────────────────────────────────
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return getRecognitionCtor() !== null;
}

// ────────────────────────────────────────────────────────────────────────────
// useSpeechRecognition — speech-to-text (FREE, browser-native).
// ────────────────────────────────────────────────────────────────────────────
export function useSpeechRecognition(locale: string) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const onDoneRef = useRef<((text: string) => void) | null>(null);
  // Silence timer for automatic end-of-speech detection (real-time turn-taking).
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SILENCE_MS = 1100; // finalize this long after the user STOPS talking
  const NO_SPEECH_MS = 8000; // give them this long to START talking

  useEffect(() => {
    setSupported(speechSupported());
  }, []);

  const start = useCallback(
    (onDone: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;

      const recognition = new Ctor();
      recognition.lang = locale;
      recognition.continuous = true; // allow multi-sentence input…
      recognition.interimResults = true;
      finalRef.current = "";
      onDoneRef.current = onDone;

      const clearSilence = () => {
        if (silenceRef.current) {
          clearTimeout(silenceRef.current);
          silenceRef.current = null;
        }
      };
      // …but auto-stop after a short pause so the turn is sent instantly,
      // instead of waiting for the user to tap stop. Longer window before the
      // first word; short window once they've started speaking.
      const armSilence = (started: boolean) => {
        clearSilence();
        silenceRef.current = setTimeout(
          () => {
            try {
              recognition.stop();
            } catch {
              /* already stopped */
            }
          },
          started ? SILENCE_MS : NO_SPEECH_MS
        );
      };

      recognition.onresult = (e) => {
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          const text = result[0].transcript;
          if (result.isFinal) finalRef.current += text + " ";
          else interimText += text;
        }
        setInterim(interimText);
        armSilence(true); // reset the short pause timer on every word
      };
      recognition.onerror = () => {
        clearSilence();
        setListening(false);
      };
      recognition.onend = () => {
        clearSilence();
        setListening(false);
        setInterim("");
        const text = finalRef.current.trim();
        if (text && onDoneRef.current) onDoneRef.current(text);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setListening(true);
        armSilence(false); // wait longer for them to start speaking
      } catch {
        setListening(false);
      }
    },
    [locale]
  );

  const stop = useCallback(() => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    recognitionRef.current?.stop();
  }, []);

  return { listening, interim, supported, start, stop };
}

// ────────────────────────────────────────────────────────────────────────────
// speak — text-to-speech (FREE, browser-native). Returns a stop function.
// ────────────────────────────────────────────────────────────────────────────
export function speak(
  text: string,
  locale: string,
  handlers?: { onStart?: () => void; onEnd?: () => void }
): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis)
    return () => {};

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = locale;
  utter.rate = 0.98;
  utter.pitch = 1;

  // Try to pick a voice matching the locale for a more natural read.
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === locale) ??
    voices.find((v) => v.lang.startsWith(locale.split("-")[0]));
  if (match) utter.voice = match;

  utter.onstart = () => handlers?.onStart?.();
  utter.onend = () => handlers?.onEnd?.();

  window.speechSynthesis.speak(utter);
  return () => window.speechSynthesis.cancel();
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis)
    window.speechSynthesis.cancel();
}
