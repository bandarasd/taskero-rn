import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Animated, StyleSheet, Text, View, SafeAreaView } from "react-native";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { Ionicons } from "@expo/vector-icons";

export interface BookingToastHandle {
  show: (message: string, variant?: "success" | "error" | "info") => void;
}

export const BookingToast = forwardRef<BookingToastHandle>((_, ref) => {
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "error" | "info">("info");
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    show: (msg, v = "info") => {
      setMessage(msg);
      setVariant(v);
      
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        hide();
      }, 3000);
    },
  }));

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getIcon = () => {
    switch (variant) {
      case "success": return "checkmark-circle";
      case "error": return "alert-circle";
      case "info": return "information-circle";
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case "success": return colors.success;
      case "error": return colors.danger;
      case "info": return colors.info;
    }
  };

  return (
    <SafeAreaView style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: getBgColor(), transform: [{ translateY }], opacity },
        ]}
      >
        <Ionicons name={getIcon()} size={20} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
