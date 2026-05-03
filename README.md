# VVUSD Data Studio

A 60-min teacher workshop where VVUSD AI Task Force teachers turn a real Google Classroom CSV into a branded HTML dashboard using a Custom Gemini Gem and the VVUSD UI Library.

> Forked from `ai-task-force-visioning` — same dark editorial design system, retargeted for production data-viz work.

## What's here

```
vvusd-data-studio/
├── index.html              Scene 01 — Hook + Frame (mini-dashboard tease)
├── scene-2-kit.html        Scene 02 — Get Your Kit (no zip, per-asset)
├── scene-3-sample.html     Scene 03 — Sample Run (side-by-side breakage)
├── scene-4-build.html      Scene 04 — Real Data + Audience + Submit + Wishlist
├── gallery.html            Live gallery — dashboards + voices from the room
├── Code.gs                 Apps Script: doPost / doGet / Drive upload
├── pop.gs                  Apps Script helpers: populateHeaders, clearAllResponses, seedDemoSubmission
├── appsscript.json         Apps Script manifest
├── css/
│   ├── variables.css       Workshop design tokens (dark editorial)
│   ├── base.css            Reset + typography
│   ├── components.css      Card / button / table / chart styles
│   ├── animations.css      Particle / glow keyframes
│   ├── landing.css         Hero / orb / particle background
│   └── scene-page.css      Shared scene layout (top bar, eyebrow, panels, nav)
├── js/
│   ├── submissions-service.js  Apps Script POST/GET wrapper (with demo-mode fallback)
│   ├── lazy-video.js
│   └── lucide.min.js
└── kit/
    ├── gem-instructions.md         Paste into Gemini Gem · Instructions field (prose only, ~123 lines)
    ├── TEACHER.md                  Static template (rarely used directly — Scene 02 builds a personalized version from a form)
    ├── ui-library-complete.html    Drag into Gemini Gem · Knowledge files (live demo + inline CSS the Gem copies into every dashboard)
    └── sample-classroom-data.csv   Practice CSV (intentionally messy)
```

---

## Activity flow (60 min)

| Scene | Time | What happens |
|------|------|------|
| 01. Hook + Frame | 3 min | Editorial pitch + live mini-dashboard tease. "By the end of the hour, one of these from your real gradebook." |
| 02. Get Your Kit | 7 min | 4-row no-zip checklist: copy Gem Instructions, build personalized TEACHER.md from the inline form, download UI Library Knowledge file, download sample CSV. Each row labeled with where it goes in Gemini's Gem builder. |
| 03. Sample Run | 10 min | Drop the sample CSV into your Gem. Side-by-side: messy data on the left (red highlights), reference dashboard on the right. Watch Phase 1 cleanup happen, say `go`, see the build. |
| 04. Real Data + Audience | 15 min | Pick an audience (PLC / Self / Parents / Students), drop your real Google Classroom CSV, build your dashboard, upload it. Then a free-response: "where else could AI help VVUSD next year?" |
| 05. Gallery walk | 12 min | Live gallery on the room screen. Dashboards organized by audience, with rendered iframe previews. Voices-from-the-room panel below shows the free-response notes. |

Total: **~47 min**. Add framing / setup time as needed.

---

## Setup (one-time, before the session)

