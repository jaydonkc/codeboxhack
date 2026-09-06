import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import * as Clipboard from "expo-clipboard";
import { C, fonts, s } from "./src/theme";
import {
  byId,
  catalog,
  demoReviews,
  distance,
  Experience,
  Filters,
  SearchOrigin,
  icons,
  matches,
  priceLabel,
  VIBES,
} from "./src/data/catalog";
import ExperienceMap from "./src/components/ExperienceMap";
import BottomSheet from "./src/components/Sheet";
import ActivityDetail from "./src/components/ActivityDetail";
import Onboarding from "./src/components/Onboarding";
import { useStoredData } from "./src/components/useStoredData";
import { useReducedMotion } from "./src/components/useReducedMotion";
import { completeOnboarding, dismissFirstSavePrompt, toggleSavedExperience } from "./src/core/storage";
import ActivityPicker from "./src/components/ActivityPicker";
import VisitDateField from "./src/components/VisitDateField";
import GuideLibrary, { GuideCover, type GuideLibraryTab } from "./src/components/GuideLibrary";
import GuideDetail from "./src/components/GuideDetail";
import { exampleGuides, type ExperienceGuide } from "./src/data/guides";
import DistanceSlider from "./src/components/DistanceSlider";
import { distanceSliderLabel, PRICE_OPTIONS, priceFilterLabel } from "./src/core/filterOptions";
import { formatVisitDate, localDateKey } from "./src/core/visitDate";
import { getNicheness } from "./src/data/nicheness";
import { createPersonalGuide, isFavorite, saveRankedVisit, updateVisitDetails } from "./src/core/personal";
import {
  answerRanking,
  Band,
  beginRanking,
  currentOpponent,
  Preference,
  RankingAnswer,
  RankingSession,
  scorePreferences,
} from "./src/core/ranking";

type Page = "discover" | "lists" | "friends" | "you" | "detail" | "guide";
type Sheet =
  | "filters"
  | "city"
  | "log"
  | "add-activity"
  | "edit-visit"
  | "niche"
  | "share"
  | "menu"
  | "activity"
  | "about"
  | "experience-share"
  | "experience-actions"
  | null;
