import React, { useState } from "react";
import { GestureResponderEvent, StyleSheet, View } from "react-native";
import { C } from "../theme";
import { nichenessSliderLabel } from "../core/filterOptions";
const clamp = (value: number) => Math.max(0, Math.min(10, Math.round(value * 2) / 2));

type Props = { value: number; onChange: (value: number) => void };

export default function NichenessSlider({ value, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const position = value;
  const travel = Math.max(0, width - 28);
  const offset = (position / 10) * travel;
  function update(event: GestureResponderEvent) {
    if (!travel) return;
    const ratio = Math.max(0, Math.min(1, (event.nativeEvent.locationX - 14) / travel));
    onChange(clamp(ratio * 10));
  }
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Minimum nicheness"
      accessibilityValue={{ min: 0, max: 10, now: position, text: nichenessSliderLabel(value) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "increment") onChange(clamp(position + 0.5));
        if (nativeEvent.actionName === "decrement") onChange(clamp(position - 0.5));
      }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={update}
      onResponderMove={update}
      onResponderTerminationRequest={() => false}
      style={styles.touchArea}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.track} />
        <View style={[styles.fill, { width: offset }]} />
        <View style={[styles.thumb, { left: offset }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: { height: 48, width: "100%" },
  track: { position: "absolute", left: 14, right: 14, top: 21, height: 6, borderRadius: 3, backgroundColor: C.line },
  fill: { position: "absolute", left: 14, top: 21, height: 6, borderRadius: 3, backgroundColor: C.green },
  thumb: { position: "absolute", top: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: C.green, borderWidth: 3, borderColor: C.ink },
});