### 1. Google Sheet
- Go to [sheets.new](https://sheets.new). Name it **VVUSD Data Studio 2026** (or whatever).
- Note the sheet's URL.

### 2. Google Drive folder for dashboard uploads
- In Drive, create a folder: **VVUSD Data Studio Submissions**.
- Right-click the folder → **Share** → set to **Anyone with the link · Viewer**.
- Copy the folder ID from the URL (the long string between `/folders/` and `?` or end).

### 3. Apps Script
- In the Sheet: **Extensions → Apps Script**.
- Replace the default `Code.gs` with the contents of [`Code.gs`](Code.gs).
- Add a new file: paste the contents of [`pop.gs`](pop.gs).
- In `Code.gs` line 33, set `DRIVE_FOLDER_ID` to the folder ID from step 2.
- Save.

### 4. Populate sheet headers
- In the Apps Script editor, select the function `populateHeaders`. Run it.
- First run will ask for permissions — grant them.
- The sheet now has four tabs: **Polls / Projects / Feedback / Wishlist**.

### 5. Deploy as Web App
- Apps Script → **Deploy → New deployment → Web app**.
- Description: "VVUSD Data Studio · 2026 session".
- **Execute as:** Me.
- **Who has access:** Anyone.
- Deploy. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`).

### 6. Wire the URL into the frontend
Open [`js/submissions-service.js`](js/submissions-service.js) and change line 19:
```js
const CONFIG = {
    SCRIPT_URL: 'PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE'
};
```
That's the only frontend change. All scenes + the gallery share this file.

### 7. Verify the round-trip (do this the night before)
- Open the GAS Web App URL directly in **incognito**. You should see JSON like `{"success":false,"error":"Missing type parameter"}` — that confirms the endpoint is alive.
- Open `index.html` in a browser → click through to Scene 4 → upload a small test HTML file with title/description/audience.
- Open Drive → confirm the file landed in your submissions folder (named like `PLC · TestUser · 20260503-143012.html`).
- Open the Sheet → confirm a row landed in the **Projects** tab.
- Open `gallery.html` → confirm the submission appears within 15s with the iframe rendering the uploaded dashboard.
- Click the test row's link in Drive — confirm it opens publicly in incognito.

---

## Day-of room setup

- Project [`gallery.html`](gallery.html) on the main screen from the start of the session.
- Each teacher works on a laptop. Bookmark `index.html` on each.
- Save `kit/ui-library.css` next to wherever they save their dashboard HTML — this is the most-missed step.
- Backup plan: if Gemini hiccups, teachers paste a Google Doc link with their description + a screenshot.

## Resetting between sessions

- Open the Sheet → Apps Script editor → run `clearAllResponses` (defined in `pop.gs`). Clears rows, keeps headers.
- Drive files **stay** in the submissions folder (cleared rows reference orphaned IDs). Manually delete files if you want a clean slate.
- Re-deploy after editing `Code.gs`: **Deploy → Manage deployments → edit existing → New version → Deploy.** URL stays the same.

## Demo mode

If `SCRIPT_URL` is left as the placeholder:
- Submissions log to the browser console instead of writing to Drive/Sheets.
- The gallery shows a banner ("Demo mode") and renders four seeded dashboards + four seeded wishlist responses so the layout previews end-to-end.

This means you can demo or rehearse the activity without ever wiring the backend.

---

## What teachers need to know

- **Gem Instructions** are paste-into-Instructions, **TEACHER.md** is drag-into-Knowledge, **CSV** is drop-in-chat, **ui-library.css** sits next to the saved HTML. The labels on each kit row tell them this.
- The Gem **always** runs Phase 1 (clean) before building. Saying `go` is part of the workflow.
- The dashboard the Gem produces uses `<link rel="stylesheet" href="ui-library.css">`. The CSS file MUST be next to the saved HTML for the styles to render.

## Customization

- Catalog of `.ui-*` classes is in `kit/ui-library-complete.html` (live demo) and `kit/ui-library.css` (single bundle). Both are extracted from the canonical Form Builder UI library.
- Audience voices are defined in `kit/gem-instructions.md` (PLC / Self / Parents / Students). Edit copy there if you want different framing.
- The four audience colors are wired in:
  - Scene 4 audience picker (data-audience + --card-color)
  - Gallery sections (#section-PLC etc.)
  - If you add a new audience, edit Scene 4's grid + the gallery's section + tab + DEMO data.

---

## Risks to watch

1. **DRIVE_FOLDER_ID not set.** Code.gs throws if it's still the placeholder. Set it before populating headers — the error message tells you what's wrong.
2. **Drive folder permissions.** If "Anyone with the link" isn't enabled on the parent folder, file uploads succeed but the iframe in the gallery fails to load. Set permissions before deploying.
3. **Gemini Canvas vs. local HTML.** Some teachers will use Gemini Canvas (which produces a hosted preview). Others will save the file. The submit form expects an .html file upload — for Canvas users, they'll need to right-click → save the rendered output as HTML.
4. **HTML size.** Apps Script can ingest up to ~50 MB POST. Inlined images can push HTML well over 1 MB. We cap at 5 MB client-side.
5. **iframe sandbox.** Drive's `/preview` URL serves with `X-Frame-Options: SAMEORIGIN` for some embed contexts. Tested: works for public files in `iframe`. If a card shows blank, check the file's sharing permission in Drive.
