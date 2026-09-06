# Elsewhere and Beli — usability review

**September 6, 2026. Finalized with the evidence collected through 07:55 PDT, following the user's instruction to finish with the available results. Google API activation/configuration is excluded. Native Elsewhere launch was blocked by Expo CLI sign-in; unexecuted cases are identified below.**

The main fixes were subsequently implemented. See the [implementation and verification follow-up](./usability-fixes-implementation.md); the observations below describe the earlier reviewed build.

Elsewhere has a working local discovery and ranking prototype. Search, filtering, personal ranking, save/unsave, photo storage, city guides, and the example social flows worked in the tested web build. It is not yet a shared multi-user product: the identity, friends, community scores, and initial visits are examples; personal changes and photos live on the device/browser.

Use Beli's compact list rows, direct sorting, searchable filter sections, quick reset, and metadata-first visit form. Keep Elsewhere's separate enjoyment, nicheness, and new-to-you concepts, its experience-specific price/duration filters, and automatic city guides. These are useful differences. Do not copy reservation/order integrations, invite rewards, or paid guides into the hackathon scope before the basic experience works reliably on a second phone.

## What the evidence means

- **Pass**: performed the interaction and observed the expected result. Elsewhere passes below are local prototype passes unless stated otherwise.
- **Friction**: the feature works but causes extra work, ambiguity, or a misleading result.
- **Partial**: tested the stated portion; a named boundary remains.
- **Observed**: the control/screen was visible, but its behavior was not exercised.
- **Blocked**: live testing could not continue because access was unavailable.
- **Absent**: no implementation/control found in the inspected Elsewhere UI and source inventory. This is not necessarily a request to build it.

The inventory covers 99 Elsewhere and 76 Beli feature/control groups. Equivalent repeated controls are grouped by feature. This does not claim that every restaurant row, every data combination, or every destructive/account/payment action was executed. Beli tests use an existing real account; drafts were used to inspect creation flows without posting fictional reviews or sending invitations. No Beli review, guide, follow, like, booking, purchase, or message was submitted by this review.

### Build and environment

| Item | Evidence |
|---|---|
| Elsewhere checkout | `1f9b181abb147c6623cc4a782a7b86622fb7e5fb`, plus uncommitted photo work from the other task |
| Frozen reviewed export | `/private/tmp/elsewhere-usability-review-export`, served on `http://127.0.0.1:4179/` |
| Web bundle | `index-5b7110f3c1fa8daecd662d844758ada0.js`; SHA-256 `780acda5dd5a606942dc1d982913a5bebe3f4ab237d0ed0daebfd93ba26e0cea` |
| Primary live UI | Codex browser, then Chrome for external-link verification |
| Responsive checks | 390×844, 320×568, 1280×800; viewport override restored afterward |
| Early social checks | Existing port 8083 origin; later tests used disposable port 4179 state |
| Beli | Installed, authenticated iPhone app through iPhone Mirroring; installed version not read |
| Physical Elsewhere | Launch attempted in Expo Go; blocked before app start because phone account is signed in but Expo CLI is not. `npx expo whoami` confirmed Not logged in. Native exports are build evidence only. |
| TypeScript | `npm run typecheck` passed |
| Automated tests | `npm test`: **56 passed, 0 failed** |
| Builds | Combined web, iOS, Android export passed |
| Browser errors | No warning/error console entries captured in the frozen-browser pass |
| Change isolation | Review did not modify implementation files or the separate Google API task |

The check log is [elsewhere-beli-review-checkpoint.md](/Users/jaydon/Documents/ChatGPT/codeboxhack/elsewhere/docs/elsewhere-beli-review-checkpoint.md). Evidence labels below refer to recorded live observations in that log/session. E16–E19 were discarded as fresh-origin evidence because an earlier snapshot helper still pointed at the old tab.

## Elsewhere feature and button inventory

### Navigation, discovery, and filters

