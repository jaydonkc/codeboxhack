import React, { useState } from "react";
import { GestureResponderEvent, StyleSheet, View } from "react-native";
import { C } from "../theme";
import { DISTANCE_SLIDER_MAX, distanceFromSlider, distanceSliderLabel } from "../core/filterOptions";

type Props = { value: number | null; onChange: (value: number | null) => void };

export default function DistanceSlider({ value, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const position = value ?? DISTANCE_SLIDER_MAX;
  const travel = Math.max(0, width - 28);
  const offset = ((position - 1) / (DISTANCE_SLIDER_MAX - 1)) * travel;
  function update(event: GestureResponderEvent) {
    if (!travel) return;
    const ratio = Math.max(0, Math.min(1, (event.nativeEvent.locationX - 14) / travel));
    onChange(distanceFromSlider(1 + ratio * (DISTANCE_SLIDER_MAX - 1)));
  }
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Maximum distance"
      accessibilityValue={{ min: 1, max: DISTANCE_SLIDER_MAX, now: position, text: distanceSliderLabel(value) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "increment") onChange(distanceFromSlider(position + 1));
        if (nativeEvent.actionName === "decrement") onChange(distanceFromSlider(position - 1));
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
