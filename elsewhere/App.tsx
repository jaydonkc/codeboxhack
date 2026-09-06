import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Linking,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { C, fonts, s } from "./src/theme";
import {
  catalog as sampleCatalog,
  demoReviews,
  distance,
  Experience,
  Filters,
  SearchOrigin,
  MapBounds,
  icons,
  matches,
  priceLabel,
  VIBES,
} from "./src/data/catalog";
import ExperienceMap from "./src/components/ExperienceMap";
import FilterSlider from "./src/components/FilterSlider";
import Disclosure from "./src/components/Disclosure";
import BottomSheet from "./src/components/Sheet";
import ActivityDetail from "./src/components/ActivityDetail";
import FriendsPage from "./src/components/FriendsPage";
import LeaderboardPage from "./src/components/LeaderboardPage";
import GuidesLibrary from "./src/components/GuidesLibrary";
import CityGuidePage from "./src/components/CityGuidePage";
import { buildCityGuides, cityGuideText, cityKey, guideCityName } from "./src/core/guides";
import { friendCityGuides } from "./src/data/friendGuides";
import { friendById, type FriendId } from "./src/data/friends";
import { matchesIntent, matchesNiche, orderExperiences, type DiscoveryContext, type DiscoveryMode, type DiscoverySort } from "./src/core/discovery";
import { createCustomExperience, type CustomDraft } from "./src/core/customExperience";
import PlaceAttribution from "./src/components/PlaceAttribution";
import { useDeviceLocation } from "./src/components/useDeviceLocation";
import { livePlacesEnabled, requestPlaces } from "./src/services/places";
import { isGoogleId, unresolvedPlace, type CitySuggestion } from "./src/services/placesTypes";
import { usePlaceSearch } from "./src/services/usePlaceSearch";
import { getNicheness } from "./src/data/nicheness";
import {
  answerRanking,
  Band,
  beginRanking,
  currentOpponent,
  rankPositions,
  finishRanking,
  Preference,
  RankingAnswer,
  RankingSession,
  scorePreferences,
} from "./src/core/ranking";

type Page = "discover" | "lists" | "friends" | "leaderboard" | "you" | "detail" | "guide";
type Sheet =
  | "rank"
  | "add-experience"
  | "distance"
  | "sort"
  | "filters"
  | "city"
  | "log"
  | "niche"
  | "share"
  | "menu"
  | "about"
  | "experience-share"
  | "experience-actions"
  | null;