| Feature / controls | Result and usability | Decision |
|---|---|---|
| Feed / My lists / Rank / Leaderboard / You navigation | **Pass.** All destinations opened. Rank is a central action rather than a page. Persistent bottom navigation is understandable. | Keep. |
| Feed search, Discover search icon, Back to feed | **Pass.** Opens discovery; search shortcut enters list view. | Keep one obvious search entry; avoid duplicate icons without a distinct purpose. |
| Fresh start / identity | **Friction.** Immediately opens as Jaydon with 7 example Been and 4 example Want entries. About explains the examples, but the first impression resembles real account data. | Add an explicit demo entry/reset or real onboarding; do not call this account readiness. |
| Search experiences | **Pass.** Garden query returns two matches; nonsense query gives an explicit empty state; clear restores eleven. | Keep live local filtering. |
| For you | **Pass, local logic.** Ordered recommendations render; preferences contribute to sorting. No evidence that recommendation quality is validated with real users. | Keep, then evaluate with actual user choices. |
| New to you | **Pass.** Four unvisited catalog entries remain after excluding the seven example visits. | Keep separate from quality and nicheness. |
| Favorites | **Friction.** Returns eight entries, including never-visited Botanical Garden, History Center, and Downtown. Source confirms it also includes interest/category matches. | Rename to “More like your favorites,” or restrict to explicitly liked/repeat places. |
| Result rows | **Pass.** Venue, activity, city, distance, price, enjoyment, small niche score, and save control are readable; opening the row reaches the right detail. | Keep Beli's compact information hierarchy. |
| Friends / Everyone score selector | **Pass.** Switch changes scores and explicit Enjoyment order. | Keep, but make example provenance visible before real social data exists. |
| Filters sheet / disclosure sections | **Pass.** Opens relevant section from Price/Nicheness shortcuts. Applied state and draft state are separate. | Keep the Beli-style expandable sheet. |
| Apply / close / cancel draft | **Pass.** Price draft changed to Free, dismissed, reopened as Any; Apply commits. | Keep cancel semantics. |
| Clear all | **Friction.** Clears the draft but needs Apply to clear actual results. Beli's Clear all immediately resets and closes. | Adopt Beli's one-action reset. |
| Clear filters from empty state | **Pass.** Restores the eleven default results. | Keep. |
| Price slider | **Pass.** Keyboard Home reaches Free; Any at the top endpoint removes the cap. Free yields four known-free entries; unknown prices are excluded with an explanation. | Keep explicit per-person values instead of restaurant-only dollar tiers. |
| Minimum / maximum nicheness sliders | **Pass.** Both endpoints work; moving past the other endpoint clamps the pair. Range 0–0 produces empty results and recovers with Clear filters. | Keep full 0–10 default; improve only if two sliders confuse phone users. |
| Duration slider | **Pass.** Fifteen-minute limit returns Bubblegum Alley; no-limit endpoint available. | Keep for experiences. |
| Good for: Relax, Active, Hangout, Creative, Learn, Explore | **Pass.** Each toggled on/off and appears in summary. | Keep six concise categories before adding a large taxonomy. |
| Sort: For You / Enjoyment / Niche / Distance / Price | **Pass.** Every sort exercised. Enjoyment descending; price free first/unknown last; distance ascending; niche ordering correct. | Keep concise direct chooser like Beli. |
| Niche High to low / Low to high | **Pass.** 7.8→0.8 reverses to 0.8→7.8. | Keep explicit direction. |
| Distance sheet / Nearest first | **Pass.** Identifies the SLO origin and straight-line miles; Nearest first applies correctly. | Good disclosure; simplify duplicated sort entry if the sheet adds no user value. |
| City picker / city query / SLO selection | **Partial.** Local SLO selection and empty search state work. Live city lookup depends on excluded Google setup. | Keep a usable local demo path. |
| Current location / Use my location / My location | **Blocked.** Browser permission/location attempt overlapped a Mac lock; no coordinates acquired. Phone check remains. | Verify success, denied, timeout, retry and retained-origin behavior on the actual phone. |
| Recs Nearby shortcut | **Friction.** Opens discovery map but retains For You sort and the selected origin. It does not itself prove GPS was requested or nearest order applied. | Make the label's promise explicit: nearby origin plus suitable ordering. |
| Add a place from discovery | **Pass.** Opens the same custom-place form as ranking. | Keep manual recovery for missing places. |
| Live search Retry / Load more / provider attribution | **Excluded integration; source inventoried.** Visible only in the provider-enabled path. | Verify in the Google task; this review does not certify them. |

### Maps and place details

| Feature / controls | Result and usability | Decision |
|---|---|---|
| View map / View list | **Pass.** Real OSM tiles and markers render in the local web mode; results remain consistent when toggling. | Keep. |
| Map pins, mouse | **Pass.** Arboretum pin selects the correct card. | Keep selected pin/card linkage. |
| Map pins, keyboard | **Pass.** SVG markers have labels, role button and tabindex0; Enter on Skate Park selects its card. | Keep. A normal DOM snapshot omitted the SVG buttons; this was not an app defect. |
| Zoom in / Zoom out | **Pass.** Viewport changes; subsequent area search changes the result set. | Keep. |
| Search this area | **Pass on Discover.** Zoomed area returns 9; list also returns 9; zoom out/search restores 11. | Keep. |
| Map gestures / recenter | **Partial.** Zoom controls tested; native pan/pinch and GPS recenter were not tested. | Retest physically. |
| Places missing coordinates | **Friction / confirmed defect.** QA-city list counts 1 place; its map shows no pin/card and no missing-coordinate notice. Detail Map jumps to unrelated SLO results. | Disable/replace the action when location is unknown; show list-only count and explanation. |
| My lists map area controls | **Friction.** Carries “map area” context across navigation even though list filtering ignores discovery bounds. | Scope area-search UI to the views it actually filters. |
| Place hero photo / title / practical metadata | **Pass.** Correct venue, duration, price, source credit, reaction/save controls. | Keep. |
| Main row / Your score / Rank again / More→Edit ranking | **Pass.** All lead into ranking for the selected place. | Keep shared behavior; provide direct metadata editing separately. |
| Save / Unsave / Want to try / More menu equivalent | **Pass.** Changes state; undo and persistence verified. | Keep single-tap save. |
| Website | **Pass in Chrome.** Bishop Peak opens its official city document. IAB did not expose the external destination; Chrome resolved that verification gap. | Keep explicit official source. |
| Directions / Get directions | **Partial.** Opens Google Maps place search for the correct named place/city. It does not open an already selected route. | Use a route destination link when reliable; otherwise label “Open in Maps.” |
| In-app Map from a known place | **Pass for map selection path; missing-coordinate defect above.** | Preserve the selected place and a clear return path. |
| Your / Friends / Everyone scores | **Pass, demo values.** Personal score differs appropriately from fixture social scores. Missing community data stays absent on the custom place. | Keep separation; avoid presenting example values as live consensus. |
| About disclosure | **Pass.** Expands readable description. | Keep secondary information collapsed. |
| Hours & access / Admission / Location | **Pass as display.** Shows uncertainty and source caveats. No live hours availability certified. | Keep concise practical facts, with detail available when needed. |
| Share experience / Copy to share | **Pass.** Preview and copied text identify correct venue/city/source. Private visit note excluded. | Keep preview; add a stable shareable app URL when backend exists. |
| More menu / close | **Pass.** Rank, save, map, official website and city guide actions present. | Add visit edit/delete instead of relying on reranking. |
| Back to results / guide→detail→back | **Pass.** Returns to the right source view/guide. | Keep; preserve scroll/filter context where possible. |

