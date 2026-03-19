import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    computeStats,
    getBookingsByDateRange,
    getBookingsByDriver,
} from "../../services/bookingService";
import useAuthStore from "../../store/authStore";
import COLORS from "../../constants/colors";

const FILTERS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "custom", label: "📅 Custom" },
];

function StatCard({ icon, value, label, color, prefix }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>
        {prefix || ""}
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, driverProfile } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState("today");
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalTrips: 0,
    totalKms: 0,
    avgDriveTimePerDay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [pickingField, setPickingField] = useState("start");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);

  const loadStats = useCallback(
    async (filter) => {
      if (!user) return;
      try {
        let bookings;
        if (filter === "custom") {
          bookings = await getBookingsByDateRange(
            user.uid,
            customStart,
            customEnd,
          );
        } else {
          bookings = await getBookingsByDriver(user.uid, filter);
        }
        setStats(computeStats(bookings));
        setRecentBookings(bookings.slice(0, 5));
      } catch (e) {
        console.error(e);
      }
    },
    [user, customStart, customEnd],
  );

  useEffect(() => {
    setLoading(true);
    loadStats(activeFilter).finally(() => setLoading(false));
  }, [activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats(activeFilter);
    setRefreshing(false);
  };

  const handleFilterPress = (id) => {
    if (id === "custom") {
      setShowCustomPicker(true);
      return;
    }
    setActiveFilter(id);
  };

  const applyCustom = () => {
    setActiveFilter("custom");
    setShowCustomPicker(false);
    loadStats("custom");
  };

  const formatAvgTime = (m) => {
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60 > 0 ? (m % 60) + "m" : ""}`;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.driverName}>
              {driverProfile?.name || "Driver"} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.availabilityBadge,
              driverProfile?.isAvailable
                ? styles.availableBadge
                : styles.unavailableBadge,
            ]}
            onPress={async () => {
              try {
                const newStatus = !driverProfile?.isAvailable;
                useAuthStore.getState().updateLocalProfile({ isAvailable: newStatus });
                await import("../../services/authService").then(m => m.toggleAvailability(user.uid, newStatus));
              } catch (e) {
                useAuthStore.getState().updateLocalProfile({ isAvailable: !driverProfile?.isAvailable });
                Toast.show({ type: "error", text1: "Failed to update status" });
              }
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: driverProfile?.isAvailable
                    ? "#22C55E"
                    : "#64748B",
                },
              ]}
            />
            <Text
              style={[
                styles.availabilityText,
                { color: driverProfile?.isAvailable ? "#22C55E" : "#64748B" },
              ]}
            >
              {driverProfile?.isAvailable ? "Available" : "Off Duty"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip,
                activeFilter === f.id && styles.filterChipActive,
              ]}
              onPress={() => handleFilterPress(f.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f.id && styles.filterTextActive,
                ]}
              >
                {f.id === "custom" && activeFilter === "custom"
                  ? `${format(customStart, "dd MMM")} – ${format(customEnd, "dd MMM")}`
                  : f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              icon="💰"
              value={stats.totalEarnings}
              label="Total Earnings"
              color="#22C55E"
              prefix="₹"
            />
            <StatCard
              icon="🚗"
              value={stats.totalTrips}
              label="Total Trips"
              color="#6C63FF"
            />
            <StatCard
              icon="📍"
              value={stats.totalKms}
              label="Kms Driven"
              color="#F59E0B"
            />
            <StatCard
              icon="⏱️"
              value={formatAvgTime(stats.avgDriveTimePerDay)}
              label="Avg Drive/Day"
              color="#3B82F6"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {recentBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛣️</Text>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySubtitle}>
                Your trips will appear here
              </Text>
            </View>
          ) : (
            recentBookings.map((b) => (
              <View key={b.id} style={styles.tripCard}>
                <View style={styles.tripRoute}>
                  <View style={styles.routeIndicator}>
                    <View
                      style={[styles.routeDot, { backgroundColor: "#22C55E" }]}
                    />
                    <View style={styles.routeLine} />
                    <View
                      style={[styles.routeDot, { backgroundColor: "#FF6B35" }]}
                    />
                  </View>
                  <View style={styles.routeText}>
                    <Text style={styles.routeFrom} numberOfLines={1}>
                      {b.fromLocation || "Pickup"}
                    </Text>
                    <Text style={styles.routeTo} numberOfLines={1}>
                      {b.toLocation || "Drop"}
                    </Text>
                  </View>
                </View>
                <View style={styles.tripMeta}>
                  <Text style={styles.tripEarnings}>₹{b.earnings || 0}</Text>
                  <Text style={styles.tripKms}>{b.distanceKm || 0} km</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showCustomPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <TouchableOpacity
              style={styles.datePickerRow}
              onPress={() => {
                setPickingField("start");
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.datePickerLabel}>Start Date</Text>
              <Text style={styles.datePickerValue}>
                {format(customStart, "dd MMM yyyy")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.datePickerRow}
              onPress={() => {
                setPickingField("end");
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.datePickerLabel}>End Date</Text>
              <Text style={styles.datePickerValue}>
                {format(customEnd, "dd MMM yyyy")}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={pickingField === "start" ? customStart : customEnd}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    pickingField === "start"
                      ? setCustomStart(date)
                      : setCustomEnd(date);
                  }
                }}
                maximumDate={new Date()}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCustomPicker(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={applyCustom}
              >
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  driverName: { fontSize: 22, fontWeight: "800", color: COLORS.text, marginTop: 2 },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availableBadge: { backgroundColor: "rgba(34,197,94,0.15)" },
  unavailableBadge: { backgroundColor: "rgba(100,116,139,0.15)" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  availabilityText: { fontSize: 12, fontWeight: "600" },
  filterRow: { marginTop: 16 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  filterTextActive: { color: COLORS.white, fontWeight: "600" },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderTopWidth: 3,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statIcon: { fontSize: 26, marginBottom: 10 },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary },
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tripRoute: { flexDirection: "row", alignItems: "center", flex: 1 },
  routeIndicator: { alignItems: "center", marginRight: 12 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  routeText: { flex: 1 },
  routeFrom: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
    marginBottom: 8,
  },
  routeTo: { fontSize: 13, color: COLORS.textSecondary },
  tripMeta: { alignItems: "flex-end", marginLeft: 12 },
  tripEarnings: { fontSize: 16, fontWeight: "700", color: "#22C55E" },
  tripKms: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 24,
  },
  datePickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  datePickerLabel: { fontSize: 15, color: COLORS.textSecondary },
  datePickerValue: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 28 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modalCancelText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "600" },
  modalApplyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  modalApplyText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});
