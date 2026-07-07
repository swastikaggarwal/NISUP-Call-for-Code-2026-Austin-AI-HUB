# NISUP — Call for Code 2026 (Austin AI Hub)

> **A safe voice to talk to.** A voice-first, trauma-informed AI assistant for
> people affected by human trafficking — with an intelligence console that helps
> authorities connect the dots no fragmented system can.

<p>
  <a href="https://nisup-call-for-code-2026-austin-ai.vercel.app"><img src="https://img.shields.io/badge/🌍_Live_Demo-nisup--call--for--code--2026--austin--ai.vercel.app-0f6e56?style=for-the-badge" alt="Live Demo"></a>
</p>

**🔗 Live app:** https://nisup-call-for-code-2026-austin-ai.vercel.app
**📦 Repository:** https://github.com/swastikaggarwal/NISUP-Call-for-Code-2026-Austin-AI-HUB

Built with Next.js 16 · Groq (Llama 3.3 70B) · RAG · Web Speech API · Recharts · Leaflet

---

## 💔 The problem

**99.7% of trafficking victims are never identified.** Four structural reasons:

1. **Designed to be invisible** — traffickers hide inside ordinary economic activity.
2. **Victims may not self-identify** — debt, cultural norms, and gradual escalation blur the line between exploitation and "a bad job."
3. **Language & immigration barriers** — victims fear deportation more than they trust authorities.
4. **Fragmented detection systems** — labour inspectors see workplaces, police see sex trafficking, healthcare sees injuries. **No one connects the dots across silos.**

NISUP attacks all four: one calm, multilingual voice anyone can talk to — and one
intelligence layer that links every report into patterns authorities can act on.

---

## ✨ What NISUP does

### 🎙️ For the person — a Siri-like safe voice

<img src="docs/assistant.png" width="700" alt="NISUP voice assistant">

- **Voice-first conversation** (browser-native speech in + out, 5 languages:
  English, हिन्दी, Español, العربية, বাংলা) with hands-free turn-taking,
  interruption ("barge-in"), and instant end-of-speech detection.
- **No forms, no categories.** Survivors, victims, witnesses and at-risk people
  all talk to the same assistant — it understands who they are through
  conversation.
- **RAG-grounded intelligence** — every reply is grounded in a curated
  knowledge base of real trafficking indicators, survivor guidance, and
  authority routing rules. No hallucinated advice.
- **🚦 Flag triage (green / amber / red)** — the assistant silently scores every
  turn against canonical trafficking indicators (passport confiscation,
  confinement, debt bondage, threats, minors, …):
  - 🟢 **Green** — just a doubt? Get a clear answer and a warm close. No case,
    no pressure. Optionally save a **private note** (never visible to
    authorities).
  - 🟡 **Amber** — one concern? One clarifying question + a clear
    "come back if X happens" tripwire.
  - 🔴 **Red** — serious indicators? The assistant names the pattern plainly,
    and makes a **firm, consent-based offer to file the report for them** —
    critical for people not in a state to face an office or a phone call.
- **Files real reports on the user's behalf** — evidence included (voice
  recordings via MediaRecorder, photos/screenshots), producing a **Case ID**, a
  shareable **case article** page, and a **live tracking page**.

### 📍 Live case tracking

<img src="docs/tracking.png" width="520" alt="Case tracking page">

Every filed case gets a tracking page: *filed → routed → authority reviewing →
action taken*, with a timestamped update log, the handling authority's
tap-to-call contacts — and it updates **live** as the authority acts.

### 🏛️ For authorities — an intelligence console

<img src="docs/dashboard.png" width="820" alt="Authority dashboard">

- **Pattern Alerts (nexus detection)** — the flagship. Every pair of cases is
  scored by weighted similarity across **phones, emails, names (fuzzy),
  organisations, image evidence (perceptual hash), locations and case type**.
  When a survivor's case from last month and a new victim's report name the
  same "Ravi Kumar" with the same phone number — the console shows
  **"86% similar · 25 days apart"** with the exact shared signals. Two isolated
  reports become one prosecutable network.
- **Cross-silo linking** — a sex-trafficking case and a forced-labour case link
  automatically when they share an actor. That is precisely the dot-connecting
  fragmented agencies cannot do.
- **🚩 Risk-first triage** — red-flagged cases float to the top of the incoming
  feed with their indicator count; each case shows its full **Risk Indicators**
  panel and an **AI-written authority brief** (what happened, who's implicated,
  evidence, suggested first action).
