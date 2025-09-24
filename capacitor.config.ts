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
    // Plugin de Google Auth para Calendar API
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar/readonly'],
      serverClientId: '253562087581-ehssj6fasblq3q07d0b2f2op7km7iobf.apps.googleusercontent.com',//'503453066418-qeqoue68i1sk5q597t95r2j0pm6mhmg2.apps.googleusercontent.com',
      //grantOfflineAccess: true,
      forceCodeForRefreshToken: true,
    },
  },
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: 'C:\\Users\\jqalvarado\\.android\\debug.keystore',
      keystorePassword: 'android',
      keystoreKeyAlias: 'androiddebugkey',
      keystoreKeyPassword: 'android'
    }
  }
};

export default config;
