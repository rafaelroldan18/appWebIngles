# 🎨 Guía de Colores - English27

## Paleta de Colores

### Primary Colors
- **Primary Light** (`#6FA0FF`) - `bg-primary-light`, `text-primary-light`
- **Primary** (`#2B6BEE`) - `bg-primary`, `text-primary`
- **Primary Dark** (`#1E4BB5`) - `bg-primary-dark`, `text-primary-dark`
- **Primary Extra Dark** (`#132F73`) - `bg-primary-extra-dark`, `text-primary-extra-dark`

### Secondary Colors
- **Secondary Light** (`#C8C9FF`) - `bg-secondary-light`, `text-secondary-light`
- **Secondary** (`#7C80FF`) - `bg-secondary`, `text-secondary`
- **Secondary Dark** (`#4B4FBA`) - `bg-secondary-dark`, `text-secondary-dark`

### Accent/State Colors
- **Success** (`#37C86F`) - `bg-success`, `text-success`
- **Danger** (`#E84855`) - `bg-danger`, `text-danger`
- **Info** (`#1BC6F2`) - `bg-info`, `text-info`

### Neutral Colors
- **Neutral 100** (`#F8FAFC`) - `bg-neutral-100`, `text-neutral-100`
- **Neutral 200** (`#E5E7EB`) - `bg-neutral-200`, `text-neutral-200`
- **Neutral 300** (`#D1D5DB`) - `bg-neutral-300`, `text-neutral-300`
- **Neutral 400** (`#9CA3AF`) - `bg-neutral-400`, `text-neutral-400`
- **Neutral 500** (`#6B7280`) - `bg-neutral-500`, `text-neutral-500`
- **Neutral 700** (`#374151`) - `bg-neutral-700`, `text-neutral-700`
- **Neutral 900** (`#111827`) - `bg-neutral-900`, `text-neutral-900`

## Uso Recomendado

### Botones
```tsx
// Botón primario
<button className="bg-primary hover:bg-primary-dark text-white">
  Acción Principal
</button>

// Botón secundario
<button className="bg-secondary hover:bg-secondary-dark text-white">
  Acción Secundaria
</button>

// Botón de éxito
<button className="bg-success hover:bg-success/90 text-white">
  Guardar
</button>

// Botón de peligro
<button className="bg-danger hover:bg-danger/90 text-white">
  Eliminar
</button>
```

### Textos
```tsx
// Títulos principales
<h1 className="text-neutral-900">Título Principal</h1>

// Subtítulos
<h2 className="text-neutral-700">Subtítulo</h2>

// Texto normal
<p className="text-neutral-500">Texto descriptivo</p>

// Texto secundario
<span className="text-neutral-400">Información adicional</span>

// Enlaces
<a className="text-primary hover:text-primary-dark">Enlace</a>
```

### Fondos
```tsx
// Fondo principal de la aplicación
<div className="bg-neutral-100">

// Cards y contenedores
<div className="bg-white border border-neutral-200">

// Secciones destacadas
<div className="bg-primary-light/10">
```

### Estados y Alertas
```tsx
// Éxito
<div className="bg-success/10 border border-success/20 text-success">
  Operación exitosa
</div>

// Error
<div className="bg-danger/10 border border-danger/20 text-danger">
  Error en la operación
</div>

// Información
<div className="bg-info/10 border border-info/20 text-info">
  Información adicional
</div>
```

### Bordes
```tsx
// Bordes sutiles
<div className="border border-neutral-200">

// Bordes más definidos
<div className="border border-neutral-300">

// Bordes de enfoque
<input className="border border-neutral-300 focus:border-primary focus:ring-primary/20">
```

## Jerarquía Visual

### Importancia Decreciente
1. **Primary** - Acciones principales, CTAs importantes
2. **Secondary** - Acciones secundarias, elementos de apoyo
3. **Accent Colors** - Estados específicos (success, warning, danger, info)
4. **Neutral** - Texto, fondos, bordes, elementos estructurales

### Contraste y Legibilidad
- Texto oscuro sobre fondos claros: `text-neutral-900` sobre `bg-white`
- Texto claro sobre fondos oscuros: `text-white` sobre `bg-primary`
- Texto medio para información secundaria: `text-neutral-500`