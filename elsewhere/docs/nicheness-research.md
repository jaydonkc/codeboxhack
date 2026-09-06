# SLO nicheness research

Research date: **September 5, 2026**. Implementation: `src/data/nicheness.ts`, method `editorial-slo-v1`.

These are editorial estimates of how far each activity sits outside San Luis Obispo’s usual visitor circuit. They are grounded in the placement and context of actual travel coverage, the venue’s purpose, and local reporting. They are **not** measured percentages of residents who know a place, visitor counts, review aggregates, or predicted enjoyment. Someone can know a niche activity well; someone visiting SLO can discover a very mainstream activity for the first time.

## Rubric

Each dimension is an editorial judgment from 0 to 4, using half steps when evidence is mixed:

| Dimension | Weight | Low end | High end |
| --- | ---: | --- | --- |
| Distance from the mainstream visitor circuit | 60% | Signature stop in general visitor itineraries | Discovery centered on campus, neighborhood, or specialist coverage |
| Audience specialization | 25% | Broad, casual activity | Focused participatory interest or subject |
| Intentional visit | 15% | Part of an ordinary downtown wander | An experience people deliberately seek out |

`score = round_to_one_decimal(2.5 × (0.60 × mainstreamDistance + 0.25 × audienceSpecialization + 0.15 × intentionalVisit))`

The weights are product choices, not coefficients fitted to survey data. A decimal supports stable ordering, not scientific precision. Interpret small differences cautiously. Rough bands: 0–2 signature stops, above 2–4 familiar discoveries, above 4–6 more focused experiences, above 6–8 specialist or tucked-away finds, above 8–10 unusually obscure discoveries. No current record merits the last band.

The first dimension dominates so that an odd-looking but famous landmark stays low. Specialization contributes modestly: a skate park can be well known while participating there appeals to a narrower group. Cost, difficulty, quality, negative reviews, raw search-result totals, and number of app ratings do not enter the formula. Few results are never by themselves evidence of obscurity.

## Estimates and evidence

All linked pages below were checked September 5, 2026. Publication dates are included only where a date was visible; a crawl date is not a publication date. Per-source observations are also included in the exported data for the activity’s score explanation.

| Activity | Score | Raw dimensions: mainstream / audience / intent | Confidence | Research basis |
| --- | ---: | --- | --- | --- |
| Downtown creek stroll | 0.8 | 0.5 / 0 / 0 | Low | [Downtown neighborhood guide](https://visitslo.com/neighborhoods/meet-us-in-downtown/) makes the creek and strolling part of the central visitor district. The listing is a broad outing, not a distinct hidden route. |
| Thursday Farmers’ Market | 0.9 | 0.5 / 0 / 0.5 | Medium | [Organizer](https://downtownslo.com/farmers-market) positions it as a signature event; statewide tourism coverage corroborates broad reach. |
| Bubblegum Alley | 0.9 | 0.5 / 0 / 0.5 | Medium | [Visit California’s SLO guide](https://www.visitcalifornia.com/places-to-visit/san-luis-obispo/) includes this highly recognizable photo stop. Its unusual appearance does not make it obscure. |
| Bishop Peak | 2.5 | 1 / 1 / 1 | Medium | [Visit SLO’s first-visit itinerary](https://visitslo.com/plan-your-trip/know-before-you-go-to-san-luis-obispo/) includes it in the first 24 hours. |
| Cerro San Luis reserve trails | 3.3 | 1.5 / 1 / 1 | Medium | [Destination listing](https://visitslo.com/things-to-do/outdoor-activities/hiking/cerro-san-luis-natural-reserve/) and [The Tribune, December 4, 2022](https://www.sanluisobispo.com/news/local/environment/article269160502.html) establish local hiking prominence. The activity covers multiple reserve trails. |
| SLOMA | 3.6 | 1.5 / 1.5 / 1 | Medium | [Museum programs](https://sloma.org/) establish an arts focus, while the statewide guide supplies evidence of general visitor visibility. |
| SLO Botanical Garden | 4.7 | 2 / 1.5 / 2 | Medium | [Official family-travel coverage](https://visitslo.com/things-to-do/family/slo-botanical-garden/) broadens its audience; the [venue](https://slobg.org/visit/) establishes its separate park destination and garden focus. |
| History Center | 5.7 | 2.5 / 2.5 / 1 | Low | [Venue purpose](https://www.historycenterslo.org/about) is county history; [tourism directory coverage](https://visitslo.com/things-to-do/arts-and-culture/museums/history-center-of-san-luis-obispo-county/) and the downtown guide prevent calling it unknown. Current public-awareness evidence is limited. |
| SLO Skate Park | 5.9 | 2 / 3.5 / 2 | Medium | [Skate-park listing](https://visitslo.com/things-to-do/outdoor-activities/parks-in-san-luis-obispo/slo-skate-park-santa-rosa-park/) and [Foothill guide](https://visitslo.com/neighborhoods/meet-us-in-foothill/) demonstrate tourism promotion. Its score reflects participation specialization more than hidden location. |
| Anam Cré pottery class | 6.8 | 2.5 / 3 / 3 | Medium | [Studio offerings](https://www.anamcre.com/) and [MoJo insider tips](https://visitslo.com/neighborhoods/meet-us-in-mojo/) support focused creative discovery. [Archived New Times reporting](https://www.newtimesslo.com/collections/volunteers-2020/) describes a longstanding local studio, so do not equate niche with new or locally unknown. |
| Leaning Pine Arboretum | 7.8 | 3.5 / 2 / 3.5 | Medium | [Cal Poly’s visitor page](https://plantsciences.calpoly.edu/leaning-pine-arboretum/visiting-lpa) locates a public horticultural laboratory on the north campus. [Mustang News, April 6, 2022](https://mustangnews.net/a-students-guide-to-the-understated-spots-on-campus/) identifies it among overlooked campus places. [Tourism coverage for Cal Poly supporters](https://visitslo.com/blog/top-activities-for-cal-poly-parents-supporters/) provides a balancing signal of existing recognition. |

## Limits and maintenance

- Confidence is limited to **medium** even where sources agree. Internet visibility is affected by tourism marketing, indexing, language, age, and editorial selection. It cannot establish local recognition rates. Low confidence flags a broad listing definition or weak evidence about reach.
- Historical reporting establishes a pattern of recognition, not today’s foot traffic or availability. Use current venue pages for operational details. For example, the tourism garden page contains older prices; those prices were not used here and must not replace the catalog’s current venue-sourced admission.
- The reference geography is SLO and nearby SLO outings. Do not compare these scores to another city until that city has been reviewed with the same rubric and shared anchor activities. No per-city or per-category percentile is implied.
- Display the number with **Estimated**. A tap should reveal the short reason, reference area, checked date, and source links. Keep detailed methodology in the explanation rather than repeating internal implementation text throughout the product.
- Preserve enjoyment and personal novelty as separate dimensions. These estimates do not change a user’s ranking or establish that a higher-scored experience is better.
- Recheck the judgments at least quarterly, sooner after major publicity, changes to venue identity, or credible corrections. If meaningful survey evidence is later collected, version the method and evaluate it independently before replacing editorial scores.
- New catalog entries without reviewed evidence should remain unrated for nicheness until researched; never substitute zero or a randomly generated estimate. The current 11 entries are all covered.
