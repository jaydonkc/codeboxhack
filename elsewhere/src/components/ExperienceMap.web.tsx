/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from "react";
import type { MapProps } from "./ExperienceMap";
import type { MapBounds } from "../data/catalog";
import { useDeviceLocation } from "./useDeviceLocation";
import LocalExperienceMap from "./LocalExperienceMap.web";

let loading: Promise<void> | undefined;
function loadGoogleMaps(key: string): Promise<void> {
  if (typeof google !== "undefined" && typeof google.maps?.importLibrary === "function") return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const win = window as unknown as Record<string, unknown>;
    const timer = setTimeout(() => { loading = undefined; script.remove(); reject(new Error("Google Maps took too long to load. Check your connection and reload.")); }, 15000);
    win.elsewhereMapsReady = () => { clearTimeout(timer); resolve(); };
    win.gm_authFailure = () => { clearTimeout(timer); loading = undefined; reject(new Error("Google Maps could not authenticate. Check the browser API key and allowed website.")); };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=weekly&callback=elsewhereMapsReady`;
    script.async = true;
    script.onerror = () => { clearTimeout(timer); loading = undefined; script.remove(); reject(new Error("Couldn’t load Google Maps. Check your connection and reload.")); };
    document.head.append(script);
  });
  return loading;
}
const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 20, padding: "12px 16px", background: "#c5dfa8", color: "#294425", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 12px #0003" };
export default function ExperienceMap(props: MapProps) {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY ? <GoogleExperienceMap {...props} /> : <LocalExperienceMap {...props} />;
}
function GoogleExperienceMap({ items, selected, onSelect, onSearchArea, onResetArea, origin, userLocation, onUserLocation, height = 390, compact = false }: MapProps) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const pins = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [bounds, setBounds] = useState<MapBounds>();
  const { locate, locating, locationError, position } = useDeviceLocation();
  const devicePoint = position ?? userLocation;
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY ?? "";
  const point = compact && items[0]?.lat != null && items[0]?.lng != null ? { lat: items[0].lat, lng: items[0].lng } : origin;
  const firstPoint = useRef(point);
  useEffect(() => {
    if (!key) return;
    let disposed = false;
    let idle: google.maps.MapsEventListener | undefined;
    loadGoogleMaps(key).then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      await google.maps.importLibrary("marker");
      if (disposed || !host.current) return;
      const m = new Map(host.current, { center: firstPoint.current ?? { lat: 20, lng: 0 }, zoom: firstPoint.current ? compact ? 15 : 12 : 2, mapId: process.env.EXPO_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID", disableDefaultUI: compact, gestureHandling: compact ? "none" : "cooperative", keyboardShortcuts: !compact, mapTypeControl: false, streetViewControl: false });
      map.current = m;
      idle = m.addListener("idle", () => { const b = m.getBounds(); if (b) setBounds({ north: b.getNorthEast().lat(), east: b.getNorthEast().lng(), south: b.getSouthWest().lat(), west: b.getSouthWest().lng() }); });
      setReady(true);
    }).catch(e => { if (!disposed) setError(e.message); });
    return () => { disposed = true; idle?.remove(); pins.current.forEach(p => p.map = null); map.current = null; };
  }, [key, compact]);
  useEffect(() => {
    if (!ready || !map.current || !point) return;
    map.current.setCenter(point);
    map.current.setZoom(compact ? 15 : 12);
  }, [ready, point?.lat, point?.lng, compact]);
  useEffect(() => {
    if (!ready || !map.current) return;
    pins.current.forEach(p => p.map = null);
    pins.current = items.filter(x => x.lat != null && x.lng != null).map(x => {
      const pin = new google.maps.marker.PinElement({ background: x.id === selected ? "#d66940" : "#345c36", borderColor: "#fff9e9", glyphColor: "#fff9e9" });
      const marker = new google.maps.marker.AdvancedMarkerElement({ map: map.current, position: { lat: x.lat!, lng: x.lng! }, title: x.name, content: pin, gmpClickable: true });
      marker.addListener("click", () => onSelect(x.id));
      return marker;
    });
    return () => { pins.current.forEach(p => p.map = null); };
  }, [ready, items, selected, onSelect]);
  useEffect(() => {
    if (!ready || !map.current || compact || !devicePoint) return;
    const pin = new google.maps.marker.PinElement({ background: "#4285F4", borderColor: "white", glyphColor: "white" });
    const marker = new google.maps.marker.AdvancedMarkerElement({ map: map.current, position: devicePoint, title: "Your last requested location", content: pin });
    return () => { marker.map = null; };
  }, [ready, compact, devicePoint?.lat, devicePoint?.lng]);
  return <div style={{ position: "relative", height, width: "100%", borderRadius: compact ? 0 : 20, overflow: "hidden", background: "#213f47" }}>
    <div ref={host} aria-label="Google Maps experience map" style={{ height: "100%", width: "100%" }} />
    {(!key || error) && <div role="status" style={{ position: "absolute", top: 25, left: 18, right: 18, color: "white" }}>{error || "Map is not connected yet. You can still browse the list."}</div>}
    {!compact && ready && onSearchArea && bounds && <button style={{ ...buttonStyle, position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }} onClick={() => onSearchArea(bounds)}>Search this area</button>}
    {!compact && <button aria-label="Reset map to my location" disabled={locating} style={{ ...buttonStyle, position: "absolute", bottom: 40, left: 12 }} onClick={() => locate(p => { map.current?.setCenter(p); map.current?.setZoom(12); onResetArea?.(); onUserLocation?.(p); })}>{locating ? "Locating…" : "My location"}</button>}
    {!!locationError && <div role="alert" style={{ position: "absolute", bottom: 95, left: 12, right: 12, background: "#22382b", color: "white", padding: 12 }}>{locationError}</div>}
  </div>;
}
