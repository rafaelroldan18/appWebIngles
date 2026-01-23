---
description: Steps to clean the database and prepare for production with real data
---

# Limpieza de Base de Datos para Producción

Sigue estos pasos para eliminar todos los datos de prueba y preparar el sistema para su uso real.

## 1. Ejecutar el Script de Limpieza SQL

El archivo `reset_db.sql` contiene los comandos para vaciar todas las tablas de forma segura.

1. Abre tu cliente de SQL (Supabase Dashboard, DBeaver, o terminal).
2. Copia el contenido del archivo `reset_db.sql`.
3. Ejecuta el script.

> **ADVERTENCIA:** Esto eliminará **TODOS** los usuarios, progresos, temas y misiones creados hasta ahora. Los usuarios en `auth.users` de Supabase permanecerán, pero sus perfiles en `public.users` serán borrados. Se recomienda borrar también los usuarios desde el panel de Authentication de Supabase para evitar inconsistencias.

## 2. Inicializar Tipos de Juegos (Game Types)

Una vez la base de datos esté vacía, es CRÍTICO volver a crear los tipos de juegos básicos para que la aplicación funcione.

1. Inicia la aplicación (`npm run dev` o tu despliegue de producción).
2. Navega a la ruta: `/admin/seed-game-types`.
3. Haz clic en el botón **"Inicializar Game Types"**.
4. Espera a ver el mensaje de éxito.

## 3. Crear el Primer Usuario Administrador

1. Regístrate normalmente en la aplicación con tu correo de administrador.
2. Como la base de datos se limpió, tu cuenta por defecto será de "Estudiante" o "Pendiente".
3. Accede a tu base de datos (Supabase Dashboard) y busca tu usuario en la tabla `public.users`.
4. Cambia manualmente el campo `role` a `'administrador'` y `account_status` a `'activo'`.

¡Listo! Tu sistema está limpio y configurado para producción.
