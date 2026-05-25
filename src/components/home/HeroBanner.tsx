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
import { usePromos } from "../../hooks/usePromos";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

export function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { data: promos = [] } = usePromos();

  useEffect(() => {
    if (!promos.length) return;
    const timer = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= promos.length) nextIndex = 0;
      
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex, promos.length]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / BANNER_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  if (!promos.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={promos}
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
          <View style={[styles.promoCard, { backgroundColor: item.body.color }]}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.body.subtitle}</Text>
              <Pressable style={styles.ctaBtn}>
                <Text style={styles.ctaText}>Book Now</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name={item.body.icon as any} size={60} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        )}
      />
      <View style={styles.pagination}>
        {promos.map((_, i) => (
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
