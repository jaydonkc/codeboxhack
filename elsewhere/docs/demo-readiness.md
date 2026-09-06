# Demo integration review — September 6, 2026

The demo includes the app changes from `codex/fix-app-bugs`, plus the completed
onboarding, guide-library, activity-photo, visit-date, filter, and bottom-navigation
work. The original local checkpoint `2d4b0d1` remains available as a backup. Its
8,473 machine-generated iOS build files and presentation/video outputs are not
part of the app integration.

## Verified

- `npm run typecheck`: passed.
- `npm test`: 45 tests passed, including ranking, tie/skip behavior, visit metadata,
  local-date handling, legacy storage migration, interrupted onboarding, ordered
  writes, and save retries.
- `npx expo export --platform web --platform ios --platform android`: passed.
- A separate browser origin was used for test data. At phone width, checked
  onboarding, reload persistence, saving, list recovery after conflicting search
  filters, real-photo navigation and source credits, visit-date selection, first
  rating, comparison ranking, and personal-guide creation.
- A liked first visit scored 8.4. Adding a preferred second experience produced
  8.9 and 7.8, persisted after reload, and generated the guide in that order.
- Private visit notes were absent from the guide's share preview.
- The guide task verified all four example guides, guide search, Save all,
  selected-guide maps, share contents, and guide → activity → guide navigation.
- The exported web build loaded successfully, rendered real map tiles and activity
  markers, and exposed map-area search after zooming. No browser errors or warnings
  were recorded in that production smoke check.

The review also fixes low-contrast native location errors and web map warnings
that previously disappeared when failed tile requests finished. Generated local
build products are now ignored by Git.

## Short demo path

1. Start Metro from `elsewhere` with `npm start`. Keep it running for Expo Go.
2. On a fresh install, select interests and continue, or use Skip for now. Existing
   users retain their history and skip onboarding.
3. Save an experience, then use My lists to show Want to try.
4. Use the center **+** to find and log an activity. Log a second liked activity to
   show the side-by-side comparison and resulting scores in Been.
5. Open Guides → My guide → Create my guide to turn ranked favorites into a guide.
   Preview sharing to show its ordered places and official links.
6. For the example community scores and four example guides, enable **Open menu →
   About Elsewhere → Example social data**. New installs leave examples off.
   Add example visits is available there only when visit history is empty.
7. Show Nearby map, zoom/pan, and Search this area. Internet is needed for tiles.

## Remaining device check

Web interaction checks and native bundle exports are complete. A physical-phone
walkthrough was not performed in this review. Before presenting, open the latest
bundle in Expo Go and check map rendering, foreground-location permission, the
keyboard in visit notes, and the onboarding/sheet transitions on the demo phone.
The app remains a local prototype: saved data is on-device; social profiles and
scores are examples; there is no production account or community backend.
