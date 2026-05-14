import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Button } from "../../components/common/Button";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";

type RouteProps = RouteProp<BookingFlowParamList, "PaymentSuccess">;

export function PaymentSuccessScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const bookingRef = route.params.taskId.slice(0, 8).toUpperCase();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
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

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Animated checkmark circle */}
        <Animated.View style={[styles.checkCircleOuter, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.checkCircleInner}>
            <Animated.Text style={[styles.checkmark, { opacity: checkAnim }]}>✓</Animated.Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.sub}>
            Your booking request has been sent. You'll receive a notification once the worker accepts.
          </Text>

          {/* Booking ID badge */}
          <View style={styles.refCard}>
            <Text style={styles.refLabel}>Booking Reference</Text>
            <Text style={styles.ref}>{bookingRef}</Text>
            <Text style={styles.refHint}>Keep this for your records</Text>
          </View>

          {/* What's next */}
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>What happens next?</Text>
            {[
              { icon: "🔔", text: "Worker reviews and accepts your booking" },
              { icon: "💬", text: "Chat with them to confirm any details" },
              { icon: "✅", text: "Service is completed and you pay" },
            ].map((item, i) => (
              <View key={i} style={styles.nextRow}>
                <Text style={styles.nextIcon}>{item.icon}</Text>
                <Text style={styles.nextText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Button label="View My Bookings" onPress={goToBookings} style={styles.cta} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },

  checkCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brandGreenLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    borderWidth: 3,
    borderColor: colors.brandGreen + "40",
  },
  checkCircleInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.brandGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 38,
    color: "#fff",
    fontWeight: "700",
    lineHeight: 44,
  },

  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 10, textAlign: "center" },
  sub: { fontSize: 15, color: colors.subtext, textAlign: "center", lineHeight: 23, marginBottom: 28, paddingHorizontal: 8 },

  refCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  refLabel: { fontSize: 11, color: colors.subtext, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  ref: { fontSize: 28, fontWeight: "800", color: colors.brandGreen, letterSpacing: 3, marginBottom: 4 },
  refHint: { fontSize: 11, color: colors.placeholder },

  nextCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    width: "100%",
    marginBottom: 24,
  },
  nextTitle: { fontSize: 13, fontWeight: "700", color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 14 },
  nextRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  nextIcon: { fontSize: 18, width: 26, textAlign: "center" },
  nextText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },

  cta: { width: "100%" },
});
