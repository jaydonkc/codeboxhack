# Elsewhere

Expo / React Native prototype for discovering experiences in San Luis Obispo. The visual baseline is the approved green Elsewhere mockup and compact Beli-inspired header, with Discover, My lists, Friends, and You in the bottom navigation.

## Run

```sh
npm install
npx expo login --browser
npm start
```

Sign in to the **same Expo account in the CLI and Expo Go on iPhone**, then scan the QR code with Expo Go (SDK 57). This is required by the current iOS Expo Go release; see [Expo's login requirement](https://expo.dev/changelog/expo-go-57-login). Use a phone and computer on the same network. `npm run web` starts the browser version. An Expo development server must remain running for the phone demo.

## Scope

Real activity listings link to their official sources. Any friend identities, reviews, and guides used to demonstrate social features are explicitly sample data. Personal saves, rankings, and awareness responses stay on this device; there is no production backend or account system yet.

The proposed ranking and nicheness methods are our product design, not Beli's proprietary algorithms.

## Working prototype flows

- Search 11 real activities; filter by admission budget, approximate radius, vibe, and suggested duration. Unknown prices do not satisfy a strict budget.
- Pan and zoom the real map, select activity markers, search the visible area, reset to SLO, and switch to the same filtered list.
- Native uses `react-native-maps` (Apple Maps on iOS); web uses Leaflet and OpenStreetMap tiles. Map tiles require internet. Points have source provenance and precision notes: some identify parks or peaks rather than entrances. Distances are straight-line from the explicit Downtown SLO origin, not the user's position or route length.
- Open an activity's official source or search its venue for access/directions.
- Save Want to Try entries, log a reaction, compare experiences, tie or skip, and view the resulting personal scores in Been. Load sample history from You to demonstrate comparisons immediately; this is allowed only with an empty history.
- Record an optional familiarity answer on this device. Nicheness remains Unknown because there is no measured city cohort. Review counts never stand in for familiarity.
- Build a city guide from completed rankings, reorder it, add separate guide notes, preview, and copy its text and official links. Private visit notes are omitted.
- Set local/travel context and planning dates. Dates are stored for planning; they do not yet filter live availability. SLO is the only current destination.

## Data and attribution

`src/data/slo.json` records official venue, city, Cal Poly, and Visit SLO sources checked September 5, 2026. `src/data/geocodes.json` retains geocoding provenance. Vibes and durations are editorial planning labels. The Botanical Garden is outside downtown; admission can have additional parking costs. The History Center has conflicting official hours, documented on its detail screen.

Map data: © OpenStreetMap contributors, geocoding by Nominatim, except the arboretum's coordinate published by Cal Poly. City photo: **Photo: Visit SLO**, from [the official image gallery](https://visitslo.com/image-gallery/), with requested attribution. It is used as SLO scenery, not as a verified photo of a specific experience.

## Validate

```sh
npm run typecheck
npm test
npx expo export --platform web --platform ios --platform android
```

Browser flow checks cover real tiles and markers, map-area filtering, detail navigation, comparison ranking, and local persistence. Native bundle export verifies bundling; it does not replace testing on a physical phone.

## Next implementation boundaries

This is the first working prototype, not a production community service. Authentication, server persistence, real friend reviews, measured niche estimates, live availability, multiple-city catalogs, revocable hosted guide links, and learned recommendation models remain to build. The current recommendation ordering matches stated interests and recorded reactions to activity metadata. Sample social numbers demonstrate the visual treatment and do not represent venue reviews.
