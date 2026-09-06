import React from "react";
import { Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { C, fonts, s } from "../theme";

type Props = {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step?: number;
  display: string;
  left: string;
  right: string;
  onChange: (value: number) => void;
};

export default function FilterSlider({ label, value, minimum, maximum, step = 1, display, left, right, onChange }: Props) {
  return <View style={{ gap: 2 }}>
    <View style={s.between}>
      <Text style={s.muted}>{label}</Text>
      <Text style={{ ...s.text, color: C.green, fontFamily: fonts.medium }}>{display}</Text>
    </View>
    <Slider
      accessibilityLabel={label}
      accessibilityValue={{ min: minimum, max: maximum, now: value, text: display }}
      minimumValue={minimum}
      maximumValue={maximum}
      step={step}
      value={value}
      onValueChange={onChange}
      minimumTrackTintColor={C.green}
      maximumTrackTintColor={C.line}
      thumbTintColor={C.green}
      style={{ width: "100%", height: 40 }}
    />
    <View style={s.between}><Text style={s.tiny}>{left}</Text><Text style={s.tiny}>{right}</Text></View>
  </View>;
}
