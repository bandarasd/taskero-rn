import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { getGigs, searchGigs } from "../services/gigService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { SERVICE_CATEGORIES, ServiceCategory, Gig } from "../types";
import { env } from "../services/env";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

const LOCATION_ADDRESS_KEY = "savedLocationAddress";
const LOCATION_LAT_KEY = "savedLocationLatitude";
const LOCATION_LNG_KEY = "savedLocationLongitude";

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

// Category display config
const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; bg: string }> = {
  Carpentry:    { label: "Carpenter",    emoji: "🪵", bg: "#FFF3E0" },
  Cleaning:     { label: "Cleaner",      emoji: "🧹", bg: "#E3F2FD" },
  Painting:     { label: "Painter",      emoji: "🎨", bg: "#FCE4EC" },
  Electrician:  { label: "Electrician",  emoji: "⚡", bg: "#F3E5F5" },
  Moving:       { label: "Mover",        emoji: "🚛", bg: "#FFF8E1" },
  Repairing:    { label: "AC Repair",    emoji: "❄️", bg: "#E1F5FE" },
  Plumbing:     { label: "Plumber",      emoji: "🔧", bg: "#FFEBEE" },
  Gardening:    { label: "Gardener",     emoji: "🌱", bg: "#E8F5E9" },
  Laundry:      { label: "Laundry",      emoji: "👕", bg: "#EDE7F6" },
  Assembly:     { label: "Assembly",     emoji: "🔩", bg: "#E0F7FA" },
  General:      { label: "General",      emoji: "🛠️", bg: "#F1F8E9" },
};

const DISPLAY_CATEGORIES: ServiceCategory[] = [
  "Carpentry", "Cleaning", "Painting", "Electrician",
  "Moving", "Repairing", "Plumbing", "Gardening",
];

function CategoryIcon({ category }: { category: ServiceCategory }) {
  const cfg = CATEGORY_CONFIG[category] ?? { label: category, emoji: "🛠️", bg: "#F3F4F6" };
  return (
    <Pressable style={styles.categoryItem}>
      <View style={[styles.categoryIconBg, { backgroundColor: cfg.bg }]}>
        <Text style={styles.categoryEmoji}>{cfg.emoji}</Text>
      </View>
      <Text style={styles.categoryLabel}>{cfg.label}</Text>
    </Pressable>
  );
}