### Ranking, visit records, and photos

| Feature / controls | Result and usability | Decision |
|---|---|---|
| Rank picker / search / clear / empty state | **Pass.** Saved/visited choices, local match, nonsense query and manual-add recovery work. | Keep. |
| Custom place name / city / optional activity / description | **Pass.** Required name/city validation works; custom item stores without invented coordinates, social scores or niche score. | Keep; add location resolution later. |
| Cancel new ranking | **Pass with nuance.** Does not add a visit. A place already created by Continue remains in Want to try. | Tell users what Continue creates, or create the place only on final confirmation. |
| Liked / Okay / Disliked | **Pass.** All three reactions reached; change reaction before saving works. | Keep Beli's three-reaction entry. |
| Comparison: new place / existing place | **Pass.** Both choices affect the opponent sequence and resulting order. | Keep. |
| About the same | **Pass.** Saved 8.8 tie produces rank 2 / rank 2 / next 4. | Keep explicit ties. |
| Can't compare | **Pass.** Skips the current opponent without fabricating a preference. | Keep. |
| Rank later / Finish ranking | **Pass.** Skipping unresolved comparisons saves a visit without a numeric score; Finish ranking resumes. | Keep this useful recovery path. |
| Save / Cancel after preview | **Pass.** Final QA rank 8.1 saved; canceled sessions do not overwrite the visit. | Keep final review before commit. |
| Notes | **Pass storage; friction editing.** Note survives saves/reload and is omitted from tested public share text. Editing requires reaction/comparisons again. | Adopt Beli's direct notes/metadata form. |
| “Would do again” switch | **Pass visually; accessibility defect.** Value persists, but the switch has no accessible name in the tested DOM. | Add an explicit label. |
| Edit your visit | **Friction.** Opens reaction chooser, then comparisons, then metadata. | Make Edit open metadata immediately; offer “Change ranking” separately. |
| Delete visit / unmark Been / delete custom place | **Absent.** No visible recovery control in detail, More, list, profile or inspected source. | Add delete/unmark with confirmation/undo before broader use. |
| Repeat visits / visit dates / companions / custom labels | **Absent.** One preference record and note per place; no visit history or metadata controls equivalent to Beli. | Add visit date and direct note editing first; defer companions until real accounts exist. |
| Photo thumbnails / hero opens gallery | **Pass.** Correct place and count; full-screen gallery opens. | Keep. |
| Previous / Next / boundaries | **Pass.** Moves between photos; disabled at either end. | Keep. Native swipe was not tested. |
| Choose photos / multi-select / Add more | **Pass for browser picker.** Multiple images accepted, previews shown. | Keep; phone library was not tested. |
| Remove selected preview / close draft | **Pass.** Removes selected item; canceled draft reopens empty. | Keep. |
| Save photos / persistence | **Pass.** One uploaded photo adds to the place and survives reload. Photo attached in ranking also persists. | Working device-local storage; shared uploads remain absent. |
| Delete your photo / Cancel / Remove | **Pass.** Cancel preserves; Remove deletes owned photo; bundled photos are protected. | Reuse this explicit recovery pattern for visits/comments. |
| Author / license attribution links | **Pass in Chrome.** Photographer source and CC BY2.0 destination opened correctly. | Keep visible credits. |
| Camera / permission-denied Settings link | **Blocked native check.** Implemented in source; cannot count it as physically tested yet. | Verify on phone. |
| Photo retry / storage error / size limits | **Partial.** Normal UI persistence passed; 56-test suite includes storage/validation cases. Actual denied/full storage/corrupt file UI not exercised. | Keep meaningful error recovery; add targeted manual failure check. |
| Cloud photo sync / shared gallery | **Absent.** Photos are stored on this device/browser. | Required for a real social gallery; do not imply otherwise in the presentation. |

### Social, guides, profile, and platform behavior

