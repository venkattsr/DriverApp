import { format } from "date-fns";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import COLORS from "../../constants/colors";
import { getBookingById } from "../../services/bookingService";
import useAuthStore from "../../store/authStore";

const STATUS_CONFIG = {
  completed: { label: "Completed", color: "#22C55E" },
  upcoming: { label: "Upcoming", color: "#3B82F6" },
  in_progress: { label: "In Progress", color: "#F59E0B" },
  cancelled: { label: "Cancelled", color: "#EF4444" },
};

function DetailRow({ label, value, valueColor }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function BookingDetailScreen({ route }) {
  const { bookingId } = route.params;
  const { driverProfile } = useAuthStore();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    getBookingById(bookingId)
      .then(setBooking)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookingId]);

  const generateInvoiceHTML = () => {
    const date = booking.createdAt?.toDate
      ? booking.createdAt.toDate()
      : new Date(booking.createdAt || Date.now());
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:#f9f9f9;padding:40px;}
      .invoice{background:white;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);}
      .header{background:linear-gradient(135deg,#6C63FF,#5A52D5);padding:40px;color:white;}
      .header h1{font-size:28px;font-weight:800;}
      .header p{opacity:0.8;font-size:14px;}
      .meta{display:flex;justify-content:space-between;padding:24px 40px;border-bottom:1px solid #eee;}
      .meta-item label{font-size:11px;color:#999;text-transform:uppercase;}
      .meta-item p{font-size:14px;color:#333;font-weight:600;margin-top:4px;}
      .section{padding:24px 40px;border-bottom:1px solid #eee;}
      .section-title{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#999;margin-bottom:16px;}
      .route{display:flex;gap:16px;}
      .dots{display:flex;flex-direction:column;align-items:center;padding-top:4px;}
      .dot{width:12px;height:12px;border-radius:50%;}
      .dot-g{background:#22C55E;}.dot-o{background:#FF6B35;}
      .line{width:2px;height:30px;background:#ddd;margin:4px 0;}
      .route-text{flex:1;}
      .from{font-size:15px;color:#333;font-weight:500;margin-bottom:20px;}
      .to{font-size:15px;color:#666;}
      .stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;padding:24px 40px;border-bottom:1px solid #eee;}
      .stat{text-align:center;}
      .stat label{font-size:11px;color:#999;text-transform:uppercase;}
      .stat p{font-size:20px;font-weight:700;color:#333;margin-top:6px;}
      .earnings{padding:24px 40px;background:#f0fdf4;}
      .row{display:flex;justify-content:space-between;margin-bottom:8px;}
      .row.total{margin-top:12px;padding-top:12px;border-top:2px solid #d1fae5;}
      .total-label{font-size:16px;font-weight:700;color:#333;}
      .total-value{font-size:22px;font-weight:800;color:#22C55E;}
      .footer{padding:24px 40px;text-align:center;background:#f9f9f9;}
      .footer p{font-size:12px;color:#999;}
    </style></head><body><div class="invoice">
      <div class="header"><h1>🚗 Trip Invoice</h1><p>Driver App — Official Receipt</p></div>
      <div class="meta">
        <div class="meta-item"><label>Invoice No.</label><p>#${booking.id?.slice(-8).toUpperCase()}</p></div>
        <div class="meta-item"><label>Date</label><p>${format(date, "dd MMM yyyy")}</p></div>
        <div class="meta-item"><label>Time</label><p>${format(date, "hh:mm a")}</p></div>
        <div class="meta-item"><label>Status</label><p style="color:#22C55E;text-transform:capitalize;">${booking.status || "completed"}</p></div>
      </div>
      <div class="section"><div class="section-title">Driver</div>
        <p style="font-size:15px;font-weight:600;color:#333;">${driverProfile?.name || "Driver"}</p>
        <p style="font-size:13px;color:#666;">+91 ${driverProfile?.phone || ""}</p>
      </div>
      <div class="section"><div class="section-title">Trip Route</div>
        <div class="route">
          <div class="dots"><div class="dot dot-g"></div><div class="line"></div><div class="dot dot-o"></div></div>
          <div class="route-text"><div class="from">${booking.fromLocation || "Pickup"}</div><div class="to">${booking.toLocation || "Drop"}</div></div>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><label>Distance</label><p>${booking.distanceKm || 0} km</p></div>
        <div class="stat"><label>Duration</label><p>${booking.durationMinutes || 0} min</p></div>
        <div class="stat"><label>Vehicle</label><p style="font-size:14px;text-transform:capitalize;">${booking.vehicleType || "Car"}</p></div>
      </div>
      <div class="earnings"><div class="section-title">Earnings</div>
        <div class="row"><span>Base Fare</span><span>₹${booking.baseFare || booking.earnings || 0}</span></div>
        <div class="row total"><span class="total-label">Total Earned</span><span class="total-value">₹${booking.earnings || 0}</span></div>
      </div>
      <div class="footer"><p>Thank you for driving with Driver App!</p></div>
    </div></body></html>`;
  };

  const handleDownloadInvoice = async () => {
    setGeneratingPDF(true);
    try {
      const { uri } = await Print.printToFileAsync({
        html: generateInvoiceHTML(),
      });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Invoice_${booking.id?.slice(-6)}`,
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to generate invoice" });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!booking)
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: COLORS.textSecondary }}>Booking not found</Text>
      </View>
    );

  const date = booking.createdAt?.toDate
    ? booking.createdAt.toDate()
    : new Date(booking.createdAt || Date.now());
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.completed;
  const vehicleIcon =
    booking.vehicleType === "bike"
      ? "🛵"
      : booking.vehicleType === "auto"
        ? "🛺"
        : "🚗";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[styles.statusBanner, { borderLeftColor: statusConfig.color }]}
        >
          <Text style={styles.statusBannerText}>
            {vehicleIcon} Trip {statusConfig.label}
          </Text>
          <Text
            style={[styles.statusBannerStatus, { color: statusConfig.color }]}
          >
            {statusConfig.label}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routeLeft}>
              <View style={[styles.routeDot, { backgroundColor: "#22C55E" }]} />
              <View style={styles.routeConnector} />
              <View style={[styles.routeDot, { backgroundColor: "#FF6B35" }]} />
            </View>
            <View style={styles.routeRight}>
              <View style={styles.routeLocation}>
                <Text style={styles.routeLocationLabel}>FROM</Text>
                <Text style={styles.routeLocationText}>
                  {booking.fromLocation || "Pickup"}
                </Text>
              </View>
              <View style={styles.routeLocation}>
                <Text style={styles.routeLocationLabel}>TO</Text>
                <Text style={styles.routeLocationText}>
                  {booking.toLocation || "Drop"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>
          <DetailRow
            label="Booking ID"
            value={`#${booking.id?.slice(-8).toUpperCase()}`}
          />
          <DetailRow label="Date" value={format(date, "dd MMM yyyy")} />
          <DetailRow label="Time" value={format(date, "hh:mm a")} />
          <DetailRow label="Vehicle" value={booking.vehicleType || "Car"} />
          <DetailRow label="Distance" value={`${booking.distanceKm || 0} km`} />
          <DetailRow
            label="Duration"
            value={`${booking.durationMinutes || 0} mins`}
          />
          {booking.customerName && (
            <DetailRow label="Customer" value={booking.customerName} />
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: "rgba(34,197,94,0.06)",
              borderColor: "rgba(34,197,94,0.2)",
            },
          ]}
        >
          <Text style={styles.cardTitle}>Earnings</Text>
          <DetailRow
            label="Base Fare"
            value={`₹${booking.baseFare || booking.earnings || 0}`}
          />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Earned</Text>
            <Text style={styles.totalValue}>₹{booking.earnings || 0}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.invoiceBtn, generatingPDF && { opacity: 0.7 }]}
          onPress={handleDownloadInvoice}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={{ fontSize: 20 }}>📄</Text>
              <Text style={styles.invoiceBtnText}>Download Invoice</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  statusBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statusBannerText: { fontSize: 15, color: COLORS.text, fontWeight: "600" },
  statusBannerStatus: { fontSize: 13, fontWeight: "700" },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  routeContainer: { flexDirection: "row" },
  routeLeft: { alignItems: "center", width: 24, marginRight: 14 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeConnector: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    minHeight: 30,
    marginVertical: 4,
  },
  routeRight: { flex: 1 },
  routeLocation: { marginBottom: 16 },
  routeLocationLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontWeight: "700",
  },
  routeLocationText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: { fontSize: 14, color: COLORS.textSecondary },
  detailValue: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  totalValue: { fontSize: 24, fontWeight: "800", color: "#22C55E" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  invoiceBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  invoiceBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
