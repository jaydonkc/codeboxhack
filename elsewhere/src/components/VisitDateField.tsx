import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, fonts, s } from "../theme";
import { formatVisitDate, localDateKey, parseVisitDate } from "../core/visitDate";

type Props = { value?: string; onChange: (value: string | undefined) => void };

export default function VisitDateField({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [month, setMonth] = useState(() => parseVisitDate(value) || new Date());
  const today = localDateKey();
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1, 12).getDay();
  const dayCount = new Date(year, monthIndex + 1, 0, 12).getDate();
  const nextMonth = new Date(year, monthIndex + 1, 1, 12);
  const canGoNext = localDateKey(nextMonth) <= today;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  function choose(date: string | undefined) {
    onChange(date);
    setExpanded(false);
  }
  return (
    <View style={v.field}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Date visited: ${value ? formatVisitDate(value) : "Add a date"}`}
        accessibilityState={{ expanded }}
        onPress={() => {
          setMonth(parseVisitDate(value) || new Date());
          setExpanded(!expanded);
        }}
        style={v.trigger}
      >
        <Ionicons name="calendar-outline" color={C.green} size={21} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.tiny}>Date visited</Text>
          <Text style={s.text}>{value ? formatVisitDate(value) : "Add a date"}</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} color={C.muted} size={18} />
      </Pressable>
      {expanded && (
        <View style={v.calendar}>
          <View style={s.between}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month"
              onPress={() => setMonth(new Date(year, monthIndex - 1, 1, 12))} style={s.icon}>
              <Ionicons name="chevron-back" color={C.ink} size={20} />
            </Pressable>
            <Text style={[s.text, { fontFamily: fonts.bold }]}>
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month"
              disabled={!canGoNext} accessibilityState={{ disabled: !canGoNext }}
              onPress={() => setMonth(nextMonth)} style={[s.icon, !canGoNext && v.disabled]}>
              <Ionicons name="chevron-forward" color={C.ink} size={20} />
            </Pressable>
          </View>
          <View style={v.week}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <Text key={i} style={[s.tiny, v.weekday]}>{day}</Text>
            ))}
          </View>
          {Array.from({ length: Math.ceil((firstDay + dayCount) / 7) }, (_, week) => (
            <View key={week} style={v.week}>
              {Array.from({ length: 7 }, (_, weekday) => {
                const day = week * 7 + weekday - firstDay + 1;
                if (day < 1 || day > dayCount) return <View key={weekday} style={v.day} />;
                const date = localDateKey(new Date(year, monthIndex, day, 12));
                const disabled = date > today, selected = date === value;
                return (
                  <Pressable key={weekday} accessibilityRole="button"
                    accessibilityLabel={`Visit on ${formatVisitDate(date)}`}
                    accessibilityState={{ selected, disabled }} disabled={disabled}
                    onPress={() => choose(date)}
                    style={[v.day, selected && v.selected, date === today && v.today, disabled && v.disabled]}>
                    <Text style={[s.text, selected && { color: C.greenInk }]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <View style={[s.wrap, { paddingTop: 10 }]}>
            {[["Today", today], ["Yesterday", localDateKey(yesterday)]].map(([label, date]) => (
              <Pressable key={label} accessibilityRole="button" onPress={() => choose(date)} style={s.pill}>
                <Text style={s.pillText}>{label}</Text>
              </Pressable>
            ))}
            {!!value && <Pressable accessibilityRole="button" onPress={() => choose(undefined)} style={s.pill}>
              <Text style={s.pillText}>Clear date</Text>
            </Pressable>}
          </View>
        </View>
      )}
    </View>
  );
}

const v = StyleSheet.create({
  field: { borderWidth: 1, borderColor: C.line, borderRadius: 15, overflow: "hidden" },
  trigger: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: C.surface },
  calendar: { paddingHorizontal: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: C.line },
  week: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", paddingVertical: 8 },
  day: { flex: 1, minWidth: 0, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: "transparent" },
  today: { borderColor: C.green },
  selected: { backgroundColor: C.green },
  disabled: { opacity: 0.3 },
});
