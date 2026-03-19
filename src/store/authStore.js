import { onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { getDriverProfile } from "../services/authService";
import { auth } from "../services/firebase";

const useAuthStore = create((set, get) => ({
  user: null,
  driverProfile: null,
  loading: true,
  initialized: false,

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        set({ user });
        try {
          const profile = await getDriverProfile(user.uid);
          set({ driverProfile: profile });
        } catch (e) {
          console.error("Error fetching driver profile:", e);
        }
      } else {
        set({ user: null, driverProfile: null });
      }
      set({ loading: false, initialized: true });
    });
    return unsubscribe;
  },

  refreshProfile: async () => {
    const { user } = get();
    if (user) {
      const profile = await getDriverProfile(user.uid);
      set({ driverProfile: profile });
    }
  },

  updateLocalProfile: (updates) => {
    const { driverProfile } = get();
    if (driverProfile) {
      set({ driverProfile: { ...driverProfile, ...updates } });
    }
  },

  clearAuth: () => set({ user: null, driverProfile: null }),
}));

export default useAuthStore;