| Feature / controls | Result and usability | Decision |
|---|---|---|
| Feed post open / score / guide preview | **Pass.** Opens corresponding place or guide. | Keep. |
| Like / Unlike | **Pass locally.** Jacob count 8→9→8; restored. | Keep interaction; backend needed. |
| Comments / empty Add / submit | **Pass locally.** Empty Add disabled; QA comment appears and clears input; survives reload. | Keep composer, add edit/delete. |
| Ask friends for recs / city / request / Add | **Pass locally.** Empty submission disabled; QA request appears and persists. | Useful experience planning; backend needed before asking real friends. |
| Delete/edit comment or rec request | **Absent.** Test content cannot be removed through visible UI. | Add recovery controls and ownership rules. |
| Feed share / preview / copy | **Pass.** Correct title, city, text and source; feedback shown. Venue repeated in some copy. | Trim duplicate venue text; later share an app link. |
| Search members / empty search | **Pass locally.** Exact Jacob match and no-results state work. | Keep. |
| Follow / Unfollow across Feed and Leaderboard | **Pass locally.** Relationship state is consistent; unfollow removes corresponding posts; restored. | Keep, then implement actual accounts/relationships. |
| Member profile / counts / bio / recent activity / guide | **Pass locally.** Fixture profile and guide open correctly. | Keep compact profile. |
| Your Been / Want / Guides counters | **Pass.** Navigate to corresponding tabs; after QA visit 8 / 4 / 2. | Make count shortcuts land in a predictable list state. |
| Been / Want to try lists | **Pass.** Personal rankings/saved membership and result actions work. | Keep. |
| City list filter | **Pass.** QA Review City isolates one entry; All cities restores scope. | Keep shared filter sheet. |
| Automatic city-guide creation | **Pass.** Adding a visit in a new city creates a second guide automatically. | Keep; faster than requiring manual guide creation for this common use. |
| Guide city chips / open / map / list | **Pass, coordinate caveat.** Filters cards, opens correct city, toggles map/list. Returning to library resets its chip to All cities. | Keep auto guides; preserve filter context if easy. |
| Guide save / unsave | **Pass.** Same saved state toggles and restores. | Keep. |
| Guide share / private-note omission | **Pass.** Ranked entries and official/search links copied; private QA note omitted. | Add persistent public/private guide links later. |
| Custom named guides / collaboration / private-guide settings | **Absent.** Current guides are automatic per-city lists. | Defer custom/collaborative guides until core data is shared. |
| Leaderboard ranks / ties | **Pass locally.** Unique-visit counts and ties agree: 8/8 at 1, 7/7 at 3. | Keep if motivating; label example members. |
| Leaderboard All Members / Friends | **Pass.** Chooser applies. | Keep. |
| Leaderboard city / member / You shortcut | **Pass for city/member; own shortcut source-inventoried.** QA city gives only You 1; member detail/follow/guide works. | Keep. |
| Interests, all six options | **Pass.** Toggle and summary work; restored Relax + Creative. | Keep lightweight preference collection. |
| Profile Location | **Pass to picker; GPS blocked.** Opens same city selector. | Keep, clarify search origin vs home city if both exist later. |
| About / Recommendations / Example social scores switch | **Pass.** Discloses examples/device storage. Turning off gives empty friend feed and You-only leaderboard; on restores examples. | Move demo identification closer to first use. |
| Edit name/photo/bio, sign in/out, account recovery | **Absent.** Fixed profile; no real account flow. | Essential before a multi-user release. |
| Notifications / calendar / streaks / taste profile / friend match | **Absent.** | Defer gamification; notifications become useful after social backend. |
| Booking / ordering / payments / imports / paid guides | **Absent.** | Defer. They are not necessary to demonstrate experience discovery. |
| Escape / backdrop / close controls | **Pass for Escape and close.** Escape removes city sheet after animation. Backdrop-specific and native Back/swipe checks remain partial. | Keep explicit close controls. |
| Responsive layout | **Pass in sampled widths.** 390px feed/filter, 320px detail/filter and 1280px centered layout usable. No document overflow at 390. | Phone-first is appropriate; no need for a new desktop design for the demo. |
| Screen reader / keyboard / motion | **Partial.** Sliders and map pins respond to keyboard; many named controls. Repeat switch unnamed. Full VoiceOver, font scaling and Reduce Motion not tested. | Fix label now; schedule real assistive-technology pass. |
| Persistence / offline / sync | **Partial.** Local visits, saves, notes, photos and social test state persist across reloads. Network-loss UX and multi-device sync not passed; sync absent. | State this limit clearly. |

## Beli feature and button inventory

This table separates tested behavior from controls that were only observed before the user ended further testing. The installed iPhone app is the primary comparison evidence. Beli's developer listing also names Taste Profile and friend Match Score; their existence is documented, not a claim that they were live-tested here. [Beli App Store listing](https://apps.apple.com/us/app/beli/id1478375386)

