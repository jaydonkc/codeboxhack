import React from "react";
import { C } from "../theme";
import { nichenessSliderLabel } from "../core/filterOptions";

type Props = { value: number; onChange: (value: number) => void };

export default function NichenessSlider({ value, onChange }: Props) {
  return (
    <input
      type="range"
      aria-label="Minimum nicheness"
      aria-valuetext={nichenessSliderLabel(value)}
      min={0}
      max={10}
      step={0.5}
      value={value}
      onChange={(event) => onChange(Number(event.currentTarget.value))}
      style={{ width: "100%", height: 48, margin: 0, accentColor: C.green, cursor: "pointer" }}
    />
  );
}
