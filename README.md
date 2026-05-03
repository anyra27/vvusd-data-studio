# VVUSD Data Studio

A two-scene teacher workshop where VVUSD AI Task Force teachers walk away with a **Custom Gemini Gem** that turns real Google Classroom CSVs into branded HTML dashboards.

The workshop site is a static onboarding hub. The actual building happens in Gemini.

---

## What's here

```
vvusd-data-studio/
├── index.html              Scene 01 — Hook + Frame
├── scene-2-kit.html        Scene 02 — Get Your Kit (4-row checklist + TEACHER.md form-builder)
├── README.md
├── css/
│   ├── variables.css       Workshop design tokens (dark editorial)
│   ├── base.css            Reset + typography
│   ├── components.css      Card / button / table / chart styles
│   ├── animations.css      Particle / glow keyframes
│   ├── landing.css         Hero / orb / particle background
│   └── scene-page.css      Shared scene layout
├── js/
│   ├── lazy-video.js
│   └── lucide.min.js
└── kit/
    ├── gem-instructions.md      Paste into Gemini Gem · Instructions field
    ├── TEACHER.md               Static template (Scene 2 builds a personalized version from a form)
    ├── ui-library-complete.html Drag into Gemini Gem · Knowledge files (CSS lives inline; chart-growth bug fixed)
    └── sample-classroom-data.csv Practice CSV (intentionally messy)
```

---

## Activity flow (~15 min)

| Scene | What happens |
|------|------|
| **01. Hook + Frame** | Editorial pitch + live mini-dashboard tease. "By the end of the hour, one of these from your real gradebook." |
| **02. Get Your Kit** | 4-row no-zip checklist: copy Gem Instructions, **build a personalized TEACHER.md from the inline form**, download the UI Library, download the sample CSV. Each row labeled with where it goes in Gemini's Gem builder. Below the checklist: 7-step "Build your Gem in Gemini" walkthrough. |

Then the teacher works in Gemini directly — the Gem walks them through Phase 1 (clean) → Phase 2 (interview) → Phase 3 (build) on each CSV they drop in.

---

## What teachers leave with

- A **Custom Gem** in their Gemini workspace with their classroom context baked in
- A **repeatable workflow:** export gradebook → drop in chat → say `go` → answer three questions → save HTML
- An **HTML dashboard** they can project, screenshot, or send (the UI Library CSS is inlined into every dashboard the Gem produces, so the file opens correctly from anywhere)

---

## Deployment

This is a **fully static site**. No backend, no auth, no database.

- **GitHub:** [github.com/anyra27/vvusd-data-studio](https://github.com/anyra27/vvusd-data-studio)
- **Cloudflare Pages:** connects to the GitHub repo. Framework preset: None. Build command: empty. Output directory: `/`. Push → auto-deploy.

To update: edit local files → `git push` → Cloudflare picks it up in ~30 seconds.

---

## Customization

- **Workshop framing copy** — `index.html` (hero tagline, lead, deliverables)
- **Kit assets** — `kit/` folder. Gem Instructions are the most important; everything else flows from there.
- **Audience voices** — defined in `kit/gem-instructions.md` (PLC / Self / Parents / Students). Adjust copy there.
- **TEACHER.md form fields** — `scene-2-kit.html` has a `TEACHER_TEMPLATE` constant in the JS. Edit the template + add/remove form rows in the HTML.
- **UI Library** — `kit/ui-library-complete.html` is the canonical source. The Gem reads this from Knowledge and inlines its `<style>` block into every dashboard.

### Chart.js sizing fix

The UI library has a hard-coded `max-height` + `overflow: hidden` on `.ui-chart-canvas` and `.ui-donut-container` plus absolute-positioning on inner `<canvas>` elements. This prevents Chart.js's `responsive: true` mode from feeding back into parent height (the "chart grows unbounded down the page" bug). The Gem instructions also explicitly require teachers' dashboards to use the wrapper pattern.

---

## Notes

- This was originally scoped as a 5-scene workshop with a live submission gallery and Apps Script backend. Simplified to two scenes after testing — the value is the kit handoff, not the in-room build experience. The gallery + submission infrastructure was removed.
- An Apps Script deployment (`AKfycbzlfJ3EiXWWDy_nllucqZzGJ5tp1llDiD7uSd0-Yb3v8iNQD9ijKvm_-HquOiGc7rUC7Q`) and its parent script (`17AR8Tsk5j3OYgqvmW1ugqIYZ-UunvAOBPZ-GDEyw5Drclc2sGoIEgKRJ`) are now orphaned. Run `clasp delete-deployment <id>` and/or delete the script project in Apps Script if you want a clean slate.