type Stored = {
  version: 1;
  placeholderVersion?: number;
  saved: string[];
  preferences: Preference[];
  awareness: Record<string, string>;
  interests: string[];
  demoSocial: boolean;
  city: string;
  cityPlaceId?: string;
  customExperiences: Experience[];
};
const seed: Preference[] = [
  { id: "bishop-peak", band: "liked", rank: 1, again: true, note: "Great views. Go early." },
  { id: "anam-cre-pottery", band: "liked", rank: 2, again: true },
  { id: "leaning-pine-arboretum", band: "liked", rank: 3, again: true },
  { id: "sloma", band: "liked", rank: 4, again: true },
  { id: "downtown-farmers-market", band: "liked", rank: 5, again: true },
  { id: "cerro-san-luis", band: "okay", rank: 1 },
  { id: "bubblegum-alley", band: "okay", rank: 2 },
];
const seedSaved = ["slo-botanical-garden", "slo-skate-park", "history-center", "downtown-creek-walk"];
function seedLists(value: Stored): Stored {
  if (value.placeholderVersion === 1) return value;
  const preferences = [...value.preferences];
  for (const item of seed) {
    if (preferences.some(p => p.id === item.id)) continue;
    const rank = Math.max(0, ...preferences.filter(p => p.band === item.band).map(p => p.rank ?? 0)) + 1;
    preferences.push({ ...item, rank });
  }
  return { ...value, placeholderVersion: 1, preferences,
    saved: [...new Set([...value.saved, ...seedSaved.filter(id => !preferences.some(p => p.id === id))])],
  };
}
const fresh: Stored = {
  version: 1,
  saved: [],
  preferences: [],
  awareness: {},
  interests: ["Relax", "Creative"],
  demoSocial: true,
  city: "San Luis Obispo",
  customExperiences: [],
};
const bands: Record<Band, string> = {
  liked: "Liked it",
  okay: "It was okay",
  disliked: "Didn’t like it",
};
const sortLabels: Record<DiscoverySort, string> = { "for-you": "For You", enjoyment: "Enjoyment", niche: "Nicheness", distance: "Distance", price: "Price" };
const validId = (id: string) => (typeof id === "string" && /^user:[A-Za-z0-9_-]+$/.test(id)) || isGoogleId(id) || sampleCatalog.some((x) => x.id === id);
const nicheFor = (id: string) => sampleCatalog.some(e => e.id === id) ? getNicheness(id) : null;
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
  const [data, setData] = useState<Stored>(() => seedLists(fresh)),
    [hydrated, setHydrated] = useState(false),
    [page, setPage] = useState<Page>("friends"),
    [sheet, setSheet] = useState<Sheet>(null);
  const [selected, setSelected] = useState("sloma"),
    [listTab, setListTab] = useState("done"),
    [map, setMap] = useState(false),
    [audience, setAudience] = useState<"Friends" | "Everyone">("Friends");
  const [sort, setSort] = useState<DiscoverySort>("for-you");
  const [draftFilters, setDraftFilters] = useState<Filters>({ budget: null, radius: null, duration: null, vibes: [], query: "" });
  const [draftNiche, setDraftNiche] = useState<[number, number]>([0, 10]);
  const [draftSort, setDraftSort] = useState<DiscoverySort>("for-you");
  const [filterSection, setFilterSection] = useState<string>();
  const [listCity, setListCity] = useState<string | null>(null);
  const [draftListCity, setDraftListCity] = useState<string | null>(null);
  const [rankQuery, setRankQuery] = useState("");
  const [rankSearchQuery, setRankSearchQuery] = useState("");
  const addIntent = useRef<"save" | "rank">("save");
  const rankFromNav = useRef(false);
  const cityDestination = useRef<Sheet>(null);
  const [nicheDirection, setNicheDirection] = useState<"asc" | "desc">("desc");
  const [nicheRange, setNicheRange] = useState<[number, number]>([0, 10]);
  const [mode, setMode] = useState<DiscoveryMode>("all"),
    [filters, setFilters] = useState<Filters>({
      budget: null,
      radius: null,
      duration: null,
      vibes: [],
      query: "",
    });
  const [searchOrigin, setSearchOrigin] = useState<SearchOrigin>();
  const [originLabel, setOriginLabel] = useState("Choose location");
  const [sampleMode, setSampleMode] = useState(!livePlacesEnabled);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [customDraft, setCustomDraft] = useState<CustomDraft>({ name: "", city: "", activityType: "", description: "", latitude: "", longitude: "" });
  const [customError, setCustomError] = useState("");
  const [cities, setCities] = useState<CitySuggestion[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState("");
  const cityGeneration = useRef(0);
  const deviceLocation = useDeviceLocation();
  const live = usePlaceSearch(searchOrigin, filters.radius, filters.bounds, submittedQuery, !sampleMode && hydrated, [...data.saved, ...data.preferences.map(p => p.id)]);
  const rankSearch = usePlaceSearch(searchOrigin ?? (sampleMode ? { lat: 35.28, lng: -120.6625 } : undefined), null, undefined, rankSearchQuery, sheet === "rank" && !!rankSearchQuery, []);
  const catalog = [...sampleCatalog, ...data.customExperiences, ...Object.values({ ...rankSearch.registry, ...live.registry })];
  const byId = (id: string): Experience => catalog.find(e => e.id === id) ?? unresolvedPlace(id);
  const [owner, setOwner] = useState<"you" | FriendId>("you"),
    [session, setSession] = useState<RankingSession | null>(null),
    [note, setNote] = useState(""),
    [again, setAgain] = useState(false);
  const [guideCity, setGuideCity] = useState<string | null>(null);
  const guideReturnPage = useRef<Page>("lists");
  const [toast, setToast] = useState(""),
    [cityQuery, setCityQuery] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    scroll = useRef<ScrollView>(null),
    returnPage = useRef<Page>("discover"),
    queue = useRef(Promise.resolve());
  function notify(message: string) {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3000);
  }
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem("elsewhere-demo-v1")
      .then((raw) => {
        if (raw && live) {
          const p = JSON.parse(raw);
          if (
            p.version === 1 &&
            Array.isArray(p.preferences) &&
            Array.isArray(p.saved)
          )
            setData(seedLists({
              ...fresh,
              ...p,
              city:
                typeof p.city === "string" && p.city.trim()
                  ? p.city
                  : fresh.city,
              customExperiences: Array.isArray(p.customExperiences) ? p.customExperiences.filter((e: Experience) => typeof e?.id === "string" && e.id.startsWith("user:") && typeof e.name === "string" && typeof e.city === "string" && Array.isArray(e.vibes)) : [],
              saved: p.saved.filter(validId),
              preferences: p.preferences.filter(
                (r: Preference) =>
                  validId(r.id) &&
                  ["liked", "okay", "disliked"].includes(r.band) &&
                  (r.rank === null || (Number.isFinite(r.rank) && r.rank >= 1)),
              ),
            }));
        }
      })
      .catch(() => notify("Could not load your saved experiences."))
      .finally(() => {
        if (live) setHydrated(true);
      });
    return () => {
      live = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (hydrated)
      queue.current = queue.current
        .then(() =>
          AsyncStorage.setItem("elsewhere-demo-v1", JSON.stringify(data)),
        )
        .catch(() => notify("Could not save your changes. Please try again."));
  }, [data, hydrated]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (sheet) {
        closeSheet();
        return true;
      }
      if (page === "detail") {
        nav(returnPage.current);
        return true;
      }
      if (page === "guide") {
        nav(guideReturnPage.current);
        return true;
      }
      if (page !== "friends") {
        nav("friends");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [sheet, page]);
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
    if (isGoogleId(id) && !live.registry[id]) void live.refresh(id).catch(() => notify("Couldn’t load place details. Your saved reference is still available."));
    nav("detail");
  }
  function openGuides() {
    setListTab("guides");
    nav("lists");
  }
  function guide(who: "you" | FriendId, city?: string) {
    if (page !== "guide" && !(page === "detail" && returnPage.current === "guide"))
      guideReturnPage.current = page === "detail" ? returnPage.current : page;
    setOwner(who);
    setGuideCity(city ? cityKey(city) : null);
    nav("guide");
  }
  function save(id: string) {
    setData((d) => ({
      ...d,
      saved: d.saved.includes(id)
        ? d.saved.filter((v) => v !== id)
        : [...d.saved, id],
    }));
  }
  function filter(p: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...p }));
  }
  function clearFilters() {
    setListCity(null);
    setNicheRange([0, 10]);
    setSubmittedQuery("");
    setFilters({
      budget: null,
      radius: null,
      duration: null,
      vibes: [],
      query: "",
    });
  }
  function openFilters(section?: string) {
    setDraftFilters({ ...filters, vibes: [...filters.vibes] });
    setDraftNiche([...nicheRange]);
    setDraftSort(sort);
    setDraftListCity(listCity);
    setFilterSection(section);
    setSheet("filters");
  }
  function chooseCity() {
    cityDestination.current = sheet === "rank" ? "rank" : null;
    setCityQuery("");
    setCities([]);
    setCityError("");
    setSheet("city");
  }
  function closeSheet() {
    setSheet(sheet === "city" ? cityDestination.current : null);
    cityDestination.current = null;
  }
  const locationLabel = searchOrigin ? originLabel : sampleMode ? data.city : originLabel;
  function useMyLocation(point: SearchOrigin) {
    setSearchOrigin(point);
    setOriginLabel("Near you");
    setSampleMode(!livePlacesEnabled);
    setSheet(sheet === "city" ? cityDestination.current : null);
    cityDestination.current = null;
    filter({ bounds: undefined, radius: filters.radius ?? 25 });
  }
  function selectCity(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSampleMode(true);
    setOriginLabel("San Luis Obispo");
    setSearchOrigin({ lat: 35.28, lng: -120.6625 });
    const city = /^(slo|san luis obispo)$/i.test(trimmed)
      ? "San Luis Obispo"
      : trimmed;
    setData((d) => ({ ...d, city, cityPlaceId: undefined }));
    filter({ bounds: undefined });
    setSheet(cityDestination.current);
    cityDestination.current = null;
  }
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void deviceLocation.locateIfPermitted(point => { if (!cancelled) useMyLocation(point); }).then(async located => {
      if (located || cancelled || !livePlacesEnabled || !data.cityPlaceId) return;
      try {
        const result = await requestPlaces({ action: "city", id: data.cityPlaceId });
        if (!cancelled && result.city) { setSearchOrigin(result.city.origin); setOriginLabel(result.city.label); }
      } catch { /* A new city or location can be selected if restoring fails. */ }
    });
    return () => { cancelled = true; };
  }, [hydrated]);
  useEffect(() => {
    if (sheet !== "city" || !livePlacesEnabled || cityQuery.trim().length < 2) { ++cityGeneration.current; setCities([]); setCityLoading(false); return; }
    const controller = new AbortController();
    const gen = ++cityGeneration.current;
    setCities([]); setCityLoading(true); setCityError("");
    const timer = setTimeout(() => {
      requestPlaces({ action: "cities", query: cityQuery }, controller.signal).then(r => {
        if (!controller.signal.aborted && cityGeneration.current === gen) setCities(r.cities ?? []);
      }).catch(e => { if (!controller.signal.aborted) setCityError(e.name === "AbortError" ? "City search timed out. Try again." : e.message); })
        .finally(() => { if (!controller.signal.aborted) setCityLoading(false); });
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [cityQuery, sheet]);
  useEffect(() => {
    if (sheet !== "rank") return;
    const timeout = setTimeout(() => setRankSearchQuery(rankQuery.trim().length >= 2 ? rankQuery.trim() : ""), 450);
    return () => clearTimeout(timeout);
  }, [rankQuery, sheet]);
  async function pickCity(city: CitySuggestion) {
    const gen = ++cityGeneration.current;
    setCityLoading(true); setCityError("");
    try {
      const result = await requestPlaces({ action: "city", id: city.id });
      if (gen !== cityGeneration.current || !result.city) return;
      setSearchOrigin(result.city.origin); setOriginLabel(city.label); setSampleMode(false);
      setData(d => ({ ...d, city: cityQuery.trim() || d.city, cityPlaceId: city.id }));
      filter({ bounds: undefined }); setSheet(cityDestination.current); cityDestination.current = null;
    } catch (e) { if (gen === cityGeneration.current) setCityError(e instanceof Error ? e.message : "Couldn’t select that city."); }
    finally { if (gen === cityGeneration.current) setCityLoading(false); }
  }
  function searchArea(bounds: MapBounds) {
    const span = (bounds.east - bounds.west + 360) % 360;
    const lng = ((bounds.west + span / 2 + 540) % 360) - 180;
    setSearchOrigin({ lat: (bounds.north + bounds.south) / 2, lng });
    setOriginLabel("Map area");
    filter({ bounds, radius: null });
  }
  function log(id: string, fromNav = false) {
    rankFromNav.current = fromNav;
    setSelected(id);
    setSession(null);
    const old = data.preferences.find((p) => p.id === id);
    setNote(old?.note || "");
    setAgain(old?.again || false);
    setSheet("log");
  }
  function openRank() {
    rankFromNav.current = true;
    setRankQuery("");
    setRankSearchQuery("");
    setSheet("rank");
  }
  function addPlace(intent: "save" | "rank", name = "") {
    addIntent.current = intent;
    setCustomDraft({ name, city: data.city, activityType: "", description: "", latitude: "", longitude: "" });
    setCustomError("");
    setSheet("add-experience");
  }
  const discoveryContext: DiscoveryContext = {
    catalog, preferences: data.preferences, interests: data.interests,
    audience, social: data.demoSocial ? demoReviews : undefined, origin: searchOrigin,
  };
  const cityCatalog = sampleMode ? sampleCatalog.filter(e => searchOrigin ? (distance(e, searchOrigin) ?? Infinity) <= (filters.radius ?? 25) : e.city.replace(/^Near /, "").toLowerCase() === data.city.toLowerCase()) : live.items;
  const listCatalog = [...new Set([...data.saved, ...data.preferences.map(p => p.id)])].map(byId);
  let results = (page === "lists" ? listCatalog : cityCatalog).filter(e => matches(e, { ...filters, ...(page === "lists" ? { bounds: undefined, radius: null } : {}), query: !sampleMode && page === "discover" ? "" : filters.query }, searchOrigin) && matchesNiche(nicheFor(e.id)?.score ?? null, nicheRange));
  if (page === "lists")
    results = results.filter((e) =>
      (listTab === "saved" ? data.saved.includes(e.id) : done.has(e.id)) && (!listCity || cityKey(e.city) === listCity),
    );
  if (page === "discover") results = results.filter(e => matchesIntent(e, mode, discoveryContext));
  const personalList = page === "lists" && listTab === "done";
  const rankedOrder = personalList && (sort === "for-you" || sort === "enjoyment");
  results = orderExperiences(results, sort, discoveryContext, id => nicheFor(id)?.score ?? null, rankedOrder, nicheDirection);
  const ownGuides = buildCityGuides(data.preferences, catalog);
  const ownerGuides = owner === "you" ? ownGuides : friendCityGuides(owner);
  const activeGuide = guideCity ? ownerGuides.find(g => g.key === guideCity) : ownerGuides[0];
  const guideOwner = owner === "you" ? "You" : friendById(owner).name;
  const guideText = activeGuide ? cityGuideText(activeGuide, guideOwner) : "";
  const official = (url: string) =>
    Linking.openURL(url).catch(() =>
      notify("Could not open the official source."),
    );
  const personalPositions = rankPositions(data.preferences);
  function card(e: Experience) {
    const personal = page === "lists" && listTab === "done";
    const enjoyment = personal ? scores[e.id] : data.demoSocial && demoReviews[e.id]
      ? demoReviews[e.id][audience === "Friends" ? "friends" : "everyone"] : null;
    const niche = nicheFor(e.id)?.score;
    const miles = distance(e, searchOrigin);
    return (
      <View key={e.id} style={s.card}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 15 }}>
          {personal && <T style={{ color: C.muted, fontSize: 14, width: 18 }}>{personalPositions[e.id] ?? "—"}</T>}
          <Pressable accessibilityRole="button" accessibilityLabel={`View ${e.venue}`} onPress={() => detail(e.id)} style={{ flex: 1, gap: 5 }}>
            <T style={{ fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 }}>{e.venue}</T>
            <T style={s.tiny}>{e.priceUSD === 0 ? "Free" : e.priceUSD == null ? "Check price" : `$${e.priceUSD}`} · {e.activityType}</T>
            <T style={s.tiny}>{e.city || "Location unavailable"}{miles == null ? "" : ` · ${miles.toFixed(1)} mi`}</T>
            {e.provider === "google" && <PlaceAttribution item={e} />}
          </Pressable>
          <View style={{ alignItems: "center", width: 66 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${personal ? "Your" : audience} enjoyment ${enjoyment == null ? "unrated" : enjoyment.toFixed(1)}`} onPress={() => personal ? log(e.id) : detail(e.id)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.green, alignItems: "center", justifyContent: "center" }}>
              <T style={{ color: C.greenInk, fontSize: 18, fontFamily: fonts.bold }}>{enjoyment == null ? "—" : enjoyment.toFixed(1)}</T>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Niche ${niche == null ? "unknown" : niche.toFixed(1)}. About this score`} onPress={() => { setSelected(e.id); setSheet("niche"); }} style={{ minHeight: 34, justifyContent: "center" }}><T style={{ ...s.tiny, fontSize: 10 }}>Niche {niche == null ? "—" : niche.toFixed(1)}</T></Pressable>
          </View>
          {!personal && <Icon name={data.saved.includes(e.id) ? "bookmark" : "bookmark-outline"} label={`${data.saved.includes(e.id) ? "Unsave" : "Save"} ${e.venue}`} onPress={() => save(e.id)} />}
        </View>
      </View>
    );
  }
  function browse() {
    const tabs = page === "lists"
      ? [["done", "Been"], ["saved", "Want to try"], ["guides", "Guides"]]
      : [["all", "For you"], ["new", "New to you"], ["familiar", "Favorites"]];
    const activeFilters = Number(page === "lists" && !!listCity) + Number(nicheRange[0] !== 0 || nicheRange[1] !== 10) + Number(filters.budget !== null) + Number(filters.duration !== null) + Number(!!filters.vibes.length);
    return <>
      <View style={s.tabs}>
        {tabs.map(([key, label]) => {
          const active = page === "lists" ? listTab === key : mode === key;
          return <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => page === "lists" ? setListTab(key) : setMode(key as DiscoveryMode)} style={[s.tab, active && s.tabActive]}>
            <T style={[s.muted, active && { color: C.ink, fontFamily: fonts.bold }]}>{label}</T>
          </Pressable>;
        })}
      </View>
      {page === "lists" && listTab === "guides" ? <GuidesLibrary guides={ownGuides} onOpen={city => guide("you", city)} onExplore={openRank} /> : <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 7, paddingBottom: 8 }}>
          <Pill label={activeFilters ? `Filters · ${activeFilters}` : "Filters"} active={!!activeFilters} icon="options-outline" onPress={() => openFilters()} />
          <Pill label={rankedOrder ? "Your ranking" : sortLabels[sort]} icon="swap-vertical-outline" onPress={() => setSheet("sort")} />
          {sort === "niche" && <Pill label={nicheDirection === "desc" ? "High to low" : "Low to high"} icon={nicheDirection === "desc" ? "arrow-down-outline" : "arrow-up-outline"} onPress={() => setNicheDirection(value => value === "desc" ? "asc" : "desc")} />}
          <Pill label="Distance" active={sort === "distance"} onPress={() => setSheet("distance")} />
          <Pill label={filters.budget === null ? "Price" : filters.budget === 0 ? "Free" : `Up to $${filters.budget}`} active={filters.budget !== null} onPress={() => openFilters("Price")} />
          <Pill label={nicheRange[0] === 0 && nicheRange[1] === 10 ? "Nicheness" : `Niche ${nicheRange[0]}–${nicheRange[1]}`} active={nicheRange[0] !== 0 || nicheRange[1] !== 10} onPress={() => openFilters("Nicheness")} />
        </ScrollView>
        <View style={[s.between, s.pad, { minHeight: 44 }]}>
          <T style={s.tiny}>{results.length} places{filters.bounds ? " · map area" : ""}{page === "lists" && !listCity ? " · all cities" : ""}</T>
          {!personalList && <Pressable accessibilityRole="button" accessibilityLabel={`Scores from ${audience}. Switch to ${audience === "Friends" ? "Everyone" : "Friends"}`} onPress={() => setAudience(value => value === "Friends" ? "Everyone" : "Friends")} style={[s.row, { minHeight: 44, gap: 4 }]}><T style={s.tiny}>{audience}</T><I name="chevron-down" size={12} color={C.muted} /></Pressable>}
        </View>
        <View style={s.pad}>
          {page === "discover" && !searchOrigin && !sampleMode && <Button onPress={chooseCity}>Choose location</Button>}
          {!!deviceLocation.locationError && <T accessibilityRole="alert" style={s.muted}>{deviceLocation.locationError}</T>}
          {page === "discover" && !sampleMode && live.loading && <ActivityIndicator color={C.green} />}
          {page === "discover" && !sampleMode && !!live.error && <View style={s.stack}><T accessibilityRole="alert" style={s.muted}>{live.error}</T><Button secondary onPress={live.retry}>Retry search</Button></View>}
          {map ? <View style={s.stack}>
            <ExperienceMap origin={searchOrigin ?? (sampleMode ? { lat: 35.28, lng: -120.6625 } : undefined)} userLocation={deviceLocation.position} onUserLocation={useMyLocation} items={results} selected={selected} onSelect={setSelected} onSearchArea={searchArea} onResetArea={() => filter({ bounds: undefined })} />
            {results.some(e => e.id === selected) && card(x)}
          </View> : results.map(card)}
          {!results.length && !live.loading && !live.error && (sampleMode || !!searchOrigin || page === "lists") && <View style={s.empty}>
            <I name="search-outline" size={30} color={C.muted} />
            <T style={s.heading}>No places found</T>
            <T style={[s.muted, { textAlign: "center" }]}>{page === "lists" && !listCatalog.length ? "Save or rank a place to add it here." : "Try another search or clear your filters."}</T>
            <Button secondary onPress={clearFilters}>Clear filters</Button>
          </View>}
          <Pressable accessibilityRole="button" onPress={() => addPlace("save", filters.query)} style={[s.row, { minHeight: 52, justifyContent: "center", marginTop: 10 }]}><I name="add" size={18} color={C.green} /><T style={{ color: C.green, fontSize: 14 }}>Add a place</T></Pressable>
          {!sampleMode && live.nextPageToken && <Button onPress={() => { void live.loadMore(); }}>{live.loading ? "Loading…" : "Load more"}</Button>}
        </View>
      </>}
    </>;
  }
  function showActivityMap() {
    clearFilters();
    if (x.lat != null && x.lng != null) { setSearchOrigin({ lat: x.lat, lng: x.lng }); setOriginLabel(x.venue); }
    setSampleMode(x.provider !== "google");
    setMap(true);
    nav("discover");
    setSelected(x.id);
  }
  function activityDirections() {
    if (x.provider === "google") { official(x.sourceUrl); return; }
    official(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.venue + ", " + x.city)}`,
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
        niche={nicheFor(x.id) ?? { score: null, label: "Not researched", reason: "We haven’t researched how niche this experience is yet." }}
        awareness={data.awareness[x.id]}
        note={pref?.note}
        again={pref?.again}
        onBack={() => nav(returnPage.current)}
        onShare={() => setSheet("experience-share")}
        onMore={() => setSheet("experience-actions")}
        onRank={() => log(x.id)}
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
        onViewGuide={pref ? () => guide("you", x.city) : undefined}
      />
    );
  }
  function guideView() {
    return <CityGuidePage key={`${owner}:${activeGuide?.key}`} guide={activeGuide} owner={guideOwner}
      savedIds={data.saved} onBack={() => nav(guideReturnPage.current)}
      onShare={() => setSheet("share")} onExperience={detail} onSave={save} />;
  }
  function profile() {
    return <View style={[s.pad, s.stack]}>
      <View style={[s.row, { paddingVertical: 16, gap: 16 }]}>
        <Image source={require("./assets/profile/jaydon-beli.png")} accessibilityLabel="Your profile photo" style={{ width: 76, height: 76, borderRadius: 38 }} resizeMode="cover" />
        <View><T style={s.title}>Jaydon</T><T style={s.muted}>@jaydonkc</T></View>
      </View>
      <View style={[s.row, { paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }]}>
        {[[data.preferences.length, "Been", "done"], [data.saved.length, "Want to try", "saved"], [ownGuides.length, "Guides", "guides"]].map(([n, label, key]) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${label}: ${n}`} onPress={() => { setListTab(String(key)); nav("lists"); }} style={{ flex: 1, alignItems: "center", gap: 4, minHeight: 48 }}><T style={s.title}>{n}</T><T style={s.tiny}>{label}</T></Pressable>)}
      </View>
      <Disclosure title="Interests" summary={data.interests.join(", ")}>
        <View style={s.wrap}>{VIBES.map(v => <Pill key={v} label={v} active={data.interests.includes(v)} onPress={() => setData(d => ({ ...d, interests: d.interests.includes(v) ? d.interests.filter(z => z !== v) : [...d.interests, v] }))} />)}</View>
      </Disclosure>
      <Pressable accessibilityRole="button" onPress={chooseCity} style={[s.between, { minHeight: 48 }]}><T>Location</T><T style={s.muted}>{locationLabel} ›</T></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setSheet("about")} style={[s.between, { minHeight: 48 }]}><T>About Elsewhere</T><I name="chevron-forward" color={C.muted} size={18} /></Pressable>
    </View>;
  }
  function logView() {
    const opponent = session ? currentOpponent(session) : null,
      preview = session ? finishRanking(session, data.preferences) : null,
      value = preview ? scorePreferences(preview)[x.id] : null;
    function answer(a: RankingAnswer) {
      if (session) setSession(answerRanking(session, a));
    }
    function finish() {
      if (!session) return;
      const next = finishRanking(session, data.preferences).map((p) =>
        p.id === x.id ? { ...p, note, again } : p,
      );
      setData((d) => ({
        ...d,
        preferences: next,
        saved: d.saved.filter((id) => id !== x.id),
      }));
      if (rankFromNav.current) { setListTab("done"); clearFilters(); setSort("for-you"); nav("lists"); }
      else setSheet(null);
      notify(
        session.status === "placed"
          ? "Added to Been. Rankings updated."
          : "Visit saved. Finish ranking from Been.",
      );
    }
    return (
      <>
        <T style={s.heading}>{x.venue}</T>
        {!session ? (
          <>
            <T style={s.title}>How was it?</T>
            {(["liked", "okay", "disliked"] as Band[]).map((b, i) => (
              <Pressable
                accessibilityRole="button"
                key={b}
                onPress={() =>
                  setSession(beginRanking(x.id, b, data.preferences))
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
            <T style={s.title}>Which did you enjoy more?</T>
            <T style={s.tiny}>
              Comparison {session.compared + 1} of at most 5 ·{" "}
              {bands[session.band]}
            </T>
            <Pressable
              accessibilityRole="button"
              onPress={() => answer("new")}
              style={s.choice}
            >
              <T style={s.heading}>{x.venue}</T>
              <T style={s.tiny}>{x.activityType} · {x.city}</T>
            </Pressable>
            <T style={[s.tiny, { textAlign: "center" }]}>OR</T>
            <Pressable
              accessibilityRole="button"
              onPress={() => answer("existing")}
              style={s.choice}
            >
              <T style={s.heading}>{byId(opponent).venue}</T>
              <T style={s.tiny}>{byId(opponent).activityType} · {byId(opponent).city}</T>
            </Pressable>
            <Button secondary onPress={() => answer("tie")}>
              About the same
            </Button>
            <Button secondary onPress={() => answer("skip")}>
              Can’t compare
            </Button>
          </>
        ) : (
          <>
            <T style={s.serif}>
              {session.status === "placed"
                ? "Your score"
                : "Rank later"}
            </T>
            {session.status === "placed" ? (
              <>
                <T style={s.bigNumber}>{value?.toFixed(1)}</T>
                <T style={s.muted}>Your enjoyment · {bands[session.band]}</T>
              </>
            ) : (
              <T style={s.muted}>
                Save your reaction now. The numeric score stays blank until you
                finish ranking.
              </T>
            )}
            <TextInput
              accessibilityLabel="Experience note"
              placeholder="Notes (optional)"
              placeholderTextColor={C.muted}
              multiline
              value={note}
              onChangeText={setNote}
              style={[s.inputBox, { minHeight: 85, textAlignVertical: "top" }]}
            />
            <View style={s.between}>
              <T>I’d do this again</T>
              <Switch
                value={again}
                onValueChange={setAgain}
                trackColor={{ true: "#608451", false: C.line }}
                thumbColor={C.green}
              />
            </View>
            <Button onPress={finish}>
              {session.status === "placed"
                ? "Save to Been"
                : "Save and rank later"}
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
    if (sheet === "rank") {
      const query = rankQuery.trim().toLocaleLowerCase();
      const matchesQuery = catalog.filter(e => `${e.venue} ${e.city} ${e.activityType}`.toLocaleLowerCase().includes(query));
      const remote = rankSearchQuery === rankQuery.trim() ? rankSearch.items : [];
      const choices = [...new Map([...matchesQuery, ...remote].map(e => [e.id, e])).values()]
        .sort((a, b) => Number(done.has(a.id)) - Number(done.has(b.id)) || Number(data.saved.includes(b.id)) - Number(data.saved.includes(a.id)));
      return <>
        <View style={[s.search, { marginHorizontal: 0, marginBottom: 0 }]}>
          <I name="search-outline" color={C.muted} />
          <TextInput accessibilityLabel="Search places to rank" placeholder="Search places" placeholderTextColor={C.muted} value={rankQuery} onChangeText={setRankQuery} onSubmitEditing={() => setRankSearchQuery(rankQuery.trim())} returnKeyType="search" style={s.input} />
          {!!rankQuery && <Icon name="close" label="Clear rank search" onPress={() => { setRankQuery(""); setRankSearchQuery(""); }} />}
        </View>
        {rankSearch.loading && <ActivityIndicator color={C.green} />}
        {!!rankSearch.error && <T accessibilityRole="alert" style={s.muted}>{rankSearch.error}</T>}
        {choices.map(e => <Pressable key={e.id} accessibilityRole="button" accessibilityLabel={`Rank ${e.venue}`} onPress={() => log(e.id, true)} style={[s.between, { minHeight: 72, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 12 }]}>
          <View style={{ flex: 1, gap: 4 }}><T style={{ fontFamily: fonts.medium }}>{e.venue}</T><T style={s.tiny}>{e.city} · {done.has(e.id) ? "Been" : data.saved.includes(e.id) ? "Want to try" : e.activityType}</T>{e.provider === "google" && <PlaceAttribution item={e} />}</View><I name={done.has(e.id) ? "checkmark-circle-outline" : "add-circle-outline"} color={C.green} size={25} />
        </Pressable>)}
        {!choices.length && !rankSearch.loading && <T style={s.muted}>No places found.</T>}
        {livePlacesEnabled && !searchOrigin && <Button secondary onPress={chooseCity}>Choose search location</Button>}
        <Button secondary onPress={() => addPlace("rank", rankQuery)}>Add a place</Button>
      </>;
    }
    if (sheet === "add-experience") return <>
      {([["name", "Place name"], ["city", "City"], ["activityType", "Activity type (optional)"]] as const).map(([field, label]) => <TextInput key={field} accessibilityLabel={label} placeholder={label} placeholderTextColor={C.muted} value={customDraft[field]} onChangeText={value => setCustomDraft(d => ({ ...d, [field]: value }))} style={s.inputBox} />)}
      <Disclosure title="Details" summary="Optional">
        <TextInput accessibilityLabel="Description (optional)" placeholder="Description" placeholderTextColor={C.muted} value={customDraft.description} onChangeText={description => setCustomDraft(d => ({ ...d, description }))} multiline style={s.inputBox} />
      </Disclosure>
      {!!customError && <T accessibilityRole="alert" style={s.muted}>{customError}</T>}
      <Button onPress={() => {
        try {
          const item = createCustomExperience(customDraft, `user:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
          setData(d => ({ ...d, customExperiences: [...d.customExperiences, item], saved: [...d.saved, item.id] }));
          if (addIntent.current === "rank") log(item.id, true);
          else { setListTab("saved"); clearFilters(); nav("lists"); notify("Added to Want to try."); }
        } catch (e) { setCustomError(e instanceof Error ? e.message : "Check the place details."); }
      }}>{addIntent.current === "rank" ? "Continue to rank" : "Save place"}</Button>
    </>;
    if (sheet === "log") return logView();
    if (sheet === "distance") return <>
      <T style={s.muted}>From {searchOrigin ? originLabel : "Downtown SLO"}</T>
      <Button onPress={() => { setSort("distance"); setSheet(null); }}>Nearest first</Button>
      <Button secondary onPress={() => { void deviceLocation.locate(point => { useMyLocation(point); setSort("distance"); }); }}>{deviceLocation.locating ? "Locating…" : "Current location"}</Button>
      {!!deviceLocation.locationError && <T accessibilityRole="alert" style={s.muted}>{deviceLocation.locationError}</T>}
      <Button secondary onPress={chooseCity}>Change location</Button>
      <T style={s.tiny}>Distance in miles, measured in a straight line.</T>
    </>;
    if (sheet === "sort") return <>
      {(Object.entries(sortLabels) as [DiscoverySort, string][]).filter(([value]) => !personalList || value !== "for-you").map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: sort === value || (rankedOrder && value === "enjoyment") }} onPress={() => { setSort(value); setSheet(null); }} style={[s.between, { minHeight: 52 }]}>
        <T>{personalList && value === "enjoyment" ? "Your ranking" : label}</T>{(sort === value || (rankedOrder && value === "enjoyment")) && <I name="checkmark" color={C.green} />}
      </Pressable>)}
    </>;
    if (sheet === "filters") return <View style={{ gap: 0 }}>
      <Disclosure title="Sort by" summary={personalList && (draftSort === "for-you" || draftSort === "enjoyment") ? "Your ranking" : sortLabels[draftSort]}>
        <View style={s.wrap}>{(Object.entries(sortLabels) as [DiscoverySort, string][]).filter(([value]) => !personalList || value !== "for-you").map(([value, label]) => <Pill key={value} label={personalList && value === "enjoyment" ? "Your ranking" : label} active={draftSort === value || (personalList && draftSort === "for-you" && value === "enjoyment")} onPress={() => setDraftSort(value)} />)}</View>
      </Disclosure>
      {page === "lists" && <Disclosure title="City" summary={draftListCity ? guideCityName(listCatalog.find(e => cityKey(e.city) === draftListCity)?.city ?? draftListCity) : "All cities"} initiallyOpen={filterSection === "City"}>
        <Pill label="All cities" active={!draftListCity} onPress={() => setDraftListCity(null)} />
        {[...new Map(listCatalog.filter(e => e.city.trim()).map(e => [cityKey(e.city), guideCityName(e.city)])).entries()].map(([key, label]) => <Pill key={key} label={label} active={draftListCity === key} onPress={() => setDraftListCity(key)} />)}
      </Disclosure>}
      <Disclosure title="Nicheness" summary={draftNiche[0] === 0 && draftNiche[1] === 10 ? "Any" : `${draftNiche[0]}–${draftNiche[1]}`} initiallyOpen={filterSection === "Nicheness"}>
        <FilterSlider label="Minimum nicheness" value={draftNiche[0]} minimum={0} maximum={10} display={String(draftNiche[0])} left="Mainstream" right="Niche" onChange={value => setDraftNiche(([_, max]) => [value, Math.max(value, max)])} />
        <FilterSlider label="Maximum nicheness" value={draftNiche[1]} minimum={0} maximum={10} display={String(draftNiche[1])} left="Mainstream" right="Niche" onChange={value => setDraftNiche(([min]) => [Math.min(min, value), value])} />
      </Disclosure>
      <Disclosure title="Price" summary={draftFilters.budget === null ? "Any" : draftFilters.budget === 0 ? "Free" : `Up to $${draftFilters.budget}`} initiallyOpen={filterSection === "Price"}>
        <FilterSlider label="Maximum price per person" value={draftFilters.budget ?? 105} minimum={0} maximum={105} step={5} display={draftFilters.budget === null ? "Any" : draftFilters.budget === 0 ? "Free" : `$${draftFilters.budget}`} left="Free" right="Any price" onChange={value => setDraftFilters({ ...draftFilters, budget: value === 105 ? null : value })} />
        <T style={s.tiny}>Places with unknown prices are excluded when a limit is set.</T>
      </Disclosure>
      <Disclosure title="Duration" summary={draftFilters.duration === null ? "Any" : `${draftFilters.duration} min`}>
        <FilterSlider label="Maximum duration" value={draftFilters.duration ?? 375} minimum={15} maximum={375} step={15} display={draftFilters.duration === null ? "Any" : `${draftFilters.duration} min`} left="15 min" right="Any duration" onChange={value => setDraftFilters({ ...draftFilters, duration: value === 375 ? null : value })} />
      </Disclosure>
      <Disclosure title="Good for" summary={draftFilters.vibes.join(", ") || "Any"}>
        <View style={s.wrap}>{VIBES.map(v => <Pill key={v} label={v} active={draftFilters.vibes.includes(v)} onPress={() => setDraftFilters({ ...draftFilters, vibes: draftFilters.vibes.includes(v) ? draftFilters.vibes.filter(z => z !== v) : [...draftFilters.vibes, v] })} />)}</View>
      </Disclosure>
    </View>;
    if (sheet === "city")
      return <>
        <Button onPress={() => { void deviceLocation.locate(useMyLocation); }}>{deviceLocation.locating ? "Locating…" : "Use my location"}</Button>
        {!!deviceLocation.locationError && <T accessibilityRole="alert" style={s.muted}>{deviceLocation.locationError}</T>}
        <TextInput accessibilityLabel="Search for a city" value={cityQuery} onChangeText={setCityQuery} placeholder="City, region, or country…" placeholderTextColor={C.muted} style={s.inputBox} />
        {cityLoading && <ActivityIndicator color={C.green} />}
        {!!cityError && <T accessibilityRole="alert" style={s.muted}>{cityError}</T>}
        {cities.map(city => <Pill key={city.id} label={city.label} icon="location-outline" onPress={() => { void pickCity(city); }} />)}
        {livePlacesEnabled && <PlaceAttribution />}
        {livePlacesEnabled && cityQuery.trim().length >= 2 && !cityLoading && !cityError && !cities.length && <T style={s.muted}>No matching cities. Try adding the country or region.</T>}
        {(!cityQuery.trim() || /slo|san|luis|obispo/i.test(cityQuery)) && <Button secondary onPress={() => selectCity("San Luis Obispo")}>San Luis Obispo</Button>}
        {!livePlacesEnabled && !!cityQuery.trim() && !/slo|san|luis|obispo/i.test(cityQuery) && <T style={s.muted}>No matching cities.</T>}
      </>;
    if (sheet === "niche") {
      const niche = nicheFor(x.id);
      return <>
        <View style={s.between}><T style={[s.heading, { flex: 1 }]}>{x.venue}</T><T style={{ color: C.green, fontFamily: fonts.bold, fontSize: 40 }}>{niche?.score.toFixed(1) ?? "—"}</T></View>
        <T style={s.muted}>0 is mainstream. 10 is little-known or specialized.</T>
        {!niche && <T style={s.muted}>No score yet.</T>}
        {!!niche && <Disclosure title="About this score">
          <T style={s.muted}>{niche.reason}</T>
          {niche.sources.map(source => <Pressable key={source.url} accessibilityRole="link" onPress={() => official(source.url)} style={{ gap: 4, paddingVertical: 8 }}><T style={{ color: C.green, fontFamily: fonts.medium }}>{source.title} ↗</T><T style={s.tiny}>{source.observation}</T></Pressable>)}
          <T style={s.tiny}>Researched {niche.checkedAt} · {niche.confidence} confidence</T>
        </Disclosure>}
        <Disclosure title="Had you heard of it?" summary={data.awareness[x.id] === "yes" ? "Yes" : data.awareness[x.id] === "no" ? "No" : undefined}>
          <T style={s.tiny}>Before finding it on Elsewhere.</T>
          <View style={s.wrap}>{([["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] as const).map(([value, label]) => <Pill key={value} label={label} active={data.awareness[x.id] === value} onPress={() => setData(d => ({ ...d, awareness: { ...d.awareness, [x.id]: value } }))} />)}</View>
        </Disclosure>
      </>;
    }
    if (sheet === "about") return <>
      <T style={s.heading}>Data & privacy</T>
      <T style={s.muted}>This preview includes example profiles, visits, and community scores. Your lists, rankings, and notes are saved on this device.</T>
      <T style={s.muted}>Place details use official sources or Google Maps. Nicheness scores are based on editorial research into awareness and specialization, separately from enjoyment.</T>
      <Disclosure title="Recommendations">
        <T style={s.muted}>For you uses your interests, ranking history, and available friend and community scores, with a mix of activity types.</T>
        <View style={s.between}><T style={{ flex: 1 }}>Example social scores</T><Switch accessibilityLabel="Example social scores" value={data.demoSocial} onValueChange={value => setData(d => ({ ...d, demoSocial: value }))} trackColor={{ true: "#608451", false: C.line }} thumbColor={C.green} /></View>
      </Disclosure>
    </>;
    if (sheet === "experience-share") {
      const text = `${x.venue}\n${x.city}\n${x.sourceUrl}`;
      return (
        <>
          <T style={s.serif}>{x.name}</T>
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
          {done.has(x.id) && <Button secondary onPress={() => guide("you", x.city)}>
            View my {x.city} guide
          </Button>}
        </>
      );
    if (sheet === "share")
      return (
        <>
          <T style={s.muted}>
            Share your city ranking and official activity links.
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
    return (
      <>
        {[
          ["you", "person-outline", "Your profile"],
          ["lists", "bookmark-outline", "Your experiences"],
          ["friends", "people-outline", "Feed"],
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
  if (!hydrated)
    return (
      <View style={[s.outer, { justifyContent: "center" }]}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  return (
    <View style={s.outer}>
      <StatusBar style="light" />
      <SafeAreaView style={s.app} edges={["top", "bottom"]}>
        {page !== "detail" && page !== "guide" && page !== "leaderboard" && <View style={s.header}>
          <View style={[s.row, { flex: 1, gap: 4 }]}>
            {page === "discover" && <Icon name="arrow-back" label="Back to feed" onPress={() => nav("friends")} />}
            <T style={page === "friends" ? s.wordmark : s.title}>{page === "friends" ? "elsewhere" : page === "lists" ? "My lists" : page === "you" ? "Profile" : "Discover"}</T>
          </View>
          {page === "discover" ? <Pressable accessibilityRole="button" accessibilityLabel="Change city" onPress={chooseCity} style={[s.row, { minHeight: 44, maxWidth: "48%", gap: 4 }]}><T numberOfLines={1} style={[s.tiny, { flexShrink: 1 }]}>{locationLabel}</T><I name="chevron-down" size={13} color={C.muted} /></Pressable> : page === "lists" && listTab !== "guides" ? <Pressable accessibilityRole="button" accessibilityLabel="Filter lists by city" onPress={() => openFilters("City")} style={[s.row, { minHeight: 44, maxWidth: "45%", gap: 4 }]}><T style={s.tiny} numberOfLines={1}>{listCity ? guideCityName(listCatalog.find(e => cityKey(e.city) === listCity)?.city ?? listCity) : "All cities"}</T><I name="chevron-down" size={13} color={C.muted} /></Pressable> : <Icon name="search-outline" label="Discover places" onPress={() => { setMap(false); nav("discover"); }} />}
        </View>}
        {(page === "discover" || (page === "lists" && listTab !== "guides")) && (
          <View style={s.search}>
            <I name="search-outline" color={C.muted} />
            <TextInput
              accessibilityLabel="Search experiences"
              placeholder="Search places"
              placeholderTextColor={C.muted}
              value={filters.query}
              onChangeText={(query) => { filter({ query }); if (!query) setSubmittedQuery(""); }}
              returnKeyType="search"
              onSubmitEditing={() => setSubmittedQuery(filters.query.trim())}
              style={s.input}
            />
            {!sampleMode && <Icon name="arrow-forward" label="Search places" onPress={() => setSubmittedQuery(filters.query.trim())} />}
            {!!filters.query && (
              <Icon
                name="close"
                label="Clear search"
                onPress={() => { filter({ query: "" }); setSubmittedQuery(""); }}
              />
            )}
          </View>
        )}
        {page === "friends" ? (
          <FriendsPage
            savedIds={data.saved}
            showExamples={data.demoSocial}
            onExperience={detail}
            onSave={save}
            onRank={log}
            onGuide={guide}
            onDiscover={() => { setMap(false); nav("discover"); }}
            onNearby={() => {
              setMap(true);
              nav("discover");
            }}
          />
        ) : page === "leaderboard" ? <LeaderboardPage guides={ownGuides} showExamples={data.demoSocial} onGuide={guide} onYou={() => nav("you")} /> : (
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: page === "discover" || (page === "lists" && listTab !== "guides") ? 84 : 28 }}
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
          ) : null}
        </ScrollView>
        )}
        {(page === "discover" || (page === "lists" && listTab !== "guides")) && <Pressable accessibilityRole="button" accessibilityLabel={map ? "View list" : "View map"} onPress={() => setMap(value => !value)} style={s.mapToggle}><I name={map ? "list-outline" : "map-outline"} color={C.greenInk} size={18} /><T style={{ color: C.greenInk, fontFamily: fonts.bold, fontSize: 13 }}>{map ? "View list" : "View map"}</T></Pressable>}
        <View style={s.nav}>
          {[["friends", "newspaper-outline", "Feed"], ["lists", "list-outline", "My lists"], ["rank", "add", "Rank"], ["leaderboard", "podium-outline", "Leaderboard"], ["you", "person-outline", "You"]].map(([p, icon, label]) => {
            const destination = page === "detail" ? returnPage.current === "guide" ? guideReturnPage.current : returnPage.current : page === "guide" ? guideReturnPage.current : page;
            const active = p === destination || (p === "friends" && destination === "discover");
            return <Pressable key={p} accessibilityRole={p === "rank" ? "button" : "tab"} accessibilityState={p === "rank" ? undefined : { selected: active }} accessibilityLabel={label} onPress={() => p === "rank" ? openRank() : nav(p as Page)} style={s.navItem}>
              {p === "rank" ? <View style={s.rankAction}><I name="add" size={27} color={C.greenInk} /></View> : <I name={icon} size={23} color={active ? C.green : C.muted} />}
              <T style={[s.navLabel, active && { color: C.green }]}>{label}</T>
            </Pressable>;
          })}
        </View>
        {!!toast && (
          <View style={s.toast} accessibilityLiveRegion="polite">
            <T style={{ color: C.greenInk, fontSize: 14 }}>{toast}</T>
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
                  "add-experience": "Add a place",
                  rank: "Rank a place",
                  distance: "Distance",
                  sort: "Sort experiences",
                  filters: "Filters",
                  log: "Your experience",
                  niche: "Nicheness",
                  share: "Share guide",
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
          {sheet === "filters" && <View style={[s.row, { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24, borderTopWidth: 1, borderTopColor: C.line }]}>
            <Pressable accessibilityRole="button" onPress={() => { setDraftFilters({ budget: null, radius: null, duration: null, vibes: [], query: filters.query }); setDraftNiche([0, 10]); setDraftSort("for-you"); setDraftListCity(null); }} style={{ flex: 1, minHeight: 48, justifyContent: "center" }}><T style={{ color: C.green }}>Clear all</T></Pressable>
            <View style={{ flex: 2 }}><Button onPress={() => { setFilters(draftFilters); setNicheRange(draftNiche); setSort(draftSort); setListCity(draftListCity); setSheet(null); }}>Apply</Button></View>
          </View>}
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}
