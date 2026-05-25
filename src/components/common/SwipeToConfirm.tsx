import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

const TRACK_HEIGHT = 72;
const THUMB_SIZE = 58;
const THUMB_PADDING = 7;
const THRESHOLD = 0.82;

interface Props {
  label: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "dark" | "green";
}

export function SwipeToConfirm({ label, onConfirm, loading, variant = "dark" }: Props) {
  const trackWidth = useRef(0);
  const pan = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const [confirmed, setConfirmed] = useState(false);

  const isDark = variant === "dark";
  const trackBg = isDark ? "#1A1A2E" : colors.brandGreen;
  const thumbBg = isDark ? "#FFFFFF" : "#FFFFFF";
  const iconColor = isDark ? "#1A1A2E" : colors.brandGreen;
  const labelColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.9)";
  const fillColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.25)";

  // Shimmer loop — draws attention before user swipes
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: false }),
        Animated.delay(1400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const maxDrag = () => trackWidth.current - THUMB_SIZE - THUMB_PADDING * 2;

  const labelOpacity = pan.interpolate({
    inputRange: [0, 90],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const fillWidth = pan.interpolate({
    inputRange: [0, Math.max(maxDrag(), 1)],
    outputRange: [THUMB_SIZE + THUMB_PADDING * 2, trackWidth.current || 400],
    extrapolate: "clamp",
  });

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.18, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !loading && !confirmed,
      onMoveShouldSetPanResponder: () => !loading && !confirmed,
      onPanResponderMove: (_, g) => {
        const clamped = Math.max(0, Math.min(g.dx, maxDrag()));
        pan.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        const max = maxDrag();
        if (g.dx >= max * THRESHOLD) {
          Animated.timing(pan, {
            toValue: max,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            setConfirmed(true);
            onConfirm();
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View
      style={[styles.track, { backgroundColor: trackBg }]}
      onLayout={(e) => {
        trackWidth.current = e.nativeEvent.layout.width;
      }}
    >
      {/* Fill that follows thumb */}
      <Animated.View style={[styles.fill, { width: fillWidth, backgroundColor: fillColor }]} />

      {/* Idle shimmer overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: shimmerOpacity, borderRadius: TRACK_HEIGHT / 2 }]}
        pointerEvents="none"
      />

      {/* Label */}
      <Animated.Text style={[styles.label, { opacity: labelOpacity, color: labelColor }]} numberOfLines={1}>
        {label}
      </Animated.Text>

      {/* Drag arrows hint on right */}
      <Animated.Text style={[styles.arrowHint, { opacity: labelOpacity, color: labelColor }]}>
        ›
      </Animated.Text>

      {/* Draggable thumb */}
      <Animated.View
        style={[styles.thumb, { transform: [{ translateX: pan }], backgroundColor: thumbBg }]}
        {...panResponder.panHandlers}
      >
        {loading || confirmed ? (
          <ActivityIndicator color={iconColor} size="small" />
        ) : (
          <Ionicons name="chevron-forward-outline" size={28} color={iconColor} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    borderRadius: TRACK_HEIGHT / 2,
  },
  label: {
    position: "absolute",
    left: THUMB_SIZE + THUMB_PADDING * 2 + 12,
    right: 40,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  arrowHint: {
    position: "absolute",
    right: 20,
    fontSize: 22,
    fontWeight: "300",
  },
  thumb: {
    position: "absolute",
    left: THUMB_PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
