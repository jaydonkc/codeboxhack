# Community-created activities

Design decision and local implementation: September 6, 2026.

[Main product design](https://app.notion.com/p/3d272c4af0f98161801dc48644c9a574).

New activities start with limited reach. Sharing helps people find something to do; raw likes, shares, or follower counts do not unlock public discovery. Enjoyment and nicheness keep their existing meanings.

## User flow

1. Choose **Add an activity** from discovery, lists, ranking, or Profile → Your activities.
2. Describe a specific activity, such as a geocaching route in a named park. Existing entries with the same normalized name and city appear before saving. Distinct routes or programs may have different names even when they share a venue.
3. Add location/meeting area, approximate duration, price if known, activity type, and optional vibes/source link. In **Map location**, use your current location, choose a pin by tapping the map, or enter coordinates. An address alone does not create a pin. Unknown coordinates remain absent; no location is invented.
4. Choose **Only me**, **Friends only** (the form default), or **Allow public discovery**. Public submissions additionally require a useful description, location, activity type, duration, and visitor-access information. Unknown/restricted access cannot satisfy public eligibility.
5. **Save and rank** is the default from every Add an activity entry. Choose your reaction, finish the comparisons, optionally add visit notes/photos, and **Save to Been**. An activity with a pin opens on the Been map centered on its selected marker, showing your personal enjoyment score. **Haven’t been? Save to Want to try** is the explicit alternative for an unvisited activity. It opens Want to try's map when coordinates exist, otherwise the list. Closing the rating flow leaves the created activity in Want to try so it can be rated later. Every audience can appear on its creator's personal map immediately. Public discovery still requires review. Profile → Your activities preserves a management route even after unsaving. Details show creator attribution, audience, review status, and access notes. Editing retains the activity ID, existing ranking, and photo associations, while clearing discovery approval.

## Visibility and distribution

| Audience/status | Personal lists | Friends/link recipients | General discovery |
| --- | --- | --- | --- |
| Only me | Creator | No | No |
| Friends only | Creator | Authenticated friends only; requires connected accounts | Never |
| Public, awaiting review | Creator | Unlisted sharing allowed | No |
| Public, reviewed local trial | Creator | Allowed | At most one eligible trial per result set |
| Public, published | Creator | Allowed | Eligible under normal filters |
| Changes requested / removed | Creator can inspect status | No sharing | No |

Private and friends-only items never appear in unrestricted activity or guide exports. Exported guide counts and positions are recomputed for the shareable subset so omitted private entries do not leak through rank gaps. Blocks and hidden items are also excluded. Existing custom activities without valid audience metadata default to private.

Trial selection occurs after hard filters and discovery intent, uses one canonical listing, and rotates eligible trial items daily. The first local trial requires a separate reviewer and a current access check; it needs no followers, shares, or completed outings. Public content/audience edits increment the revision and invalidate the review. A stale review, a creator reviewing their own activity, unknown access, or an unresolved moderation hold cannot approve discovery.

Wider publication remains a manual decision. The initial reusable policy requires five established people with current voluntary completed-experience reactions across at least three independent groups, and at least 70% positive after giving each group equal weight. One current reaction per person counts; self-endorsements, repeated actions, future/stale records, and unestablished/incomplete experiences cannot supply the required evidence. Shares do not enter this calculation. These starting thresholds require validation with real data.

## Spam and moderation

- New accounts: three creations per rolling 24 hours; established-account policy supports ten. The local app always uses the conservative limit. Durable creation receipts survive listing deletion.
- Exact duplicate prevention normalizes name/city case, punctuation, spacing, and diacritics. It does not automatically merge different activities at one address. Server-side catalog-wide deduplication is a launch requirement.
- Report and hide records one current report per activity/reporter and hides it for that person. A report alone never removes an activity for everyone. A moderation hold prevents approval; report resolution and operational moderation need the shared service.
- Block creator/person hides authored activities/feed posts and restricts guide access. Profile → Hidden activities and blocked people supports unhide/unblock.
- In development, About Elsewhere → Preview submission review demonstrates pending → trial, changes requested, and removal. It explicitly labels every decision as local. Wider eligibility can be checked but no engagement is fabricated. Review controls are absent from release UI.

## Code and delivery boundary

`src/core/submissions.ts` owns audience, read/export eligibility, duplicate detection, creation limits, trial allocation, report behavior, and review/promotion policy. `src/core/customExperience.ts` owns validated creation and editing. The editor and review preview are separate components. `App.tsx` integrates storage, personal management, discovery, maps, reporting, and sharing; guide/feed exports reuse the visibility policy.

This is an implementation in the existing device-local Expo prototype. It does not connect real social accounts, deliver activities to other phones, create hosted/revocable app links, collect trustworthy engagement, or operate a moderation service. Copying permitted details copies plain text only. The UI names this limitation at creation, pending review, friends-only sharing, and the development review preview.

Before public launch, enforce these rules atomically on a server with authenticated identity, friendship and block checks, authoritative trust/group evidence, a durable review/audit store, report resolution, share revocation, cache invalidation, and access checks on every read. Never accept creator/moderator IDs, `isModerator`, friendship, establishment, or group IDs as client assertions. Clearing/tampering with device storage can bypass local checks; the local implementation is not an abuse-resistant backend.

## Verification

- `npm run typecheck`: passed.
- `npm test`: 77 passed, including 13 submission-policy tests.
- Expo production exports: web, iOS, and Android passed; output inspected under `/tmp/elsewhere-community-export`.
- Isolated browser origin `localhost:8085`: created a geocaching test activity; verified private export blocking, required visitor-access validation, local review approval with no engagement, discovery inclusion, removal from discovery on Friends-only revocation, persistence after reload, duplicate suggestions with disabled save, and block/unblock of an example profile.
- Visually inspected the audience form: selection, explanatory text, scrolling, and spacing rendered correctly in the web app.
- Android interaction, other native community-review flows, and shared-account delivery were not verified. Export success alone is build evidence only.
- Activity-map demo update: on `localhost:8081`, created **Demo creek sketch walk**, placed a pin by tapping Google Maps, saved with Only me, and verified that Want to try opened in map view centered on the selected new activity. Reloaded and verified that its marker remained and selected the correct card. On isolated `localhost:8086`, verified that an incomplete coordinate pair blocks saving, and removing the pin allows a list-only save with **No map location**. That isolated port is outside the Google key's allowed referrers, so the actual map test used the configured demo URL. Typecheck, all 77 tests, and iOS/Android exports passed.
- Physical iPhone 13 follow-up: the phone initially showed the previous editor. Used Expo's **Reload**, verified the new Map location controls, created **Demo creek sketch walk**, tapped the native Apple map to place a pin, selected Only me, and saved. Observed **Activity saved to your map**, Want to try selected, five saved places, and the new selected orange marker. Mirroring then ended when the user began using the phone; a second reload/persistence test on the phone was not performed.
- Rating-on-create follow-up: the default action is now **Save and rank** with an explicit Want to try alternative. On `localhost:8081`, created **Demo sunset sketch walk**, chose Liked it, tied it with the displayed comparison, and saved the resulting 8.4 to Been. Confirmed the selected Been map marker, card, and detail map all display that personal score, with the visit note retained. Typecheck, 77 tests, and iOS/Android exports passed. The earlier physical-phone check covered pin creation; this revised rating flow was checked in the browser.
