import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subDays,
} from "date-fns";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "./firebase";

export const getBookingsByDriver = async (driverUid, filter = "today") => {
  const now = new Date();
  let startDate, endDate;

  switch (filter) {
    case "today":
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case "yesterday":
      startDate = startOfDay(subDays(now, 1));
      endDate = endOfDay(subDays(now, 1));
      break;
    case "this_week":
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "this_month":
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    default:
      startDate = null;
      endDate = null;
  }

  let q;
  if (startDate && endDate) {
    q = query(
      collection(db, "bookings"),
      where("driverUid", "==", driverUid),
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      where("createdAt", "<=", Timestamp.fromDate(endDate)),
      orderBy("createdAt", "desc"),
    );
  } else {
    q = query(
      collection(db, "bookings"),
      where("driverUid", "==", driverUid),
      orderBy("createdAt", "desc"),
    );
  }

  const querySnapshot = await getDocs(q);
  const bookings = [];
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });
  return bookings;
};

export const getBookingsByDateRange = async (driverUid, startDate, endDate) => {
  const q = query(
    collection(db, "bookings"),
    where("driverUid", "==", driverUid),
    where("createdAt", ">=", Timestamp.fromDate(startOfDay(new Date(startDate)))),
    where("createdAt", "<=", Timestamp.fromDate(endOfDay(new Date(endDate)))),
    orderBy("createdAt", "desc"),
  );
  const querySnapshot = await getDocs(q);
  const bookings = [];
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });
  return bookings;
};

export const getBookingById = async (bookingId) => {
  const docRef = doc(db, "bookings", bookingId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const computeStats = (bookings) => {
  const totalEarnings = bookings.reduce((sum, b) => sum + (b.earnings || 0), 0);
  const totalTrips = bookings.length;
  const totalKms = bookings.reduce((sum, b) => sum + (b.distanceKm || 0), 0);
  const totalDriveMinutes = bookings.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
  const uniqueDays = getUniqueDays(bookings);
  const avgDriveTimePerDay = totalTrips > 0 ? Math.round(totalDriveMinutes / Math.max(1, uniqueDays)) : 0;
  return {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalTrips,
    totalKms: Math.round(totalKms * 10) / 10,
    avgDriveTimePerDay,
  };
};

const getUniqueDays = (bookings) => {
  const days = new Set();
  bookings.forEach((b) => {
    if (b.createdAt) {
      const date = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      days.add(date.toDateString());
    }
  });
  return days.size || 1;
};

// --- Real-time Listeners and Status Implementations ---

export const subscribeToActiveBookings = (driverUid, callback) => {
  const q = query(
    collection(db, "bookings"),
    where("driverUid", "==", driverUid),
    where("status", "in", ["accepted", "arrived", "in_progress"])
  );
  
  return onSnapshot(q, (snapshot) => {
    const activeBookings = [];
    snapshot.forEach((doc) => {
      activeBookings.push({ id: doc.id, ...doc.data() });
    });
    // Assuming a driver can only have one active trip at a time
    callback(activeBookings[0] || null);
  }, (error) => {
    console.error("Error subscribing to active bookings:", error);
  });
};

export const subscribeToNewBookingRequests = (driverUid, callback) => {
  // Listen for 'pending' requests assigned to this driver
  const q = query(
    collection(db, "bookings"),
    where("driverUid", "==", driverUid),
    where("status", "==", "pending")
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    callback(requests);
  }, (error) => {
    console.error("Error subscribing to new booking requests:", error);
  });
};

export const updateBookingStatus = async (bookingId, newStatus) => {
  const docRef = doc(db, "bookings", bookingId);
  await updateDoc(docRef, { status: newStatus });
};

export const rejectBooking = async (bookingId) => {
  const docRef = doc(db, "bookings", bookingId);
  await updateDoc(docRef, { 
    status: "rejected", 
    driverUid: null // Unassign the driver so the rider app can find another one
  });
};