const seed: Preference[] = [
  { id: "sloma", band: "liked", rank: 1, again: true },
  { id: "leaning-pine-arboretum", band: "liked", rank: 2, again: true },
  { id: "downtown-creek-walk", band: "liked", rank: 3, again: true },
];
const bands: Record<Band, string> = {
  liked: "Liked it",
  okay: "It was okay",
  disliked: "Didn’t like it",
};
const I = ({
  name,
  size = 20,
  color = C.ink,
}: {
  name: string;
  size?: number;
  color?: string;
}) => <Ionicons name={name as any} size={size} color={color} />;
const T = ({ style, ...props }: React.ComponentProps<typeof Text>) => (
  <Text {...props} style={[s.text, style]} />
);
function Icon({
  name,
  label,
  onPress,
}: {
  name: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={s.icon}
    >
      <I name={name} />
    </Pressable>
  );
}
function Button({
  children,
  onPress,
  secondary = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={secondary ? s.secondary : s.primary}
    >
      <T style={secondary ? { fontFamily: fonts.medium } : s.primaryText}>
        {children}
      </T>
    </Pressable>
  );
}
function Pill({
  label,
  onPress,
  active = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[s.pill, active && s.pillActive]}
    >
      {icon && <I name={icon} size={15} color={active ? C.greenInk : C.ink} />}
      <T style={[s.pillText, active && s.pillTextActive]}>{label}</T>
    </Pressable>
  );
}
export default function App() {
  const [ready, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
  });
  if (!ready && !error)
    return (
      <View style={[s.outer, { justifyContent: "center" }]}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  return (
    <SafeAreaProvider>
      <Elsewhere />
    </SafeAreaProvider>
  );
}
function Elsewhere() {
  const { data, setData, loaded: hydrated, loadError, saveError, retryLoad, retrySave } = useStoredData();
  const reducedMotion = useReducedMotion();
  const appOpacity = useRef(new Animated.Value(1)).current;
  const [enteringDiscover, setEnteringDiscover] = useState(false);
  const [launchStep, setLaunchStep] = useState<"onboarding" | "account" | "complete">("onboarding");
  const [launchInterests, setLaunchInterests] = useState<string[] | null>(null);
  const selectedLaunchInterests = launchInterests ?? (data.onboarding.step === "complete" ? data.interests : data.onboarding.draftInterests);
  const [page, setPage] = useState<Page>("discover"),
    [sheet, setSheet] = useState<Sheet>(null);
  const [selected, setSelected] = useState("sloma"),
    [listTab, setListTab] = useState("saved"),
    [map, setMap] = useState(false),
    [audience, setAudience] = useState<"Friends" | "Everyone">("Friends");
  const [mode, setMode] = useState("all"),
    [filters, setFilters] = useState<Filters>({
      budget: null,
      radius: null,
      duration: null,
      vibes: [],
      query: "",
    });
  const [owner, setOwner] = useState<string>("emma"),
    [session, setSession] = useState<RankingSession | null>(null),
    [note, setNote] = useState(""),
    [again, setAgain] = useState(false),
    [visitedOn, setVisitedOn] = useState<string | undefined>();
  const [guideLibraryTab, setGuideLibraryTab] = useState<GuideLibraryTab>("explore");
  const [guideMap, setGuideMap] = useState(false);
  const [toast, setToast] = useState(""),
    [toastSavedId, setToastSavedId] = useState<string | null>(null),
    [cityQuery, setCityQuery] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    scroll = useRef<ScrollView>(null),
    returnPage = useRef<Page>("discover");
  function notify(message: string, savedId: string | null = null) {
    setToast(message);
    setToastSavedId(savedId);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), savedId ? 8000 : 3000);
  }
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    if (!enteringDiscover) return;
    const animation = Animated.timing(appOpacity, {
      toValue: 1, duration: reducedMotion === false ? 260 : 0,
      easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web",
    });
    animation.start(({ finished }) => { if (finished) setEnteringDiscover(false); });
    return () => animation.stop();
  }, [appOpacity, enteringDiscover, reducedMotion]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (sheet) {
        closeSheet();
        return true;
      }
      if (page !== "discover") {
        setPage("discover");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [sheet, page, session, note, again, visitedOn]);
  const scores = useMemo(
      () => scorePreferences(data.preferences),
      [data.preferences],
    ),
    done = new Set(data.preferences.map((x) => x.id)),
    x = byId(selected);
  function nav(p: Page) {
    setPage(p);
    setSheet(null);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  function detail(id: string) {
    returnPage.current = page;
    setSelected(id);
    nav("detail");
  }
  function guide(who: string) {
    setOwner(who !== "you" && !data.demoSocial ? "you" : who);
    setGuideMap(false);
    nav("guide");
  }
  function save(id: string) {
    const removing = data.saved.includes(id);
    setData((d) => toggleSavedExperience(d, id));
    notify(removing ? "Removed from Want to try" : "Saved to Want to try", removing ? null : id);
  }
  function filter(p: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...p }));
  }
  function clearFilters() {
    setFilters({
      budget: null,
      radius: null,
      duration: null,
      vibes: [],
      query: "",
    });
  }
  function chooseCity() {
    setCityQuery("");
    setSheet("city");
  }
  const [searchOrigin, setSearchOrigin] = useState<SearchOrigin>();
  const [mapFocus, setMapFocus] = useState<SearchOrigin>();
  const locationLabel = searchOrigin ? "Near you" : data.city;
  function useMyLocation(point: SearchOrigin) {
    setMapFocus(undefined);
    setSearchOrigin(point);
    filter({ bounds: undefined, radius: filters.radius ?? 25 });
  }
  function selectCity(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSearchOrigin(undefined);
    setMapFocus(undefined);
    const city = /^(slo|san luis obispo)$/i.test(trimmed)
      ? "San Luis Obispo"
      : trimmed;
    setData((d) => ({ ...d, city }));
    filter({ bounds: undefined });
    setSheet(null);
  }
  function log(id: string) {
    setSelected(id);
    setSession(null);
    const old = data.preferences.find((p) => p.id === id);
    setNote(old?.note || "");
    setAgain(old?.again || false);
    setVisitedOn(old ? old.visitedOn : localDateKey());
    setSheet("log");
  }
  function updateRanking(next: RankingSession) {
    setSession(next);
    setData((d) => saveRankedVisit(d, next, { note, again, visitedOn }));
  }
  function closeSheet() {
    if (sheet === "log" && session)
      setData((d) => saveRankedVisit(d, session, { note, again, visitedOn }));
    setSheet(null);
  }
  function editVisit(id: string) {
    const visit = data.preferences.find((p) => p.id === id);
    if (!visit) return;
    setSelected(id);
    setNote(visit.note || "");
    setAgain(visit.again || false);
    setVisitedOn(visit.visitedOn);
    setSheet("edit-visit");
  }
  function fit(e: Experience) {
    const explicit =
      e.vibes.filter((v) => data.interests.includes(v)).length /
      Math.max(e.vibes.length, 1);
    let total = 0,
      w = 0;
    for (const p of data.preferences) {
      const prev = byId(p.id),
        similar =
          (prev.activityType === e.activityType ? 2 : 0) +
          prev.vibes.filter((v) => e.vibes.includes(v)).length;
      total += similar * (p.band === "liked" ? 1 : p.band === "okay" ? 0.5 : 0);
      w += similar;
    }
    return w ? (explicit * 2 + total) / (2 + w) : explicit;
  }
  const cityCatalog = catalog.filter(
    (e) =>
      searchOrigin ? (distance(e, searchOrigin) ?? Infinity) <= (filters.radius ?? 25) : e.city.replace(/^Near /, "").toLowerCase() === data.city.toLowerCase(),
  );
  let results = cityCatalog.filter((e) => matches(e, filters, searchOrigin));
  if (page === "lists")
    results = results.filter((e) =>
      listTab === "saved" ? data.saved.includes(e.id) : done.has(e.id),
    );
  if (page === "discover" && mode === "new")
    results = results.filter((e) => !done.has(e.id));
  if (page === "discover" && mode === "familiar")
    results = results.filter((e) => isFavorite(e.id, data.preferences));
  const listIds = listTab === "saved" ? data.saved : data.preferences.map((p) => p.id);
  const hiddenListEntries = page === "lists" && listIds.length > 0 && !results.length;
  results.sort((a, b) =>
    page === "lists" && listTab === "done"
      ? (scores[b.id] ?? -1) - (scores[a.id] ?? -1)
      : fit(b) - fit(a),
  );
  const personalGuide: ExperienceGuide = {
    id: "you", title: "My SLO favorites", author: "You", city: "San Luis Obispo",
    description: "My favorite experiences in San Luis Obispo.",
    coverId: data.guide[0] || "", experienceIds: data.guide, notes: data.guideNotes,
  };
  const activeGuide = owner === "you" || !data.demoSocial
    ? personalGuide : exampleGuides.find((item) => item.id === owner) || exampleGuides[0];
  const guideIds = activeGuide.experienceIds;
  const guideText =
    `${activeGuide.title}\n${activeGuide.city}\nBy ${activeGuide.author}\n\n` +
    guideIds.map((id, i) =>
      `${i + 1}. ${byId(id).name}\n${activeGuide.notes[id] || ""}\n${byId(id).sourceUrl}`,
    ).join("\n\n");
  const official = (url: string) =>
    Linking.openURL(url).catch(() =>
      notify("Could not open the official source."),
    );
  function score(e: Experience) {
    const personal = done.has(e.id);
    return (
      <View style={s.score}>
        <I name={personal ? "person-outline" : "people-outline"} color={C.green} size={14} />
        <T style={s.scoreText}>
          {personal
            ? scores[e.id] === null
              ? "Not fully ranked"
              : `You ${scores[e.id]?.toFixed(1)}`
            : data.demoSocial
              ? `${audience} ${demoReviews[e.id][audience === "Friends" ? "friends" : "everyone"].toFixed(1)}`
              : "Unrated"}
        </T>
      </View>
    );
  }
  function card(e: Experience) {
    const visit = data.preferences.find((p) => p.id === e.id);
    return (
      <View style={s.card} key={e.id}>
        <View style={s.cardBody}>
          <View style={[s.row, { alignItems: "flex-start" }]}>
            <View style={[s.avatar, { borderRadius: 12 }]}>
              <I
                name={icons[e.activityType] || "compass-outline"}
                color={C.green}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${e.name}`}
              onPress={() => detail(e.id)}
              style={{ flex: 1, gap: 4 }}
            >
              <T style={s.heading}>{e.name}</T>
              <T style={s.tiny}>{e.venue}</T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${data.saved.includes(e.id) ? "Unsave" : "Save"} ${e.name}`}
              accessibilityState={{ selected: data.saved.includes(e.id) }}
              onPress={() => save(e.id)}
              style={[
                s.save,
                data.saved.includes(e.id) && { backgroundColor: C.green },
              ]}
            >
              <I
                name={
                  data.saved.includes(e.id) ? "bookmark" : "bookmark-outline"
                }
                color={data.saved.includes(e.id) ? C.greenInk : C.ink}
                size={18}
              />
            </Pressable>
          </View>
          <T style={s.muted}>
            {e.vibes.join(" · ")}
            {"\n"}
            {priceLabel(e)} · ~{e.durationMinutesSuggested} min ·{" "}
            {distance(e, searchOrigin)?.toFixed(1)} mi
          </T>
          <View style={s.wrap}>
            {score(e)}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSelected(e.id);
                setSheet("niche");
              }}
              style={s.niche}
            >
              <T style={s.nicheText}>
                Niche {getNicheness(e.id).score.toFixed(1)}
              </T>
            </Pressable>
          </View>
          {page === "lists" && listTab === "done" && (
            <>
              <Pressable accessibilityRole="button"
                accessibilityLabel={`Edit visit date for ${e.name}`}
                onPress={() => editVisit(e.id)}
                style={[s.row, { minHeight: 44 }]}>
                <I name="calendar-outline" color={C.muted} size={16} />
                <T style={s.muted}>
                  {visit?.visitedOn ? `Visited ${formatVisitDate(visit.visitedOn)}` : "Add visit date"}
                </T>
              </Pressable>
              <Button secondary onPress={() => log(e.id)}>
                {scores[e.id] === null ? "Finish ranking" : "Rerank"}
              </Button>
            </>
          )}
        </View>
      </View>
    );
  }
  function teaser() {
    if (!data.demoSocial) return null;
    return <GuideCover guide={exampleGuides[0]} compact onPress={() => guide("emma")} />;
  }
  function browse() {
    return (
      <>
        <View style={s.quick}>
          {[
            ["new", "sparkles-outline", "New to you"],
            ["familiar", "heart-outline", "Favorites"],
            ["map", "map-outline", "Nearby map"],
          ].map(([m, icon, label]) => (
            <Pressable
              accessibilityRole="button"
              key={m}
              style={[
                s.quickButton,
                (m === "map" ? map : mode === m) && s.quickActive,
              ]}
              onPress={() => {
                if (m === "map") setMap(!map);
                else {
                  setMode(mode === m ? "all" : m);
                  if (page !== "discover") nav("discover");
                }
              }}
            >
              <I name={icon} size={14} color={C.green} />
              <T style={{ fontSize: 12, fontFamily: fonts.medium }}>{label}</T>
            </Pressable>
          ))}
        </View>
        <View style={[s.between, s.pad]}>
          <T style={s.title}>Experiences</T>
          <Pressable accessibilityRole="button" onPress={chooseCity}>
            <T style={s.tiny}>{locationLabel} ⌄</T>
          </Pressable>
        </View>
        <View style={s.tabs}>
          {[
            ["discover", "For you"],
            ["done", "Been"],
            ["saved", "Want to try"],
            ["guides", "Guides"],
          ].map(([key, label]) => {
            const active =
              key === "discover"
                ? page === "discover"
                : page === "lists" && listTab === key;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                key={key}
                style={[s.tab, active && s.tabActive]}
                onPress={() => {
                  if (key === "guides")
                    nav("friends");
                  else if (key === "discover") nav("discover");
                  else {
                    setListTab(key);
                    nav("lists");
                  }
                }}
              >
                <T
                  style={[
                    s.muted,
                    active && { color: C.ink, fontFamily: fonts.bold },
                  ]}
                >
                  {label}
                </T>
              </Pressable>
            );
          })}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 22,
            gap: 7,
            paddingBottom: 14,
          }}
        >
          <Pill
            label="Filters"
            icon="options-outline"
            onPress={() => setSheet("filters")}
          />
          <Pill
            label={locationLabel}
            icon="location-outline"
            onPress={chooseCity}
          />
          <Pill
            label={
              filters.budget === null ? "Any price" : priceFilterLabel(filters.budget)
            }
            active={filters.budget !== null}
            onPress={() => setSheet("filters")}
          />
          <Pill
            label={filters.radius ? `${filters.radius} mi` : "Distance"}
            onPress={() => setSheet("filters")}
          />
        </ScrollView>
        <View style={[s.between, s.pad, { marginBottom: 14 }]}>
          <T style={s.tiny}>
            {results.length} results{filters.bounds ? " · map area" : ""}
          </T>
          <View style={s.row}>
            {data.demoSocial && (["Friends", "Everyone"] as const).map((a) => (
              <Pressable
                key={a}
                accessibilityRole="button"
                onPress={() => setAudience(a)}
              >
                <T
                  style={[
                    s.tiny,
                    a === audience && {
                      color: C.green,
                      textDecorationLine: "underline",
                    },
                  ]}
                >
                  {a}
                </T>
              </Pressable>
            ))}
            <Icon
              name={map ? "list-outline" : "map-outline"}
              label={map ? "Show list" : "Show map"}
              onPress={() => setMap(!map)}
            />
          </View>
        </View>
        <View style={s.pad}>
          {page === "discover" && !map && mode !== "familiar" && results.length > 0 &&
            !data.onboarding.firstSavePromptDismissed && data.saved.length === 0 && (
            <View style={[s.notice, s.between, { marginBottom: 16 }]}>
              <I name="bookmark-outline" color={C.green} size={22} />
              <T style={[s.muted, { flex: 1 }]}>See something you’d try? Save it for later.</T>
              <Icon name="close" label="Dismiss saving tip" onPress={() => setData(dismissFirstSavePrompt)} />
            </View>
          )}
          {map ? (
            <View style={s.stack}>
              <ExperienceMap
                initialCenter={mapFocus}
                origin={searchOrigin}
                onUserLocation={useMyLocation}
                items={results}
                selected={selected}
                onSelect={setSelected}
                onSearchArea={(bounds) => filter({ bounds })}
                onResetArea={() => filter({ bounds: undefined })}
              />
              <T style={s.tiny}>
                Distances from {searchOrigin ? "your location" : "Downtown SLO"} · check access before you go.
              </T>
              {results.some((e) => e.id === selected) && card(x)}
            </View>
          ) : (
            results.map(card)
          )}
          {!results.length && (
            <View style={s.empty}>
              <I name="leaf-outline" size={35} color={C.green} />
              <T style={s.heading}>
                {page === "lists"
                  ? hiddenListEntries ? "No experiences match your filters." : "Your next story starts here."
                  : !cityCatalog.length
                    ? searchOrigin ? "No experiences nearby yet." : `No experiences in ${data.city} yet.`
                    : "A little too specific?"}
              </T>
              <T style={[s.muted, { textAlign: "center" }]}>
                {page === "lists"
                  ? hiddenListEntries
                    ? `Your ${listTab === "saved" ? "saved experiences" : "visits"} are still here. Clear the search, area and filters to see them.`
                    : "Save or log an experience to see it here."
                  : !cityCatalog.length
                    ? "Explore San Luis Obispo while we add more cities."
                    : "Try a wider area or a different budget."}
              </T>
              <Button
                secondary
                onPress={() => {
                  clearFilters();
                  setMode("all");
                  if (hiddenListEntries) {
                    selectCity(byId(listIds[0]).city.replace(/^Near /, ""));
                    return;
                  }
                  if (!cityCatalog.length) selectCity("San Luis Obispo");
                  nav("discover");
                }}
              >
                {hiddenListEntries ? "Clear filters" : cityCatalog.length
                  ? "Explore all experiences"
                  : "Explore San Luis Obispo"}
              </Button>
            </View>
          )}
          {page === "discover" && <View style={{ marginVertical: 18 }}>{teaser()}</View>}
        </View>
      </>
    );
  }
  function showActivityMap() {
    selectCity(x.city.replace(/^Near /, ""));
    clearFilters();
    setMode("all");
    setMapFocus(x.lat !== null && x.lng !== null ? { lat: x.lat, lng: x.lng } : undefined);
    setMap(true);
    nav("discover");
    setSelected(x.id);
  }
  function activityDirections() {
    official(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.venue + ", San Luis Obispo, California")}`,
    );
  }
  function detailView() {
    const pref = data.preferences.find((p) => p.id === x.id);
    return (
      <ActivityDetail
        key={x.id}
        activity={x}
        map={
          <ExperienceMap
            items={[x]}
            selected={x.id}
            onSelect={showActivityMap}
            compact
            height={166}
          />
        }
        personalScore={pref ? scores[x.id] : undefined}
        saved={data.saved.includes(x.id)}
        social={data.demoSocial ? demoReviews[x.id] : null}
        niche={getNicheness(x.id)}
        awareness={data.awareness[x.id]}
        note={pref?.note}
        again={pref?.again}
        visitedOn={pref?.visitedOn}
        onBack={() => nav(returnPage.current)}
        onShare={() => setSheet("experience-share")}
        onMore={() => setSheet("experience-actions")}
        onRank={() => log(x.id)}
        onEditVisit={() => editVisit(x.id)}
        onSave={() => save(x.id)}
        onWebsite={() => official(x.sourceUrl)}
        onDirections={activityDirections}
        onMap={showActivityMap}
        onNiche={() => setSheet("niche")}
        onAwareness={(value) => {
          setData((d) => ({
            ...d,
            awareness: { ...d.awareness, [x.id]: value },
          }));
          notify("Thanks for sharing.");
        }}
        onAddToGuide={
          pref
            ? () => {
                setData((d) => ({
                  ...d,
                  guide: [...new Set([...d.guide, x.id])],
                  guideCreated: true,
                }));
                notify("Added to your SLO guide.");
              }
            : undefined
        }
      />
    );
  }
  function guideView() {
    return <GuideDetail
      key={activeGuide.id}
      guide={activeGuide}
      personal={activeGuide.id === "you"}
      saved={data.saved}
      map={guideMap}
      mapView={guideMap && <ExperienceMap items={guideIds.map(byId)} selected={selected} onSelect={detail} />}
      onBack={() => nav("friends")}
      onShare={() => setSheet("share")}
      onMap={() => setGuideMap(!guideMap)}
      onSaveAll={() => {
        setData((d) => ({ ...(guideIds.length ? dismissFirstSavePrompt(d) : d), saved: [...new Set([...d.saved, ...guideIds])] }));
        notify("Guide experiences saved.", guideIds[0] ?? null);
      }}
      onSave={save}
      onOpen={detail}
      onMoveUp={(index) => {
        if (index < 1) return;
        setData((d) => {
          const next = [...d.guide];
          [next[index - 1], next[index]] = [next[index], next[index - 1]];
          return { ...d, guide: next };
        });
      }}
      onRemove={(id) => setData((d) => ({ ...d, guide: d.guide.filter((value) => value !== id) }))}
      onNote={(id, value) => setData((d) => ({ ...d, guideNotes: { ...d.guideNotes, [id]: value } }))}
      onAdd={() => {
        clearFilters();
        setData((d) => ({ ...d, city: "San Luis Obispo" }));
        setSearchOrigin(undefined);
        setListTab("done");
        setMap(false);
        nav(data.preferences.length ? "lists" : "discover");
      }}
    />;
  }
  function profile() {
    return (
      <View style={[s.pad, s.stack]}>
        <Image
          source={require("./assets/profile/jaydon-beli.png")}
          accessibilityLabel="Your profile photo"
          style={{ width: 70, height: 70, borderRadius: 35 }}
          resizeMode="cover"
        />
        <T style={s.serif}>Your kind of{"\n"}good day.</T>
        <View style={[s.row, { gap: 25 }]}>
          {[
            [data.preferences.length, "experiences"],
            [data.saved.length, "want to try"],
            [data.guide.length, "in your guide"],
          ].map(([n, label]) => (
            <View key={label}>
              <T style={s.title}>{n}</T>
              <T style={s.tiny}>{label}</T>
            </View>
          ))}
        </View>
        <T style={s.heading}>You’re into</T>
        <View style={s.wrap}>
          {VIBES.map((v) => (
            <Pill
              key={v}
              label={v}
              active={data.interests.includes(v)}
              onPress={() =>
                setData((d) => ({
                  ...d,
                  interests: d.interests.includes(v)
                    ? d.interests.filter((z) => z !== v)
                    : [...d.interests, v],
                }))
              }
            />
          ))}
        </View>
        <Button secondary onPress={() => guide("you")}>
          My SLO guide
        </Button>
        <View style={s.separator} />
        <Button secondary onPress={chooseCity}>
          Search city
        </Button>
        <Button secondary onPress={() => setSheet("about")}>
          About Elsewhere
        </Button>
      </View>
    );
  }
  function visitFields() {
    return (
      <>
        <VisitDateField value={visitedOn} onChange={setVisitedOn} />
        <TextInput
          accessibilityLabel="Experience note"
          placeholder="A note for your future self"
          placeholderTextColor={C.muted}
          multiline
          value={note}
          onChangeText={setNote}
          style={[s.inputBox, { minHeight: 85, textAlignVertical: "top" }]}
        />
        <View style={s.between}>
          <T>Repeatable</T>
          <Switch
            accessibilityLabel="Repeatable"
            value={again}
            onValueChange={setAgain}
            trackColor={{ true: "#608451", false: C.line }}
            thumbColor={C.green}
          />
        </View>
      </>
    );
  }
  function logView() {
    const opponent = session ? currentOpponent(session) : null,
      value = session?.status === "placed" ? scores[session.id] : null;
    function answer(a: RankingAnswer) {
      if (session) updateRanking(answerRanking(session, a));
    }
    function finish() {
      if (!session) return;
      setData((d) => saveRankedVisit(d, session, { note, again, visitedOn }, { savePending: true }));
      setSheet(null);
      notify(
        session.status === "placed"
          ? "Ranking saved."
          : "Visit saved. Finish ranking from Been.",
      );
    }
    return (
      <>
        {session?.status !== "active" && <T style={s.muted}>{x.name}</T>}
        {!session ? (
          <>
            <T style={s.serif}>How was it?</T>
            <VisitDateField value={visitedOn} onChange={setVisitedOn} />
            {(["liked", "okay", "disliked"] as Band[]).map((b, i) => (
              <Pressable
                accessibilityRole="button"
                key={b}
                onPress={() =>
                  updateRanking(beginRanking(x.id, b, data.preferences))
                }
                style={[
                  s.choice,
                  { flexDirection: "row", alignItems: "center", gap: 16 },
                ]}
              >
                <I
                  name={
                    ["happy-outline", "remove-circle-outline", "sad-outline"][i]
                  }
                  color={[C.green, "#e8d192", C.coral][i]}
                  size={32}
                />
                <T style={s.heading}>{bands[b]}</T>
              </Pressable>
            ))}
          </>
        ) : session.status === "active" && opponent ? (
          <>
            <View style={s.comparisonHeader}>
              <T style={s.comparisonTitle}>Which did you{"\n"}enjoy more?</T>
              <T style={s.tiny}>
                Comparison {session.compared + 1} of at most 5 ·{" "}
                {bands[session.band]}
              </T>
            </View>
            <View style={s.comparisonRow}>
              {([
                { experience: x, label: "Just visited", answer: "new" },
                { experience: byId(opponent), label: "From your list", answer: "existing" },
              ] as const).map((choice) => (
                <Pressable
                  key={choice.answer}
                  accessibilityRole="button"
                  accessibilityLabel={`I enjoyed ${choice.experience.name} more`}
                  accessibilityHint={choice.experience.venue}
                  onPress={() => answer(choice.answer)}
                  style={({ pressed }) => [
                    s.comparisonCard,
                    pressed && s.comparisonCardPressed,
                  ]}
                >
                  <T style={s.comparisonLabel}>{choice.label}</T>
                  <View style={s.comparisonIcon}>
                    <I
                      name={icons[choice.experience.activityType] || "sparkles-outline"}
                      size={28}
                      color={C.green}
                    />
                  </View>
                  <T style={s.comparisonName}>{choice.experience.name}</T>
                  <T style={s.comparisonVenue}>{choice.experience.venue}</T>
                </Pressable>
              ))}
              <View pointerEvents="none" style={s.comparisonOr}>
                <T style={s.tiny}>or</T>
              </View>
            </View>
            <Button secondary onPress={() => answer("tie")}>
              About the same
            </Button>
            <Button secondary onPress={() => answer("skip")}>
              Can’t compare
            </Button>
            <T style={[s.tiny, { textAlign: "center" }]}>
              Skipping never counts as a dislike.
            </T>
          </>
        ) : (
          <>
            <T style={s.serif}>
              {session.status === "placed"
                ? "Found its place."
                : "Save it for later."}
            </T>
            {session.status === "placed" ? (
              <>
                <T style={s.bigNumber}>{value?.toFixed(1)}</T>
                <T style={s.muted}>Your score · {bands[session.band]}</T>
                <T style={s.eyebrow}>Saved to Been</T>
                <T style={s.tiny}>
                  Based on your rankings. Your score adjusts as you try more
                  experiences.
                </T>
              </>
            ) : (
              <T style={s.muted}>
                Save your reaction now. The numeric score stays blank until you
                finish ranking.
              </T>
            )}
            {visitFields()}
            <Button onPress={finish}>
              {session.status === "placed"
                ? "Done"
                : "Save reaction · rank later"}
            </Button>
            <Button secondary onPress={() => setSession(null)}>
              Change my reaction
            </Button>
          </>
        )}
      </>
    );
  }
  function sheetView() {
    if (sheet === "add-activity") return <ActivityPicker onSelect={log} />;
    if (sheet === "log") return logView();
    if (sheet === "edit-visit")
      return (
        <>
          <T style={s.heading}>{x.name}</T>
          <T style={s.muted}>Update your visit date, note, and repeatable choice.</T>
          {visitFields()}
          <Button onPress={() => {
            setData((d) => ({
              ...d,
              preferences: updateVisitDetails(d.preferences, x.id, { note, again, visitedOn }),
            }));
            setSheet(null);
            notify("Visit updated.");
          }}>
            Save visit changes
          </Button>
        </>
      );
    if (sheet === "filters")
      return (
        <>
          <T style={s.heading}>Price</T>
          <View style={s.wrap}>
            {PRICE_OPTIONS.map((option) => (
              <Pill
                key={option.label}
                label={option.label}
                active={filters.budget === option.value}
                onPress={() => filter({ budget: option.value })}
              />
            ))}
          </View>
          <T style={s.tiny}>
            {PRICE_OPTIONS.find((option) => option.value === filters.budget)?.description}.
            {filters.budget !== null ? " Excludes unknown prices." : " Extras may cost more."}
          </T>
          <View style={{ gap: 6 }}>
            <View style={s.between}>
              <T style={s.heading}>Distance</T>
              <T style={{ color: C.green, fontFamily: fonts.medium }}>{distanceSliderLabel(filters.radius)}</T>
            </View>
            <T style={s.tiny}>From {searchOrigin ? "your location" : "Downtown SLO"}</T>
            <DistanceSlider value={filters.radius} onChange={(radius) => filter({ radius })} />
            <View style={s.between}>
              <T style={s.tiny}>1 mi</T>
              <T style={s.tiny}>Any distance</T>
            </View>
          </View>
          <T style={s.heading}>The mood</T>
          <View style={s.wrap}>
            {VIBES.map((v) => (
              <Pill
                key={v}
                label={v}
                active={filters.vibes.includes(v)}
                onPress={() =>
                  filter({
                    vibes: filters.vibes.includes(v)
                      ? filters.vibes.filter((z) => z !== v)
                      : [...filters.vibes, v],
                  })
                }
              />
            ))}
          </View>
          <T style={s.heading}>Time to spend</T>
          <View style={s.wrap}>
            {[null, 60, 90, 180].map((v) => (
              <Pill
                key={String(v)}
                label={v === null ? "Any" : `${v} min`}
                active={filters.duration === v}
                onPress={() => filter({ duration: v })}
              />
            ))}
          </View>
          <T style={s.tiny}>
            Suggested durations · distances measured from {searchOrigin ? "your location" : "Downtown SLO"}.
          </T>
          <Button onPress={() => setSheet(null)}>
            Show matching experiences
          </Button>
          <Button secondary onPress={clearFilters}>
            Reset filters
          </Button>
        </>
      );
    if (sheet === "city")
      return (
        <>
          <TextInput
            accessibilityLabel="Search for a city"
            value={cityQuery}
            onChangeText={setCityQuery}
            onSubmitEditing={() => selectCity(cityQuery)}
            placeholder="Search for a city"
            placeholderTextColor={C.muted}
            returnKeyType="search"
            style={s.inputBox}
          />
          <T style={s.tiny}>Searching in {data.city}</T>
          {(!cityQuery.trim() ||
            "san luis obispo".includes(cityQuery.trim().toLowerCase()) ||
            cityQuery.trim().toLowerCase() === "slo") && (
            <Pill
              label="San Luis Obispo"
              icon="location-outline"
              active={data.city === "San Luis Obispo"}
              onPress={() => selectCity("San Luis Obispo")}
            />
          )}
          {!!cityQuery.trim() && (
            <Button onPress={() => selectCity(cityQuery)}>
              Search {cityQuery.trim()}
            </Button>
          )}
          <T style={s.muted}>
            Experiences are currently available in San Luis Obispo. More cities
            to come.
          </T>
        </>
      );
    if (sheet === "niche") {
      const niche = getNicheness(x.id);
      return (
        <>
          <View style={[s.between, s.notice]}>
            <View>
              <T style={s.heading}>Nicheness</T>
              <T style={s.muted}>Research estimate · SLO</T>
            </View>
            <T style={[s.bigNumber, { color: C.purple, fontSize: 46 }]}>
              {niche.score.toFixed(1)}
            </T>
          </View>
          <T style={s.heading}>{x.name}</T>
          <T style={s.muted}>{niche.reason}</T>
          <View style={s.notice}>
            <T style={s.heading}>Familiar to under the radar</T>
            <T style={s.muted}>
              0 is a familiar staple. 10 is a specialist find. We look at travel
              coverage, the audience, and how deliberately you seek it out.
            </T>
          </View>
          <T style={s.tiny}>
            An editorial estimate, separate from enjoyment and how new it is to
            you.
          </T>
          <T style={s.heading}>Behind the estimate</T>
          {niche.sources.map((source) => (
            <Pressable
              key={source.url}
              accessibilityRole="link"
              onPress={() => official(source.url)}
              style={{ gap: 4, paddingVertical: 8 }}
            >
              <T style={{ color: C.green, fontFamily: fonts.medium }}>
                {source.title} ↗
              </T>
              <T style={s.tiny}>{source.observation}</T>
            </Pressable>
          ))}
          <T style={s.tiny}>
            Researched {niche.checkedAt} · {niche.confidence} confidence
          </T>
          <Button onPress={() => setSheet(null)}>Got it</Button>
        </>
      );
    }
    if (sheet === "about")
      return (
        <>
          <T style={s.serif}>Find your kind of good day.</T>
          <T style={s.muted}>
            Save things you want to try, rank what you’ve done, and share your
            favorite corners of a city.
          </T>
          <T style={s.heading}>About the data</T>
          <T style={s.muted}>
            Activity details come from official venue and destination sources.
            Nicheness is an editorial research estimate.
          </T>
          <T style={s.muted}>
            This preview uses example profiles, friend activity, and community
            scores. Your own lists, rankings, and notes are saved on this
            device.
          </T>
          <View style={s.between}>
            <View style={{ flex: 1 }}>
              <T>Example social data</T>
              <T style={s.tiny}>Show friends and community score examples</T>
            </View>
            <Switch
              accessibilityLabel="Example social data"
              value={data.demoSocial}
              onValueChange={(value) => {
                setData((d) => ({ ...d, demoSocial: value }));
                if (!value && owner !== "you") setOwner("you");
              }}
              trackColor={{ true: "#608451", false: C.line }}
              thumbColor={C.green}
            />
          </View>
          {!data.preferences.length && (
            <Button
              secondary
              onPress={() => {
                setData((d) => ({ ...d, preferences: seed }));
                notify("Three example visits added.");
              }}
            >
              Add example visits
            </Button>
          )}
          <T style={s.tiny}>
            Example visits let you explore comparison rankings with an empty
            list.
          </T>
          <Button onPress={() => setSheet(null)}>Back to exploring</Button>
        </>
      );
    if (sheet === "experience-share") {
      const text = `${x.name}\n${x.venue} · San Luis Obispo\n${x.sourceUrl}`;
      return (
        <>
          <T style={s.serif}>{x.name}</T>
          <T style={s.muted}>A good find is better shared.</T>
          <T selectable style={[s.notice, s.muted]}>
            {text}
          </T>
          <Button
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(text);
                setSheet(null);
                notify("Experience copied.");
              } catch {
                notify("Couldn’t copy. Select the text above.");
              }
            }}
          >
            Copy experience
          </Button>
        </>
      );
    }
    if (sheet === "experience-actions")
      return (
        <>
          <T style={s.heading}>{x.name}</T>
          <Button onPress={() => log(x.id)}>
            {done.has(x.id) ? "Edit your ranking" : "Rank this experience"}
          </Button>
          {done.has(x.id) && (
            <Button secondary onPress={() => editVisit(x.id)}>Edit visit details</Button>
          )}
          <Button
            secondary
            onPress={() => {
              save(x.id);
              setSheet(null);
            }}
          >
            {data.saved.includes(x.id)
              ? "Remove from Want to try"
              : "Save to Want to try"}
          </Button>
          <Button secondary onPress={showActivityMap}>
            View on map
          </Button>
          <Button secondary onPress={() => official(x.sourceUrl)}>
            Visit website ↗
          </Button>
          {done.has(x.id) && (
            <Button
              secondary
              onPress={() => {
                setData((d) => ({
                  ...d,
                  guide: [...new Set([...d.guide, x.id])],
                  guideCreated: true,
                }));
                setSheet(null);
                notify("Added to your SLO guide.");
              }}
            >
              Add to my city guide
            </Button>
          )}
        </>
      );
    if (sheet === "share")
      return (
        <>
          <T style={s.muted}>
            Only the guide’s order, guide notes and official links are included.
            Your private visit notes stay out.
          </T>
          <T selectable style={[s.notice, s.muted]}>
            {guideText}
          </T>
          <Button
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(guideText);
                setSheet(null);
                notify("Guide copied. Paste it to share.");
              } catch {
                notify("Copy unavailable. Select the text in the preview.");
              }
            }}
          >
            Copy guide text
          </Button>
        </>
      );
    if (sheet === "activity")
      return (
        <>
          <T style={s.muted}>{data.demoSocial ? "From your circle" : "No friend activity yet."}</T>
          {teaser()}
        </>
      );
    return (
      <>
        {[
          ["you", "person-outline", "Your profile"],
          ["lists", "bookmark-outline", "Your experiences"],
          ["friends", "book-outline", "Guides"],
        ].map(([p, icon, label]) => (
          <Pressable
            accessibilityRole="button"
            key={p}
            onPress={() => nav(p as Page)}
            style={[s.row, { paddingVertical: 14 }]}
          >
            <I name={icon} />
            <T>{label}</T>
          </Pressable>
        ))}
        <Button secondary onPress={chooseCity}>
          Change city
        </Button>
        <Button secondary onPress={() => setSheet("about")}>
          About Elsewhere
        </Button>
      </>
    );
  }
  if (loadError)
    return (
      <View style={s.outer}>
        <StatusBar style="light" />
        <SafeAreaView style={[s.app, s.pad, s.stack, { justifyContent: "center" }]}>
          <T style={s.serif}>Let’s try that again.</T>
          <T style={s.muted}>Couldn’t load your saved experiences. Your stored data hasn’t been changed.</T>
          <Button onPress={retryLoad}>Try loading again</Button>
        </SafeAreaView>
      </View>
    );
  if (!hydrated)
    return (
      <View style={[s.outer, { justifyContent: "center" }]}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  if (launchStep === "onboarding")
    return (
      <View style={s.outer}>
        <StatusBar style="light" />
        <SafeAreaView style={s.app} edges={["top", "bottom"]}>
          <Onboarding selected={selectedLaunchInterests}
            onToggle={(interest) => setLaunchInterests(selectedLaunchInterests.includes(interest)
              ? selectedLaunchInterests.filter((value) => value !== interest)
              : [...selectedLaunchInterests, interest])}
            onComplete={(skip) => {
              setData((d) => completeOnboarding({
                ...d,
                onboarding: { ...d.onboarding, step: "interests", draftInterests: skip ? d.interests : selectedLaunchInterests },
              }));
              setLaunchStep("account");
            }}
            saveError={saveError} onRetrySave={retrySave} />
        </SafeAreaView>
      </View>
    );
  if (launchStep === "account")
    return (
      <View style={s.outer}>
        <StatusBar style="light" />
        <SafeAreaView style={[s.app, s.pad, s.stack, { justifyContent: "center" }]} edges={["top", "bottom"]}>
          <T style={s.wordmark}>elsewhere</T>
          <Image source={require("./assets/profile/jaydon-beli.png")} accessibilityLabel="Your profile photo"
            style={{ width: 96, height: 96, borderRadius: 48, marginTop: 24 }} resizeMode="cover" />
          <T accessibilityRole="header" style={s.serif}>Welcome back, Jaydon.</T>
          <T style={s.muted}>Your demo profile, saved experiences, and personal rankings are ready.</T>
          <Button onPress={() => {
            appOpacity.setValue(reducedMotion === false ? 0 : 1);
            setEnteringDiscover(true);
            setLaunchStep("complete");
            clearFilters();
            setMode("all");
            setMap(false);
            nav("discover");
          }}>Continue as Jaydon</Button>
          <Button secondary onPress={() => setLaunchStep("onboarding")}>Back</Button>
        </SafeAreaView>
      </View>
    );
  return (
    <Animated.View style={[s.outer, { opacity: appOpacity }]}>
      <StatusBar style="light" />
      <SafeAreaView style={s.app} edges={["top", "bottom"]}>
        {saveError && <View accessibilityLiveRegion="polite" style={[s.notice, s.between, { margin: 12 }]}>
          <T style={[s.muted, { flex: 1 }]}>Your latest changes haven’t been saved.</T>
          <Pressable accessibilityRole="button" onPress={retrySave} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 10 }}>
            <T style={{ color: C.green }}>Retry save</T>
          </Pressable>
        </View>}
        {page !== "detail" && (
          <View style={s.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Elsewhere home"
              onPress={() => nav("discover")}
            >
              <T style={s.wordmark}>elsewhere</T>
            </Pressable>
            <View style={{ flexDirection: "row" }}>
              <Icon
                name="location-outline"
                label="Change city"
                onPress={chooseCity}
              />
              <Icon
                name="notifications-outline"
                label="Activity"
                onPress={() => setSheet("activity")}
              />
              <Icon
                name="menu-outline"
                label="Open menu"
                onPress={() => setSheet("menu")}
              />
            </View>
          </View>
        )}
        {(page === "discover" || page === "lists") && (
          <View style={s.search}>
            <I name="search-outline" color={C.muted} />
            <TextInput
              accessibilityLabel="Search experiences"
              placeholder="Search experiences, places…"
              placeholderTextColor={C.muted}
              value={filters.query}
              onChangeText={(query) => filter({ query })}
              style={s.input}
            />
            {!!filters.query && (
              <Icon
                name="close"
                label="Clear search"
                onPress={() => filter({ query: "" })}
              />
            )}
          </View>
        )}
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
        >
          {page === "discover" || page === "lists" ? (
            browse()
          ) : page === "detail" ? (
            detailView()
          ) : page === "guide" ? (
            guideView()
          ) : page === "you" ? (
            profile()
          ) : (
            <GuideLibrary
              examples={data.demoSocial ? exampleGuides : []}
              personal={personalGuide}
              created={data.guideCreated || data.guide.length > 0}
              tab={guideLibraryTab}
              onTab={setGuideLibraryTab}
              onOpen={guide}
              onCreate={() => {
                setData(createPersonalGuide);
                guide("you");
              }}
            />
          )}
        </ScrollView>
        <View style={s.nav}>
          {[
            ["discover", "compass-outline", "Discover"],
            ["lists", "bookmark-outline", "My lists"],
            ["add-activity", "add", "Add an activity"],
            ["friends", "book-outline", "Guides"],
            ["you", "person-outline", "You"],
          ].map(([p, icon, label]) => {
            if (p === "add-activity") return (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint="Choose an activity and log your visit"
                onPress={() => setSheet("add-activity")}
                style={({ pressed }) => [s.navItem, pressed && { opacity: 0.7 }]}
              >
                <View style={s.navAdd}>
                  <I name="add" size={30} color={C.bg} />
                </View>
              </Pressable>
            );
            const active =
              page === p ||
              (page === "detail" && p === "discover") ||
              (page === "guide" && p === "friends");
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
                key={p}
                onPress={() => nav(p as Page)}
                style={[s.navItem, active && s.navSelected]}
              >
                <I name={icon} size={22} color={active ? C.coral : C.muted} />
                <T style={[s.navLabel, active && { color: C.coral }]}>
                  {label}
                </T>
              </Pressable>
            );
          })}
        </View>
        {!!toast && (
          <View style={[s.toast, s.between]} accessibilityLiveRegion="polite">
            <T style={{ color: C.greenInk, fontSize: 14, flex: 1 }}>{toast}</T>
            {toastSavedId && <Pressable accessibilityRole="button" onPress={() => {
              clearFilters();
              selectCity(byId(toastSavedId).city.replace(/^Near /, ""));
              setMode("all");
              setMap(false);
              setListTab("saved");
              nav("lists");
              setToast("");
            }} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 6 }}>
              <T style={{ color: C.greenInk, fontSize: 14, fontFamily: fonts.bold }}>View list</T>
            </Pressable>}
          </View>
        )}
        <BottomSheet
          visible={sheet !== null}
          onClose={closeSheet}
          style={s.sheet}
          contentBottomPadding={32}
        >
          <View style={s.sheetHeader}>
            <T style={s.heading}>
              {
                {
                  filters: "Make it your kind of day",
                  log: "Your experience",
                  "add-activity": "Add an activity",
                  "edit-visit": "Edit your visit",
                  niche: "How niche is it?",
                  share: "Share a good day",
                  activity: "Activity",
                  about: "About Elsewhere",
                  city: "Choose a city",
                  "experience-share": "Share this experience",
                  "experience-actions": "Your experience",
                  menu: "Elsewhere",
                }[sheet || "menu"]
              }
            </T>
            <Icon
              name="close"
              label="Close dialog"
              onPress={closeSheet}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.sheetBody}
          >
            {sheetView()}
          </ScrollView>
        </BottomSheet>
      </SafeAreaView>
    </Animated.View>
  );
}
