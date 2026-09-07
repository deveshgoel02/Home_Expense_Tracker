import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // The Android app bundles this build's dist/ output directly into its own
  // assets. publicDir (which holds the downloadable APK for the website) must
  // never be copied into a capacitor build, or each rebuilt APK would embed
  // the previous APK inside itself, growing every time it's rebuilt.
  publicDir: mode === "capacitor" ? false : "public",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
}));