function ServiceCard({ gig, onPress }: { gig: Gig; onPress: () => void }) {
  const workerName = gig.tasker
    ? `${gig.tasker.first_name ?? ""} ${gig.tasker.last_name ?? ""}`.trim()
    : "Service Provider";
  const image = gig.attachments?.[0];
  const price = gig.base_price ?? 0;
  const originalPrice = Math.round(price * 1.2);

  return (
    <Pressable style={styles.serviceCard} onPress={onPress}>
      {image ? (
        <Image source={{ uri: image }} style={styles.serviceImage} />
      ) : (
        <View style={[styles.serviceImage, styles.serviceImagePlaceholder]}>
          <Text style={{ fontSize: 36 }}>🏠</Text>
        </View>
      )}
      <View style={styles.serviceBody}>
        {/* Stars */}
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map((s) => (
            <Text key={s} style={[styles.star, s <= Math.round(gig.rating ?? 4) ? styles.starFilled : styles.starEmpty]}>★</Text>
          ))}
          <Text style={styles.reviewCount}> ({gig.review_count ?? 0} Reviews)</Text>
        </View>
        <Text style={styles.serviceTitle} numberOfLines={2}>{gig.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.servicePrice}>${price}</Text>
          <Text style={styles.originalPrice}> ${originalPrice}</Text>
        </View>
        <View style={styles.providerRow}>
          <View style={styles.providerAvatar}>
            <Text style={{ fontSize: 14 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.providerName} numberOfLines={1}>{workerName}</Text>
            <Text style={styles.providerRole}>Service Provider</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={onPress}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Gig[]>([]);
  const [locationAddress, setLocationAddress] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const placesRef = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem(LOCATION_ADDRESS_KEY).then((val) => {
      if (val) setLocationAddress(val);
      else setShowLocationModal(true);
    });
  }, []);

  const handleSelectLocation = async (address: string, lat?: number, lng?: number) => {
    setLocationAddress(address);
    setShowLocationModal(false);
    await AsyncStorage.setItem(LOCATION_ADDRESS_KEY, address);
    if (lat != null) await AsyncStorage.setItem(LOCATION_LAT_KEY, String(lat));
    if (lng != null) await AsyncStorage.setItem(LOCATION_LNG_KEY, String(lng));
  };

  const { data: gigs, isLoading, refetch } = useQuery({
    queryKey: ["gigs"],
    queryFn: getGigs,
  });

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

  const navigateToGig = (gig: Gig) => {
    navigation.navigate("ServiceDetail", { gigId: gig.id });
  };

  const navigateToCategory = (category: ServiceCategory) => {
    navigation.navigate("CategoryServices", { category });
  };

  if (isLoading) return <LoadingSpinner />;

  const showSearch = search.trim().length >= 2;
  const bestServices = gigs?.slice(0, 6) ?? [];
  const kitchenServices = gigs?.filter(g => g.category === "Cleaning").slice(0, 6) ?? gigs?.slice(0, 6) ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationBlock}>
          <Text style={styles.locationLabel}>Location</Text>
          <Pressable style={styles.locationRow} onPress={() => setShowLocationModal(true)}>
            <Text style={styles.locationCity} numberOfLines={1}>
              {locationAddress || "Select location"}
            </Text>
            <Text style={styles.locationChevron}> ▾</Text>
          </Pressable>
        </View>
        <Pressable style={styles.bellBtn} onPress={() => navigation.navigate("ClientNotifications")}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowLocationModal(false)} />
          <KeyboardAvoidingView
            style={styles.modalSheet}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* Handle bar */}
              <View style={styles.sheetHandle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <Pressable style={styles.sheetCloseBtn} onPress={() => setShowLocationModal(false)}>
                  <Text style={styles.sheetCloseIcon}>✕</Text>
                </Pressable>
                <Text style={styles.sheetTitle}>Addresses</Text>
                <View style={{ width: 36 }} />
              </View>

              {/* GooglePlacesAutocomplete must not be inside a clipping container */}
              <GooglePlacesAutocomplete
                ref={placesRef}
                placeholder="Search for an address"
                onPress={(data, details) => {
                  const address = data.description;
                  const lat = details?.geometry?.location?.lat;
                  const lng = details?.geometry?.location?.lng;
                  handleSelectLocation(address, lat, lng);
                }}
                query={{ key: env.googlePlacesApiKey, language: "en" }}
                fetchDetails
                enablePoweredByContainer={false}
                minLength={2}
                renderRow={(data) => (
                  <View style={styles.placeRow}>
                    <View style={styles.placeIconWrap}>
                      <Text style={styles.placeIcon}>📍</Text>
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
                }}
              />
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
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
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⊟</Text>
        </Pressable>
      </View>

      {showSearch ? (
        /* Search results */
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searching ? (
            <LoadingSpinner style={{ height: 100 }} size="small" />
          ) : searchResults.length === 0 ? (
            <EmptyState icon="🔍" title="No results found" message="Try a different search term" style={{ height: 120 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(g) => g.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <ServiceCard gig={item} onPress={() => navigateToGig(item)} />
              )}
            />
          )}
        </View>
      ) : (
        <>
          {/* All Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Categories</Text>
              <Pressable onPress={() => navigation.navigate("Categories")}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            <View style={styles.categoryGrid}>
              {DISPLAY_CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat] ?? { label: cat, emoji: "🛠️", bg: "#F3F4F6" };
                return (
                  <Pressable key={cat} style={styles.categoryItem} onPress={() => navigateToCategory(cat)}>
                    <View style={[styles.categoryIconBg, { backgroundColor: cfg.bg }]}>
                      <Text style={styles.categoryEmoji}>{cfg.emoji}</Text>
                    </View>
                    <Text style={styles.categoryLabel}>{cfg.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Best Services */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Best Services</Text>
              <Pressable onPress={() => navigation.navigate("Categories")}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            {bestServices.length === 0 ? (
              <EmptyState icon="⭐" title="No services yet" style={{ height: 120 }} />
            ) : (
              <FlatList
                data={bestServices}
                keyExtractor={(g) => g.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <ServiceCard gig={item} onPress={() => navigateToGig(item)} />
                )}
                contentContainerStyle={{ paddingRight: spacing.lg }}
              />
            )}
          </View>

          {/* Kitchen Cleaning */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kitchen Cleaning</Text>
              <Pressable onPress={() => navigateToCategory("Cleaning")}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            {kitchenServices.length === 0 ? (
              <EmptyState icon="🧹" title="No services yet" style={{ height: 120 }} />
            ) : (
              <FlatList
                data={kitchenServices}
                keyExtractor={(g) => `kitchen-${g.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <ServiceCard gig={item} onPress={() => navigateToGig(item)} />
                )}
                contentContainerStyle={{ paddingRight: spacing.lg }}
              />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 32 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 16,
  },
  locationBlock: {},
  locationLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 2 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationCity: { fontSize: 16, fontWeight: "700", color: "#111111", maxWidth: 220 },
  locationChevron: { fontSize: 14, color: "#111111", fontWeight: "700" },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon: { fontSize: 22 },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: 10,
    marginBottom: 24,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: "#111111" },
  clearIcon: { fontSize: 14, color: "#9CA3AF" },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.brandGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  filterIcon: { fontSize: 20, color: "#FFFFFF" },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  seeAll: { fontSize: 13, color: colors.brandGreen, fontWeight: "600" },

  // Categories
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: 0,
    rowGap: 16,
  },
  categoryItem: {
    width: "25%",
    alignItems: "center",
  },
  categoryIconBg: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryEmoji: { fontSize: 28 },
  categoryLabel: { fontSize: 11, color: "#374151", textAlign: "center", fontWeight: "500" },

  // Service Card
  serviceCard: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginLeft: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  serviceImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
  },
  serviceImagePlaceholder: {
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceBody: { padding: 12 },
  starsRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  star: { fontSize: 12 },
  starFilled: { color: "#F59E0B" },
  starEmpty: { color: "#D1D5DB" },
  reviewCount: { fontSize: 11, color: "#6B7280", marginLeft: 2 },
  serviceTitle: { fontSize: 14, fontWeight: "700", color: "#111111", marginBottom: 4, lineHeight: 18 },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  servicePrice: { fontSize: 16, fontWeight: "700", color: colors.brandGreen },
  originalPrice: { fontSize: 13, color: "#9CA3AF", textDecorationLine: "line-through" },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  providerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: { fontSize: 11, fontWeight: "600", color: "#374151" },
  providerRole: { fontSize: 10, color: "#9CA3AF" },
  addBtn: {
    backgroundColor: colors.brandGreen,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  // Location Modal — Uber Eats style bottom sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    height: "85%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // NO overflow:hidden — it clips the autocomplete dropdown
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
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
  sheetCloseIcon: { fontSize: 14, color: "#374151", fontWeight: "700" },
  sheetTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#111111" },

  // GooglePlacesAutocomplete styles
  placesContainer: {
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  placesInputContainer: {
    backgroundColor: "#F7F8FA",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 4,
  },
  placesInput: {
    fontSize: 15,
    color: "#111111",
    backgroundColor: "transparent",
    height: 48,
  },
  placesListView: {
    backgroundColor: "#FFFFFF",
    marginTop: 4,
  },
  placesSeparator: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: spacing.lg },

  // Custom result row
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  placeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  placeIcon: { fontSize: 17 },
  placeMain: { fontSize: 14, fontWeight: "600", color: "#111111", marginBottom: 2 },
  placeSub: { fontSize: 12, color: "#9CA3AF" },
});
