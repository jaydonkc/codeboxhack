# Beli / Elsewhere UX audit

Reviewed September 6, 2026. The direction is a compact social ranking app: short labels, place names, scannable lists, and actions where people expect them. Elsewhere keeps its green identity and the experience-specific dimensions of nicheness, duration, cost, and access.

## Evidence and scope

The current Beli app was inspected through iPhone Mirroring: My Lists, filters, City, search, Feed, Guides, profile, and Leaderboard. The observed list filter offered Score / Distance / Date added, expandable facets, and Clear all / Apply. Distance was an ordering option in that sheet; a radius slider was not observed there. This does not establish that Beli has no radius control anywhere else.

Beli's [developer description on the App Store](https://apps.apple.com/us/app/beli/id1478375386?platform=ipad) also identifies ranked lists/maps, a friend feed, notes, tags, a taste profile, recommendations, and friend match scores. Apple's [editorial walkthrough](https://apps.apple.com/us/iphone/story/id1862619357) confirms the reaction-and-comparison interaction. No Beli ratings, posts, follows, bookings, or account changes were submitted during this review. Its private scoring and recommendation algorithms are not available to inspect.

This audits every current Elsewhere surface and the major Beli capabilities relevant to it. It does not claim exhaustive access to Beli's experiments, paid features, or all account states. Adopted means an interaction exists in this local prototype, not that a production social service exists.

## Navigation and discovery

| Feature | Beli baseline / rationale | Elsewhere decision and implementation | Remaining limitation |
|---|---|---|---|
| Bottom navigation | Separate social activity, personal lists, adding/ranking, competitive counts, and profile. | Feed / My lists / central Rank / Leaderboard / You. Rank is an action button; other items are destinations. | Profile is a local identity, not an authenticated account. |
| Discover entry | Search is accessible from Feed; ordinary discovery should not need a second competing home structure. | Feed place search opens Discover. Back returns to Feed. Nearby opens its map. | Place and member search remain distinct flows; no universal search result page. |
| Screen heading | A useful heading identifies the current surface. | Discover, My lists, Profile; compact Elsewhere wordmark on Feed. Removed repeated “Experiences,” duplicate city lines, and decorative introductions. | No remaining marketing header is needed. |
| Search | Place query and location are separate. | Search places input; city selector in Discover header. Local search is immediate; configured live discovery submits a query to the selected area. | Live city/venue coverage requires provider configuration. |
| Discovery modes | Recommendations should reduce decision effort. | For you, New to you, Favorites. Removed the separate row of overlapping quick actions. | Favorites currently includes liked/repeat-worthy places and relevant new ones; this is broader than a strictly saved-favorites list. |
| Recommendation order | Beli's public product uses taste and social evidence; internals are unknown. | Existing heuristic uses interests/history and available social scores, varies activity types, and keeps niche independent. | Fixture opinions and a heuristic do not establish recommendation quality or Beli-equivalent personalization. |
| Discover promotions | Promotions interrupt the list's core purpose when they are unrelated to the query. | Removed Emma's city-guide teaser and its fake notification route from Discover. Friends' guides remain attached to their actual feed/profile surfaces. | No replacement promotion. |
| Result rows | Compact place names, metadata, score, and separators. | Place title, type/price/city/distance, prominent enjoyment circle, smaller Niche value below, and save action. No activity-tag strip or recommendation paragraph. | Venue-specific images are not broadly available; no unrelated images are substituted. |
| Score audience | People need to know whose opinion a score represents. | Friends/Everyone selector applies to discovery and saved-list enjoyment. Been shows the user's own score. Accessible labels identify the score source. | Social values remain disclosed examples. |
| Empty states | A short state and useful recovery are sufficient. | “No places found,” clear filters, change/search location, or Add a place. Removed “Your next story starts here” and similar copy. | Offline/error and missing-provider states still need clear messages. |

## Lists, sorting, filters, and map

| Feature | Beli baseline / rationale | Elsewhere decision and implementation | Remaining limitation |
|---|---|---|---|
| Personal lists | Been, Want to Try, Recs, Guides, More were visible. | Been / Want to try / Guides. Recommendation browsing stays in Discover rather than duplicating it in every list. | No extra “More” tab until there are useful additional lists. |
| Personal ranking | A filtered view must preserve the actual preference order. | Been uses global score/rank with shared positions for actual ties; distance/niche/price views never rescore the subset. | Reliable date-added sorting requires new timestamps; old entries have no trustworthy dates. |
| Sort picker | Score, Distance, Date added were observed. | Concise selection rows for For you, Enjoyment, Nicheness, Distance, Price. Been labels its score order “Your ranking.” | Date added is explicitly absent rather than based on array order. |
| Nicheness direction | No Beli equivalent verified. | Adjacent High to low / Low to high button when sorting by Nicheness. Unknown values stay last. | This is an intentional Elsewhere addition. |
| Distance | Nearest sorting is separate from city/current-location selection. | Distance opens Nearest first, Current location, Change location. The old radius slider is gone. Values are miles from the chosen origin, not travel time. | No route-time estimate or arbitrary visible radius slider. Live searches still have a bounded fetch area internally. |
| City filtering | Searchable City and Current Location were observed. | Discover chooses the search origin. Been/Want to try can filter their existing entries by city or All cities without changing discovery geography. | Neighborhood/country facets need normalized catalog geography. |
| Filter organization | Expandable facets keep a large sheet manageable. | Sort by, City for personal lists, Nicheness, Price, Duration, Good for are expandable with a current-value summary. Specific chips open their relevant section. | Category taxonomy needs more than a handful of ad hoc activity types before adding another facet. |
| Apply / cancel | Beli has Clear all and Apply. | Changes are drafts. Apply commits; dismiss discards. Clear all resets the draft. Both footer actions remain available while scrolling. | Search text is deliberately retained by Clear all inside the filter sheet. |
| Niche range | User explicitly prefers numeric sliders here. | Independent min/max sliders with constrained endpoints, full 0–10 default, and Mainstream/Niche ends. | Beli's observed score thresholds are not presented as evidence for these sliders. |
| Price | Restaurant dollar tiers are coarse for experiences. | Numeric per-person maximum, Free at zero, Any at the end. Unknown prices fail a finite cap. | Booking fees, parking, equipment and package costs can differ; venue details retain actual notes. |
| Duration | Activities require more time planning than restaurants. | Numeric suggested-duration maximum with an Any endpoint. | Suggested duration is not an opening hour or bookable time slot. |
| Good for | Beli uses named facets and tags. | Categorical Relax/Active/Hangout/Creative/Learn/Explore options remain inside filters; no scattered row tags. | Group size, accessibility, age suitability, indoor/outdoor and intensity require supported data. |
| Map/list placement | Floating View Map and View List were observed. | Floating map/list action above the navbar. The same filtered results, selected marker, and search origin are retained. | Owned/catalog places have a working Leaflet/OpenStreetMap web fallback and Apple Maps iPhone fallback. Live Google pins need their configured map provider. |
| Map movement | Searching a visible area is a concrete geographic action. | Search this area selects the visible bounds; reset removes them. Device recenter handles permission failures. | No invented coordinates for manually added places. |

## Ranking and place details

| Feature | Beli baseline / rationale | Elsewhere decision and implementation | Remaining limitation |
|---|---|---|---|
| Rank entry | Adding a visit is a primary action. | Center Rank opens place search, prioritizes unranked and saved places, and supports existing Been entries for reranking. | No batch import of past visits. |
| Missing place | Users should not be blocked by an incomplete catalog. | Add a place requires name and city; activity type/description are optional. From Rank it continues straight to the reaction flow. Removed raw latitude/longitude fields from the ordinary form. | A manually added place is local; missing costs, niche scores and coordinates stay unknown. |
| Reaction | Public Beli walkthrough shows liking and then comparing. | Liked it / It was okay / Didn't like it, followed by pairwise comparisons. Short headings and concise place metadata replace decorative copy and duplicate titles. | Elsewhere owns its ranking algorithm. |
| Comparison | A concrete choice is easier than inventing a precise number. | Which did you enjoy more? Two places, About the same, Can't compare. Skips do not imply dislike, and unresolved placement can be saved for later. | No claim that the exact question cap or score bands match Beli. |
| Completion | Show the result and the next useful action. | Your score, optional note, repeat preference, Save to Been. Starting from central Rank returns to Been after saving. | Comparison cancellation does not save a new rating; adding a missing place itself saves that place to Want to try. |
| Detail hierarchy | Venue first, direct save/rank and practical actions. | Map, place title, type/city/time/price, Rank/Want to try, source/directions/map, personal/friends/everyone scores. | No live booking availability implied. |
| Niche presentation | Different angle from Beli, without competing with enjoyment. | Compact Nicheness row. Tap for number, short scale definition, expandable method/sources, optional familiarity response. Removed the always-expanded research paragraph and familiarity questionnaire. | Scores are editorial research; source/date/confidence remain inspectable. Unresearched live places show a dash. |
| Practical details | Hours/access affect whether the plan works. | Visit details retains schedule, admission and location notes. Description is expandable; ordinary detail tag chips removed. | Multiple sessions at the same venue, event dates, cancellations and freshness still need an occurrence model. |
| Notes | Beli offers notes/favorite dishes. | Private visit notes and “I'd do this again”; guide shares omit private notes. | Dish-specific inputs do not map directly to mixed experiences. Public review authoring needs an account model. |
| Sharing a place | Share a concrete useful reference. | Place, city and official source, with Copy experience. Removed the share slogan and duplicated place name. | Not a hosted in-app deep link with visibility controls. |

## Social, guides, and profile

| Feature | Beli baseline / rationale | Elsewhere decision and implementation | Remaining limitation |
|---|---|---|---|
| Feed | Compact friend posts, requests, recommendations and search were observed. | Dedicated Feed; concise search/member entry, Nearby recommendations, posts with rank/save/like/comment/share actions. Jacob and Usman are present. | Example posts and local actions do not message real people. |
| Comments | Stay focused on the discussion. | Comments retain the post context and replies. The redundant “Mentioned in this plan” place list was removed in the preceding pass. | No synced multi-user thread or moderation service yet. |
| Member search and profiles | A social app needs people lookup separate from place search. | Member search through the people control, friend profile sheet, follow control and city guide links. | Fixture identities and local following state. |
| Recommendation requests | Asking friends is useful when preferences are specific. | Existing local request/composer and comment flow remain. | Not delivered to real friends without account/backend support. |
| Automatic city guides | City-ranked histories fit this product; the user explicitly rejected manually created lists. | My lists > Guides automatically groups visits by city, keeps personal rank, and updates from visit history. Friend guides use the same model. | This intentionally omits Beli's custom-guide authoring. |
| Guide presentation | A guide should explain which city and whose order is shown. | City cover, owner, compact ranked entries, map and share. Removed lifestyle guide naming. | Current sharing copies text; hosted, revocable links remain unimplemented. |
| Profile | Identity and useful counts should lead. | Actual authorized profile image, Jaydon/@jaydonkc, clickable Been/Want to try/Guides counts. Interests are expandable; Location and About are simple rows. | Profile editing/sharing, taste analysis and a meaningful match score need persisted account data. |
| Leaderboard | Beli has Been plus other metrics. User requested places visited only. | Dedicated Leaderboard counts distinct visited places; tied counts share a rank. All Members/Friends and city filters, with member/profile/guide navigation. | Other members' visit histories are seeded. Influence/Notes/Photos competitions are omitted. |
| Notifications | A bell should show actual relevant events. | Removed the bell that only opened a static Emma guide. | Real notifications need delivery, read state and preferences. |
| Preview labels | Data provenance belongs somewhere users can inspect, not on every normal control. | No “sample collection,” “sample” city suffix, “make it your kind of day,” or similar routine copy. About explains example data, local persistence and editorial niche scoring. | Provenance is still necessary; removing its repeated labels does not make fixtures real reviews. |
| Goals, streaks, recaps, invites | Observed in Beli, but not necessary to a usable core loop. | Not added to this pass. | Add only after real visit history and account support. |
| Reservations, order, Gmail import | Restaurant-specific commerce/import controls were visible; import was not exercised. | Official venue sources and directions remain the useful common actions. | Session booking, calendar import and occurrence availability should be designed for experiences; no fake reservation controls. |

## Verification

- TypeScript validation and all 50 automated tests pass, covering ranking/ties/skips, niche sort directions, geographic filtering, unknown prices/coordinates, guides, unique-visit leaderboards and provider request boundaries.
- Browser checks passed for Feed entry, Discover copy, filter cancel/apply/reset, free-only results, niche direction toggling, distance-sorted Been retaining global ranks, city filtering, marker keyboard selection, map-area/list consistency, place details, central Rank, comparisons/ties, adding a missing place, save-to-Been, reload persistence, automatic guides, and exclusion of private notes from guide shares. Mutating ranking checks used a separate test origin.
- Web, iOS and Android exports pass. The coordinated native check verified Feed and the visits Leaderboard on the real iPhone; that does not establish full device parity for every control.
- Browser map tiles and markers work without a Google key through the restored Leaflet/OpenStreetMap fallback for owned/catalog data. Configured Google results remain on Google maps. Live provider queries and native Google pins still need credentials/build configuration.

## Next work that changes real usefulness

1. Accounts, synced visit history, real friend opinions, and permission-aware sharing.
2. Session/occurrence data: date, booking, cancellation, fresh hours, actual total cost, and suitability.
3. Trustworthy save/visit timestamps for Date added and visit-history editing.
4. Normalized activity categories and geography; then richer filter facets.
5. Evaluate recommendation quality and niche research coverage rather than presenting unsupported predicted scores or match percentages.
