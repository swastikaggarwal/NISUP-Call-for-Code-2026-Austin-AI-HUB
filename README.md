# NISUP — Call for Code 2026 (Austin AI Hub)

> **A safe voice to talk to.** Voice-first, trauma-informed AI assistant for
> people affected by human trafficking.

NISUP is a **voice-first, trauma-informed AI assistant** for people affected by
human trafficking. Everyone — survivor, victim, at-risk person, or witness —
talks to the same calm assistant (by voice, with a typing fallback). NISUP
figures out who they are through conversation, guides them, silently builds a
structured case record, and can file a report to the right authority.

A separate **Authority Dashboard** receives those reports with a live map,
analytics, **AI pattern detection with similarity scoring** (nexus detection —
linking cases that name the same person, phone, photo, or place across case
types), and **red-flag triage** that prioritises the cases that can't wait.

---

## 1. Install & run

```bash
cd nisup
npm install            # already done if you scaffolded here
cp .env.example .env.local   # then add your key (see below)
npm run dev            # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

> On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

## 2. Environment variable

NISUP's brain is **Groq** (free, very fast). You need one key:

| Variable        | Where to get it                                                        |
| --------------- | ---------------------------------------------------------------------- |
| `GROQ_API_KEY`  | https://console.groq.com → **API Keys → Create API Key** (free tier)   |

Put it in `.env.local`:

```
GROQ_API_KEY=gsk_your_key_here
```

The key is read **server-side only** (inside the API routes) and is never sent
to the browser. Without a key the app still runs — the assistant just returns a
calm fallback message instead of a real reply.

**Voice** uses the browser-native Web Speech API (speech-to-text) and Speech
Synthesis (text-to-speech) — no keys, no cost. Use **Chrome or Edge** for the
best voice support, and allow microphone access when prompted.

## 3. Six-step demo script

A victim talks to NISUP by voice, gets guidance, files a report — then the
authority sees it on the dashboard.

1. **Open** `http://localhost:3000`, pick a language, tap **Begin**. NISUP
   greets you and speaks aloud.
2. **Tap the orb** (or the **Add Context** mic button) and speak, e.g.
   *"I paid an agency called Rapid Overseas Placements for a job abroad and now
   they've taken my passport and there's no job."* (Prefer typing? Tap the
   keyboard icon and type it.)
3. **Continue the conversation** — answer NISUP's one gentle question at a time
   (where it happened, who was involved). NISUP names what the situation sounds
   like and who can help locally. A **similar-alert card** may surface.
4. When NISUP offers — or when the **"Would you like me to report this…"** card
   appears — tap it. Review the auto-prepared report, edit anything, and tap
   **Send this report**. Note the **reference ID** (e.g. `NIS-8F3K2`).
5. **Open the dashboard** at `http://localhost:3000/dashboard`, sign in (any
   credentials). On **Overview** your new case appears in *Incoming Cases* and
   as a marker on the map.
6. Open the case for the **AI brief + recorded conversation player**, then visit
   **Analytics** to see charts and the **AI pattern-detection panel** (e.g. it
   flags multiple cases naming the same recruiter as a possible network).

### Try these other personas
- **Survivor:** *"I got out of a trafficking situation and I want to warn
  others."* → an amber **"Your voice can protect others"** card appears.
- **Witness:** *"I saw children working in a shop during school hours."* →
  NISUP captures it and offers to route it to child protection.
- **Quick Exit:** tap **Quick Exit** any time — the conversation is wiped from
  memory and you land on a neutral weather page.

## 4. Architecture

- **Next.js 16 (App Router) + TypeScript**, **Tailwind v4** design system.
- **Groq** `llama-3.3-70b-versatile` via server-side route handlers.
- **Web Speech API** for voice in/out (free, browser-native).
- **RAG:** LLM-as-retriever over JSON in `/data` (`// TODO: upgrade to vector
  embeddings`).
- **Recharts** (analytics) + **react-leaflet** with free OpenStreetMap tiles.
- **Storage:** in-memory + JSON for the MVP (`// TODO: replace with real DB`).
- Conversation/case state lives in React context — never `localStorage`
  (only the language preference is persisted).

### Key paths
```
app/                page (welcome) · assistant · weather · dashboard/* · api/*
components/assistant VoiceOrb · MessageBubble · EvidenceSheet · Cards · ReportSheet
components/dashboard DashboardShell · CaseMap(+Wrapper)
lib/                prompts.ts · groq.ts · speech.ts · api.ts · types.ts
context/            LanguageContext · CaseContext
data/               authorities · survivor-stories · alerts · sample-cases
```

## 5. Not built yet (future scope — stubbed & commented)

Multi-day follow-up, real vector-DB RAG, real authority API integrations, real
auth/encryption, and durable persistence. Each mock is marked with a
`// TODO: replace for production` comment.
