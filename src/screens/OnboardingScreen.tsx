import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { colors } from "../theme/colors";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Your Home Services,\nSimplified",
    subtitle: "Effortlessly book trusted professionals for all your needs.",
  },
  {
    id: "2",
    title: "Book in Minutes",
    subtitle: "Pick a service, choose a time slot, and get a confirmed booking without the hassle.",
  },
  {
    id: "3",
    title: "Transparent Pricing",
    subtitle: "Know the cost upfront. No surprise fees — pay securely through the app.",
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0] != null) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const isLast = activeIndex === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      {/* Green top illustration area */}
      <View style={styles.illustrationArea}>
        {/* Worker illustration mockup */}
        <View style={styles.workersRow}>
          <View style={[styles.workerCircle, styles.workerLeft]}>
            <Text style={styles.workerEmoji}>🧹</Text>
          </View>
          <View style={[styles.workerCircle, styles.workerCenter]}>
            <Text style={styles.workerEmoji}>🔧</Text>
          </View>
          <View style={[styles.workerCircle, styles.workerRight]}>
            <Text style={styles.workerEmoji}>🔩</Text>
          </View>
        </View>
        <View style={styles.curveBottom} />
      </View>

      {/* White bottom card */}
      <View style={styles.card}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(s) => s.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          )}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Footer: Skip + Arrow */}
        <View style={styles.footer}>
          <Pressable onPress={onComplete} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <Pressable onPress={goNext} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brandGreen },
  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  workersRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 40,
  },
  workerCircle: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  workerLeft: { width: 90, height: 110, marginBottom: 8 },
  workerCenter: { width: 110, height: 130 },
  workerRight: { width: 90, height: 110, marginBottom: 8 },
  workerEmoji: { fontSize: 44 },
  curveBottom: {
    position: "absolute",
    bottom: -1,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 40,
    paddingHorizontal: 32,
    paddingBottom: 48,
    minHeight: height * 0.38,
  },
  slide: {
    width: width - 64,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  dotActive: { width: 24, backgroundColor: colors.brandGreen },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { fontSize: 15, color: "#6B7280", fontWeight: "500" },
  arrowBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: "#FFFFFF", fontSize: 28, fontWeight: "700", lineHeight: 34 },
});
