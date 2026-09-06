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

Real activity listings link to their official sources. Friend identities, community scores, and example guides are fixture data, disclosed in the app's **About Elsewhere** screen. Personal saves, rankings, and awareness responses stay on this device; there is no production backend or account system yet. Routine screens use product copy; data provenance and preview controls live in About rather than repeated footers.

The proposed ranking and nicheness methods are our product design, not Beli's proprietary algorithms.

## Working prototype flows

- Search 11 real activities; filter by admission budget, approximate radius, vibe, and suggested duration. Unknown prices do not satisfy a strict budget.
- Pan and zoom the real map, select activity markers, search the visible area, recenter on your device location with permission, and switch to the same filtered list.
- Native uses `react-native-maps` (Apple Maps on iOS); web uses Leaflet and OpenStreetMap tiles. Map tiles require internet. Points have source provenance and precision notes: some identify parks or peaks rather than entrances. Distances are straight-line from Downtown SLO until you use My location; then nearby filtering and distances use the returned device coordinates. Location denial, failure, and timeout leave the map in place and show an error.
- Open an activity's official source or search its venue for access/directions.
- Save Want to Try entries, log a reaction, compare experiences, tie or skip, and view the resulting personal scores in Been. Load sample history from About Elsewhere to demonstrate comparisons immediately; this is allowed only with an empty history.
- Read editorial nicheness estimates for all 11 activities. Each score links to its research and explains how far the activity sits outside SLO's usual visitor circuit. These are labeled estimates, not measured community awareness; review counts are not used. The optional familiarity answer is stored separately and does not silently change the research estimate. See [nicheness research](docs/nicheness-research.md).
- Build a city guide from completed rankings, reorder it, add separate guide notes, preview, and copy its text and official links. Private visit notes are omitted.
- Choose a search city from the header or menu. Only SLO has catalog entries; other cities show an empty state. My location searches the existing catalog nearby and does not fetch new venues.
- Open an activity detail page modeled on the Beli restaurant page inspected through iPhone Mirroring: map header, venue title, rank/save actions, compact website/directions links, separate personal/friends/community score circles, nicheness and practical details. No unrelated or fabricated venue photos are used.
- Open and dismiss menus with independently animated backdrop opacity and measured sheet movement, including reduced-motion support and retained closing content.
- Browse a Beli-style Friends feed with compact activity posts, enjoyment score circles, friend search and profiles, comments, likes, saves, ranking shortcuts, and copyable shares. Social profiles and posts are examples; feed interactions stay on this device and do not send messages to other people.

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
