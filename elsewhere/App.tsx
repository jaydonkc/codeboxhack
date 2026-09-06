import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
  icons,
  matches,
  priceLabel,
  VIBES,
} from "./src/data/catalog";
import ExperienceMap from "./src/components/ExperienceMap";
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
  "filters" | "trip" | "log" | "niche" | "share" | "menu" | "activity" | null;
type Stored = {
  version: 1;
  saved: string[];
  preferences: Preference[];
  awareness: Record<string, string>;
  guide: string[];
  guideNotes: Record<string, string>;
  interests: string[];
  demoSocial: boolean;
  visiting: boolean;
  start: string;
  end: string;
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
  visiting: true,
  start: "2026-09-11",
  end: "2026-09-13",
};
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
    [start, setStart] = useState(fresh.start),
    [end, setEnd] = useState(fresh.end),
    [dateError, setDateError] = useState("");
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
      .catch(() => notify("Could not load this device’s saved demo."))
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
        .catch(() => notify("Changes could not be saved on this device."));
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
  function trip() {
    setStart(data.start);
    setEnd(data.end);
    setDateError("");
    setSheet("trip");
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
  let results = catalog.filter((e) => matches(e, filters));
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
    `${owner === "you" ? "My SLO favorites" : "A slow weekend in SLO (sample guide)"}\nSan Luis Obispo\n\n` +
    guideIds
      .map(
        (id, i) =>
          `${i + 1}. ${byId(id).name}\n${owner === "you" ? data.guideNotes[id] || "" : "Sample recommendation"}\n${byId(id).sourceUrl}`,
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
              ? `${audience} ${demoReviews[e.id][audience === "Friends" ? "friends" : "everyone"].toFixed(1)} · demo`
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
            {distance(e)?.toFixed(1)} mi
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
              <T style={s.nicheText}>Niche: unknown</T>
            </Pressable>
          </View>
          <View style={s.reason}>
            <I name="sparkles-outline" color={C.coral} size={15} />
            <T style={[s.tiny, { flex: 1 }]}>{reason(e)}</T>
            {!done.has(e.id) && <T style={s.tiny}>Not logged yet</T>}
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
            <T style={s.tiny}>Emma · sample profile</T>
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
          <Pressable accessibilityRole="button" onPress={trip}>
            <T style={s.tiny}>
              {data.visiting ? "Visiting SLO" : "Around SLO"} ⌄
            </T>
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
            label="San Luis Obispo"
            icon="location-outline"
            onPress={trip}
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
                items={results}
                selected={selected}
                onSelect={setSelected}
                onSearchArea={(bounds) => filter({ bounds })}
                onResetArea={() => filter({ bounds: undefined })}
              />
              <T style={s.tiny}>
                Approximate positions · straight-line miles from Downtown SLO.
                Pins may mark an area, not an entrance.
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
                  : "A little too specific?"}
              </T>
              <T style={[s.muted, { textAlign: "center" }]}>
                {page === "lists"
                  ? "Save or log an experience to see it here."
                  : "Try fewer filters. Unknown prices do not pass a budget limit."}
              </T>
              <Button
                secondary
                onPress={() => {
                  clearFilters();
                  nav("discover");
                }}
              >
                Explore all experiences
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
  function detailView() {
    const pref = data.preferences.find((p) => p.id === x.id);
    return (
      <View style={[s.pad, s.stack]}>
        <View style={s.between}>
          <Icon
            name="arrow-back"
            label="Back to results"
            onPress={() => nav(returnPage.current)}
          />
          <T style={s.eyebrow}>{x.activityType}</T>
          <Icon
            name="bookmark-outline"
            label="Save experience"
            onPress={() => save(x.id)}
          />
        </View>
        <T style={s.serif}>{x.name}</T>
        <T style={s.muted}>
          {x.venue} · {x.city}
        </T>
        <View style={s.wrap}>
          {score(x)}
          <Pill label="Niche: unknown" onPress={() => setSheet("niche")} />
        </View>
        <T>{x.description}</T>
        <View style={s.notice}>
          <T style={s.heading}>{priceLabel(x)}</T>
          <T style={s.muted}>{x.priceNote}</T>
          <T style={s.tiny}>
            Allow ~{x.durationMinutesSuggested} min · planning estimate
          </T>
        </View>
        <T style={s.heading}>Before you go</T>
        <T style={s.muted}>{x.scheduleNote}</T>
        <T style={s.muted}>{x.locationNote}</T>
        <Button secondary onPress={() => official(x.sourceUrl)}>
          Official details ↗
        </Button>
        <Button
          secondary
          onPress={() =>
            official(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.venue + ", San Luis Obispo, California")}`,
            )
          }
        >
          Find access & directions ↗
        </Button>
        <T style={s.tiny}>Checked {x.checkedAt}. Availability is not live.</T>
        <Button onPress={() => log(x.id)}>
          {pref ? "Your enjoyment · rerank" : "I did this · rank it"}
        </Button>
        <Button secondary onPress={() => save(x.id)}>
          {data.saved.includes(x.id) ? "Saved to Want to try" : "Want to try"}
        </Button>
        {!data.awareness[x.id] ? (
          <View style={[s.notice, { gap: 12 }]}>
            <T style={s.heading}>A quick familiarity check</T>
            <T style={s.muted}>
              Before seeing it here, had you heard of this experience?
            </T>
            <View style={s.wrap}>
              {[
                ["yes", "Yes"],
                ["no", "No"],
                ["unsure", "Not sure"],
              ].map(([v, label]) => (
                <Pill
                  key={v}
                  label={label}
                  onPress={() => {
                    setData((d) => ({
                      ...d,
                      awareness: { ...d.awareness, [x.id]: v },
                    }));
                    notify("Answer saved locally. Niche score stays unknown.");
                  }}
                />
              ))}
            </View>
            <T style={s.tiny}>Optional · demo response, not a city survey</T>
          </View>
        ) : (
          <T style={s.muted}>
            Familiarity answer saved. One answer isn’t enough for a niche score.
          </T>
        )}
        {pref && (
          <Button
            secondary
            onPress={() => {
              setData((d) => ({
                ...d,
                guide: [...new Set([...d.guide, x.id])],
              }));
              notify("Added to your city guide.");
            }}
          >
            Add to my city guide
          </Button>
        )}
      </View>
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
            ? "Your chosen order · saved on this device"
            : "Emma’s guide · sample recommendations"}
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
        <T style={s.heading}>Demo settings</T>
        <View style={s.between}>
          <View style={{ flex: 1 }}>
            <T>Sample social scores</T>
            <T style={s.tiny}>Illustrative friends and community ratings</T>
          </View>
          <Switch
            value={data.demoSocial}
            onValueChange={(v) => setData((d) => ({ ...d, demoSocial: v }))}
            trackColor={{ true: "#608451", false: C.line }}
            thumbColor={C.green}
          />
        </View>
        <Button
          secondary
          onPress={() => {
            if (data.preferences.length) {
              notify("Reset the local demo first to load sample history.");
              return;
            }
            setData((d) => ({ ...d, preferences: seed }));
            notify("Three sample visits loaded.");
          }}
        >
          Load sample ranking history
        </Button>
        <T style={s.tiny}>
          Adds three sample past visits so you can try comparisons immediately.
        </T>
        <Button
          secondary
          onPress={() => {
            setData({ ...fresh, demoSocial: false });
            clearFilters();
            notify("Local demo reset.");
          }}
        >
          Reset local demo
        </Button>
        <View style={s.notice}>
          <T style={s.muted}>
            Real activities. Personal saves, rankings and responses stay on this
            device. No accounts, live community scores, booking inventory or
            cloud sync yet.
          </T>
          <T style={s.tiny}>Expo SDK 57</T>
        </View>
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
            {!data.preferences.length && (
              <Button
                secondary
                onPress={() => {
                  setData((d) => ({ ...d, preferences: seed }));
                  notify("Three sample visits loaded for comparison demos.");
                }}
              >
                Try with sample history
              </Button>
            )}
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
                  Derived from your comparisons. Scores can shift as the list
                  grows. Fewer than three entries in a reaction band means a
                  provisional score.
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
          <T style={s.heading}>Distance from Downtown SLO</T>
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
            Approximate durations and straight-line distance. Not a live
            availability check.
          </T>
          <Button onPress={() => setSheet(null)}>
            Show matching experiences
          </Button>
          <Button secondary onPress={clearFilters}>
            Reset filters
          </Button>
        </>
      );
    if (sheet === "trip")
      return (
        <>
          <T style={s.serif}>A little time{"\n"}in SLO.</T>
          <Image
            source={require("./assets/catalog/slo-hills.jpg")}
            style={[s.photo, { borderRadius: 18 }]}
            accessibilityLabel="San Luis Obispo hills"
          />
          <T style={s.tiny}>Photo: Visit SLO</T>
          <T style={s.muted}>
            San Luis Obispo is the first destination. Your interests stay with
            you.
          </T>
          <View style={s.wrap}>
            <Pill
              label="I’m visiting"
              active={data.visiting}
              onPress={() => setData((d) => ({ ...d, visiting: true }))}
            />
            <Pill
              label="I live nearby"
              active={!data.visiting}
              onPress={() => setData((d) => ({ ...d, visiting: false }))}
            />
          </View>
          <T style={s.heading}>Trip dates</T>
          <TextInput
            accessibilityLabel="Trip start date"
            value={start}
            onChangeText={setStart}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.muted}
            style={s.inputBox}
          />
          <TextInput
            accessibilityLabel="Trip end date"
            value={end}
            onChangeText={setEnd}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.muted}
            style={s.inputBox}
          />
          {!!dateError && <T style={{ color: C.coral }}>{dateError}</T>}
          <T style={s.tiny}>
            Planning dates only. Check official sources for opening hours and
            scheduled sessions.
          </T>
          <Button
            onPress={() => {
              const valid = (v: string) =>
                /^\d{4}-\d{2}-\d{2}$/.test(v) &&
                !Number.isNaN(Date.parse(v)) &&
                new Date(v).toISOString().slice(0, 10) === v;
              if (!valid(start) || !valid(end) || end < start) {
                setDateError(
                  "Use valid YYYY-MM-DD dates, with end after start.",
                );
                return;
              }
              setData((d) => ({ ...d, start, end }));
              setSheet(null);
              notify("Trip dates saved.");
            }}
          >
            Save trip dates
          </Button>
        </>
      );
    if (sheet === "niche")
      return (
        <>
          <View style={s.niche}>
            <T style={[s.nicheText, { fontSize: 25, fontFamily: fonts.bold }]}>
              Unknown
            </T>
          </View>
          <T>{x.name}</T>
          <T style={s.muted}>
            Nicheness asks how familiar this experience is to the local
            community. We don’t have enough awareness responses to measure it
            yet.
          </T>
          <T style={s.heading}>It’s not the number of reviews.</T>
          <T style={s.muted}>
            We ask whether people had heard of it, then estimate the unfamiliar
            share. At least 30 valid local responses and a supported baseline
            are proposed before showing a measured score.
          </T>
          <View style={s.notice}>
            <T style={s.muted}>
              Enjoyment: did you like it?{"\n"}Nicheness: do locals know it?
              {"\n"}New to you: have you done it?
            </T>
          </View>
          <T style={s.tiny}>
            This demo saves awareness answers on your device. It doesn’t
            simulate a city-wide survey.
          </T>
          <Button onPress={() => setSheet(null)}>Got it</Button>
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
          <T style={s.tiny}>
            Copy-and-paste sharing works now. Hosted guide links and friend
            accounts come with the backend.
          </T>
        </>
      );
    if (sheet === "activity")
      return (
        <>
          <T style={s.muted}>Sample activity</T>
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
        <Button secondary onPress={trip}>
          Plan a SLO visit
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
              name="calendar-outline"
              label="Plan your trip"
              onPress={trip}
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
                <T style={s.eyebrow}>SAMPLE SOCIAL FEED</T>
                <T>Emma shared a slow afternoon in SLO.</T>
                <T style={s.tiny}>
                  Sample identities and recommendations. No real friend data is
                  connected.
                </T>
              </View>
              <Button secondary onPress={() => guide("you")}>
                My city guide
              </Button>
            </View>
          )}
          <T
            style={[
              s.tiny,
              { textAlign: "center", paddingHorizontal: 22, marginTop: 18 },
            ]}
          >
            Real SLO activities ·{" "}
            {data.demoSocial
              ? "Sample social scores"
              : "No live community ratings"}
            {"\n"}Personal changes stay on this device
          </T>
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
        <Modal
          visible={sheet !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSheet(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={s.backdrop}
          >
            <View style={s.sheet} accessibilityViewIsModal>
              <View style={s.sheetHeader}>
                <T style={s.heading}>
                  {sheet === "filters"
                    ? "Make it your kind of day"
                    : sheet === "log"
                      ? "Your experience"
                      : sheet === "niche"
                        ? "About nicheness"
                        : sheet === "share"
                          ? "Share a good day"
                          : sheet === "activity"
                            ? "Activity"
                            : "Elsewhere"}
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
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
