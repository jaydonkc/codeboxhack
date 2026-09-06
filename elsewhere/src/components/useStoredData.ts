import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createFreshState, createStateWriter, parseStoredState, STORAGE_KEY } from "../core/storage";

export function useStoredData() {
  const [data, setData] = useState(createFreshState);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const write = useRef(createStateWriter((key, value) => AsyncStorage.setItem(key, value))).current;

  useEffect(() => {
    let active = true;
    setLoadError(false);
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const restored = parseStoredState(raw);
        if (active) {
          setData(restored);
          setLoaded(true);
        }
      })
      .catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [loadAttempt]);

  useEffect(() => {
    // A failed read never enables writes, protecting the existing on-device data.
    if (!loaded) return;
    let current = true;
    write(data).then(
      () => { if (current) setSaveError(false); },
      () => { if (current) setSaveError(true); },
    );
    return () => { current = false; };
  }, [data, loaded, saveAttempt, write]);

  return {
    data, setData, loaded, loadError, saveError,
    retryLoad: () => setLoadAttempt((value) => value + 1),
    retrySave: () => setSaveAttempt((value) => value + 1),
  };
}
