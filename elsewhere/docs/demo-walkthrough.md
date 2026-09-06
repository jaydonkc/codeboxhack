**Elsewhere demo walkthrough and hands-on test checklist**

Prepared September 6, 2026, against the current local app.

Use this story: **“A friend is visiting SLO. We want something relaxing, new to us, under 90 minutes, with admission at most $10. After going, I want to remember how much I liked it and recommend it later.”**

Opening line: “Elsewhere helps you find experiences that fit your taste, time, and budget, then turns the things you try into personal rankings and city guides.”

The main walkthrough takes about 8–10 minutes. The extra checks take another 10–15 minutes.

**Before starting**

- On the Mac, open [the current preview](http://localhost:8081/). Keep its development server running. The Places server also needs to remain running for live city/place searches.
- Use the same browser, exact URL, or phone app throughout the persistence test. Each has its own local data.
- Open **You**, record your Been / Want to try / Guides counts, then return to Feed. The initial fixture has seven visits and four saved places; existing test data can change these counts.
- If the example feed is empty, check **You → About Elsewhere → Recommendations → Example social scores**.
- For the pitch, describe friend identities, posts, community scores, and initial visits as demo data. Personal changes and photos are stored on this device. City guides currently share copied text and links.

**1. Start with a friend's discovery — about 1 minute**

On **Feed**, find Jacob's bookmark of **Cal Poly Leaning Pine Arboretum** and tap the place name. If needed, find the same researched entry in **My lists → Been**.

Open its two-photo gallery, move to the next photo, and close it. Point out the separate **Your score**, **Friends**, and **Everyone** scores. Tap **Nicheness**, then **About this score**.

Say: “Enjoyment tells me how much people liked it. Nicheness tells me how little-known or specialized it is. Those answer different questions.”

Check: the current researched Arboretum entry shows Nicheness **7.8**; its source explanation is available. A high niche score is not a claim that it is better. Close the niche sheet.

**2. Find an experience for this afternoon — about 1 minute**

On the Arboretum detail, tap **Map → View list**. This route opens the researched SLO collection. It also makes the Arboretum the distance origin; the top label can therefore show its name.

Select **New to you**, then **Filters**. Set **Price → $10**, **Duration → 90 min**, and **Good for → Relax**. Leave Nicheness at its full range. Tap **Apply**.

Say: “I can narrow this to something I haven't tried that actually fits today's plan.”

Check: in the current example history, the researched catalog goes from **11 places → 4 new places → 1 match: San Luis Obispo Botanical Garden**. The badge reads **Filters · 3**. If you already logged the Garden, its absence from New to you is correct; use **For you** and search **Botanical** to repeat the remaining steps.

**3. Check the place and save it — about 1 minute**

Tap **View map**, select the Garden's score marker, then open its place card. Check its **~75 min**, admission details, separate enjoyment and niche scores, and **Website / Open in Maps** actions. Its current niche score is **4.7**. The price filter concerns admission; read the details for additional costs such as parking.

Tap **Want to try**. If it already has a checkmark, it is already saved; remove and save it again if you want to exercise both states. Open **My lists → Filters → Clear all → Want to try** and find the same entry.

Say: “I can check the practical details and keep it for later.”

Check: the marker selects the correct card; saving creates one entry, with a filled bookmark. Clearing the filters matters because discovery filters also affect personal lists.

**4. Pretend you've just visited and rank it — about 2 minutes**

Open the saved Garden and tap **Rank it → Liked it**. Choose which experience you enjoyed more until **Your score** appears. **About the same** is available for a tie; **Can’t compare** skips a comparison. A numeric ranking can remain unfinished if you skip the available comparisons.

Add the note **“DEMO PRIVATE NOTE — peaceful afternoon; bring water.”** Turn on **I’d do this again**. Optionally use **Choose photos** to attach a disposable photo, then tap **Save to Been**.

Say: “A few comparisons place it among things I've already tried, so my score reflects my own taste.”

Check: the comparison flow offers at most five comparisons. The saved entry moves into Been and leaves Want to try. For a previously unvisited saved place, Been increases by one and Want to try decreases by one. Re-ranking an existing visit should not increase the visit count. Do not expect a fixed numeric score: it depends on your history and answers.

Also try the center **Rank** button later: it opens the searchable picker for saved and visited places. Choose the existing catalog entry so you are testing the same record.

**5. See the visit become a guide — about 1 minute**

Go to **My lists → Been**. Clear any remaining filters and search text, then check the Garden's position and score. Open it and confirm the note, repeat choice, and optional photo.

Go to **My lists → Guides → San Luis Obispo**. The Garden should already be included. Toggle **Map / List**. Tap the share icon, then **Copy guide text**, and paste into a scratch note.

Say: “My city guide builds itself from my visits and stays in my personal order.”

Check: the guide includes the Garden in the same relative personal order. The “Near San Luis Obispo” venue belongs in the SLO guide. Copied text includes activity names, scores, and source links; it excludes **DEMO PRIVATE NOTE**. This action copies text and does not create a hosted guide page.

**6. Show the social and profile payoff — about 1 minute**

Open **Leaderboard**. Switch between **All Members / Friends** and **All cities / San Luis Obispo**. Open a member profile and their city guide. Finish on **You**, where the Been, Want to try, and Guides counters should lead to the corresponding lists.

Say: “I can build my own history and browse the experiences other people have tried.”

Check: the leaderboard counts distinct visited places. A new SLO visit adds one to your relevant count; the displayed position may stay the same. Other members and their activity are examples in this build.

**7. Prove that the save survives — about 30 seconds**

Reload the browser, or close and reopen the app on the same device. Return to **My lists → Been** and open the Garden.

Check: its visit, ranking, note, repeat choice, and saved photo remain, and it is still in the city guide. Finish the core demo here.

**8. Test live discovery separately — about 2 minutes**

Open **Feed → Search experiences → Change city**. Search **San Luis Obispo**, select **San Luis Obispo, CA, USA**, clear earlier filters and search text, and use **For you**. Try a place query such as **museum**, submitting with the search arrow or keyboard Search. Then open **View map**, move the map, press **Search this area**, and switch to the list.

Check: choosing a city resolves that city and produces results or a clear recoverable error. Live places may have unknown price, duration, niche, and friend scores; those should stay blank. Map-area results and the list should correspond. Returning no venues under a strict filter can be legitimate when those fields are unknown.

On your phone, separately try **Use my location**, grant location permission, and check the location marker, recentering, and nearby results. Test the photo picker there as well. The web checks below do not establish phone behavior; Google place pins require a compatible configured native map build.

**Add your own activity and show its pin — about 1 minute**

Open **You → Your activities → Add an activity**. Give it a distinctive demo name, city, activity type, and short description. Under **Map location**, select **Choose on map**, move/zoom to the meeting point, and tap to place the pin. **Use my current location** is available when you are at the activity; **Enter coordinates** is an alternative. Check that the form says **Pin added**. For a personal demo, choose **Only me**, then **Save and rank**. Choose a reaction, complete the comparisons, optionally add notes/photos, and tap **Save to Been**.

The app opens **My lists → Been** in map view, centered on the new activity with your score on its selected marker and card. Reload, return to Been, and use **View map** to see the saved rating and pin again. If you have not done the activity, choose **Haven’t been? Save to Want to try** in the editor instead; its enjoyment stays unrated. Activities without pins remain in the list. This is your device's personal map; the public Discover feed still requires review, and delivery to other phones is not connected. Nicheness remains separate and unknown for unresearched custom activities.

**Extra checks while testing it yourself**

| Done | Test | What should happen |
|---|---|---|
| [ ] | Change a filter, then close the sheet without Apply. | The previous applied results remain. |
| [ ] | Set an impossible search or a restrictive niche range, then Clear filters. | A readable empty state appears, and clearing recovers the list. Clear the text field separately if needed. |
| [ ] | Sort the researched collection by Enjoyment, Nicheness in both directions, Distance, and Price. | The order follows the selected field; unknown values stay last. Switch Friends/Everyone with Enjoyment selected to see the audience change. |
| [ ] | Start Rank it, answer a comparison, then close before Save to Been. | The prior visit state and ranking remain unchanged. |
| [ ] | Use About the same. | The result can share a position with the compared experience. |
| [ ] | Use Can’t compare through the available comparisons. | An unresolved visit can be saved for later with a blank numeric score; it is not silently assigned a made-up score. |
| [ ] | Open a logged place → Your visit → Edit; change only the note/repeat choice and save. | The exact personal ranking remains unchanged. |
| [ ] | Choose a photo, remove the draft selection, and cancel. | No photo is added. Then add a disposable photo, save, reload, and open it. |
| [ ] | Open an uploaded disposable photo and remove it. | Your uploaded photo is removable; bundled venue photos are protected. |
| [ ] | Like and unlike a Feed post. | The count and selected state change once in each direction. |
| [ ] | Add a disposable comment; edit it and remove it. | Your comment updates/removes correctly; an empty comment cannot be submitted. These interactions stay local. |
| [ ] | Search members for Jacob, open his profile, unfollow/follow, and check Friends leaderboard. | The relationship is consistent across profile, Feed, and leaderboard. Restore the starting relationship afterward. |
| [ ] | Tap Had you heard of it? inside the niche sheet and change your response. | The answer is retained without changing the researched niche score. |
| [ ] | Add an activity with a distinctive test name and the Only me audience. | It appears in your activities/lists, stays out of public discovery, and does not expose shareable text. Friend delivery/public review remain local previews. |
| [ ] | Leave both coordinates blank for that test activity. | It remains usable in lists; Map is unavailable or clearly explains the missing location. It should not jump to an unrelated place. |
| [ ] | Try an exact duplicate activity name/city in Add an activity. | The existing activity is offered instead of creating a duplicate. |
| [ ] | On the phone, deny location permission, then continue using city search. | A useful error appears and existing results remain usable. The app does not leave a permanent spinner. |
| [ ] | Navigate all bottom tabs, open/close sheets, and type with the phone keyboard up. | Controls remain reachable; no stuck overlay, covered save button, or horizontal overflow. |

If the Garden visit was created only for this test, its **More → Remove from Been** flow can return it to **Want to try** using **Keep in Want to try**. Remove only disposable test photos/activities you created. Re-ranking an original visit cannot be undone by deleting it.

**Verification behind this walkthrough**

Checked live in the current localhost:8081 browser during this task: Feed entry; Arboretum detail/photo controls and score labels; city autocomplete returning San Luis Obispo; the researched discovery route; 11 → 4 → 1 filtering; rendered Google map and Garden marker/card selection; Liked it → comparison → tie → score preview; cancellation before saving; personal-list navigation and filter reset. The guide and extra-test expectations were checked against the current source. Save/reload, uploads, outbound links, and physical-phone behavior are checks for you to perform, not claims of fresh end-to-end verification here.
