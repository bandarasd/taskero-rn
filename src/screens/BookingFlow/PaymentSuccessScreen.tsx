import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Button } from "../../components/common/Button";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteProps = RouteProp<BookingFlowParamList, "PaymentSuccess">;

export function PaymentSuccessScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const bookingRef = route.params.taskId.slice(0, 8).toUpperCase();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const goToBookings = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "BookingsTab" }],
      })
    );
  };

  const goToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "HomeTab" }],
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="checkmark" size={50} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your tasker will review and send{"\n"}a quote shortly
          </Text>
        </View>

        <Animated.View style={[styles.receiptCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptId}>Booking #{bookingRef}</Text>
          </View>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptBody}>
            <View style={styles.receiptRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.subtext} />
              <Text style={styles.receiptValue}>Scheduled for Wed, 17 May</Text>
            </View>
            <View style={[styles.receiptRow, { marginTop: spacing.sm }]}>
              <Ionicons name="location-outline" size={18} color={colors.subtext} />
              <Text style={styles.receiptValue} numberOfLines={1}>123 Galle Road, Colombo</Text>
            </View>
            <View style={[styles.receiptRow, { marginTop: spacing.sm }]}>
              <Ionicons name="time-outline" size={18} color={colors.subtext} />
              <Text style={styles.receiptValue}>2:00 PM</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>What's next?</Text>
          <View style={styles.timeline}>
            <TimelineItem
              icon="document-text"
              title="Tasker reviews & quotes"
              description="They'll check your details and send a price."
              isFirst
            />
            <TimelineItem
              icon="card"
              title="Accept quote & pay"
              description="Securely pay through the app once you agree."
            />
            <TimelineItem
              icon="checkmark-done"
              title="Service completed"
              description="Enjoy your professional service!"
              isLast
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button label="View My Bookings" onPress={goToBookings} style={styles.primaryButton} />
          <Button label="Back to Home" onPress={goToHome} variant="ghost" style={styles.ghostButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineItem({ icon, title, description, isFirst, isLast }: any) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: isFirst ? colors.brandGreen : colors.border }]} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineRight}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineDesc}>{description}</Text>
      </View>
    </View>
  );
}

import { ScrollView } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  content: { padding: spacing.lg, alignItems: "center" },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.brandGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 32,
  },
  receiptHeader: {
    paddingBottom: spacing.sm,
  },
  receiptId: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
  },
  receiptDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    borderStyle: "dashed",
    marginVertical: spacing.sm,
  },
  receiptBody: {
    paddingTop: spacing.xs,
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  receiptValue: {
    fontSize: 15,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  timelineSection: {
    width: "100%",
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    marginLeft: spacing.lg,
    paddingBottom: spacing.lg,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  timelineDesc: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
  footer: {
    width: "100%",
    paddingBottom: 20,
  },
  primaryButton: {
    marginBottom: spacing.sm,
  },
  ghostButton: {
    alignSelf: "center",
  },
});
