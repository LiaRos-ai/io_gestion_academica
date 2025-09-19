# 🔧 Guía de Solución de Problemas - Android Emulator

## Problema: Login no funciona en Android Studio Emulator

Esta guía te ayudará a solucionar los problemas más comunes con Firebase Authentication en emuladores de Android.

## 📋 Verificación Inicial

### 1. Verificar Conexión a Internet del Emulador

```bash
# En Android Studio Emulator:
# 1. Abre el panel de control del emulador (tres puntos "...")
# 2. Ve a Settings > Network & Internet
# 3. Verifica que esté conectado a internet
```

### 2. Reiniciar el Emulador

```bash
# Método 1: Reinicio suave
adb reboot

# Método 2: Reinicio completo desde Android Studio
# 1. Cierra el emulador
# 2. Ve a AVD Manager
# 3. Selecciona el emulador
# 4. Click en "Cold Boot Now"
```

## 🔧 Soluciones Específicas

### Problema 1: "auth/network-request-failed"

**Síntomas:**
- El login falla con error de red
- Console muestra: "Network request failed"

**Soluciones:**

#### Opción A: Verificar Configuración de Red
```bash
# 1. Abrir terminal en el directorio del proyecto
# 2. Ejecutar comandos de diagnóstico
adb shell ping -c 4 8.8.8.8
adb shell ping -c 4 google.com
```

#### Opción B: Configurar Proxy (si usas VPN/corporate network)
```bash
# En Android Emulator:
# 1. Settings > Network & Internet > Wi-Fi
# 2. Mantén presionado el nombre de la red
# 3. Modify network > Advanced options
# 4. Configurar proxy si es necesario
```

#### Opción C: Limpiar Caché del Emulador
```bash
# Limpiar datos del emulador
adb shell pm clear com.gestionacademica.app

# Reiniciar aplicación
adb shell am force-stop com.gestionacademica.app
adb shell am start -n com.gestionacademica.app/.MainActivity
```

### Problema 2: "auth/invalid-api-key"

**Síntomas:**
- Error de clave API inválida
- Console muestra problemas con Firebase config

**Solución:**
```bash
# Verificar que google-services.json esté correcto
# El archivo debe estar en: android/app/google-services.json

# Verificar configuración en firebase.config.ts
# appId debe ser: "1:495953103542:android:16071c8c78c2d8dd367417"
```

### Problema 3: "auth/too-many-requests"

**Síntomas:**
- Demasiados intentos de login
- Firebase bloquea temporalmente

**Solución:**
```bash
# Esperar 5-10 minutos
# O cambiar a otra cuenta de prueba
```

## 🚀 Configuración Recomendada del Emulador

### 1. Crear Emulador Optimizado

```bash
# En Android Studio AVD Manager:
# - API Level: 30+ (Android 11+)
# - RAM: 2048 MB mínimo
# - Storage: 4GB mínimo
# - Graphics: Hardware (recomendado)
```

### 2. Configuración de Red

```bash
# Verificar configuración DNS
adb shell getprop net.dns1
adb shell getprop net.dns2

# Si es necesario, configurar DNS manual
adb shell setprop net.dns1 8.8.8.8
adb shell setprop net.dns2 8.8.4.4
```

## 🔍 Diagnóstico Avanzado

### Verificar Logs de Firebase

```bash
# Verificar logs en la consola del navegador/desarrollador
# Buscar mensajes relacionados con Firebase

# Verificar configuración de Firebase
console.log('Firebase config:', firebaseConfig);
console.log('Firebase app:', firebase.app());
```

### Verificar Conectividad desde la App

```typescript
// Agregar este código temporal en login.page.ts
private async testConnectivity() {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log('✅ Conectividad OK');
  } catch (error) {
    console.log('❌ Error de conectividad:', error);
  }
}
```

## 🛠️ Comandos Útiles para Debugging

```bash
# Ver estado del emulador
adb devices

# Ver logs del dispositivo
adb logcat

# Ver logs específicos de la app
adb logcat | grep "gestion-academica"

# Reiniciar ADB
adb kill-server
adb start-server

# Limpiar datos de la app
adb shell pm clear com.gestionacademica.app

# Ver información de red
adb shell ip route
adb shell cat /proc/net/route
```

## 📱 Configuración de Firebase para Android

### Verificar google-services.json

```json
{
  "project_info": {
    "project_id": "gestion-academica-mov"
  },
  "client": [
    {
      "android_client_info": {
        "package_name": "com.gestionacademica.app"
      },
      "api_key": [
        {
          "current_key": "AIzaSyDy_bIwJIcUf3EN3X-jOkyIQ_wle0pLsSM"
        }
      ]
    }
  ]
}
```

### Verificar firebase.config.ts

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyDy_bIwJIcUf3EN3X-jOkyIQ_wle0pLsSM",
  projectId: "gestion-academica-mov",
  appId: "1:495953103542:android:16071c8c78c2d8dd367417"
};
```

## 🔄 Pasos de Troubleshooting Sistemático

### Paso 1: Verificar Conexión Básica
1. Abrir navegador en el emulador
2. Ir a `https://www.google.com`
3. Si no carga, problema de red del emulador

### Paso 2: Verificar Firebase
1. Abrir app
2. Ver console logs
3. Buscar errores específicos de Firebase

### Paso 3: Reinicio Completo
1. Cerrar Android Studio
2. Cerrar emulador
3. Reiniciar ADB: `adb kill-server && adb start-server`
4. Abrir Android Studio
5. Cold boot del emulador
6. Probar app nuevamente

### Paso 4: Verificar Configuración
1. Verificar `google-services.json`
2. Verificar `firebase.config.ts`
3. Verificar `AndroidManifest.xml` permisos
4. Verificar `capacitor.config.ts`

## 📞 Soporte Adicional

Si los problemas persisten:

1. **Limpiar proyecto completo:**
   ```bash
   rm -rf node_modules
   rm -rf android/app/build
   npm install
   npx cap sync android
   ```

2. **Verificar versión de Android:**
   - API 30+ recomendado
   - Google Play Services actualizado

3. **Verificar Firebase Console:**
   - Proyecto activo
   - Authentication habilitado
   - Reglas de Firestore configuradas

## ✅ Checklist Final

- [ ] Emulador tiene conexión a internet
- [ ] Firebase config correcta
- [ ] google-services.json presente
- [ ] Permisos en AndroidManifest.xml
- [ ] Proyecto rebuild después de cambios
- [ ] ADB reiniciado
- [ ] Emulador cold boot realizado

---

**Nota:** La mayoría de los problemas se resuelven reiniciando el emulador y verificando la conexión a internet.