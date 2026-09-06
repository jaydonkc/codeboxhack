import React, { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { MapProps } from "./ExperienceMap";
import type { MapBounds } from "../data/catalog";
import "leaflet/dist/leaflet.css";
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
export default function ExperienceMap({
  items,
  selected,
  onSelect,
  onSearchArea,
  onResetArea,
  origin,
  initialCenter,
  onUserLocation,
  height = 390,
  compact = false,
}: MapProps) {
  const { locate, locating, locationError } = useDeviceLocation();
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
          : initialCenter ? [initialCenter.lat, initialCenter.lng]
          : origin ? [origin.lat, origin.lng] : [35.298, -120.69],
        compact || initialCenter ? 15 : 12,
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
      // Leaflet also fires "load" when requests finish with errors. Keep the
      // warning until failed tiles recover or leave the visible map.
      const failedTiles = new Set<HTMLElement>();
      tiles.on("tileerror", (event) => {
        failedTiles.add(event.tile);
        setTileError(true);
      });
      const clearFailedTile = (event: import("leaflet").TileEvent) => {
        failedTiles.delete(event.tile);
        setTileError(failedTiles.size > 0);
      };
      tiles.on("tileload", clearFailedTile);
      tiles.on("tileunload", clearFailedTile);
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
