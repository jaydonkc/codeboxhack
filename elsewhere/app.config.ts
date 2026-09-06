import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "Elsewhere",
  slug: config.slug ?? "elsewhere",
  plugins: [...(config.plugins ?? []), ["react-native-maps", {
    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
    iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_KEY,
  }]],
  extra: { ...config.extra, googleMapsAndroidReady: !!process.env.GOOGLE_MAPS_ANDROID_KEY, googleMapsIosReady: !!process.env.GOOGLE_MAPS_IOS_KEY },
});
