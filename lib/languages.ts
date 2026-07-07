import type { Language } from "./types";

// The five languages shown on the welcome screen (matches the Stitch design).
export const LANGUAGES: Language[] = [
  { code: "en", label: "English", speechLocale: "en-US" },
  { code: "hi", label: "हिन्दी", speechLocale: "hi-IN" },
  { code: "es", label: "Español", speechLocale: "es-ES" },
  { code: "ar", label: "العربية", speechLocale: "ar-SA", rtl: true },
  { code: "bn", label: "বাংলা", speechLocale: "bn-IN" },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0];

// Small set of UI strings that must exist even before the bot speaks.
// (The bot itself always replies in the selected language via the system prompt.)
export const UI_STRINGS: Record<
  string,
  {
    listening: string;
    takeYourTime: string;
    typePlaceholder: string;
    greeting: string;
  }
> = {
  en: {
    listening: "I'm listening to you. Take your time.",
    takeYourTime: "Speak freely — I am keeping track of everything for you.",
    typePlaceholder: "Type anything that's on your mind…",
    greeting:
      "I'm here with you. Take your time — you can speak or type anything that's on your mind, and I'll listen without judgment. What's going on?",
  },
  hi: {
    listening: "मैं आपकी बात सुन रहा हूँ। आराम से बताइए।",
    takeYourTime: "बेझिझक बोलिए — मैं आपके लिए सब कुछ याद रख रहा हूँ।",
    typePlaceholder: "जो भी मन में है, लिखिए…",
    greeting:
      "मैं आपके साथ हूँ। आराम से बताइए — आप बोल सकते हैं या लिख सकते हैं, जो भी मन में है। मैं बिना किसी जजमेंट के सुनूँगा। क्या हुआ है?",
  },
  es: {
    listening: "Te estoy escuchando. Tómate tu tiempo.",
    takeYourTime: "Habla con libertad — lo estoy anotando todo por ti.",
    typePlaceholder: "Escribe lo que tengas en mente…",
    greeting:
      "Estoy aquí contigo. Tómate tu tiempo — puedes hablar o escribir lo que quieras, y te escucharé sin juzgar. ¿Qué está pasando?",
  },
  ar: {
    listening: "أنا أستمع إليك. خذ وقتك.",
    takeYourTime: "تحدث بحرية — أنا أدوّن كل شيء من أجلك.",
    typePlaceholder: "اكتب ما يدور في ذهنك…",
    greeting:
      "أنا هنا معك. خذ وقتك — يمكنك التحدث أو الكتابة عن أي شيء يدور في ذهنك، وسأستمع دون أحكام. ما الذي يحدث؟",
  },
  bn: {
    listening: "আমি আপনার কথা শুনছি। ধীরে সুস্থে বলুন।",
    takeYourTime: "নির্দ্বিধায় বলুন — আমি সবকিছু মনে রাখছি আপনার জন্য।",
    typePlaceholder: "আপনার মনে যা আছে লিখুন…",
    greeting:
      "আমি আপনার সাথে আছি। ধীরে সুস্থে বলুন — আপনি বলতে বা লিখতে পারেন, মনে যা আছে। আমি বিচার ছাড়াই শুনব। কী হয়েছে?",
  },
};

export function uiStrings(code: string) {
  return UI_STRINGS[code] ?? UI_STRINGS.en;
}
