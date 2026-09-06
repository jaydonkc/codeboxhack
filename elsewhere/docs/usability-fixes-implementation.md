# Main usability fixes implemented

September 6, 2026. Follow-up to the [Elsewhere/Beli review](./elsewhere-beli-usability-review.md). The original review remains a record of the build tested at that time.

| Fix | Result |
|---|---|
| Edit a visit directly | Your visit → Edit opens notes, photos, and the repeat choice. Saving preserves the existing ranking; Change ranking remains a separate action. |
| Remove a visit | Remove from Been has a confirmation and a Keep in Want to try switch, enabled by default. Removing a visit clears its ranking, note, and repeat choice; existing place photos remain. |
| Delete a custom place | An owned custom place has a confirmation explaining the data removed. Deletion removes the place, visit, bookmark, awareness response, and stored photos. Photo-storage failures leave the place available for retry. |
| Edit/delete social contributions | Your own recommendation requests and comments have edit and confirmed-delete controls. Editing preserves identity and replies. Deleting a request removes its associated local comments and likes. |
| Correct Favorites | Only places explicitly liked or marked “I’d do this again” qualify. Unvisited category/interest matches no longer appear as favorites. |
| Handle missing coordinates | A place without valid coordinates stays accessible in lists. Its internal Map action is disabled with an explanation; list/guide maps omit invalid points and explain unmapped entries. |
| Keep map navigation predictable | Discovery and My lists maintain separate map/list states. A place's Map action focuses that place, and personal-list maps do not show discovery area-search controls. |
| Reset filters in one action | Clear all resets the applied filters and closes the sheet immediately. |
| Improve small controls and wording | The repeat switch has an accessible name; “Not sure” appears in its summary; the external place-search action says “Open in Maps.” |
| Make Nearby request the intended behavior | Recs Nearby requests location, switches to distance order, and opens the map. Actual GPS acquisition still depends on device/browser permission. |
| Explain prototype data | Profile/About explain the example identity and device-only data. The persistent banner remains removed, following the user's newer request in the location task. |

## Verification

Tested the exported app in a separate browser origin at `http://127.0.0.1:4181/`, using disposable test content and bundled place imagery. No real social message or Beli account action was submitted.

- Edited a saved visit's note and repeat choice, saved, and reloaded: the changes persisted and its score stayed 7.8. Canceling an edit discarded the draft.
- Added a photo through direct visit editing: the photo appeared while the score stayed 1.7.
- Canceled and confirmed visit removal; a controlled Bishop Peak removal stayed in Want to try after reload.
- Created a place without coordinates: its Map action was disabled and it remained accessible below the list map.
- Canceled custom-place deletion, then confirmed it: the place disappeared from the list and search after reload. The photo-storage regression test separately verifies persistent batch deletion.
- Created, edited, and reloaded an owned request and comment; canceled and confirmed their deletion; verified the temporary request was gone after reload.
- Checked Favorites against the remaining liked visits: exactly three qualifying places, without unvisited interest matches.
- Applied the Free filter: four results. Clear all immediately closed the sheet and restored eleven results.
- Opened a known place's Map action: the right place remained selected with its corresponding result card.
- Checked the direct-edit sheet at 390 × 844: note, named switch, photo picker, Save, Cancel, and Remove controls were visible and usable.

Automated verification: TypeScript passed; the current combined workspace suite passed **77 tests, zero failures**. Eight regression cases added by this task cover rank-preserving edits, removal and guide consistency, owned-place cleanup, coordinate validation, comment/request ownership, Favorites membership, and photo deletion after database reopen. Other activity-submission work added further tests in the shared checkout.

Web, iOS, and Android exports passed. The final export is `/private/tmp/elsewhere-main-fixes-export`, with web bundle `index-57eb1048b4b22108a6416c8a8a4ed3a4.js`. Native export success is build evidence; this implementation pass does not claim a completed physical-phone test. Google API activation/configuration remains outside this task. Other tasks continued adding submission and map features during this pass, so this document describes the fixes and flows checked here rather than certifying every concurrent feature.

No CodeHacks update was sent, as requested.
