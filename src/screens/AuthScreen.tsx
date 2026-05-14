import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import {
  GoogleAuthProvider,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { env } from "../services/env";
import { firebaseAuth, firebaseConfig } from "../services/firebase";
import { colors } from "../theme/colors";

type Step = "phone" | "otp" | "email";

export function AuthScreen() {
  const [step, setStep] = useState<Step>("phone");
  const [countryCode] = useState("+94");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  WebBrowser.maybeCompleteAuthSession();

  const googleConfig = {
    expoClientId: env.googleAuth.expoClientId || undefined,
    androidClientId: env.googleAuth.androidClientId || undefined,
    webClientId: env.googleAuth.webClientId || undefined,
  };
  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);
  const isGoogleEnabled = Boolean(
    env.googleAuth.expoClientId || env.googleAuth.androidClientId || env.googleAuth.webClientId
  );

  useEffect(() => {
    const signInFromGoogle = async () => {
      if (response?.type !== "success") return;
      const idToken = response.authentication?.idToken;
      const accessToken = response.authentication?.accessToken;
      if (!idToken) { setError("Google sign-in failed: missing ID token."); return; }
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      await signInWithCredential(firebaseAuth, credential);
    };
    signInFromGoogle().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    });
  }, [response]);

  const handleContinue = async () => {
    if (step === "email") {
      await handleEmailAuth();
      return;
    }
    if (!phoneNumber.trim()) { setError("Enter your phone number."); return; }
    setError(null);
    setLoading(true);
    try {
      const full = `${countryCode}${phoneNumber.trim()}`;
      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        full,
        recaptchaRef.current as FirebaseRecaptchaVerifierModal
      );
      setVerificationId(confirmation.verificationId);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationId || !otpCode.trim()) { setError("Enter the code you received."); return; }
    setError(null);
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      await signInWithCredential(firebaseAuth, credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { setError("Enter email and password."); return; }
    setError(null);
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <FirebaseRecaptchaVerifierModal ref={recaptchaRef} firebaseConfig={firebaseConfig} />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>t</Text>
        </View>
      </View>

      <Text style={styles.title}>Get started with Taskero</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === "phone" && (
        <>
          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryBox}>
              <Text style={styles.countryFlag}>🇱🇰</Text>
              <Text style={styles.countryCode}>{countryCode}</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="768 574 082"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
          <Pressable style={[styles.primaryBtn, loading && styles.disabled]} onPress={handleContinue} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? "Sending..." : "Continue"}</Text>
          </Pressable>
        </>
      )}

      {step === "otp" && (
        <>
          <Text style={styles.label}>Enter OTP sent to {countryCode} {phoneNumber}</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="------"
            placeholderTextColor="#9CA3AF"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Pressable style={[styles.primaryBtn, loading && styles.disabled]} onPress={handleVerifyOtp} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? "Verifying..." : "Verify"}</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => { setStep("phone"); setOtpCode(""); }}>
            <Text style={styles.linkText}>← Change number</Text>
          </Pressable>
        </>
      )}

      {step === "email" && (
        <>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable style={[styles.primaryBtn, loading && styles.disabled]} onPress={handleContinue} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? "Working..." : isRegistering ? "Create account" : "Sign in"}</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => setRegistering(!isRegistering)}>
            <Text style={styles.linkText}>
              {isRegistering ? "Already have an account? Sign in" : "New here? Create account"}
            </Text>
          </Pressable>
        </>
      )}

      {step === "phone" && (
        <>
          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <Pressable
            style={[styles.socialBtn, (!request || !isGoogleEnabled) && styles.disabled]}
            onPress={() => promptAsync()}
            disabled={!request || !isGoogleEnabled}
          >
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={styles.socialBtnText}>Continue with Apple</Text>
          </Pressable>

          <Pressable
            style={[styles.socialBtn, (!request || !isGoogleEnabled) && styles.disabled]}
            onPress={() => promptAsync()}
            disabled={!request || !isGoogleEnabled}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </Pressable>

          <Pressable style={styles.socialBtn} onPress={() => setStep("email")}>
            <Text style={styles.socialIcon}>✉</Text>
            <Text style={styles.socialBtnText}>Continue with Email</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  logoContainer: { alignItems: "center", marginBottom: 28 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.brandGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 44,
    includeFontPadding: false,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  countryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
  },
  countryFlag: { fontSize: 20 },
  countryCode: { fontSize: 15, color: "#111111", fontWeight: "500" },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111111",
    backgroundColor: "#F9FAFB",
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 22,
    color: "#111111",
    backgroundColor: "#F9FAFB",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111111",
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.brandGreen,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { fontSize: 13, color: "#9CA3AF" },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  socialIcon: { fontSize: 18, fontWeight: "700", color: "#111111", width: 24, textAlign: "center" },
  socialBtnText: { fontSize: 15, fontWeight: "600", color: "#111111" },
  linkBtn: { paddingVertical: 12, alignItems: "center" },
  linkText: { color: colors.brandGreen, fontWeight: "600", fontSize: 14 },
  error: { color: "#EF4444", fontSize: 13, marginBottom: 16, textAlign: "center" },
  disabled: { opacity: 0.5 },
});