- Live map, urgency mix, geographic hotspots, resolution analytics — auto-syncing
  every 5 seconds as new reports arrive.

### 🔐 Privacy by design

- Nothing is filed without explicit consent; anonymity is on by default for
  survivors.
- **Private notes never reach any authority surface** — not the dashboard, not
  analytics, not pattern matching.
- The AI never invents facts, names or contacts (strict extraction rules with
  allowed-list classification — verified against hallucination).
- API keys server-side only; no conversation data in browser storage.

---

## 🧠 How the AI works

| Layer | What it does |
|---|---|
| **Groq · Llama 3.3 70B** | The conversational brain — trauma-informed persona, ~1s replies (voice UX needs speed) |
| **RAG retriever** (`lib/rag.ts`) | TF-IDF retrieval over a curated knowledge base of case examples + guidance, injected per turn |
| **Structured extraction** (`/api/extract`) | Conversation → case record JSON: type, people, contacts, urgency, **risk band + red flags**, authority brief |
| **Triage steering** | The current risk band feeds back into the system prompt — green concludes, amber clarifies, red offers firmly |
| **Nexus engine** (`lib/similarity.ts`, `lib/nexus.ts`) | Weighted entity matching: phone/email (strong), fuzzy names, orgs, **perceptual image hashing** (`sharp`), location, type → match % |
| **Pattern alerts** (`/api/patterns`) | All-pairs scan across the case store → scored network alerts for the console |

---

## 🚀 Run it locally

```bash
git clone https://github.com/swastikaggarwal/NISUP-Call-for-Code-2026-Austin-AI-HUB.git
cd NISUP-Call-for-Code-2026-Austin-AI-HUB
npm install
copy .env.example .env.local   # then put your key inside (see below)
npm run dev                    # → http://localhost:3000
```

**Environment variable** (`.env.local`):

| Variable | Where to get it |
|---|---|
| `GROQ_API_KEY` | Free at https://console.groq.com → API Keys |

Use **Chrome/Edge** and allow the microphone for voice. Without a key the app
still runs; the assistant answers with a calm fallback.

---

## 🎬 Try this 6-step demo

1. Open the **[live app](https://nisup-call-for-code-2026-austin-ai.vercel.app)** → **Begin** → NISUP greets you aloud.
2. **Green test:** type *"An agency asks a ₹2000 registration fee — is that normal?"* → clear guidance, no case pushed, private-note offer.
3. **Red test:** tap the NISUP logo (start over), then say *"The agent took my passport, the door is locked at night, and they say I owe $3000 so I can't quit."* → 🚩 red-flag card names the pattern and offers to file.
4. Say **yes** → review the auto-drafted complaint → **Send** → get a **Case ID** + **Track this case** (live status page).
5. **Nexus test:** start over and mention *"a man called Ravi Kumar brought me to Dubai, his number is +971 50 123 4567"* → **"I've seen a related case — 86% match"** appears, linking a survivor's earlier case.
6. Open **/dashboard/overview** (any login — demo mode) → **Pattern Alerts** shows the scored network links; open the red case for its Risk Indicators + AI brief; change its status and watch the victim's tracking page update live.

---

## 🏗️ Architecture

```
app/
├─ assistant/          # voice UI: shader orb, hands-free loop, triage cards
├─ case/[id]/          # public case article (recordings, evidence, nexus)
├─ track/[id]/         # live tracking (timeline, authority contacts)
├─ dashboard/          # authority console (overview, analytics, case detail)
├─ alerts|stories|reports|emergency|privacy
└─ api/                # chat · extract · report · nexus · patterns ·
                       # case-status · classify · match · cases   (all server-side)
lib/    # prompts, RAG, similarity/nexus, entities, pHash, speech, store
data/   # knowledge base, authorities, sample cases, alerts, stories
```

**MVP scope (intentional):** in-memory + JSON persistence (`// TODO: real DB`),
mock authority login, LLM-as-retriever RAG (upgrade path: vector embeddings).
On the free hosting tier, newly filed cases persist per session; seeded demo
data is always available.

## 🗺️ Roadmap

- Real database (Supabase/Neon) for durable multi-user persistence
- Per-agency dashboards with **cross-agency alerts** when a nexus spans two authorities
- Vector-embedding RAG; face-aware image matching for evidence photos
- Verified authority onboarding + real intake API integrations
- SMS/email notifications on case status changes

---

## 🏆 Call for Code 2026 — Austin AI Hub

Built for the Call for Code 2026 challenge. NISUP exists because the first step
against trafficking is being **found** — and being found starts with having a
safe voice to talk to.
