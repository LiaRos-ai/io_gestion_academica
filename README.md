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
    login/
      login.page.ts
      login.page.html
      login.page.scss
    home/
      home.page.ts
      ...
  assets/
  environments/
  theme/
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

## Requisitos
- Node.js y npm
- Angular CLI
- Ionic CLI

## Estado actual
- Login funcional con validaciones y mensajes
- Página de inicio redirigida al login
- Listo para conectar con backend o ampliar módulos

## Cambios recientes

- Se agregaron reglas de seguridad recomendadas para Firestore en Firebase para permitir acceso a usuarios autenticados.
- Se mejoró la gestión de mensajes de éxito y error en la UI para login y registro.
- Se validó la creación automática de la colección de materias en Firestore si no existe.
- Se revisó y ajustó la estructura de los componentes y servicios para cumplir con Angular standalone y buenas prácticas.

## Autor
LiaRos-ai

---
Este README resume el trabajo realizado hasta el momento y sirve como base para futuras mejoras en la gestión académica móvil.
