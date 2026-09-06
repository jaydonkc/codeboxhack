import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VIBES } from "../data/catalog";
import { C, fonts, s } from "../theme";
import { useReducedMotion } from "./useReducedMotion";

const useNativeDriver = Platform.OS !== "web";
const descriptions: Record<string, { icon: React.ComponentProps<typeof Ionicons>["name"]; detail: string }> = {
  Relax: { icon: "leaf-outline", detail: "Slow down" },
  Active: { icon: "trail-sign-outline", detail: "Get moving" },
  Hangout: { icon: "people-outline", detail: "Good company" },
  Creative: { icon: "color-palette-outline", detail: "Make something" },
  Learn: { icon: "book-outline", detail: "Stay curious" },
  Explore: { icon: "compass-outline", detail: "Somewhere new" },
};

function Reveal({ children, delay, reduced, style }: {
  children: React.ReactNode; delay: number; reduced: boolean | null; style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced === null) return;
    if (reduced) { progress.setValue(1); return; }
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, reduced]);
  return <Animated.View style={[style, {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  }]}>{children}</Animated.View>;
}

function InterestTile({ label, selected, disabled, onPress, reduced }: {
  label: string; selected: boolean; disabled: boolean; onPress: () => void; reduced: boolean | null;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const check = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    const animation = Animated.timing(check, {
      toValue: selected ? 1 : 0, duration: reduced === false ? 180 : 0,
      easing: Easing.out(Easing.cubic), useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [check, selected, reduced]);
  useEffect(() => () => scale.stopAnimation(), [scale]);
  function press(toValue: number) {
    if (reduced !== false) return;
    Animated.spring(scale, { toValue, stiffness: 380, damping: 24, mass: 0.7, useNativeDriver }).start();
  }
  const { icon, detail } = descriptions[label];
  return <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
    <Pressable accessibilityRole="checkbox" accessibilityLabel={label}
      accessibilityHint={detail} accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected} aria-disabled={disabled}
      {...(Platform.OS === "web" ? {
        // RN Web handles Enter, but only gives Space activation to button roles.
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            if (!disabled && !event.repeat) onPress();
          }
        },
      } : {})}
      disabled={disabled} onPress={onPress} onPressIn={() => press(0.965)} onPressOut={() => press(1)}
      style={[styles.tile, selected && styles.selectedTile]}>
      <View style={s.between}>
        <Ionicons name={icon} size={27} color={selected ? C.greenInk : C.green} />
        <Animated.View style={[styles.check, { opacity: check, transform: [{ scale: check.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) }] }]}>
          <Ionicons name="checkmark" size={14} color={C.green} />
        </Animated.View>
      </View>
      <View style={{ gap: 2 }}>
        <Text style={[styles.label, selected && { color: C.greenInk }]}>{label}</Text>
        <Text style={[styles.detail, selected && { color: C.greenInk }]}>{detail}</Text>
      </View>
    </Pressable>
  </Animated.View>;
}

export default function Onboarding({ selected, onToggle, onComplete, saveError, onRetrySave }: {
  selected: string[]; onToggle: (interest: string) => void; onComplete: (skip: boolean) => void;
  saveError: boolean; onRetrySave: () => void;
}) {
  const reduced = useReducedMotion();
  const exit = useRef(new Animated.Value(1)).current;
  const [leaving, setLeaving] = useState<"continue" | "skip" | null>(null);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    if (!leaving) return;
    const animation = Animated.timing(exit, {
      toValue: 0, duration: reduced === false ? 200 : 0,
      easing: Easing.in(Easing.quad), useNativeDriver,
    });
    animation.start(({ finished }) => { if (finished) complete.current(leaving === "skip"); });
    return () => animation.stop();
  }, [exit, leaving, reduced]);

  return <Animated.View style={{ flex: 1, opacity: exit, transform: [{ translateY: exit.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Reveal reduced={reduced} delay={0}>
        <Text style={s.wordmark}>elsewhere</Text>
        <Text accessibilityRole="header" style={styles.headline}>Welcome.{"\n"}What are you into?</Text>
        <Text style={styles.subtitle}>Pick a few. You can change these anytime.</Text>
      </Reveal>
      <View style={styles.grid}>
        {VIBES.map((vibe, index) => <Reveal key={vibe} reduced={reduced} delay={80 + index * 45} style={styles.cell}>
          <InterestTile label={vibe} selected={selected.includes(vibe)} disabled={leaving !== null}
            onPress={() => onToggle(vibe)} reduced={reduced} />
        </Reveal>)}
      </View>
      <Reveal reduced={reduced} delay={350} style={styles.footer}>
        <View style={styles.location}>
          <Ionicons name="location-outline" color={C.muted} size={14} />
          <Text style={s.tiny}>Starting in San Luis Obispo</Text>
        </View>
        {saveError && <View accessibilityLiveRegion="polite" style={s.notice}>
          <Text style={s.muted}>Couldn’t save your choices.</Text>
          <Pressable accessibilityRole="button" onPress={onRetrySave} style={styles.retry}>
            <Text style={{ color: C.green, fontFamily: fonts.bold }}>Try saving again</Text>
          </Pressable>
        </View>}
        <Pressable accessibilityRole="button" accessibilityLabel="Continue" accessibilityState={{ disabled: leaving !== null }}
          disabled={leaving !== null} onPress={() => setLeaving("continue")}
          style={({ pressed }) => [s.primary, pressed && { opacity: 0.85 }]}>
          <Text style={s.primaryText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={C.greenInk} />
        </Pressable>
        <Pressable accessibilityRole="button" disabled={leaving !== null}
          accessibilityState={{ disabled: leaving !== null }} onPress={() => setLeaving("skip")}
          style={styles.skip}>
          <Text style={s.muted}>Skip for now</Text>
        </Pressable>
      </Reveal>
    </ScrollView>
  </Animated.View>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 12 },
  headline: { color: C.ink, fontFamily: fonts.serif, fontSize: 39, lineHeight: 45, marginTop: 26, letterSpacing: -0.7 },
  subtitle: { ...s.muted, marginTop: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 28, marginBottom: 26 },
  cell: { flexBasis: "47%", flexGrow: 1 },
  tile: { flex: 1, minHeight: 125, borderRadius: 20, padding: 16, gap: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  selectedTile: { backgroundColor: C.green, borderColor: C.green },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.greenInk, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.bold, color: C.ink, fontSize: 18, lineHeight: 24 },
  detail: { fontFamily: fonts.body, color: C.muted, fontSize: 12, lineHeight: 18 },
  footer: { marginTop: "auto", gap: 8 },
  location: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 8 },
  skip: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  retry: { minHeight: 44, justifyContent: "center" },
});
