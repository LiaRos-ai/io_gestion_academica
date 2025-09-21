// Archivo de configuración de Capacitor para aplicación híbrida con SQLite
const config = {
  appId: 'com.gestionacademica.app',
  appName: 'Gestión Académica',
  webDir: 'www', // Usar 'www' para Ionic
  plugins: {
    // Plugin de SQLite para almacenamiento local
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'gestion-academica',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite'
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
        biometricSubTitle: 'Log in using your biometric'
      },
      electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
      electronMacLocation: 'Library/Application Support/CapacitorDatabases',
      electronLinuxLocation: 'Databases'
    },
    // Plugin de red para verificar conectividad
    Network: {},
    // Plugin de notificaciones locales
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
