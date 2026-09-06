# Elsewhere

Expo / React Native experience-discovery app with Google Places integration and an included San Luis Obispo catalog. See [live discovery setup](docs/live-discovery.md) for credentials, server, and native Google Maps builds. The visual baseline is the approved green Elsewhere mockup and compact Beli-inspired header, with Feed, My lists, Rank, Leaderboard, and You in the bottom navigation. Discover opens from Feed search.

## Run

```sh
npm install
npx expo login --browser
npm start
```

Sign in to the **same Expo account in the CLI and Expo Go on iPhone**, then scan the QR code with Expo Go (SDK 57). This is required by the current iOS Expo Go release; see [Expo's login requirement](https://expo.dev/changelog/expo-go-57-login). Use a phone and computer on the same network. `npm run web` starts the browser version. An Expo development server must remain running for the phone demo.

For demo sessions or Codex-managed startup, use `npm run start:demo` (add `-- --web` for the browser). This skips the standalone Mac React Native DevTools helper, which has crashed during automatic startup on this machine, while retaining project checks and phone discovery. The phone app does not need that desktop helper. `npm start` retains the standard developer-tool startup. The preset uses Expo SDK 57's internal headless option and should be rechecked when upgrading Expo.

## Scope

Real activity listings link to their official sources. Friend identities, community scores, and example guides are fixture data, disclosed in the app's **About Elsewhere** screen. Personal saves, rankings, and awareness responses stay on this device; there is no production backend or account system yet. Routine screens use product copy; data provenance and preview controls live in About rather than repeated footers.

The proposed ranking and nicheness methods are our product design, not Beli's proprietary algorithms.

## Working prototype flows

- Community activities: **Add an activity** creates a concrete outing with audience controls, duplicate checks, visitor-access details, and a rolling creation limit. **Profile → Your activities** manages entries and review status. Unreviewed submissions stay out of Discover; private/friends-only entries stay out of public exports. The development review preview demonstrates limited local trials. See [community activity design and validation](docs/community-activities.md) for the implementation and shared-backend boundary.

- Search 11 researched local activities plus configured live places; filter by admission budget, nicheness, vibe, and suggested duration. Sort by distance from a chosen city or current location; city and distance are separate controls. Filter sections expand on demand, edits are drafts, and Apply commits them. Unknown prices do not satisfy a strict budget.
- Pan and zoom the real map, select activity markers, search the visible area, recenter on your device location with permission, and switch to the same filtered list.
- iPhone uses native Apple Maps through `react-native-maps` in Expo Go and installed builds, with catalog/custom-activity score pins and device location. Google Places results stay in the list rather than appearing as Apple Maps pins. Android uses Google Maps; web uses the Google Maps JavaScript API when configured and Leaflet/OpenStreetMap for owned/catalog entries otherwise. Map tiles require internet. Points have source provenance and precision notes: some identify parks or peaks rather than entrances. Distances are straight-line from Downtown SLO until you use My location; then nearby filtering and distances use the returned device coordinates. Location denial, failure, and timeout leave the map in place and show an error.
- Open an activity's official source or search its venue for access/directions.
- Save Want to Try entries, log a reaction, compare experiences, tie or skip, and view the resulting personal scores in Been. The central Rank action opens a searchable place picker, including Want to try and Been entries. Add a missing place and continue directly to its ranking. Canceling an unfinished comparison does not change the ranking.
- View nicheness scores for all 11 researched activities. The smaller Niche score sits below the enjoyment score, with its method and sources available on tap. Scores represent obscurity or specialization, separately from quality. The optional familiarity answer lives in that score sheet and does not silently change the score. See [nicheness research](docs/nicheness-research.md).
- My lists > Guides automatically groups visited places by city, preserves personal ranking, and updates from visit history. Users do not create or separately reorder guides. Share copies the city ranking and official links; private visit notes are omitted.
- Leaderboard orders members by distinct places visited, with shared positions for count ties, All Members/Friends, and city filters.
- Choose a city from Google autocomplete or use My location. Configured discovery fetches venues around that location, and Search this area fetches new candidates for the visible map. Without configuration, the San Luis Obispo catalog remains available.
- Open a place with a photo header, gallery, venue title, rank/save actions, website/directions links, separate personal/friends/community score circles, nicheness and practical details. Places without photos keep the map header.
- Add up to six photos at a time from the library (or camera on iOS/Android), preview and remove selections, then save. Photos can also be attached while ranking and are saved only with the visit. The gallery supports swiping/previous/next and removing your own photos. Up to 20 uploads per place are stored on this device: image blobs in IndexedDB on web, document-directory files plus a metadata index on native. Photos are resized to at most 1600 px and re-encoded without camera EXIF. Canceling a draft saves nothing. Shared/cloud uploads still require an account and storage backend.
- Configured Google places load photos on demand through the server with photographer credit; each request resolves a fresh photo reference. Google image URLs/references are not added to persisted venue or upload records.
- Open and dismiss menus with independently animated backdrop opacity and measured sheet movement, including reduced-motion support and retained closing content.
- Browse a Beli-style Feed with compact activity posts, enjoyment score circles, friend search and profiles, comments, likes, saves, ranking shortcuts, and copyable shares. Social profiles and posts are examples; feed interactions stay on this device and do not send messages to other people.

## Data and attribution

Bundled venue photos and their author/license links are documented in [photo credits](assets/places/CREDITS.md). They show the actual named venues; uploaded photos are associated with stable place IDs.

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

This is the first working prototype, not a production community service. Authentication, server persistence of user data, real friend reviews, measured niche estimates, live activity availability, revocable hosted guide links, and learned recommendation models remain to build. Multi-city venue discovery is implemented through Google Places and requires configuration. The current recommendation ordering matches stated interests and recorded reactions to activity metadata. Sample social numbers demonstrate the visual treatment and do not represent venue reviews.

## Design alignment: discovery and ranking

Discovery keeps enjoyment prominent and shows a quieter, tappable **Niche** alongside it. Following the product discussion, nicheness means how little-known **or specialized** an experience is. Research estimates use tourism coverage, specialist audience, and deliberate discovery as proxies; they are not measured local awareness or evidence of quality. Cards show one activity type rather than a row of vibe labels; vibes remain in filters.

- Filter an inclusive niche range from 0–10 in the same query used by map and list. The default includes the full range.
- Choose For You, Enjoyment (selected Friends/Everyone audience), Nicheness (ascending or descending), Distance, or Price. Unknown values sort last. Been preserves personal ranking, including distinct ranks with identical rounded scores.
- For You combines metadata, interests, reaction/ranking history, and available social evidence using the design's 60/25/15 starting weights and friend-count shrinkage. Missing components are omitted and weights renormalized. A small reordering step varies adjacent activity types. Nicheness never boosts this score.
- Familiar discovery includes liked/repeat-worthy experiences and matching new activities; a disliked repeat is not included merely because its vibe matches. New to you excludes logged experiences.
- Social evidence still comes from the disclosed demo fixture. Turning off Example social scores removes those scores from display and recommendation ordering.

This pass does not complete the entire proposed MVP. Accounts, real social aggregates, hosted/revocable guide links, occurrence/date filtering, richer activity-specific catalogs, survey sampling, and more sophisticated exploration allocation remain implementation work. The decision to combine obscurity and specialization supersedes the original awareness-only definition; a future awareness survey measures only the obscurity component.

### Compact list prototype

Place names now lead the discovery and personal-list rows. Enjoyment uses the prominent score circle; Niche is the smaller secondary score. Method/provenance details remain available behind the niche score and in About.

The requested placeholder update adds seven personal rankings, four saved places, automatic city guides, and Jacob/Usman profiles and feed posts. A one-time local migration adds missing sample entries without overwriting existing preferences or notes. These profiles, opinions, and personal-history entries are fictional demo data.

## UX audit

See [the feature comparison](docs/beli-comparison.md) for observed Beli behavior, adopted interactions, intentional experience-specific differences, and remaining gaps. Routine screens use short functional labels; preview provenance remains in About.
