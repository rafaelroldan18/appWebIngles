# 🎨 Sistema de Colores Estandarizado - English27

## 📋 Resumen

Se ha implementado un sistema de colores centralizado y consistente para toda la aplicación, eliminando colores hardcodeados y asegurando una experiencia visual coherente en modo claro y oscuro.

---

## 🎯 Paleta de Colores

### Colores Primarios (Azul)
- **Uso**: Acciones principales, navegación, elementos destacados
- **Light**: `#3B82F6` (blue-500)
- **Dark**: `#60A5FA` (blue-400)
- **Gradiente**: `from-blue-500 to-blue-600`

### Colores Secundarios (Verde)
- **Uso**: Acciones secundarias, éxito, completado
- **Light**: `#10B981` (green-500)
- **Dark**: `#34D399` (green-400)
- **Gradiente**: `from-green-500 to-green-600`

### Colores de Acento

#### Advertencia (Ámbar)
- **Uso**: Alertas, puntos, métricas importantes
- **Light**: `#F59E0B` (amber-500)
- **Dark**: `#FCD34D` (amber-300)
- **Gradiente**: `from-amber-500 to-amber-600`

#### Peligro (Rojo)
- **Uso**: Errores, eliminación, alertas críticas
- **Light**: `#EF4444` (red-500)
- **Dark**: `#F87171` (red-400)
- **Gradiente**: `from-red-500 to-red-600`

---

## 🔧 Uso en Código

### Importación
```typescript
import { colors, getCardClasses, getButtonPrimaryClasses } from '@/config/colors';
```

### Ejemplos de Uso

#### Backgrounds
```tsx
// Background principal
<div className={colors.background.base}>

// Card/Tarjeta
<div className={colors.background.card}>

// Hover
<div className={colors.background.hover}>
```

#### Texto
```tsx
// Texto principal
<h1 className={colors.text.primary}>

// Texto secundario
<p className={colors.text.secondary}>

// Texto muted
<span className={colors.text.muted}>
```

#### Borders
```tsx
// Border estándar
<div className={`border ${colors.border.light}`}>

// Border con focus
<input className={colors.border.focus}>
```

#### Estados
```tsx
// Éxito
<span className={`${colors.status.success.bg} ${colors.status.success.text} border ${colors.status.success.border}`}>

// Advertencia
<span className={`${colors.status.warning.bg} ${colors.status.warning.text} border ${colors.status.warning.border}`}>

// Error
<span className={`${colors.status.error.bg} ${colors.status.error.text} border ${colors.status.error.border}`}>

// Info
<span className={`${colors.status.info.bg} ${colors.status.info.text} border ${colors.status.info.border}`}>

// Neutral
<span className={`${colors.status.neutral.bg} ${colors.status.neutral.text} border ${colors.status.neutral.border}`}>
```

#### Botones
```tsx
// Botón primario
<button className={`${getButtonPrimaryClasses()} rounded-xl p-4`}>

// Botón secundario
<button className={`${getButtonSecondaryClasses()} rounded-xl p-4`}>

// Botón advertencia
<button className={`${getButtonWarningClasses()} rounded-xl p-4`}>
```

#### Cards
```tsx
// Card completa
<div className={`${getCardClasses()} p-6`}>
```

---

## 📦 Componentes Actualizados

### ✅ Dashboards
- `EstudianteDashboard.tsx` - Completamente refactorizado
- `DocenteDashboard.tsx` - Completamente refactorizado
- `AdministradorDashboard.tsx` - Completamente refactorizado

### 🎨 Elementos Estandarizados

#### Métricas/Cards
- Background: `colors.background.card`
- Iconos: Gradientes primarios/secundarios/warning
- Texto: `colors.text.primary` y `colors.text.secondary`
- Borders: `colors.border.light`

#### Botones de Acción
- Primarios: Azul (crear, principal)
- Secundarios: Verde (gestionar, aprobar)
- Warning: Ámbar (reportes, estadísticas)

#### Badges/Estados
- Completado/Activo: Verde
- En progreso/Pendiente: Ámbar
- Error/Alto: Rojo
- Info/Tipo: Azul
- Neutral/Inactivo: Gris

---

## 🌓 Modo Oscuro

Todos los colores tienen variantes automáticas para modo oscuro usando las clases `dark:`:

```tsx
// Automático con el sistema
<div className={colors.text.primary}> 
// Renderiza: text-gray-900 dark:text-white

<div className={colors.background.card}>
// Renderiza: bg-white dark:bg-gray-800
```

---

## 🚫 Colores Eliminados

Se eliminaron todos los colores hardcodeados como:
- ❌ `text-[#1E293B]`
- ❌ `bg-[#F8FAFC]`
- ❌ `border-[#E2E8F0]`
- ❌ `from-[#3B82F6]`

Reemplazados por:
- ✅ `colors.text.primary`
- ✅ `colors.background.base`
- ✅ `colors.border.light`
- ✅ `colors.primary.gradient`

---

## 📊 Consistencia Visual

### Antes
- 15+ colores diferentes hardcodeados
- Inconsistencias entre modo claro/oscuro
- Difícil mantenimiento
- Colores no semánticos

### Después
- 4 colores principales (Azul, Verde, Ámbar, Rojo)
- Consistencia total en ambos modos
- Fácil mantenimiento centralizado
- Colores semánticos y accesibles

---

## 🎯 Beneficios

1. **Mantenibilidad**: Un solo archivo para cambiar colores
2. **Consistencia**: Mismos colores en toda la app
3. **Accesibilidad**: Contraste adecuado en ambos modos
4. **Escalabilidad**: Fácil agregar nuevos colores
5. **Legibilidad**: Nombres semánticos vs hex codes

---

## 📝 Guía de Estilo

### Cuándo usar cada color

#### Azul (Primario)
- Botones de acción principal
- Enlaces
- Navegación activa
- Iconos de información

#### Verde (Secundario)
- Estados de éxito
- Actividades completadas
- Botones de confirmación
- Métricas positivas

#### Ámbar (Warning)
- Advertencias
- Estados pendientes
- Puntos/recompensas
- Métricas importantes

#### Rojo (Danger)
- Errores
- Eliminación
- Estados críticos
- Dificultad alta

---

## 🔄 Migración

Para migrar componentes antiguos:

1. Importar el sistema de colores:
```typescript
import { colors, getCardClasses } from '@/config/colors';
```

2. Reemplazar colores hardcodeados:
```tsx
// Antes
<div className="bg-white dark:bg-gray-800 text-[#1E293B] dark:text-white">

// Después
<div className={`${colors.background.card} ${colors.text.primary}`}>
```

3. Usar helpers para componentes comunes:
```tsx
// Antes
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E2E8F0] dark:border-gray-700">

// Después
<div className={getCardClasses()}>
```

---

## 📚 Recursos

- Archivo principal: `/src/config/colors.ts`
- Documentación Tailwind: https://tailwindcss.com/docs/customizing-colors
- Guía de accesibilidad: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum

---

**Última actualización**: 2024
**Versión**: 1.0.0
**Estado**: ✅ Implementado
