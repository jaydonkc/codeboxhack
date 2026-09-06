# Personal-flow regression checks

Use separate browser storage for testing (for example, `127.0.0.1` instead of an existing `localhost` session). Example visits are persistent local data.

1. **Filtered lists:** Save SLOMA, search for pottery, and open Want to try. The empty state explains that filters hide saved entries. Clear filters restores SLOMA and keeps Want to try open. Repeat after choosing another city or filtering a different map area.
2. **Favorites:** With no visit history, Favorites has no results even when interests match the catalog. After loading example visits, only the three liked visits appear. Disliked and okay reactions must not qualify.
3. **Activity map:** Enable Favorites, choose Los Angeles, then open Emma’s guide and SLOMA. Tap Map. The city becomes San Luis Obispo, the activity marker and card are present, and the map centers on the venue. Distance labels still refer to Downtown SLO; the venue center must not be treated as device location.
4. **Example guide notes:** Emma’s guide displays a recommendation under all four picks. Preview contains the same notes.
5. **Social toggle:** Disable Example social data. Discover has no sample guide or social score selectors, Friends and Activity show empty states, and Guides opens the personal guide. Repeat after a reload and when disabling examples from Emma’s guide.
6. **Guide preservation:** Load example visits, create the guide from Been, move Leaning Pine above SLOMA, and add a guide note. Return to Been and select Open my SLO guide. Order and notes remain intact, including after a reload. Unit tests additionally cover intentionally emptied guides and excluding disliked, okay, and unresolved visits from initial generation.
7. **Visit editing:** Open a scored activity and choose Edit under Your visit. Change its note and revisit choice, then save without comparisons. The score, rank, saved-list membership, and guide order remain unchanged. Reload to confirm persistence. Preview the guide and confirm the private visit note is absent.

The browser checks above accompany the core tests; physical iOS/Android checks are still needed for native map positioning, keyboard behavior, and location permissions.
