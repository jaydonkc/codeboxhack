import React from "react";
import { C } from "../theme";
import { DISTANCE_SLIDER_MAX, distanceFromSlider, distanceSliderLabel } from "../core/filterOptions";

type Props = { value: number | null; onChange: (value: number | null) => void };

export default function DistanceSlider({ value, onChange }: Props) {
  return (
    <input
      type="range"
      aria-label="Maximum distance"
      aria-valuetext={distanceSliderLabel(value)}
      min={1}
      max={DISTANCE_SLIDER_MAX}
      step={1}
      value={value ?? DISTANCE_SLIDER_MAX}
      onChange={(event) => onChange(distanceFromSlider(Number(event.currentTarget.value)))}
      style={{ width: "100%", height: 48, margin: 0, accentColor: C.green, cursor: "pointer" }}
    />
  );
}
