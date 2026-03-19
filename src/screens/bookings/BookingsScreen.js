import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";
import { getBookingsByDriver } from "../../services/bookingService";
import useAuthStore from "../../store/authStore";

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.12)",
  },
  upcoming: {
    label: "Upcoming",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
  },
  in_progress: {
    label: "In Progress",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
  },
};

const VEHICLE_ICONS = { car: "🚗", bike: "🛵", auto: "🛺" };

function BookingCard({ booking, onPress }) {
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.completed;
  const icon = VEHICLE_ICONS[booking.vehicleType] || "🚗";
  const date = booking.createdAt?.toDate
    ? booking.createdAt.toDate()
    : new Date(booking.createdAt || Date.now());
  return (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => onPress(booking)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.bookingIdRow}>
          <Text style={styles.vehicleIcon}>{icon}</Text>
          <Text style={styles.bookingId}>
            #{booking.id?.slice(-6).toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>
      <View style={styles.routeContainer}>
        <View style={styles.routeLeft}>
          <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
          <View style={styles.routeConnector} />
          <View style={[styles.dot, { backgroundColor: "#FF6B35" }]} />
        </View>
        <View style={styles.routeRight}>
          <Text style={styles.routeFrom} numberOfLines={1}>
            {booking.fromLocation || "Pickup"}
          </Text>
          <Text style={styles.routeTo} numberOfLines={1}>
            {booking.toLocation || "Drop"}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Earnings</Text>
          <Text style={[styles.footerValue, { color: "#22C55E" }]}>
            ₹{booking.earnings || 0}
          </Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Distance</Text>
          <Text style={styles.footerValue}>{booking.distanceKm || 0} km</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Date</Text>
          <Text style={styles.footerValue}>{format(date, "dd MMM")}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const TABS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function BookingsScreen({ navigation }) {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const loadBookings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getBookingsByDriver(user.uid, "all");
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    loadBookings().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const filtered =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={(b) =>
                navigation.navigate("BookingDetail", { bookingId: b.id })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "all" ? "No trips yet" : `No ${activeTab} trips`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  tabTextActive: { color: COLORS.white, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  bookingIdRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  vehicleIcon: { fontSize: 22 },
  bookingId: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "700" },
  routeContainer: { flexDirection: "row", marginBottom: 14 },
  routeLeft: { alignItems: "center", width: 20, marginRight: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeConnector: {
    width: 1.5,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 3,
  },
  routeRight: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  routeFrom: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
    marginBottom: 10,
  },
  routeTo: { fontSize: 14, color: COLORS.textSecondary },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  footerItem: { flex: 1 },
  footerLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 3 },
  footerValue: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  footerDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  arrow: { color: COLORS.primary, fontSize: 18, fontWeight: "700", marginLeft: 8 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary },
});
