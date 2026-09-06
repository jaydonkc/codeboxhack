import React, { useMemo, useRef, useState } from "react";
import { PanResponder, View, Text } from "react-native";
import { C, fonts, s } from "../theme";

type Props = { value: [number, number]; onChange: (value: [number, number]) => void };

export default function NichenessRangeSlider({ value, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const latest = useRef({ value, onChange, width });
  latest.current = { value, onChange, width };
  const start = useRef<[number, number]>(value);
  const update = (index: number, next: number) => {
    const { value: current, onChange: change } = latest.current;
    const rounded = Math.max(0, Math.min(10, Math.round(next)));
    const range: [number, number] = index === 0
      ? [Math.min(rounded, current[1]), current[1]]
      : [current[0], Math.max(rounded, current[0])];
    latest.current.value = range;
    change(range);
  };
  const responders = useMemo(() => [0, 1].map(index => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { start.current = [...latest.current.value]; },
    onPanResponderMove: (_, gesture) => {
      const trackWidth = latest.current.width;
      if (trackWidth <= 0) return;
      // When the handles overlap, dragging left selects min and right selects max.
      const active = start.current[0] === start.current[1] ? (gesture.dx < 0 ? 0 : 1) : index;
      update(active, start.current[active] + gesture.dx / trackWidth * 10);
    },
    onPanResponderTerminationRequest: () => false,
  })), []);

  return <View style={{ gap: 2 }}>
    <View style={s.between}>
      <Text style={s.muted}>Min <Text style={{ color: C.green, fontFamily: fonts.medium }}>{value[0]}</Text></Text>
      <Text style={s.muted}>Max <Text style={{ color: C.green, fontFamily: fonts.medium }}>{value[1]}</Text></Text>
    </View>
    <View style={{ marginHorizontal: 22, height: 44 }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 20, height: 4, borderRadius: 2, backgroundColor: C.line }} />
      <View pointerEvents="none" style={{ position: "absolute", left: `${value[0] * 10}%`, width: `${(value[1] - value[0]) * 10}%`, top: 20, height: 4, backgroundColor: C.green }} />
      {([0, 1] as const).map(index => <View
        key={index}
        {...responders[index].panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${index === 0 ? "Minimum" : "Maximum"} nicheness`}
        accessibilityValue={{ min: index === 0 ? 0 : value[0], max: index === 0 ? value[1] : 10, now: value[index] }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={event => update(index, value[index] + (event.nativeEvent.actionName === "increment" ? 1 : -1))}
        style={{ position: "absolute", left: `${value[index] * 10}%`, marginLeft: -22, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <View pointerEvents="none" style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.green, borderWidth: 2, borderColor: C.surface }} />
      </View>)}
    </View>
    <View style={s.between}><Text style={s.tiny}>Mainstream</Text><Text style={s.tiny}>Niche</Text></View>
  </View>;
}
