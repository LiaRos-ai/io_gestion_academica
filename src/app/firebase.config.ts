// Archivo de configuración de Firebase para Angular/Ionic
export const firebaseConfig = {
  // Clave de API para autenticar las peticiones desde tu app
  apiKey: "AIzaSyDy_bIwJIcUf3EN3X-jOkyIQ_wle0pLsSM",
  // Dominio de autenticación de tu proyecto Firebase
  authDomain: "gestion-academica-mov.firebaseapp.com",
  // ID único de tu proyecto en Firebase
  projectId: "gestion-academica-mov",
  // URL del bucket de almacenamiento de archivos en Firebase
  storageBucket: "gestion-academica-mov.firebasestorage.app",
  // ID del remitente para mensajes push (Firebase Cloud Messaging)
  messagingSenderId: "495953103542",
  // ID único de la aplicación registrada en Firebase (Android)
  appId: "1:495953103542:android:16071c8c78c2d8dd367417",
  // Configuración adicional para Android
  measurementId: undefined
};

// Configuración específica para desarrollo/emulador
export const isDevelopment = true; // Cambiar a false en producción

if (isDevelopment) {
  console.log('🔧 Modo desarrollo activado');
  console.log('📱 Si usas emulador Android, verifica:');
  console.log('   1. Conexión a internet del emulador');
  console.log('   2. Configuración de proxy si es necesario');
  console.log('   3. Reinicio del emulador si hay problemas');
}

// Configuración actualizada con los valores correctos de Firebase para Android
