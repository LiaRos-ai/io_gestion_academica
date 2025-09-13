// Archivo de configuración de Capacitor
import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.gestionacademica.app',
  appName: 'Gestión Académica',
  webDir: 'www', // Usar 'www' para Ionic
  bundledWebRuntime: false,
  plugins: {
    Network: {},
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
