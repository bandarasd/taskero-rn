import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing } from "../../theme/spacing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

const PROMOS = [
  {
    id: "1",
    title: "Summer Special",
    subtitle: "Get 20% off your first house cleaning booking",
    color: "#16A34A",
    icon: "sparkles",
  },
  {
    id: "2",
    title: "Top Rated Experts",
    subtitle: "Highly rated plumbers and electricians near you",
    color: "#1D4ED8",
    icon: "construct",
  },
  {
    id: "3",
    title: "Quick Fixes",
    subtitle: "Handyman services starting from just Rs. 49",
    color: "#EA580C",
    icon: "hammer",
  },
];

export function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= PROMOS.length) nextIndex = 0;
      
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / BANNER_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={PROMOS}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={BANNER_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.promoCard, { backgroundColor: item.color }]}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Pressable style={styles.ctaBtn}>
                <Text style={styles.ctaText}>Book Now</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={60} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        )}
      />
      <View style={styles.pagination}>
        {PROMOS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  promoCard: {
    width: BANNER_WIDTH,
    height: 160,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    overflow: "hidden",
  },
  textContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 4,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: "#16A34A",
  },
  inactiveDot: {
    width: 6,
    backgroundColor: "#E5E7EB",
  },
});
