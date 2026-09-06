import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Experience, priceLabel } from "../data/catalog";
import { C, fonts } from "../theme";

export type ActivityDetailProps = {
  activity: Experience;
  map?: ReactNode;
  personalScore?: number | null;
  saved: boolean;
  social?: { friends: number; everyone: number; count: number } | null;
  niche: { score: number; label: string; reason: string };
  awareness?: string;
  note?: string;
  again?: boolean;
  onBack: () => void;
  onShare: () => void;
  onMore: () => void;
  onRank: () => void;
  onEditVisit: () => void;
  onSave: () => void;
  onWebsite: () => void;
  onDirections: () => void;
  onMap: () => void;
  onNiche: () => void;
  onAwareness: (value: "yes" | "no" | "unsure") => void;
  onAddToGuide?: () => void;
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [d.roundButton, pressed && d.pressed]}
    >
      <Ionicons name={icon} color={C.ink} size={23} />
    </Pressable>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [d.action, pressed && d.pressed]}
    >
      <Ionicons name={icon} color={C.green} size={17} />
      <Text style={d.actionText}>{label}</Text>
    </Pressable>
  );
}

function Score({
  label,
  score,
  personal = false,
  onPress,
}: {
  label: string;
  score?: number | null;
  personal?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={[d.scoreCircle, personal && d.personalCircle]}>
        {typeof score === "number" ? (
          <Text style={[d.scoreValue, personal && d.personalScore]}>
            {score.toFixed(1)}
          </Text>
        ) : (
          <Ionicons
            name={personal ? "add" : "remove"}
            size={28}
            color={personal ? C.green : C.muted}
          />
        )}
      </View>
      <Text style={d.scoreLabel}>{label}</Text>
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        typeof score === "number"
          ? `${label}: ${score.toFixed(1)}. Rank again`
          : "Add your ranking"
      }
      onPress={onPress}
      style={({ pressed }) => [d.scoreColumn, pressed && d.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={d.scoreColumn}>{content}</View>
  );
}

function Information({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={d.information}>
      <Ionicons
        name={icon}
        color={C.muted}
        size={20}
        style={{ marginTop: 2 }}
      />
      <View style={d.informationBody}>
        <Text style={d.informationTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

export default function ActivityDetail({
  activity,
  map,
  personalScore,
  saved,
  social,
  niche,
  awareness,
  note,
  again,
  onBack,
  onShare,
  onMore,
  onRank,
  onEditVisit,
  onSave,
  onWebsite,
  onDirections,
  onMap,
  onNiche,
  onAwareness,
  onAddToGuide,
}: ActivityDetailProps) {
  const ranked = typeof personalScore === "number";
  const rankLabel = ranked
    ? "Rank again"
    : personalScore === null
      ? "Finish ranking"
      : "Rank it";

  return (
    <View style={d.page}>
      <View style={[d.hero, !map && d.heroWithoutMap]}>
        {map && (
          <View style={d.mapButton}>
            <View style={d.mapContent}>
              {map}
            </View>
            <View pointerEvents="none" style={d.mapTint} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${activity.venue} on the map`}
              onPress={onMap}
              style={d.mapCaption}
            >
              <Ionicons name="expand-outline" color={C.ink} size={14} />
              <Text style={d.mapCaptionText}>Explore the area</Text>
            </Pressable>
          </View>
        )}
        <View style={d.toolbar} pointerEvents="box-none">
          <RoundButton
            icon="arrow-back"
            label="Back to results"
            onPress={onBack}
          />
          <View style={d.toolbarRight}>
            <RoundButton
              icon="share-outline"
              label="Share this experience"
              onPress={onShare}
            />
            <RoundButton
              icon="ellipsis-horizontal"
              label="More experience options"
              onPress={onMore}
            />
          </View>
        </View>
      </View>

      <View style={d.intro}>
        <Text style={d.title} accessibilityRole="header">
          {activity.venue}
        </Text>
        {activity.name !== activity.venue && (
          <Text style={d.subtitle}>{activity.name}</Text>
        )}
        <Text style={d.category}>
          {activity.activityType} · {activity.city}
        </Text>
        <View style={d.metadata}>
          <View style={d.inline}>
            <Ionicons name="time-outline" size={15} color={C.muted} />
            <Text style={d.metadataText}>
              Allow ~{activity.durationMinutesSuggested} min
            </Text>
          </View>
          <Text style={d.metadataDot}>·</Text>
          <Text style={d.metadataText}>{priceLabel(activity)}</Text>
        </View>

        <View style={d.primaryActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onRank}
            style={({ pressed }) => [d.rankButton, pressed && d.pressed]}
          >
            <Ionicons name="podium-outline" color={C.greenInk} size={19} />
            <Text style={d.rankText}>{rankLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              saved ? "Remove from Want to try" : "Save to Want to try"
            }
            accessibilityState={{ selected: saved }}
            onPress={onSave}
            style={({ pressed }) => [
              d.saveButton,
              saved && d.savedButton,
              pressed && d.pressed,
            ]}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              color={C.green}
              size={18}
            />
            <Text style={d.saveText}>
              {saved ? "Want to try ✓" : "Want to try"}
            </Text>
          </Pressable>
        </View>
        <View style={d.actions}>
          <Action icon="globe-outline" label="Website" onPress={onWebsite} />
          <Action
            icon="navigate-outline"
            label="Directions"
            onPress={onDirections}
          />
          <Action icon="map-outline" label="Map" onPress={onMap} />
        </View>
      </View>

      <View style={d.section}>
        <Text style={d.sectionTitle} accessibilityRole="header">
          Scores
        </Text>
        <View style={d.scores}>
          <Score
            label="Your score"
            score={personalScore}
            personal
            onPress={onRank}
          />
          <Score label="Friends" score={social?.friends} />
          <Score label="Everyone" score={social?.everyone} />
        </View>
        {!!social?.count && (
          <Text style={d.friendsCaption}>
            {social.count} friends have been here
          </Text>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Nicheness ${niche.score.toFixed(1)} out of 10, ${niche.label}. View estimate details`}
        onPress={onNiche}
        style={({ pressed }) => [d.nicheCard, pressed && d.pressed]}
      >
        <View style={d.nicheHeading}>
          <View style={d.nicheIcon}>
            <Ionicons name="sparkles-outline" size={20} color={C.purple} />
          </View>
          <View style={d.nicheTextColumn}>
            <Text style={d.nicheTitle}>How niche is it?</Text>
            <Text style={d.nicheCaption}>{niche.label} · out of 10</Text>
          </View>
          <Text style={d.nicheValue}>{niche.score.toFixed(1)}</Text>
          <Ionicons name="chevron-forward" size={16} color={C.purple} />
        </View>
        <Text style={d.nicheReason}>{niche.reason}</Text>
      </Pressable>

      <View style={d.section}>
        <Text style={d.sectionTitle} accessibilityRole="header">
          About
        </Text>
        <Text style={d.body}>{activity.description}</Text>
        <View style={d.tags}>
          {activity.vibes.map((vibe) => (
            <View key={vibe} style={d.tag}>
              <Text style={d.tagText}>{vibe}</Text>
            </View>
          ))}
        </View>
      </View>

      {(note?.trim() || again || onAddToGuide) && (
        <View style={d.section}>
          <View style={d.sectionHeading}>
            <Text style={d.sectionTitle} accessibilityRole="header">
              Your visit
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit your visit"
              onPress={onEditVisit}
              style={d.textButton}
            >
              <Text style={d.link}>Edit</Text>
            </Pressable>
          </View>
          {!!note?.trim() && <Text style={d.body}>{note}</Text>}
          {again && (
            <View style={d.tags}>
              <View style={[d.tag, d.inline]}>
                <Ionicons name="repeat-outline" color={C.green} size={15} />
                <Text style={d.tagText}>Repeatable</Text>
              </View>
            </View>
          )}
          {onAddToGuide && (
            <Pressable
              accessibilityRole="button"
              onPress={onAddToGuide}
              style={({ pressed }) => [d.guideButton, pressed && d.pressed]}
            >
              <Ionicons name="map-outline" color={C.green} size={19} />
              <Text style={d.guideText}>Add to my city guide</Text>
              <Ionicons name="add" color={C.green} size={20} />
            </Pressable>
          )}
        </View>
      )}

      <View style={d.section}>
        <Text style={d.sectionTitle} accessibilityRole="header">
          Plan your visit
        </Text>
        <Information icon="time-outline" title="Hours & access">
          <Text style={d.informationText}>{activity.scheduleNote}</Text>
        </Information>
        <Information icon="ticket-outline" title="Admission">
          <Text style={d.informationText}>{activity.priceNote}</Text>
        </Information>
        <Information icon="location-outline" title="Location">
          <Text style={d.informationText}>{activity.locationNote}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onDirections}
            style={d.directionLink}
          >
            <Text style={d.link}>Get directions</Text>
            <Ionicons
              name="arrow-up-right-box-outline"
              color={C.green}
              size={16}
            />
          </Pressable>
        </Information>
      </View>

      <View style={d.familiarity}>
        <Text style={d.sectionTitle} accessibilityRole="header">
          Had you heard of it?
        </Text>
        <Text style={d.familiarityCaption}>
          Before finding it on Elsewhere.
        </Text>
        <View style={d.familiarityChoices}>
          {(
            [
              ["yes", "Yes"],
              ["no", "No"],
              ["unsure", "Not sure"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: awareness === value }}
              onPress={() => onAwareness(value)}
              style={({ pressed }) => [
                d.familiarityChoice,
                awareness === value && d.familiaritySelected,
                pressed && d.pressed,
              ]}
            >
              <Text
                style={[
                  d.familiarityLabel,
                  awareness === value && d.familiaritySelectedLabel,
                ]}
              >
                {label}
              </Text>
              {awareness === value && (
                <Ionicons name="checkmark" size={16} color={C.greenInk} />
              )}
            </Pressable>
          ))}
        </View>
        {!!awareness && <Text style={d.thanks}>Thanks for sharing.</Text>}
      </View>
    </View>
  );
}

const d = StyleSheet.create({
  page: { backgroundColor: C.bg, paddingBottom: 24 },
  hero: { height: 170, backgroundColor: C.surface, overflow: "hidden" },
  heroWithoutMap: { height: 64, backgroundColor: C.bg },
  mapButton: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  mapContent: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  mapTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#18271f32",
  },
  mapCaption: {
    position: "absolute",
    bottom: 12,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#18271fdf",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mapCaptionText: { fontFamily: fonts.medium, fontSize: 11, color: C.ink },
  toolbar: {
    position: "absolute",
    left: 15,
    right: 15,
    top: 10,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toolbarRight: { flexDirection: "row", gap: 8 },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#18271fe8",
    borderWidth: 1,
    borderColor: "#b1c0b330",
  },
  intro: { paddingHorizontal: 22, paddingTop: 21, paddingBottom: 21 },
  title: {
    fontFamily: fonts.serif,
    color: C.ink,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: C.ink,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  category: {
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 4,
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 5 },
  metadataText: {
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 19,
  },
  metadataDot: { color: C.muted, fontSize: 13 },
  primaryActions: { flexDirection: "row", gap: 10, marginTop: 19 },
  rankButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 25,
    backgroundColor: C.green,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  rankText: { color: C.greenInk, fontFamily: fonts.bold, fontSize: 14 },
  saveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: C.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  savedButton: { backgroundColor: C.surface, borderColor: "#70875f" },
  saveText: { color: C.green, fontFamily: fonts.medium, fontSize: 14 },
  actions: { flexDirection: "row", gap: 7, marginTop: 12 },
  action: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 23,
    paddingHorizontal: 7,
    paddingVertical: 10,
  },
  actionText: { color: C.ink, fontFamily: fonts.medium, fontSize: 12 },
  section: {
    marginHorizontal: 22,
    paddingVertical: 21,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    color: C.ink,
    fontSize: 18,
    lineHeight: 25,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scores: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 18,
  },
  scoreColumn: { flex: 1, alignItems: "center", gap: 9 },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#789264",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22382b66",
  },
  personalCircle: { borderColor: C.green, backgroundColor: "#354d2c" },
  scoreValue: {
    fontFamily: fonts.bold,
    color: C.green,
    fontSize: 28,
    letterSpacing: -0.8,
  },
  personalScore: { color: C.green },
  scoreLabel: {
    color: C.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  friendsCaption: {
    textAlign: "center",
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 15,
  },
  nicheCard: {
    marginHorizontal: 22,
    marginBottom: 21,
    padding: 16,
    backgroundColor: C.purpleBg,
    borderRadius: 17,
    gap: 10,
  },
  nicheHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  nicheIcon: {
    width: 33,
    height: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  nicheTextColumn: { flex: 1 },
  nicheTitle: {
    color: C.purple,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  nicheCaption: {
    color: "#c5b4d2",
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 18,
  },
  nicheValue: {
    color: C.purple,
    fontFamily: fonts.bold,
    fontSize: 25,
    letterSpacing: -0.7,
  },
  nicheReason: {
    color: "#d7cce0",
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 19,
  },
  body: {
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 10,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 15 },
  tag: {
    backgroundColor: C.surface,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 16,
  },
  tagText: {
    color: C.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  information: { flexDirection: "row", gap: 12, marginTop: 21 },
  informationBody: { flex: 1, gap: 5 },
  informationTitle: {
    fontFamily: fonts.medium,
    color: C.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  informationText: {
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 21,
  },
  directionLink: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
  },
  link: {
    color: C.green,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  textButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  guideButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 12,
  },
  guideText: {
    color: C.green,
    fontFamily: fonts.medium,
    fontSize: 14,
    flex: 1,
  },
  familiarity: {
    marginHorizontal: 22,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    marginTop: 7,
  },
  familiarityCaption: {
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 4,
  },
  familiarityChoices: { flexDirection: "row", gap: 8, marginTop: 14 },
  familiarityChoice: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  familiaritySelected: { backgroundColor: C.green, borderColor: C.green },
  familiarityLabel: { color: C.ink, fontFamily: fonts.medium, fontSize: 13 },
  familiaritySelectedLabel: { color: C.greenInk },
  thanks: {
    color: C.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 11,
  },
  pressed: { opacity: 0.68 },
});