| Feature / controls | Live result and usability | Elsewhere decision |
|---|---|---|
| Bottom Feed / Your Lists / Search / Leaderboard / Profile | **Pass for destinations.** All five reached. The central plus icon says Search and opens restaurant/member search. | Elsewhere's explicit central Rank label is clearer for logging. |
| Feed search / Restaurants / Members | **Partial.** Olive query returns Olive Garden and other matches; clear restores recents. Members with a nonsense query shows No results. A matching-member query was not verified. | Keep search and clear recovery. |
| Restaurant fuzzy search / Load more / missing place | **Partial.** Nonsense query returns a loose fuzzy match; Load more reaches Can't find restaurant. Reporting form prefills name/city; canceled before submission. | Prefer explicit match quality and a simple custom-place recovery. |
| Calendar icon / reservation sharing | **Partial, terms boundary.** Opens Claim and Share Reservations; See reservations requires accepting terms. Nevermind returns without acceptance. | Defer; the icon's purpose could be clearer. |
| Notifications | **Pass for opening.** New/Earlier activity displays. Opening clears the unread badge. No follow/reply action submitted. | Add after real social activity exists. |
| Reserve now / Order | **Observed.** Visible shortcuts; no reservation/order started. | Defer external commercial integrations. |
| Recs Nearby | **Pass.** Opens Recs map around current location; markers and location dot load. View List uses Distance order with 0.2, 0.3, 0.4-mile results. | Adopt the clear current-origin and distance-sorted behavior. |
| Invite progress / invite friends / reward unlocks | **Observed.** Progress and rewards occupy prominent Feed space. No invitation sent. | Defer; these distract from the first useful experience in a prototype. |
| Monthly recap / next / previous / close | **Pass for navigation.** Stats and story cards open; next/back/close work. Social export buttons visible but not activated. | Defer recap until real history exists. |
| Ask friends for recs / city / title / description / discard | **Pass in draft.** City opens composer; blank or title-only Post disabled; title plus description enables it. Back then Close prompts Keep editing/Discard. Explicitly discarded. No post made. | Keep validation and unsaved-draft protection. |
| Feed like/comment/share/follow actions | **Not tested.** Avoided changing real social state before finishing read-only surfaces. | No speed claim from this review. |
| Restaurant category dropdown | **Observed.** Lists default Restaurants; category options visible in filters. | Experiences need activity categories rather than food-only taxonomy. |
| Been / Want to Try | **Pass.** Lists open; compact rows show score, price, cuisine, neighborhood/city, distance and hours. | Adopt compact scan-friendly rows. |
| Recs / Guides / More list tabs | **Pass for navigation.** Recs loads nearby recommendations; Guides opens custom guides, automatic city Top 10s and recently updated sections. More opens Been, Want, Recs for You, Guides, Recs from Friends and Trending. | Keep recommendation and city-guide concepts; defer extra tabs without a clear use. |
| Recs from Friends / Trending | **Pass for results.** Friend Recs loads scored rows with friend-count badges. Trending loads Most Trending order. More becomes partly clipped on the extended tab strip, although its visible edge remains tappable. | Keep navigation labels accessible; defer Trending until there is meaningful activity. |
| Filters / expandable sections | **Pass.** City, Good For, Score, Cuisine, Price, Neighborhood, Country all expanded successfully. | Adopt searchable sections as option sets grow. |
| City search / checkbox / Apply | **Pass.** Sacramento applied and only Sacramento results shown. | Keep city filtering. |
| City current location / home / View more | **Observed.** Controls visible; no new GPS permission granted. | Phone verification remains necessary. |
| Score threshold | **Pass.** 9+ combined with Sacramento gives two qualifying venues, 10.0 and 9.2. | Useful if data coverage is sufficient; not needed before real scores. |
| Combined filters / selected-count Apply | **Pass.** City+score Apply(2) behaves consistently; loading skeleton then results. | Adopt count feedback. |
| Clear all | **Pass.** Immediately clears applied filters and closes sheet. One action from open sheet. | Adopt. |
| Dismiss filter draft | **Pass.** Breakfast selected in draft then X; list has no applied filter. | Keep Elsewhere's matching cancel behavior. |
| Good For search/options | **Partial.** Opened and Breakfast toggled in canceled draft; no final result filtering tested. | Use concise experience tags, not all restaurant tags. |
| Cuisine search / View more / close | **Pass for navigation.** Searchable expanded picker works. No applied cuisine test. | Equivalent can support activity types later. |
| Price $–$$$$ | **Observed.** Four choices visible; selection/apply not tested. | Elsewhere's actual dollars better fit varied activities. |
| Neighborhood search / View more | **Pass for navigation.** Expanded picker opens and closes. | Defer until enough places exist in each city. |
| Country search | **Observed.** Search and United States option visible. | Defer for focused demo. |
| Categories: restaurants/bars/bakeries/coffee/dessert | **Observed.** Options visible; not all applied. | Use experience categories. |
| Open now filter | **Pass.** Nearby list narrows to three open restaurants, each labeled Open. Clear all restores closed and open results. | Add only with reliable hours data. |
| Reserve / Order filter toggles | **Observed.** Not yet applied. | Defer commercial integrations. |
| Sort Score / Distance / Date added | **Pass with anomaly.** Distance shows nearby SLO entries; Date added changes order. Score was original ordering. | Adopt direct sort action sheet; Date added is useful for saved items. |
| Sort after canceled Reorder | **Unconfirmed observation.** Earlier label changed to Score while rows looked like Date added. That sequence was not repeated; later returning to Been correctly showed Score and descending 10.0/9.9/9.8/9.7 rows. | Do not treat this as a confirmed Beli defect. |
| List search / close / search scope | **Pass for personal-list search.** Magnifier offers Search this list / Search all places. Inline Olive query returns one correct Olive Garden record; Close clears the search and restores the full list. | Keep a clear distinction between personal-list and global search. |
| View Map / View List / guide map / pin card | **Pass.** Tiles, current-location dot and score markers render. Guide pin opens Olive Garden 6.9 card; card opens the correct detail. | Adopt the selected-pin/card/detail sequence. |
| Overflow Filter / Search / Share / Select / Reorder / Gmail import | **Pass for menu.** All options discoverable. | Keep a short menu; avoid imports until sync/account boundaries are clear. |
| Full list share vs selected places | **Pass to choices.** Share chooser offers full link or selected places. | Adopt selected-place sharing when lists grow. |
| Select one place / Share(1) / Copy / Done | **Pass.** Olive Garden selected; native share sheet; Copy produces venue/link and profile context; Done leaves selection mode. No message sent. | Better sharing path than only raw text; stable app links required. |
| Reorder handles / Cancel / Save | **Partial.** Editor opened, Cancel used; no real ranking modified. | Direct reordering may help corrections, after delete/edit exists. |
| Gmail import | **Observed, boundary.** Did not authorize email access/import. | Defer. |
| Want-to-Try import promo / saved plus / bookmark | **Partial.** Plus on Go's Mart opens log flow. Import menu opens text, Google Maps, Foursquare and Mapstr paths. No bookmark changed. | Keep obvious add/rank action. |
| Text / Google Maps list import | **Partial.** Forms open; blank Begin import disabled. Text requires city and one place per line. Maps requires a public list URL and excludes Google My Maps. No import submitted. | Defer; later prefer simple in-app forms. |
| Foursquare / Mapstr import | **Partial.** Instructions require user export and emailing a JSON/CSV/ZIP. Email submission not pressed. | Do not copy this manual handoff into the core flow. |
| Liked / Okay / Disliked initial reactions | **Pass in draft.** All three selected; switching changes the active reaction. Whole draft discarded. Final comparison/save not exercised. | Elsewhere's matching three reactions already pass locally. |
| Visit metadata form | **Pass to form.** Companions, labels, notes, favorite dishes, photos, visit date, stealth and Okay are together before final completion. | Adopt this organization. |
| Notes / @mention hint / Cancel | **Pass for draft/cancel.** Editor opens; draft discarded; Add notes returns. No saved note posted. | Add direct note editing without reranking. |
| Who did you go with / search / suggestions / invite / Cancel | **Pass for opening and cancel.** No companion selected or invited. | Defer tagging until real accounts exist. |
| Labels / Your guides / Good For search | **Pass to picker.** Existing guides and Add new entry available. | Basic labels useful later; auto-city guide stays simpler for core use. |
| Create guide name / description / location | **Partial.** Form opens with 300-character description limit and venue city. Blank Create disabled. No guide created. | Borrow validation if adding custom guides later. |
| Guide collaborators / Make private | **Partial.** Collaborator control visible; private switch toggled in draft only. | Privacy matters once guides are shared; collaboration can wait. |
| Favorite dishes | **Pass in draft.** Suggested dish creates a removable chip; canceled without saving. | Optional activity-specific highlights might replace dishes later. |
| Photos | **Pass to native picker.** Library opens after loading; canceled without selecting or uploading a personal image. | Keep native picker and clear cancel path. |
| Date / month arrows / Today / Yesterday / 2 days ago | **Partial.** Calendar opens with Today; prior-month navigation and Aug 31 selection work; canceled. Quick-date chips visible but not all tapped. | Date shortcuts are a useful simple addition. |
| Stealth mode | **Pass in draft.** Switch responds; whole log canceled. Visibility after publishing not tested. | Do not conflate private notes with private activity. Define visibility explicitly. |
| Reservation party / date / time / Search | **Partial.** 2 / Today / All Day bar opens picker; time wheel/Done and party-size changes work; restored 2 and Search returns results. No booking started. | Defer reservations; picker patterns can support future event planning. |
| Automatic Top 10 city guide / List / Map / share | **Partial.** SLO guide opens with 10 entries and ranked rows; map/pin/detail path passes. Share entry visible. | Beli also has automatic city guides; keep this shared good pattern. |
| Okay / final comparisons / save review | **Not completed.** Stopped before committing a fictional visit. | No empirical claim that Beli's complete ranking is faster or more accurate. |
| Restaurant detail / scores / practical actions | **Partial.** Opened Olive Garden from map card. Correct personal/friend/community score areas, Website/Call/Directions and member photos visible. Did not place a call or complete external navigation. | Keep direct practical actions and separate score sources. |
| Restaurant share ranking / restaurant link | **Partial with recovery issue.** Link opens native share sheet; Copy used without a recipient. Returning left a black screen/chooser in Mirroring; restarting Beli recovered. Physical reproduction not confirmed. | Do not copy this recovery behavior; keep a clear Close/Cancel path. |
| Profile counters / rank / followers / following | **Pass for display/navigation.** Real profile shows 63 Been / 13 Want; Leaderboard links to member profile. No whole-account count reconciliation performed. | Real identity/persistence is a release prerequisite for Elsewhere. |
| Edit profile / photo / name / username / home city / bio / social links | **Partial.** Edit screen opens and fields are discoverable. Identity/social-link changes were not saved. | Adopt ordinary direct editing. |
| Account email / phone / password / payment / school / company / deactivate / delete | **Observed in working account menu.** Credential changes, payment actions and deletion not executed. | Essential recovery/privacy controls for a release; no need to fake them in the demo. |
| Privacy: public account / blocked / muted / cookies | **Partial.** Privacy screen opens. No privacy setting changed or account blocked. | Define visibility before real sharing. |
| Profile suggested-people dropdown | **Pass to suggestions.** Arrow expands suggested profiles with Follow and See all; no follow action submitted. | Defer until a real user graph exists. |
| Friend profile / following / streak / goal | **Pass for read-only navigation.** Counts, Following state and challenge/streak panels displayed. | Keep profile/list access; gamification can wait. |
| Places you both want to try | **Pass.** Opens Overlapping Bookmarks; zero overlap has a clear empty state plus links to each person's saved list. | Valuable later for planning together, after shared accounts/saves. |
| Dining goal / number / 50–100–150 presets / Set goal / close | **Partial.** 100 preset updates draft. Close requires a second Skip confirmation. Skipped; no goal saved. | Defer goals; avoid cancellation nagging. |
| Restore streak | **Observed.** Entry visible; restoration not performed. | Defer. |
| Settings: account / notifications / privacy / app / help | **Pass to settings structure.** Clear grouping; Help/contact submission not exercised. | Adopt plain grouping when settings are needed. |
| Notification preferences | **Partial.** Screen opens with switches for follows, saves, likes/comments, contact joins, featured lists/news, reservation activity, rank and streak reminders. No changes made. | Prioritize only useful real social notifications. |
| Vibration / Miles–Kilometers | **Pass for units.** Kilometers checkmark verified; restored Miles. Vibration control observed, unchanged. | Units are a simple later improvement for travelers. |
| Reservations / subscriptions / dietary restrictions / disliked cuisines / FAQ / logout | **Observed in menu.** No reservation/subscription/account session changed. | Food-specific settings and commercial scope can wait. |
| Taste Profile / friend Match Score | **Partial.** Match label observed on the user's leaderboard row. Dedicated taste/match screens not reached; feature existence also documented in developer listing. | Do not claim validated taste prediction; defer until useful data exists. |
| Leaderboard Been / Influence / Notes / Photos | **Pass for screen/results.** All four tabs loaded, with clear metric descriptions and different results. Influence counts invite joins; Notes counts notes/dishes; Photos counts photographed restaurants. | Elsewhere's single visited-places metric is sufficient now. |
| Leaderboard All Members / Friends | **Pass.** Sacramento Friends view gives You 9 and friends 4 / 1 instead of the global city leaders. | Keep audience selector. |
| Leaderboard city control | **Not completed.** Phone disconnected during opening. Existing Sacramento selection was not changed. | No city-change pass claimed. |
| Paid guides / subscriptions | **Not exercised.** Beli documents paid-guide subscriptions. [Beli paid-guide terms](https://beliapp.com/paid-guides-terms-subscriber) | Defer monetization. |

## Prioritized changes

| Priority | Problem and reproduction | Recommended behavior / acceptance check |
|---|---|---|
| P1 — physical demo launch | Expo Go rejects the development server because the phone is signed into jaydonkc but Expo CLI is not logged in. Confirmed independently with `npx expo whoami`. | Run `npx expo login` as the matching account and retry on the phone. Then execute the remaining native test cases. This is separate from Google Maps API setup. |
| P1 — demo trust | Fresh browser opens as Jaydon with example visits/friends/scores; explanation is under About. | Make demo state obvious on entry; provide a clean test identity/reset. Verify a teammate knows which data is real without reading documentation. |
| P1 — user recovery | Rank a custom place; open detail and More. No delete/unmark action. Post local QA comment/request; no delete/edit. | Add owned record editing/deletion with undo or confirmation. Verify counts, scores, guides and feed update after removal and reload. |
| P1 — misleading map action | Create a place without coordinates, rank it, filter list to its city, switch Map. Count 1 but empty map; detail Map sends to SLO. | Explain list-only places; do not navigate to unrelated locations. Keep the item accessible and offer location resolution. E103–106. |
| P2 — editing friction | Open existing visit → Edit. Reaction chooser and comparisons precede the note. | Open note/repeat/date/photos directly. Change ranking is a separate action. Metadata edit must preserve score without comparisons. |
| P2 — Favorites meaning | Open Favorites with default data. Unvisited interest matches appear. | Match the label to behavior. Verify never-visited interest matches only appear under an explicitly recommendation-based label. |
| P2 — mixed list/map state | Search a discovery area, then use profile Been. Map mode and “map area” caption carry over although lists ignore area bounds. | Separate discovery/list state or clearly indicate effective scope. Profile count shortcuts should predictably expose the counted items. |
| P2 — reset cost | Filters→Clear all leaves draft open and old results applied. | Adopt Beli's immediate reset/close or rename button to “Reset selections” if Apply is intentionally required. |
| P2 — direction promise | Directions opens Maps search for the venue. | Open routing with a verified destination, or use “Open in Maps.” Never imply a trail peak coordinate is a safe trailhead. |
| P2 — unlabeled repeat control | Ranking final form exposes a switch without accessible name. | Label “Would do this again”; verify in DOM and VoiceOver. |
| P3 — small text/state polish | “1 places,” “1 experiences,” Not sure produces blank collapsed summary, duplicated venue in share copy. | Singular/plural correctly; retain explicit Not sure; remove duplicate text. |
| Release gate | No real sign-in, backend social sync or shared photo storage. | Demonstrate two independent users and durable shared state before describing the app as socially live. Not required to fake for the hackathon. |

Source anchors for implementers: [visit editing and navigation](/Users/jaydon/Documents/ChatGPT/codeboxhack/elsewhere/App.tsx:524), [Favorites logic](/Users/jaydon/Documents/ChatGPT/codeboxhack/elsewhere/src/core/discovery.ts:57), [detail edit action](/Users/jaydon/Documents/ChatGPT/codeboxhack/elsewhere/src/components/ActivityDetail.tsx:343), [web map marker handling](/Users/jaydon/Documents/ChatGPT/codeboxhack/elsewhere/src/components/LocalExperienceMap.web.tsx:98). The shared checkout changed after this frozen export: App.tsx hash became `4307f827ab0f813adae39fb3b5b49e75bfd3647ea8e458d5d2e5db49dc94ccd7`; FriendsPage and ActivityDetail hashes stayed unchanged. Re-read the target before editing.

## Where Beli is measurably simpler

Counts are observed actions from the stated starting screen, excluding typing and animation. They are not stopwatch benchmarks; mirroring/tool latency and lock interruptions make elapsed-time comparisons unreliable.

| Task | Elsewhere | Beli | Decision |
|---|---|---|---|
| Reset active filters from open filter sheet | Clear all, Apply: 2 actions | Clear all: 1 action | Adopt Beli. |
| Change sort from list | Sort chip, option: 2 actions | Sort label, option: 2 actions | Equivalent; keep simple chooser. |
| Cancel a filter draft | Close: 1 action, old filters remain | X: 1 action, old filters remain | Both work; keep. |
| Edit visit metadata | Must pass reaction and comparison flow before note | Metadata is grouped in log form; notes opens directly from that form | Adopt Beli's organization. Existing-record Beli editing was not exercised, so no measured action-count advantage is claimed for that path. |
| Open a city guide | Automatically generated city guides | Automatic city Top 10 guides plus optional custom guides | Keep automatic guides; no proven action-count advantage assigned. |
| Share selected places | No subset selection; whole guide/text only | Selection mode, selectable rows, Share count, native sheet | Adopt later when persistent share links exist. |

## Team contribution plan

1. **UI owner:** settle one palette and typography system, then apply it consistently to feed, rows, detail, map overlays and sheets. Compare light/dark in sunlight on a phone; prioritize legibility and selected/disabled states over adding effects.
2. **Product/QA owner:** reproduce the P1/P2 cases above on a second phone. Record the screen, expected result and actual result. Review copy such as Favorites, Directions, and demo-data labels.
3. **Presentation owner:** build a short problem→audience→solution→live workflow→difference→next steps deck. Show enjoyment, nicheness and new-to-you as distinct choices. State device-local prototype limits clearly.
4. **Video/demo owner:** storyboard a 60–90 second loop: search a city/place, filter an experience, save it, log/rank a visit, add a photo/note, open the automatic city guide, and share. Capture a clean run after blockers are fixed; edit out setup and permission pauses.
5. **Content owner:** verify a small compelling collection of actual experiences, prices/access/hours and source links; choose strong licensed photos and explain niche evidence. More trustworthy examples help more than a large thin catalog.
6. **Engineering owner:** first fix record recovery, direct editing and missing-coordinate behavior. Then own account/backend persistence and shared photos. Coordinate Google API configuration with its existing task rather than duplicating it.

## Coverage limits, cleanup, and delivery

- The user ended further testing and requested this report with the evidence already collected. No claim of exhaustive execution is made for the observed, partial or blocked rows.
- Physical Elsewhere stopped before launch at the Expo Go/CLI account mismatch. Native tabs, sliders, keyboard/forms, camera/library, gallery swipes, map gestures, device location and external links remain unverified. Web/iOS/Android export success does not establish physical usability.
- Full VoiceOver, font scaling, denied-permission recovery, offline/network loss and full/corrupt-storage UI were not exercised. Beli existing-record note editing, final ranking/save, several secondary filter options and commercial/account actions retain the boundaries listed above.
- Beli guide/log/goal/request drafts were canceled. Been / Score / no active filters / list mode were restored and visually verified. Distance units were restored to Miles. No privacy, notification-preference or identity changes were made; opening Notifications did mark its unread items as read. Leaderboard's last tested view was Photos / Friends / Sacramento; no city change was committed.
- Browser clipboard and viewport were restored; Chrome link-test tabs were closed. QA visits/photos/comments/requests remain only in the disposable/local browser origins documented in the checkpoint; no externally shared QA post was created. The review changed documentation only.
- **CodeHacks iMessage: canceled by the user's final instruction. Nothing was sent.** The review heartbeat remains paused and its message instructions have been removed.
