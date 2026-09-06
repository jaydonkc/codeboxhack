import React, { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { MapProps } from "./ExperienceMap";
import type { MapBounds } from "../data/catalog";
import "leaflet/dist/leaflet.css";
import { scoreMarker } from "./scoreMarker.web";
import { useDeviceLocation } from "./useDeviceLocation";
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
export default function LocalExperienceMap({
  items,
  selected,
  scores,
  scoreLabel = "Enjoyment",
  onSelect,
  onSearchArea,
  onResetArea,
  origin,
  userLocation,
  onUserLocation,
  pickedLocation,
  onPickLocation,
  height = 390,
  compact = false,
}: MapProps) {
  const { locate, locating, locationError, position } = useDeviceLocation();
  const devicePoint = position ?? userLocation;
  const host = useRef<HTMLDivElement>(null),
    map = useRef<LeafletMap | null>(null),
    markers = useRef<LayerGroup | null>(null),
    callback = useRef(onSelect),
    [ready, setReady] = useState(false),
    [bounds, setBounds] = useState<MapBounds | null>(null),
    [tileError, setTileError] = useState(false),
    [loadError, setLoadError] = useState(false);
  callback.current = onSelect;
  const pick = useRef(onPickLocation);
  pick.current = onPickLocation;
  useEffect(() => {
    let dead = false;
    import("leaflet").then((L) => {
      if (dead || !host.current) return;
      const point = compact ? items[0] : undefined;
      const m = L.map(host.current, {
        scrollWheelZoom: false,
        zoomControl: !compact,
        dragging: !compact,
        doubleClickZoom: !compact,
        touchZoom: !compact,
        keyboard: !compact,
      }).setView(
        point?.lat != null && point?.lng != null
          ? [point.lat, point.lng]
          : origin ? [origin.lat, origin.lng] : [35.298, -120.69],
        compact ? 15 : 12,
      );
      map.current = m;
      m.on("click", event => pick.current?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
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
      const updateBounds = () => {
        const b = m.getBounds();
        setBounds({
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        });
      };
      m.on("moveend", updateBounds);
      updateBounds();
      setReady(true);
    }).catch(() => { if (!dead) setLoadError(true); });
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
        .filter((x) => x.provider !== "google" && x.lat != null && x.lng != null)
        .forEach((x) => {
          const marker = L.marker([x.lat!, x.lng!], {
            icon: L.divIcon({ html: scoreMarker(scores?.[x.id], x.id === selected), className: "elsewhere-score-marker", iconSize: [48, 36], iconAnchor: [24, 18] }),
            zIndexOffset: x.id === selected ? 1000 : 0,
          }).addTo(markers.current!);
          const label = document.createElement("span");
          label.textContent = x.venue;
          marker.bindTooltip(label);
          marker.on("click", () => callback.current(x.id));
          const el = marker.getElement();
          if (el) {
            el.setAttribute("tabindex", "0");
            el.setAttribute("role", "button");
            el.setAttribute("aria-label", `${x.name} · ${scoreLabel} ${scores?.[x.id] == null ? "unrated" : scores[x.id]!.toFixed(1)}`);
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
  }, [ready, items.map(x => `${x.id}:${x.lat}:${x.lng}:${x.venue}`).join("|"), scores, scoreLabel, selected]);
  useEffect(() => {
    if (!ready || !origin || compact || !map.current) return;
    const center = map.current.getCenter();
    if (Math.abs(center.lat - origin.lat) > 0.00001 || Math.abs(center.lng - origin.lng) > 0.00001)
      map.current.setView([origin.lat, origin.lng], 12);
  }, [ready, origin?.lat, origin?.lng, compact]);
  useEffect(() => {
    if (!ready || !pickedLocation) return;
    let dead = false;
    let marker: import("leaflet").CircleMarker | undefined;
    import("leaflet").then(L => {
      if (dead || !map.current) return;
      marker = L.circleMarker([pickedLocation.lat, pickedLocation.lng], { radius: 10, fillColor: "#d66940", color: "#fff9e9", weight: 3, fillOpacity: 1 }).addTo(map.current);
      marker.bindTooltip("Activity location");
    });
    return () => { dead = true; marker?.remove(); };
  }, [ready, pickedLocation?.lat, pickedLocation?.lng]);
  useEffect(() => {
    if (!ready || !devicePoint || compact) return;
    let dead = false;
    let marker: import("leaflet").CircleMarker | undefined;
    import("leaflet").then(L => {
      if (dead || !map.current) return;
      marker = L.circleMarker([devicePoint.lat, devicePoint.lng], { radius: 7, fillColor: "#4285F4", color: "white", weight: 2, fillOpacity: 1 }).addTo(map.current);
      marker.bindTooltip("Your last requested location");
    });
    return () => { dead = true; marker?.remove(); };
  }, [ready, devicePoint?.lat, devicePoint?.lng, compact]);
  return (
    <div
      style={{
        position: "relative",
        height,
        width: "100%",
        borderRadius: compact ? 0 : 20,
        overflow: "hidden",
        background: "#213f47",
      }}
    >
      <div
        ref={host}
        aria-label="Interactive experience map"
        style={{ height: "100%", width: "100%" }}
      />
      {!compact && onSearchArea && bounds && (
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
      {!compact && (
        <button
          aria-label="Reset map to my location"
          disabled={locating}
          style={{
            ...buttonStyle,
            position: "absolute",
            bottom: 30,
            right: 12,
            zIndex: 500,
          }}
          onClick={() => locate((point) => {
            map.current?.setView([point.lat, point.lng], 12);
            onResetArea?.();
            onUserLocation?.(point);
          })}
        >
          {locating ? "Locating…" : "My location"}
        </button>
      )}
      {!!locationError && <div role="alert" style={{ position: "absolute", bottom: 80, left: 12, right: 12, zIndex: 500, background: "#22382b", color: "white", padding: 12 }}>{locationError}</div>}
      {items.some(item => item.provider === "google") && <div role="status" style={{ position: "absolute", top: 60, left: 12, right: 12, zIndex: 500, color: "white", background: "#22382b", padding: 12 }}>Some places are available in the list only.</div>}
      {(tileError || loadError) && (
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
          Map couldn’t load. Check your connection or view the list.
        </div>
      )}
    </div>
  );
}
