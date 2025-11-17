# 📝 Sistema Tipográfico Estandarizado - English27

## 🎨 Paleta de Colores de Texto

### Light Mode
- **Titles (H1-H3)**: `#111827` - `text-[#111827]`
- **Text Principal (p)**: `#374151` - `text-[#374151]`
- **Subtext/Labels**: `#6B7280` - `text-[#6B7280]`
- **Disabled**: `#9CA3AF` - `text-[#9CA3AF]`

### Dark Mode
- **Titles (H1-H3)**: `#F8FAFC` - `dark:text-[#F8FAFC]`
- **Text Principal (p)**: `#E5E7EB` - `dark:text-[#E5E7EB]`
- **Subtext/Labels**: `#D1D5DB` - `dark:text-[#D1D5DB]`
- **Disabled**: `#9CA3AF` - `dark:text-[#9CA3AF]`

### Especiales
- **Botones Primarios**: `#FFFFFF` - `text-white`

## 🔧 Sistema en colors.ts

```typescript
text: {
  title: 'text-[#111827] dark:text-[#F8FAFC]',      // H1-H3 titles
  primary: 'text-[#374151] dark:text-[#E5E7EB]',     // Main text (p)
  secondary: 'text-[#6B7280] dark:text-[#D1D5DB]',   // Subtext/labels
  disabled: 'text-[#9CA3AF] dark:text-[#9CA3AF]',    // Disabled (same both modes)
  button: 'text-white',                               // Text on primary buttons
}
```

## 📋 Guía de Aplicación

### Títulos (H1, H2, H3)
```tsx
<h1 className={`text-2xl font-bold ${colors.text.title}`}>
<h2 className={`text-xl font-bold ${colors.text.title}`}>
<h3 className={`text-lg font-bold ${colors.text.title}`}>
```

### Texto Principal (párrafos)
```tsx
<p className={`text-base ${colors.text.primary}`}>
<div className={`${colors.text.primary}`}>
```

### Labels y Subtextos
```tsx
<label className={`text-sm ${colors.text.secondary}`}>
<span className={`text-xs ${colors.text.secondary}`}>
```

### Estados Deshabilitados
```tsx
<input disabled className={`${colors.text.disabled}`}>
<button disabled className={`${colors.text.disabled}`}>
```

### Botones Primarios
```tsx
<button className={`bg-primary ${colors.text.button}`}>
```

## 🎯 Componentes Actualizados

### ✅ Dashboards
- `EstudianteDashboard.tsx` - Títulos y métricas
- `DocenteDashboard.tsx` - Títulos y métricas  
- `AdministradorDashboard.tsx` - Títulos y métricas

### ✅ Componentes UI
- `Card.tsx` - Labels y valores
- `LoadingSpinner.tsx` - Mensaje de carga
- `UserMenu.tsx` - Nombre y email

### 🔄 Pendientes de Actualizar
- Formularios (Login, modales)
- Inputs y selects
- Navegación
- Alerts y notificaciones
- Tooltips
- Placeholders

## 📝 Reglas de Implementación

### 1. Jerarquía Visual
- **Títulos**: Más oscuros/claros para máximo contraste
- **Texto Principal**: Contraste medio para lectura cómoda
- **Subtextos**: Contraste reducido para información secundaria
- **Deshabilitado**: Mismo color en ambos modos para consistencia

### 2. Consistencia
- Usar SOLO los colores definidos en el sistema
- No usar colores hardcodeados fuera del sistema
- Aplicar dark mode a todos los textos

### 3. Accesibilidad
- Mantener ratios de contraste WCAG AA
- Títulos con máximo contraste
- Texto deshabilitado claramente diferenciado

## 🔍 Verificación

Para verificar implementación completa:
```bash
# Buscar colores de texto no estandarizados
grep -r "text-slate\|text-gray\|text-blue" src/
grep -r "text-\[#" src/ | grep -v "#111827\|#374151\|#6B7280\|#9CA3AF\|#F8FAFC\|#E5E7EB\|#D1D5DB"
```

## 🎨 Resultado Visual

El sistema garantiza:
- ✅ Consistencia visual en toda la aplicación
- ✅ Legibilidad óptima en ambos modos
- ✅ Jerarquía tipográfica clara
- ✅ Accesibilidad mejorada
- ✅ Mantenimiento simplificado