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
  byId,
  catalog,
  demoGuide,
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
import { getNicheness } from "./src/data/nicheness";
import {
  answerRanking,
  Band,
  beginRanking,
  currentOpponent,
  finishRanking,
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
  | "niche"
  | "share"
  | "menu"
  | "activity"
  | "about"
  | "experience-share"
  | "experience-actions"
  | null;
type Stored = {
  version: 1;
  saved: string[];
  preferences: Preference[];
  awareness: Record<string, string>;
  guide: string[];
  guideNotes: Record<string, string>;
  interests: string[];
  demoSocial: boolean;
  city: string;
};
const fresh: Stored = {
  version: 1,
  saved: [],
  preferences: [],
  awareness: {},
  guide: [],
  guideNotes: {},
  interests: ["Relax", "Creative"],
  demoSocial: true,
  city: "San Luis Obispo",
};
const seed: Preference[] = [
  { id: "sloma", band: "liked", rank: 1, again: true },
  { id: "leaning-pine-arboretum", band: "liked", rank: 2, again: true },
  { id: "downtown-creek-walk", band: "liked", rank: 3, again: true },
];
const friendGuideNotes: Record<string, string> = {
  sloma: "Start with a little art beside Mission Plaza.",
  "leaning-pine-arboretum": "A quiet garden detour when you want to slow down.",
  "downtown-farmers-market": "Make Thursday evening your downtown night.",
  "anam-cre-pottery":
    "Book a class and make something to remember the trip by.",
};
const bands: Record<Band, string> = {
  liked: "Liked it",
  okay: "It was okay",
  disliked: "Didn’t like it",
};
const validId = (id: string) => catalog.some((x) => x.id === id);
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
  const [data, setData] = useState<Stored>(fresh),
    [hydrated, setHydrated] = useState(false),
    [page, setPage] = useState<Page>("discover"),
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
  const [owner, setOwner] = useState<"you" | "emma">("emma"),
    [session, setSession] = useState<RankingSession | null>(null),
    [note, setNote] = useState(""),
    [again, setAgain] = useState(false);
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
            setData({
              ...fresh,
              ...p,
              city:
                typeof p.city === "string" && p.city.trim()
                  ? p.city
                  : fresh.city,
              saved: p.saved.filter(validId),
              guide: (p.guide || []).filter(validId),
              preferences: p.preferences.filter(
                (r: Preference) =>
                  validId(r.id) &&
                  ["liked", "okay", "disliked"].includes(r.band) &&
                  (r.rank === null || (Number.isFinite(r.rank) && r.rank >= 1)),
              ),
            });
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
        setSheet(null);
        return true;
      }
      if (page !== "discover") {
        setPage("discover");
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
    nav("detail");
  }
  function guide(who: "you" | "emma") {
    setOwner(who);
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
  const locationLabel = searchOrigin ? "Near you" : data.city;
  function useMyLocation(point: SearchOrigin) {
    setSearchOrigin(point);
    filter({ bounds: undefined, radius: filters.radius ?? 25 });
  }
  function selectCity(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSearchOrigin(undefined);
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
    setSheet("log");
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
  function reason(e: Experience) {
    if (data.preferences.some((p) => p.id === e.id && p.band === "liked"))
      return "A good one to do again";
    const v = e.vibes.filter((v) => data.interests.includes(v));
    return v.length
      ? `Fits your ${v.join(" + ").toLowerCase()} interests`
      : "A different kind of day to try";
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
    results = results.filter(
      (e) =>
        data.preferences.some((p) => p.id === e.id && p.band === "liked") ||
        e.vibes.some((v) => data.interests.includes(v)),
    );
  results.sort((a, b) =>
    page === "lists" && listTab === "done"
      ? (scores[b.id] ?? -1) - (scores[a.id] ?? -1)
      : fit(b) - fit(a),
  );
  const guideIds = owner === "you" ? data.guide : demoGuide;
  const guideText =
    `${owner === "you" ? "My SLO favorites" : "A slow weekend in SLO"}\nSan Luis Obispo\n\n` +
    guideIds
      .map(
        (id, i) =>
          `${i + 1}. ${byId(id).name}\n${owner === "you" ? data.guideNotes[id] || "" : friendGuideNotes[id] || ""}\n${byId(id).sourceUrl}`,
      )
      .join("\n\n");
  const official = (url: string) =>
    Linking.openURL(url).catch(() =>
      notify("Could not open the official source."),
    );
  function score(e: Experience) {
    return (
      <View style={s.score}>
        <I name="people-outline" color={C.green} size={14} />
        <T style={s.scoreText}>
          {page === "lists" && listTab === "done"
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
          <View style={s.reason}>
            <I name="sparkles-outline" color={C.coral} size={15} />
            <T style={[s.tiny, { flex: 1 }]}>{reason(e)}</T>
            {!done.has(e.id) && <T style={s.tiny}>New to you</T>}
          </View>
          {page === "lists" && listTab === "done" && (
            <Button secondary onPress={() => log(e.id)}>
              {scores[e.id] === null ? "Finish ranking" : "Rerank"}
            </Button>
          )}
        </View>
      </View>
    );
  }
  function teaser() {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => guide("emma")}
        style={s.guide}
      >
        <View style={s.row}>
          <View style={s.avatar}>
            <T>EM</T>
          </View>
          <View>
            <T style={s.eyebrow}>A FRIEND’S CITY GUIDE</T>
            <T style={s.tiny}>Emma · 4 picks</T>
          </View>
        </View>
        <T style={s.serif}>A slow weekend{"\n"}in SLO.</T>
        <T style={s.muted}>4 things worth making time for ↗</T>
      </Pressable>
    );
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
                    guide(data.guide.length ? "you" : "emma");
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
              filters.budget === null ? "Any price" : `Under $${filters.budget}`
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
            {(["Friends", "Everyone"] as const).map((a) => (
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
          {map ? (
            <View style={s.stack}>
              <ExperienceMap
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
                  ? "Your next story starts here."
                  : !cityCatalog.length
                    ? searchOrigin ? "No experiences nearby yet." : `No experiences in ${data.city} yet.`
                    : "A little too specific?"}
              </T>
              <T style={[s.muted, { textAlign: "center" }]}>
                {page === "lists"
                  ? "Save or log an experience to see it here."
                  : !cityCatalog.length
                    ? "Explore San Luis Obispo while we add more cities."
                    : "Try a wider area or a different budget."}
              </T>
              <Button
                secondary
                onPress={() => {
                  clearFilters();
                  if (!cityCatalog.length) selectCity("San Luis Obispo");
                  nav("discover");
                }}
              >
                {cityCatalog.length
                  ? "Explore all experiences"
                  : "Explore San Luis Obispo"}
              </Button>
            </View>
          )}
          {page === "lists" &&
            listTab === "done" &&
            data.preferences.length > 0 && (
              <Button
                onPress={() => {
                  setData((d) => ({
                    ...d,
                    guide: d.preferences
                      .filter((p) => p.rank !== null)
                      .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
                      .map((p) => p.id),
                  }));
                  guide("you");
                }}
              >
                Create my SLO guide
              </Button>
            )}
          <View style={{ marginVertical: 18 }}>{teaser()}</View>
        </View>
      </>
    );
  }
  function showActivityMap() {
    clearFilters();
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
        onAddToGuide={
          pref
            ? () => {
                setData((d) => ({
                  ...d,
                  guide: [...new Set([...d.guide, x.id])],
                }));
                notify("Added to your SLO guide.");
              }
            : undefined
        }
      />
    );
  }
  function guideView() {
    return (
      <View style={[s.pad, s.stack]}>
        <View style={s.between}>
          <Icon name="arrow-back" label="Back" onPress={() => nav("friends")} />
          <T style={s.eyebrow}>SAN LUIS OBISPO</T>
          <Icon
            name="share-outline"
            label="Share guide"
            onPress={() => setSheet("share")}
          />
        </View>
        <Image
          source={require("./assets/catalog/slo-hills.jpg")}
          style={[s.photo, { height: 190, borderRadius: 20 }]}
          accessibilityLabel="Sunlit San Luis Obispo hills"
        />
        <T style={s.tiny}>SLO scenery · Photo: Visit SLO</T>
        <T style={s.serif}>
          {owner === "you" ? "My SLO favorites." : "A slow weekend\nin SLO."}
        </T>
        <T style={s.muted}>
          {owner === "you"
            ? "Your picks, in your order"
            : "A city guide by Emma"}
        </T>
        <View style={s.row}>
          <Button
            secondary
            onPress={() => {
              setData((d) => ({
                ...d,
                saved: [...new Set([...d.saved, ...guideIds])],
              }));
              notify("Guide experiences saved.");
            }}
          >
            Save all
          </Button>
          <Button secondary onPress={() => setMap(!map)}>
            {map ? "List" : "Map"}
          </Button>
        </View>
        {map && (
          <ExperienceMap
            items={guideIds.map(byId)}
            selected={selected}
            onSelect={detail}
          />
        )}
        <View>
          {guideIds.map((id, i) => (
            <View key={id}>
              <View style={s.guideRow}>
                <T style={s.rank}>{i + 1}</T>
                <Pressable
                  accessibilityRole="button"
                  style={{ flex: 1 }}
                  onPress={() => detail(id)}
                >
                  <T style={s.heading}>{byId(id).name}</T>
                  <T style={s.tiny}>{priceLabel(byId(id))}</T>
                </Pressable>
                {owner === "you" ? (
                  <View>
                    <Icon
                      name="arrow-up"
                      label={`Move ${byId(id).name} up`}
                      onPress={() => {
                        if (i > 0)
                          setData((d) => {
                            const g = [...d.guide];
                            [g[i - 1], g[i]] = [g[i], g[i - 1]];
                            return { ...d, guide: g };
                          });
                      }}
                    />
                    <Icon
                      name="close"
                      label={`Remove ${byId(id).name} from guide`}
                      onPress={() =>
                        setData((d) => ({
                          ...d,
                          guide: d.guide.filter((v) => v !== id),
                        }))
                      }
                    />
                  </View>
                ) : (
                  <Icon
                    name={
                      data.saved.includes(id) ? "bookmark" : "bookmark-outline"
                    }
                    label={`Save ${byId(id).name}`}
                    onPress={() => save(id)}
                  />
                )}
              </View>
              {owner === "you" && (
                <TextInput
                  accessibilityLabel={`Guide note for ${byId(id).name}`}
                  placeholder="Why recommend it?"
                  placeholderTextColor={C.muted}
                  value={data.guideNotes[id] || ""}
                  onChangeText={(text) =>
                    setData((d) => ({
                      ...d,
                      guideNotes: { ...d.guideNotes, [id]: text },
                    }))
                  }
                  style={[s.inputBox, { marginTop: 8 }]}
                />
              )}
            </View>
          ))}
        </View>
        {!guideIds.length && (
          <T style={s.muted}>Log an experience, then add it to your guide.</T>
        )}
        <Button onPress={() => setSheet("share")}>Preview & copy guide</Button>
      </View>
    );
  }
  function profile() {
    return (
      <View style={[s.pad, s.stack]}>
        <View style={[s.avatar, { width: 70, height: 70, borderRadius: 35 }]}>
          <I name="person-outline" size={30} />
        </View>
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
      setSheet(null);
      notify(
        session.status === "placed"
          ? "Added to Been. Rankings updated."
          : "Visit saved. Finish ranking from Been.",
      );
    }
    return (
      <>
        <T style={s.muted}>{x.name}</T>
        {!session ? (
          <>
            <T style={s.serif}>How was it?</T>
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
            <T style={s.serif}>Which did you{"\n"}enjoy more?</T>
            <T style={s.tiny}>
              Comparison {session.compared + 1} of at most 5 ·{" "}
              {bands[session.band]}
            </T>
            <Pressable
              accessibilityRole="button"
              onPress={() => answer("new")}
              style={s.choice}
            >
              <T style={s.eyebrow}>THE ONE YOU JUST DID</T>
              <T style={s.heading}>{x.name}</T>
              <T style={s.muted}>{x.venue}</T>
            </Pressable>
            <T style={[s.tiny, { textAlign: "center" }]}>OR</T>
            <Pressable
              accessibilityRole="button"
              onPress={() => answer("existing")}
              style={s.choice}
            >
              <T style={s.eyebrow}>FROM YOUR LIST</T>
              <T style={s.heading}>{byId(opponent).name}</T>
              <T style={s.muted}>{byId(opponent).venue}</T>
            </Pressable>
            <Button secondary onPress={() => answer("tie")}>
              About the same
            </Button>
            <Button secondary onPress={() => answer("skip")}>
              Can’t compare
            </Button>
            <T style={s.tiny}>
              Choose based on personal enjoyment. Skipping never counts as a
              dislike.
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
                <T style={s.muted}>Your enjoyment · {bands[session.band]}</T>
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
    if (sheet === "log") return logView();
    if (sheet === "filters")
      return (
        <>
          <T style={s.heading}>Budget per person</T>
          <View style={s.wrap}>
            {[null, 0, 15, 30, 50].map((v) => (
              <Pill
                key={String(v)}
                label={v === null ? "Any" : v === 0 ? "Free" : `$${v}`}
                active={filters.budget === v}
                onPress={() => filter({ budget: v })}
              />
            ))}
          </View>
          <T style={s.tiny}>
            Admission only; check extra costs on details. Unknown prices are
            excluded by a budget limit.
          </T>
          <T style={s.heading}>Distance from {searchOrigin ? "your location" : "Downtown SLO"}</T>
          <View style={s.wrap}>
            {[null, 1, 3, 5, 10].map((v) => (
              <Pill
                key={String(v)}
                label={v === null ? "Any" : `${v} mi`}
                active={filters.radius === v}
                onPress={() => filter({ radius: v })}
              />
            ))}
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
              value={data.demoSocial}
              onValueChange={(value) =>
                setData((d) => ({ ...d, demoSocial: value }))
              }
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
          <T style={s.muted}>From your circle</T>
          {teaser()}
        </>
      );
    return (
      <>
        {[
          ["you", "person-outline", "Your profile"],
          ["lists", "bookmark-outline", "Your experiences"],
          ["friends", "people-outline", "Friends & guides"],
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
            <View style={[s.pad, s.stack]}>
              <T style={s.title}>From people you trust</T>
              <T style={s.muted}>
                A city feels smaller with a good recommendation.
              </T>
              {teaser()}
              <View style={s.notice}>
                <T style={s.eyebrow}>A GOOD DAY, SHARED</T>
                <T>Emma’s picks for a slow afternoon in SLO.</T>
                <T style={s.muted}>
                  Art, a garden walk, and something handmade.
                </T>
              </View>
              <Button secondary onPress={() => guide("you")}>
                My city guide
              </Button>
            </View>
          )}
        </ScrollView>
        <View style={s.nav}>
          {[
            ["discover", "compass-outline", "Discover"],
            ["lists", "bookmark-outline", "My lists"],
            ["friends", "people-outline", "Friends"],
            ["you", "person-outline", "You"],
          ].map(([p, icon, label]) => {
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
          <View style={s.toast} accessibilityLiveRegion="polite">
            <T style={{ color: C.greenInk, fontSize: 14 }}>{toast}</T>
          </View>
        )}
        <BottomSheet
          visible={sheet !== null}
          onClose={() => setSheet(null)}
          style={s.sheet}
          contentBottomPadding={32}
        >
          <View style={s.sheetHeader}>
            <T style={s.heading}>
              {
                {
                  filters: "Make it your kind of day",
                  log: "Your experience",
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
              onPress={() => setSheet(null)}
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
    </View>
  );
}
