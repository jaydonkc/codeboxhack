import React, { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { MapProps } from "./ExperienceMap";
import type { MapBounds } from "../data/catalog";
import "leaflet/dist/leaflet.css";
const buttonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 20,
  padding: "12px 16px",
  background: "#c5dfa8",
  color: "#294425",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 2px 12px #0003",
};
export default function ExperienceMap({
  items,
  selected,
  onSelect,
  onSearchArea,
  onResetArea,
}: MapProps) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<LeafletMap | null>(null),
    markers = useRef<LayerGroup | null>(null),
    callback = useRef(onSelect),
    [ready, setReady] = useState(false),
    [bounds, setBounds] = useState<MapBounds | null>(null),
    [tileError, setTileError] = useState(false);
  callback.current = onSelect;
  useEffect(() => {
    let dead = false;
    import("leaflet").then((L) => {
      if (dead || !host.current) return;
      const m = L.map(host.current, { scrollWheelZoom: false }).setView(
        [35.298, -120.69],
        12,
      );
      map.current = m;
      markers.current = L.layerGroup().addTo(m);
      const tiles = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        },
      ).addTo(m);
      tiles.on("tileerror", () => setTileError(true));
      tiles.on("load", () => setTileError(false));
      m.on("moveend", () => {
        const b = m.getBounds();
        setBounds({
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        });
      });
      setReady(true);
    });
    return () => {
      dead = true;
      map.current?.remove();
      map.current = null;
      markers.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !markers.current) return;
    let dead = false;
    import("leaflet").then((L) => {
      if (dead || !markers.current) return;
      markers.current.clearLayers();
      items
        .filter((x) => x.lat !== null && x.lng !== null)
        .forEach((x) => {
          const marker = L.circleMarker([x.lat!, x.lng!], {
            radius: x.id === selected ? 12 : 9,
            fillColor: x.id === selected ? "#d66940" : "#345c36",
            color: "#fff9e9",
            weight: 3,
            fillOpacity: 1,
          }).addTo(markers.current!);
          marker.bindTooltip(x.name);
          marker.on("click", () => callback.current(x.id));
          const el = marker.getElement();
          if (el) {
            el.setAttribute("tabindex", "0");
            el.setAttribute("role", "button");
            el.setAttribute("aria-label", x.name);
            el.addEventListener("keydown", (ev) => {
              if (["Enter", " "].includes((ev as KeyboardEvent).key)) {
                ev.preventDefault();
                callback.current(x.id);
              }
            });
          }
        });
    });
    return () => {
      dead = true;
    };
  }, [ready, items.map((x) => x.id).join(","), selected]);
  return (
    <div
      style={{
        position: "relative",
        height: 390,
        width: "100%",
        borderRadius: 20,
        overflow: "hidden",
        background: "#213f47",
      }}
    >
      <div
        ref={host}
        aria-label="Interactive map of San Luis Obispo experiences"
        style={{ height: "100%", width: "100%" }}
      />
      {onSearchArea && bounds && (
        <button
          style={{
            ...buttonStyle,
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 500,
            whiteSpace: "nowrap",
          }}
          onClick={() => onSearchArea(bounds)}
        >
          Search this area
        </button>
      )}
      <button
        aria-label="Reset map to San Luis Obispo"
        style={{
          ...buttonStyle,
          position: "absolute",
          bottom: 30,
          right: 12,
          zIndex: 500,
        }}
        onClick={() => {
          map.current?.setView([35.298, -120.69], 12);
          onResetArea?.();
        }}
      >
        All SLO
      </button>
      {tileError && (
        <div
          role="status"
          style={{
            position: "absolute",
            bottom: 70,
            left: 12,
            right: 12,
            zIndex: 500,
            background: "#22382b",
            color: "#fff",
            padding: 12,
          }}
        >
          Map tiles couldn’t load. Check your connection; the list is still
          available.
        </div>
      )}
    </div>
  );
}
