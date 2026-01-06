# 🖼️ Solución: Error "Bucket not found" al Subir Imágenes

## ⚠️ Error Actual

```
Error [StorageApiError]: Bucket not found
status: 400, statusCode: '404'
```

**Causa:** El bucket `game-images` no existe en Supabase Storage.

## ✅ Solución: Crear el Bucket en Supabase

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. **Abre tu proyecto en Supabase:**
   ```
   https://supabase.com/dashboard/project/[tu-proyecto-id]
   ```

2. **Ve a Storage** (icono de carpeta en el menú lateral)

3. **Click en "New bucket"**

4. **Configura el bucket:**
   ```
   Name: game-images
   Public bucket: ✅ (marcado)
   File size limit: 5 MB
   Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
   ```

5. **Click en "Create bucket"**

6. **¡Listo!** ✅

### Opción 2: Desde SQL Editor

Si prefieres usar SQL, ve al SQL Editor en Supabase y ejecuta:

```sql
-- Crear el bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-images', 'game-images', true);

-- Configurar políticas de acceso público (lectura)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'game-images' );

-- Permitir subida autenticada
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-images' 
  AND auth.role() = 'authenticated'
);

-- Permitir actualización autenticada
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'game-images' 
  AND auth.role() = 'authenticated'
);

-- Permitir eliminación autenticada
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'game-images' 
  AND auth.role() = 'authenticated'
);
```

## 📋 Configuración Recomendada del Bucket

### Configuración Básica:
- **Name:** `game-images`
- **Public:** ✅ Sí (para que las imágenes sean accesibles públicamente)
- **File size limit:** 5 MB
- **Allowed MIME types:** 
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`

### Políticas de Seguridad:
- **Lectura (SELECT):** Pública (cualquiera puede ver las imágenes)
- **Escritura (INSERT):** Solo usuarios autenticados
- **Actualización (UPDATE):** Solo usuarios autenticados
- **Eliminación (DELETE):** Solo usuarios autenticados

## 🔍 Verificar que Funciona

Después de crear el bucket, prueba subir una imagen:

1. Ve a tu panel de administrador
2. Intenta subir una imagen para contenido de juego
3. Deberías ver un mensaje de éxito ✅

## 📁 Estructura de Archivos

Las imágenes se guardarán en:
```
game-images/
└── game-content/
    ├── 1704502800000-abc123.jpg
    ├── 1704502801000-def456.png
    └── ...
```

## 🌐 URL Pública

Las imágenes tendrán URLs como:
```
https://[tu-proyecto].supabase.co/storage/v1/object/public/game-images/game-content/[timestamp]-[random].[ext]
```

## ⚙️ Alternativa: Cambiar el Nombre del Bucket

Si prefieres usar otro nombre de bucket, edita el archivo:

**`app/api/upload/image/route.ts`**

```typescript
// Línea 55 y 72, cambia 'game-images' por tu bucket:
.from('tu-nombre-de-bucket')
```

## 🚀 Próximos Pasos

1. ✅ Crear el bucket `game-images` en Supabase
2. ✅ Configurar como público
3. ✅ Configurar políticas de acceso
4. ✅ Probar subiendo una imagen

---

**Tiempo estimado:** 2-3 minutos  
**Dificultad:** Fácil  
**Frecuencia:** Solo una vez por proyecto
