# Live place discovery

Elsewhere can search Google Places around the user's location, a selected city, or a map area. It fetches venues on demand instead of downloading a worldwide catalog. Nearby discovery returns up to 20 candidates; text and map-area searches support Load more when Google returns a page token. Coverage and results depend on Google, and venue discovery does not guarantee that a particular class or event is available.

## Connect Google Cloud

Create or select a billing-enabled Google Cloud project and enable:

- Places API (New), for the server.
- Maps JavaScript API, for the web map.
- Maps SDK for iOS and Maps SDK for Android, for native builds.

Create separate keys. Restrict the server key to Places API and, when hosted with fixed egress, the server's IP addresses. Restrict the browser key to Maps JavaScript API and your allowed website referrers. Restrict the native keys to their respective SDK and application identifiers/signatures. Set Google Cloud quotas and billing alerts before live use. The local proxy also limits total incoming search requests per minute; this is not a dollar-denominated spending cap.

No credentials are included in the repository. Do not paste the server key into the app or an `EXPO_PUBLIC_*` variable.

## Run on the web

From the `elsewhere` directory:

```sh
cp .env.example .env.local
cp .env.server.example .env.server.local
```

Fill in `.env.server.local` with the server Places key. In `.env.local`, set the public proxy URL and browser Maps key. Set a Google map ID for deployed maps; the development default is Google's `DEMO_MAP_ID`.

In separate terminals:

```sh
npm run server
```

```sh
npm run web
```

Restart Expo with `npx expo start --clear` after editing environment variables. Use `npx expo export --clear` when exporting after changing configuration. `GET http://127.0.0.1:8787/health` returns whether a server key is configured; it does not validate that key or billing. Allow the Expo browser origin in `ALLOWED_ORIGINS` if you use a port other than 8081. The server defaults to loopback and returns explicit configuration, timeout, and quota errors without exposing Google's response or the key.

With no public proxy URL the app opens a clearly labeled SLO sample collection. With a configured URL it starts nearby discovery if foreground location permission was already granted. On first use, choose Use my location to grant permission, or select a city. City autocomplete distinguishes regions/countries, and selecting a suggestion moves the map. Submit the search field to search Google; filters apply to the returned candidates. Panning does not issue paid searches until Search this area is pressed. My location resets the map and clears the previous area.

## Run on a phone

Set the iOS and Android SDK keys in `.env.local`. Use a Google Maps development build:

```sh
npx expo run:ios
# or
npx expo run:android
```

The iPhone Expo Go preview uses Apple Maps for the basemap and our own entries. Google Places pins require the configured Google Maps native build; those results remain available in the list. Android Expo Go uses its bundled Google map. These build commands require the platform's native development tools and signing setup.

For a phone on the same trusted LAN, explicitly set `HOST=0.0.0.0` in the server environment and use the computer's LAN address in `EXPO_PUBLIC_PLACES_API_URL`. Localhost on a phone points to the phone itself. Prefer an HTTPS backend for a deployed build; browser device location requires a secure context (localhost is supported for local web development).

The development proxy is not a production public API. Before exposing it publicly, add authenticated access and per-user rate limits, deploy behind HTTPS, configure allowed origins, and publish the app's terms and privacy policy. CORS alone is not authentication. Never put a shared secret into the client to substitute for user authentication.

## Data behavior

- Google results have stable `google:` place references. Saves, notes, comparisons, and guide membership persist on the device. Google venue metadata stays in memory and is fetched again for saved references after restart. Failed refreshes preserve those references with a “Saved place” placeholder.
- Personal missing experiences use `user:` IDs. The user supplies the name, city, optional notes and coordinates. These original entries are stored locally and can be saved, ranked, and put in guides. They are not published to other users.
- Google attribution and supplied third-party attributions appear with Google results. Google data is shown on Google Maps on every supported map surface. The server never proxies arbitrary URLs or returns its key.
- Google venue ratings are not repurposed as personal/friend scores. Prices, activity durations, and nicheness remain unknown unless separately established. Activity-type-derived moods are editorial suggestions. Unknown prices/durations are excluded by restrictive filters.
- The SLO sample collection and sample friend activity remain available explicitly. They are not presented as live results in other cities. Authentication, real social accounts, live class schedules, and booking remain separate work.

## Verification

```sh
npm run typecheck
npm test
npm run export:web
npm run export:native
```

API tests use controlled provider responses, covering city resolution, current coordinates, rectangular searches, pagination, unknown fields, closed places, invalid inputs, quotas, and missing configuration. An actual Google Cloud key and configured physical-device build are required to verify real provider responses, map authorization, and device permissions end to end.

References: [Places search](https://developers.google.com/maps/documentation/places/web-service/nearby-search), [city autocomplete](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete), [Google display and storage requirements](https://developers.google.com/maps/documentation/places/web-service/policies).
