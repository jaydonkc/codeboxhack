import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import WebView from "react-native-webview";
import Constants from "expo-constants";
import type { MapProps } from "./ExperienceMap";
import type { MapBounds, SearchOrigin } from "../data/catalog";
import { placesUrl } from "../services/places";
import { useDeviceLocation } from "./useDeviceLocation";
import { C, s } from "../theme";

export default function PhoneGoogleMap({items, scores, scoreLabel = "Enjoyment", selected, onSelect, origin, userLocation, onUserLocation, onResetArea, onSearchArea, height = 390, compact = false}: MapProps) {
  const web = useRef<WebView>(null);
  const [loaded, setLoaded] = useState(false), [ready, setReady] = useState(false), [error, setError] = useState("");
  const [bounds, setBounds] = useState<MapBounds>();
  const [recenter, setRecenter] = useState<SearchOrigin>();
  useEffect(() => setRecenter(undefined), [origin?.lat, origin?.lng]);
  const { locate, locating, locationError, position } = useDeviceLocation();
  const uri = useMemo(() => {
    if (process.env.EXPO_PUBLIC_MAP_EMBED_URL) return process.env.EXPO_PUBLIC_MAP_EMBED_URL;
    const host = Constants.expoConfig?.hostUri;
    if (host) return `http://${host}/phone-map.html`;
    const url = new URL(placesUrl); url.port = "8081"; url.pathname = "/phone-map.html"; return url.toString();
  }, []);
  const source = useMemo(() => ({uri, headers: { "ngrok-skip-browser-warning": "1" }}), [uri]);
  const payload = JSON.stringify({
    key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY, mapId: process.env.EXPO_PUBLIC_GOOGLE_MAP_ID,
    items: items.filter(x => x.lat != null && x.lng != null).map(x => ({id:x.id,name:x.name,lat:x.lat,lng:x.lng,score:scores?.[x.id] ?? null})),
    scoreLabel, selected, compact,
    origin: compact && items[0]?.lat != null && items[0]?.lng != null ? {lat:items[0].lat,lng:items[0].lng} : recenter ?? origin,
    userLocation: position ?? userLocation,
  });
  useEffect(() => { if (loaded) web.current?.injectJavaScript(`window.elsewhereMapUpdate(${payload});true;`); }, [loaded, payload]);
  return <View style={{height, borderRadius:compact?0:20, overflow:"hidden", backgroundColor:C.water}}>
    <WebView ref={web} source={source} style={{flex:1,backgroundColor:C.water}} scrollEnabled={false}
      onLoadStart={() => {setLoaded(false);setReady(false);setError("");}}
      onLoadEnd={() => setLoaded(true)}
      onError={() => setError("Map couldn’t connect. Check your Wi-Fi and retry.")}
      onHttpError={() => setError("Map couldn’t load. Please retry.")}
      onShouldStartLoadWithRequest={request => {
        if(request.isTopFrame === false) return true;
        if(request.url === uri || request.url === "about:blank") return true;
        if (/^https:\/\/(?:[\w-]+\.)?(?:google\.com|gstatic\.com)\//.test(request.url)) void Linking.openURL(request.url);
        return false;
      }}
      onMessage={event => {
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if(message.type === "ready") {setReady(true);setError("");}
          if(message.type === "error") setError("Map couldn’t connect. Please retry.");
          if(message.type === "select" && items.some(x=>x.id===message.id)) onSelect(message.id);
          if(message.type === "bounds" && ["north","south","east","west"].every(k=>typeof message.bounds?.[k] === "number" && Number.isFinite(message.bounds[k]))) setBounds(message.bounds);
        } catch { /* Ignore messages outside the map bridge protocol. */ }
      }}/>
    {!ready && !error && <ActivityIndicator pointerEvents="none" color={C.green} style={{position:"absolute",top:18,right:18}} />}
    {!compact && ready && onSearchArea && bounds && <Pressable accessibilityRole="button" onPress={()=>onSearchArea(bounds)} style={[s.primary,{position:"absolute",top:12,alignSelf:"center",minHeight:42}]}><Text style={s.primaryText}>Search this area</Text></Pressable>}
    {!compact && <Pressable accessibilityRole="button" disabled={locating} onPress={()=>locate(point=>{setRecenter(point);onResetArea?.();onUserLocation?.(point);})} style={[s.primary,{position:"absolute",bottom:32,left:12,minHeight:42}]}><Text style={s.primaryText}>{locating?"Locating…":"My location"}</Text></Pressable>}
    {!!(error || locationError) && <View style={{position:"absolute",top:60,left:12,right:12,padding:12,backgroundColor:C.surface}}><Text accessibilityRole="alert" style={s.muted}>{error || locationError}</Text>{!!error && <Pressable accessibilityRole="button" onPress={()=>web.current?.reload()}><Text style={s.text}>Retry map</Text></Pressable>}</View>}
  </View>;
}
