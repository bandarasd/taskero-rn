import React, { useCallback, useEffect, useRef, useState } from "react";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Ionicons } from "@expo/vector-icons";
import { getGigs, searchGigs } from "../services/gigService";
import { getNotifications, markNotificationRead } from "../services/notificationService";
import { getUserById } from "../services/userService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { useAuth } from "../store/authStore";
import { Gig, APINotification, ServiceCategory } from "../types";
import { env } from "../services/env";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

// Home Components
import { HeroBanner } from "../components/home/HeroBanner";
import { CategoriesRow } from "../components/home/CategoriesRow";
import { ServiceSection } from "../components/home/ServiceSection";
import { NearYouSection } from "../components/home/NearYouSection";
import { RecentlyViewedSection } from "../components/home/RecentlyViewedSection";
import { HowItWorksSection } from "../components/home/HowItWorksSection";

const LOCATION_ADDRESS_KEY = "savedLocationAddress";
const RECENTLY_VIEWED_KEY = "recently_viewed_gigs";

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Gig[]>([]);
  const [locationAddress, setLocationAddress] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const placesRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);
  const userDraggedRef = useRef(false);

  const DEFAULT_REGION: Region = { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.05, longitudeDelta: 0.05 };
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [pendingAddress, setPendingAddress] = useState("");
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!env.googlePlacesApiKey) return;
    setReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googlePlacesApiKey}`
      );
      const json = await res.json();
      const address: string = json.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setPendingAddress(address);
    } catch {
      setPendingAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setReverseGeocoding(false);
    }
  }, []);

  const goToMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const region: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(region, 600);
      setMapRegion(region);
      void reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    } catch {}
    finally { setLocating(false); }
  }, [reverseGeocode]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  const { data: profile } = useQuery({
    queryKey: ["profile", dbUserId],
    queryFn: () => getUserById(dbUserId!),
    enabled: !!dbUserId,
  });

  const firstName = profile?.first_name || "there";
  const greeting = `${getTimeGreeting()}, ${firstName} 👋`;

  useEffect(() => {
    AsyncStorage.getItem(LOCATION_ADDRESS_KEY).then((val) => {
      if (val) setLocationAddress(val);
      else setShowLocationModal(true);
    });
  }, []);

  const handleSelectLocation = async (address: string) => {
    setLocationAddress(address);
    setShowLocationModal(false);
    await AsyncStorage.setItem(LOCATION_ADDRESS_KEY, address);
    qc.invalidateQueries({ queryKey: ["gigs"] });
  };

  const { data: gigs, isLoading, refetch } = useQuery({
    queryKey: ["gigs"],
    queryFn: getGigs,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", dbUserId],
    queryFn: () => getNotifications(dbUserId!),
    enabled: !!dbUserId,
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  const handleSearch = useCallback(async (text: string) => {
    setSearch(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const results = await searchGigs(text.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const navigateToGig = async (gig: Gig) => {
    // Track recently viewed
    try {
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      let ids: string[] = stored ? JSON.parse(stored) : [];
      // Remove if already exists and add to top
      ids = ids.filter(id => id !== gig.id);
      ids.unshift(gig.id);
      // Keep last 10
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids.slice(0, 10)));
    } catch (e) {
      console.error("Failed to track recently viewed", e);
    }
    
    navigation.navigate("ServiceDetail", { gigId: gig.id });
  };

  const navigateToCategory = (category: ServiceCategory) => {
    navigation.navigate("CategoryServices", { category });
  };

  const handleReadNotification = async (n: APINotification) => {
    if (n.is_read) return;
    try {
      await markNotificationRead(n.id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch {}
  };

  if (isLoading && !gigs) return <LoadingSpinner />;

  const showSearch = search.trim().length >= 2;
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const topRated = gigs ? shuffle([...gigs].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6)) : [];
  const trending = gigs ? shuffle([...gigs].sort((a, b) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 6)) : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.locationChip} onPress={() => setShowLocationModal(true)}>
            <Ionicons name="location" size={16} color="#16A34A" />
            <Text style={styles.locationCity} numberOfLines={1} ellipsizeMode="tail">
              {locationAddress || "Select location"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </Pressable>
          <Pressable style={styles.bellBtn} onPress={() => setShowNotifications(true)}>
            <Ionicons name="notifications-outline" size={24} color="#111111" />
            {unreadCount > 0 && <View style={styles.bellBadge} />}
          </Pressable>
        </View>

        {/* Greeting Section */}
        {!showSearch && (
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle}>{greeting}</Text>
            <Text style={styles.greetingSubtitle}>What service do you need?</Text>
          </View>
        )}

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => { setSearch(""); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterBtn}>
            <Ionicons name="options-outline" size={22} color="#111111" />
          </Pressable>
        </View>

        {showSearch ? (
          <ServiceSection
            title="Search Results"
            gigs={searchResults}
            loading={searching}
            onGigPress={navigateToGig}
          />
        ) : (
          <>
            <HeroBanner />
            
            <CategoriesRow onCategoryPress={navigateToCategory} />

            <ServiceSection
              title="Top Rated"
              gigs={topRated}
              onSeeAll={() => navigation.navigate("Categories")}
              onGigPress={navigateToGig}
              emptyIcon="⭐"
            />

            <NearYouSection onGigPress={navigateToGig} />

            <ServiceSection
              title="Trending Now"
              gigs={trending}
              onSeeAll={() => navigation.navigate("Categories")}
              onGigPress={navigateToGig}
              emptyIcon="🔥"
            />

            <RecentlyViewedSection onGigPress={navigateToGig} />

            <HowItWorksSection />
          </>
        )}
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationModal(false)}
        onShow={() => { userDraggedRef.current = false; setPendingAddress(""); }}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowLocationModal(false)} />
          <KeyboardAvoidingView
            style={styles.modalSheet}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Pressable style={styles.sheetCloseBtn} onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={20} color="#374151" />
                </Pressable>
                <Text style={styles.sheetTitle}>Set Location</Text>
                <View style={{ width: 36 }} />
              </View>

              <View style={styles.mapSearchWrap}>
                <GooglePlacesAutocomplete
                  ref={placesRef}
                  placeholder="Search for an address"
                  onPress={async (data) => {
                    const address = data.description ?? data.structured_formatting?.main_text ?? "";
                    setPendingAddress(address);
                    if (env.googlePlacesApiKey) {
                      try {
                        const res = await fetch(
                          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${env.googlePlacesApiKey}`
                        );
                        const json = await res.json();
                        const loc = json.results?.[0]?.geometry?.location;
                        if (loc) {
                          const newRegion = { latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
                          setMapRegion(newRegion);
                          mapRef.current?.animateToRegion(newRegion, 600);
                        }
                      } catch {}
                    }
                  }}
                  query={{ key: env.googlePlacesApiKey, language: "en" }}
                  fetchDetails={false}
                  enablePoweredByContainer={false}
                  minLength={2}
                  listLoaderComponent={
                    <View style={styles.placesLoader}>
                      <ActivityIndicator size="small" color={colors.brandGreen} />
                    </View>
                  }
                  renderRow={(data) => (
                    <View style={styles.placeRow} pointerEvents="none">
                      <View style={styles.placeIconWrap}>
                        <Ionicons name="location" size={18} color={colors.brandGreen} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.placeMain} numberOfLines={1}>
                          {data.structured_formatting?.main_text ?? data.description}
                        </Text>
                        <Text style={styles.placeSub} numberOfLines={1}>
                          {data.structured_formatting?.secondary_text ?? ""}
                        </Text>
                      </View>
                    </View>
                  )}
                  styles={{
                    container: styles.placesContainer,
                    textInputContainer: styles.placesInputContainer,
                    textInput: styles.placesInput,
                    listView: styles.placesListView,
                    separator: styles.placesSeparator,
                    row: { backgroundColor: "#FFFFFF", padding: 0 },
                    description: { color: "#111111" },
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <MapView
                  ref={mapRef}
                  style={StyleSheet.absoluteFillObject}
                  region={mapRegion}
                  onPanDrag={() => { userDraggedRef.current = true; }}
                  onRegionChangeComplete={(region) => {
                    setMapRegion(region);
                    if (!userDraggedRef.current) return;
                    userDraggedRef.current = false;
                    void reverseGeocode(region.latitude, region.longitude);
                  }}
                />

                <View style={styles.fixedPinWrap} pointerEvents="none">
                  <Ionicons name="location" size={44} color={colors.brandGreen} style={{ marginBottom: -4 }} />
                  <View style={styles.fixedPinShadow} />
                </View>

                <Pressable style={styles.myLocationBtn} onPress={goToMyLocation}>
                  {locating
                    ? <ActivityIndicator size="small" color={colors.brandGreen} />
                    : <Ionicons name="navigate" size={22} color={colors.brandGreen} />}
                </Pressable>
              </View>

              <View style={styles.mapConfirmBar}>
                <View style={{ flex: 1 }}>
                  {reverseGeocoding ? (
                    <ActivityIndicator size="small" color={colors.brandGreen} />
                  ) : (
                    <Text style={styles.mapConfirmAddress} numberOfLines={2}>
                      {pendingAddress || "Move the map to pick a location"}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={[styles.mapConfirmBtn, !pendingAddress && styles.mapConfirmBtnDisabled]}
                  onPress={() => pendingAddress && void handleSelectLocation(pendingAddress)}
                >
                  <Text style={styles.mapConfirmBtnText}>Confirm</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowNotifications(false)} />
          <View style={[styles.modalSheet, { height: "70%" }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { textAlign: "left" }]}>Notifications</Text>
              <Pressable 
                onPress={() => {
                  setShowNotifications(false);
                  navigation.navigate("ClientNotifications");
                }}
              >
                <Text style={styles.seeAllNotifications}>See all</Text>
              </Pressable>
            </View>
            
            <FlatList
              data={notifications}
              keyExtractor={(n) => n.id}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <View style={{ marginTop: 60 }}>
                  <EmptyState icon="🔔" title="No notifications yet" />
                </View>
              }
              renderItem={({ item: n }) => (
                <Pressable
                  onPress={() => handleReadNotification(n)}
                  style={[styles.notificationItem, !n.is_read && styles.notificationUnread]}
                >
                  <View style={[styles.notifIconWrap, n.is_read ? styles.notifIconRead : styles.notifIconUnread]}>
                    <Ionicons
                      name={n.is_read ? "notifications-outline" : "notifications"}
                      size={20}
                      color={n.is_read ? "#9CA3AF" : colors.brandGreen}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text style={[styles.notifTitle, !n.is_read && styles.notifTitleUnread]} numberOfLines={1}>{n.title}</Text>
                      <Text style={styles.notifTime}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}</Text>
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                  </View>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.notifDivider} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 32 },

  // Header
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === "ios" ? 56 : StatusBar.currentHeight ?? 24,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    maxWidth: "60%",
  },
  locationCity: { flex: 1, fontSize: 14, fontWeight: "700", color: "#111111" },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  // Greeting
  greetingBlock: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111111",
  },
  greetingSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#111111", fontWeight: "500" },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "88%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  // Map
  mapSearchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 100,
  },
  placesContainer: { flex: 0 },
  placesInputContainer: { backgroundColor: "transparent", borderTopWidth: 0, borderBottomWidth: 0 },
  placesInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    fontSize: 15,
    paddingLeft: 12,
  },
  placesListView: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  },
  placesSeparator: { height: 1, backgroundColor: "#F3F4F6" },
  placeRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  placeIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" },
  placeMain: { fontSize: 15, color: "#111111", fontWeight: "600" },
  placeSub: { fontSize: 13, color: "#6B7280" },
  placesLoader: { padding: 12, alignItems: "center" },

  fixedPinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -40,
    marginLeft: -22,
    alignItems: "center",
    justifyContent: "center",
  },
  fixedPinShadow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: 2,
  },
  myLocationBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  mapConfirmBar: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  mapConfirmAddress: { fontSize: 14, color: "#374151", fontWeight: "500", lineHeight: 20 },
  mapConfirmBtn: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  mapConfirmBtnDisabled: { backgroundColor: "#9CA3AF" },
  mapConfirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  // Notifications
  seeAllNotifications: { fontSize: 14, color: colors.brandGreen, fontWeight: "600" },
  notificationItem: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  notificationUnread: { backgroundColor: "#F0FDF4" },
  notifIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  notifIconUnread: { backgroundColor: "#DCFCE7" },
  notifIconRead: { backgroundColor: "#F3F4F6" },
  notifTitle: { fontSize: 15, color: "#374151", fontWeight: "500" },
  notifTitleUnread: { color: "#111111", fontWeight: "700" },
  notifTime: { fontSize: 12, color: "#9CA3AF" },
  notifBody: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginTop: 2 },
  notifDivider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 20 },
});
