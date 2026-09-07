import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.familyexpensetracker.app',
  appName: 'Family Expense Tracker',
  webDir: 'dist',
  // Serves bundled assets from https://localhost instead of the default
  // capacitor:// scheme — needed so the httpOnly/Secure/SameSite=None session
  // cookie from the backend (an HTTPS origin) is accepted by the WebView.
  server: {
    androidScheme: 'https',
  },
};

export default config;
