import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, fonts } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Omit when the children already include a header and close button. */
  title?: string;
  style?: StyleProp<ViewStyle>;
  /** Bottom padding already provided by the children, such as sheetBody's 32. */
  contentBottomPadding?: number;
};

/** Keeps the backdrop still while the panel moves, including on dismissal. */
export default function Sheet({
  visible,
  onClose,
  children,
  title,
  style,
  contentBottomPadding = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [presented, setPresented] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const panelProgress = useRef(new Animated.Value(0)).current;
  const currentVisible = useRef(visible);
  const lastContent = useRef({ children, title });
  currentVisible.current = visible;

  // The parent may clear its sheet selection immediately. Retain its last
  // contents so a different/empty sheet does not flash during the exit animation.
  if (visible) lastContent.current = { children, title };

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => active && setReduceMotion(enabled))
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) setMounted(true);
    else Keyboard.dismiss();
  }, [visible]);

  useEffect(() => {
    // Wait for the native modal and its measured layout before animating. This
    // also makes a short menu travel its own height instead of a whole screen.
    if (!mounted || !presented || !panelHeight) return;
    const useNativeDriver = Platform.OS !== "web";
    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: reduceMotion ? 0 : 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }),
      Animated.timing(panelProgress, {
        toValue: visible ? 1 : 0,
        duration: reduceMotion ? 0 : visible ? 280 : 220,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished && !currentVisible.current) {
        setMounted(false);
        setPresented(false);
        setPanelHeight(0);
      }
    });
    return () => animation.stop();
  }, [
    mounted,
    presented,
    panelHeight,
    visible,
    reduceMotion,
    backdropOpacity,
    panelProgress,
  ]);

  const handleShow = useCallback(() => setPresented(true), []);
  const dismiss = () => {
    if (!currentVisible.current) return;
    Keyboard.dismiss();
    onClose();
  };

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onShow={handleShow}
      onRequestClose={dismiss}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
          />
        </Animated.View>
        <KeyboardAvoidingView
          pointerEvents="box-none"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.positioner, { paddingTop: insets.top + 16 }]}
        >
          <Animated.View
            accessibilityViewIsModal
            onAccessibilityEscape={dismiss}
            pointerEvents={visible ? "auto" : "none"}
            onLayout={(event) =>
              setPanelHeight(event.nativeEvent.layout.height)
            }
            style={[
              styles.panel,
              style,
              {
                paddingBottom: keyboardVisible
                  ? 0
                  : Math.max(0, insets.bottom - contentBottomPadding),
                transform: [
                  {
                    translateY: panelProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [panelHeight || height, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {lastContent.current.title !== undefined && (
              <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>
                  {lastContent.current.title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                  onPress={dismiss}
                  style={styles.close}
                >
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>
            )}
            {lastContent.current.children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#08110ecc",
  },
  positioner: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "100%",
    flexShrink: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 15,
    paddingBottom: 10,
    gap: 12,
  },
  title: {
    flex: 1,
    color: C.ink,
    fontFamily: fonts.medium,
    fontSize: 21,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: C.ink, fontSize: 30, lineHeight: 34 },
});
