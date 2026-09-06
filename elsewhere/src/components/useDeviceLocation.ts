import { useCallback, useState } from "react";
import * as Location from "expo-location";
import type { SearchOrigin } from "../data/catalog";

export function useDeviceLocation() {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const requestPermission = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(permission.granted);
      if (!permission.granted)
        throw new Error("Location access is off. Enable it in your device or browser settings, or choose a city.");
      setLocationError("");
      return true;
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Couldn’t access your location. Try again in Settings.");
      return false;
    }
  }, []);
  async function locate(onLocated: (point: SearchOrigin) => void) {
    if (locating) return;
    setLocating(true);
    setLocationError("");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!await requestPermission()) return;
      const point = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error("Location took too long. Try again or choose a city.")), 20000);
        }),
      ]);
      onLocated({ lat: point.coords.latitude, lng: point.coords.longitude });
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Couldn’t get your location. Try again or choose a city.");
    } finally {
      if (timeout) clearTimeout(timeout);
      setLocating(false);
    }
  }
  return { locate, locating, locationError, hasLocationPermission, requestPermission };
}
