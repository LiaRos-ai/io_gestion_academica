## Comandos de desarrollo: build vs serve
### ionic build
Compila la aplicación y genera los archivos de producción en la carpeta `www`:
```bash
ionic build
```
**Uso recomendado:** Preparar la app para despliegue en dispositivos, emuladores o producción. Necesario antes de usar Capacitor para sincronizar cambios.

### ionic serve
Inicia un servidor de desarrollo con recarga automática para pruebas rápidas en el navegador:
```bash
ionic serve
```
**Uso recomendado:** Desarrollo web, pruebas rápidas, sin plugins nativos.

**Diferencias principales:**
- `ionic serve` solo ejecuta la app en el navegador y no genera archivos para producción.
- `ionic build` genera los archivos finales y es requerido para pruebas en emulador/dispositivo.

# io_gestion_academica
Proyecto ionic de gestion academica

# Gestión Académica

Este proyecto es una aplicación móvil desarrollada con Ionic y Angular para la gestión académica. Incluye un sistema de login básico, validaciones de formulario y navegación entre páginas.

## Características principales
- Login con validación de usuario y contraseña
- Mensajes de error y bienvenida dinámicos
- Navegación con rutas standalone (Angular v16+)
- Uso de componentes de Ionic para una interfaz moderna
- Estructura lista para ampliarse con nuevas funcionalidades

## Estructura del proyecto
```
src/
  app/
    login/                # Página de login y autenticación
    home/                 # Página principal
    pages/
      materias-sqlite/    # CRUD de materias en SQLite
      sqlite-test/        # Pruebas y utilidades para SQLite
    services/
      auth.service.ts     # Servicio de autenticación (Firebase + SQLite)
      sqlite.service.ts   # Servicio de acceso y lógica SQLite
      materias.service.ts # Servicio para materias (Firebase, si aplica)
    assets/
      icon/               # Iconos y recursos gráficos
      shapes.svg          # SVGs para UI
    environments/
      environment.ts      # Configuración de entorno (dev/prod)
    theme/
      variables.scss      # Variables globales de estilos
  global.scss            # Estilos globales
  index.html             # Entrada principal de la app
  main.ts                # Bootstrap de Angular/Ionic
  ...otros archivos de configuración
```


## Instalación y ejecución
1. Instala las dependencias:
  ```bash
  npm install
  ```
2. Inicia el servidor de desarrollo:
  ```bash
  npm start
  ```
  ng build
  ng serve
3. Accede a la app en [http://localhost:4200](http://localhost:4200)

## Pruebas en emulador Android

1. Sincroniza los cambios con Capacitor:
  ```bash
  ionic cap sync android
  ```
2. Abre el proyecto en Android Studio:
  ```bash
  ionic cap open android
  ```
3. Compila y ejecuta en el emulador desde Android Studio, o usa:
  ```bash
  ionic cap run android --verbose
  ```
4. Si tienes problemas con el SDK, revisa las variables de entorno:
  - ANDROID_HOME debe apuntar a la ruta del SDK (ejemplo: `C:\Users\<usuario>\AppData\Local\Android\Sdk`)
  - Agrega a tu PATH: `C:\Users\<usuario>\AppData\Local\Android\Sdk\platform-tools`
5. Si el emulador muestra "device still authorizing", acepta la depuración USB en el emulador y ejecuta:
  ```bash
  adb kill-server
  adb start-server
  adb devices
  ```

## Requisitos
- Node.js y npm
- Angular CLI
- Ionic CLI

## Estado actual
- Login funcional con validaciones y mensajes
- Página de inicio redirigida al login
- Listo para conectar con backend o ampliar módulos

## Cambios recientes

- **Login con Firebase y guardado local:** El login se realiza con Firebase, pero los datos del usuario se guardan en la base local SQLite para uso offline.
- **Inicialización condicional de SQLite:** SQLite solo se inicializa en dispositivos móviles (Cordova/Capacitor), evitando errores en entorno web.
- **Comentarios explicativos:** Se agregaron comentarios en el código para documentar los cambios y la lógica de inicialización condicional.
- **Validación y listado de materias:** Las materias se guardan y se listan desde la base local SQLite usando los métodos del servicio.

## Autor
LiaRos-ai

---
Este README resume el trabajo realizado hasta el momento y sirve como base para futuras mejoras en la gestión académica móvil.
