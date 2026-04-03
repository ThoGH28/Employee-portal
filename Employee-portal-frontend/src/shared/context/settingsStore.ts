import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "vi" | "en";
export type ThemeMode = "light" | "dark" | "system";

interface SettingsStore {
  language: Language;
  themeMode: ThemeMode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  leaveNotifications: boolean;
  payslipNotifications: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;

  setLanguage: (lang: Language) => void;
  setThemeMode: (theme: ThemeMode) => void;
  setEmailNotifications: (v: boolean) => void;
  setPushNotifications: (v: boolean) => void;
  setLeaveNotifications: (v: boolean) => void;
  setPayslipNotifications: (v: boolean) => void;
  setTwoFactorEnabled: (v: boolean) => void;
  setSessionTimeout: (v: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      language: "vi",
      themeMode: "light",
      emailNotifications: true,
      pushNotifications: true,
      leaveNotifications: true,
      payslipNotifications: true,
      twoFactorEnabled: false,
      sessionTimeout: 30,

      setLanguage: (language) => set({ language }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setEmailNotifications: (emailNotifications) =>
        set({ emailNotifications }),
      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
      setLeaveNotifications: (leaveNotifications) =>
        set({ leaveNotifications }),
      setPayslipNotifications: (payslipNotifications) =>
        set({ payslipNotifications }),
      setTwoFactorEnabled: (twoFactorEnabled) => set({ twoFactorEnabled }),
      setSessionTimeout: (sessionTimeout) => set({ sessionTimeout }),
    }),
    { name: "ep-settings" },
  ),
);
