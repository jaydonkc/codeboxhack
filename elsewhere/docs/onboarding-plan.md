# Elsewhere onboarding plan

Status: implemented locally September 6, 2026. Welcome and interest selection share one screen, per the approved revision. Physical-device verification remains separate from browser checks and native bundle exports.

## Goal

Help a new user find and save one experience they want to try. Aim for roughly 30–60 seconds to the first useful action; validate that target with testers. Setup completion and the first save are separate milestones, so browsing is always available.

## Flow

**Welcome + interests → Discover → First save**

### 1. Welcome and interests

- Headline: **Welcome. What are you into?**
- Supporting copy: “Pick a few. You can change these anytime.”
- Use the existing choices: **Relax, Active, Hangout, Creative, Learn, Explore**.
- Start with nothing selected for new users. Allow any number of selections; no required minimum.
- Primary action: **Show me experiences**. With zero selections, continue with the general catalog order.
- Secondary action: **Skip for now**. Discard selections from this step and use the general catalog order.
- Keep the green palette and serif headline. Six interest tiles have staggered fade/rise entrances, spring press feedback, and animated selection checks. Continuing fades into Discover. Reduced-motion settings bypass movement.
- Draft selections survive an interrupted session. Android back can leave the app without requiring another setup screen.
- A small “Starting in San Luis Obispo” label sets the catalog scope.

SLO is the only populated catalog today. Location permission belongs to the later **My location** action on the map, where its purpose is clear. Users outside SLO can still browse SLO.

Selections feed the existing interest-based ordering. They must not become strict filters: an interest in art should not hide walks or gardens. Keep budget, duration, and radius in Discover, where the user can adjust them for a particular outing.

### 2. First use inside Discover

- Open the normal Discover list, ordered by the chosen interests.
- Show one dismissible inline prompt above the list: **“See something you’d try? Save it for later.”**
- Keep activity details, prices, map access, and the full catalog available. Avoid a separate recommendation carousel or a blocking tutorial.
- On the first save, dismiss the prompt and confirm **“Saved to Want to try”**, with a **View list** action. Do not force navigation away from browsing.
- If the user dismisses the prompt without saving, leave them in Discover and remember that choice.

The first meaningful outcome is a real saved experience, not a sample entry. Saving expresses future interest; it must not mark an experience as visited or liked.

## Teach the remaining features when they are used

- **First logged visit:** reuse the existing reaction and ranking flow. Ask for comparisons only when another suitable logged experience exists. Never require a new visitor to rate places they have not tried.
- **Nicheness:** explain it when the user opens the existing Niche label. Keep it separate from enjoyment and from whether the user has visited an experience.
- **Location:** request foreground permission only after My location is tapped. Denial, timeout, or an out-of-coverage result must leave a usable path back to the SLO catalog.
- **Lists:** use an empty state that leads back to Discover until the first save.

## Scope for this prototype

The current app has local persistence, an SLO catalog, editable interests, saves, rankings, and maps. It has no account system or real friend graph. This onboarding can ship within those capabilities.

For new installations, default example social data off so a new user does not interpret fixtures as real friend recommendations. Keep the existing About control for demonstrations and preserve existing users’ choice. Keep the disclosure about on-device storage in About.

Defer account creation, profile photos, contact access, friend invitations, notification permission, and a mandatory taste questionnaire. Add account setup when there is a working sync benefit; add friend setup when real connections exist.

## Implementation

- `src/core/storage.ts` owns schema version 2, legacy migration, onboarding transitions, and the serialized writer. The key remains `elsewhere-demo-v1` so existing histories are found. The onboarding record contains version 1, step (`interests` or `complete`), draft interests, and prompt dismissal.
- `src/components/useStoredData.ts` loads before enabling writes. An absent store starts onboarding; an invalid or failed read shows a retry screen without writing defaults. Valid legacy stores bypass onboarding, even when their lists are empty. Failed writes show a retry action and retain the latest in-memory changes.
- `src/components/Onboarding.tsx` presents the single screen; `useReducedMotion.ts` reads and follows the system preference. Interest checkboxes expose native checked state and explicit web ARIA checked state.
- `App.tsx` connects the flow, interest ordering, first-save prompt, and confirmation. View list clears conflicting discovery filters and opens Want to try. Individual saves and guide Save all dismiss the prompt. Existing histories and demo settings are preserved.
- `src/core/storage.test.ts` covers migration, interrupted setup, skip, prompt persistence, corrupt stores, serialized writes, and retry after a failed write.

Before writing Expo code, follow `elsewhere/AGENTS.md` and read its required versioned Expo documentation.

## Acceptance checks

- A fresh install opens directly to interests under the welcome heading; completing or skipping setup survives restart.
- Android hardware back and interrupted-session resume preserve draft choices without trapping the user.
- A legacy store opens the app without onboarding or lost personal data.
- Zero interests produces a useful full list; selected interests change ordering without removing results.
- No location, contacts, or notification prompt appears automatically.
- First save updates Want to try, shows confirmation, and removes the prompt. Dismissal and undoing a save do not restart onboarding.
- Location refusal and unavailable coverage allow continued catalog browsing.
- Failed reads do not overwrite existing data; failed writes provide a retry path.
- VoiceOver labels, selected states, larger text, safe areas, and small-screen scrolling remain usable on iOS and web; check Android back behavior on Android.
- Run the repository’s typecheck, tests, and platform exports. Add focused checks for migration and onboarding transitions, and verify the visible flow on a physical phone; bundling alone is insufficient.

## Evaluate with testers

Record whether each tester reaches Discover, saves an experience, finds that save again, and understands the difference between saving and logging a visit. Measure time to first save and where they hesitate. These are proposed evaluation measures; analytics collection is not currently implemented.

## Validation completed September 6, 2026

- TypeScript check passed; all 45 core tests passed, including 10 storage/onboarding cases.
- Web, iOS, and Android production exports passed after the final keyboard-accessibility change.
- Browser verification used isolated test origins on port 8094. At 390×844, the single screen, selected tile appearance, draft restoration, first-save confirmation, and View list worked. At 320×568, the content scrolled and both completion actions stayed reachable.
- Explicit web checked states and Space/Enter activation worked. Continuing retained all 11 results with interest ordering. Saving, reloading, and unsaving did not restart onboarding or the tip. Skipping discarded draft interests, showed the general catalog, and survived reload. Dismissing the tip without saving also survived reload. No browser console errors were observed.
- Physical iOS/Android interaction, VoiceOver, system reduced-motion behavior, and large-text settings still need device verification. Reduced-motion handling is implemented; this pass did not change the user's system setting to test it.
