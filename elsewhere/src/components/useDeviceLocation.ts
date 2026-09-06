import { useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import type { SearchOrigin } from "../data/catalog";

export function useDeviceLocation() {
  const busy = useRef(false);
  const [position, setPosition] = useState<SearchOrigin>();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  async function locate(onLocated: (point: SearchOrigin) => void) {
    if (busy.current) return false;
    busy.current = true;
    setLocating(true);
    setLocationError("");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && !window.isSecureContext)
        throw new Error("Open Elsewhere over HTTPS to use your phone’s location, or use Expo Go.");
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error("Location access is off. Enable it in your device or browser settings, or choose a city.");
      const point = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error("Location took too long. Try again or choose a city.")), 20000);
        }),
      ]);
      const current = { lat: point.coords.latitude, lng: point.coords.longitude };
      setPosition(current);
      onLocated(current);
      return true;
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Couldn’t get your location. Try again or choose a city.");
      return false;
    } finally {
      busy.current = false;
      if (timeout) clearTimeout(timeout);
      setLocating(false);
    }
  }
  async function locateIfPermitted(onLocated: (point: SearchOrigin) => void) {
    try { if ((await Location.getForegroundPermissionsAsync()).granted) { return await locate(onLocated); } }
    catch { /* The city picker remains available when permission cannot be checked. */ }
    return false;
  }
  return { locate, locateIfPermitted, locating, locationError, position };
}
