# 📦 Guía de Imports en Next.js 13+

## ❌ NO Necesitas Importar React

En Next.js 13+ con React 18+, **NO necesitas** `import React from 'react'` para usar JSX.

### Antes (React 16/17)
```tsx
import React from 'react'; // ❌ Ya no necesario

export function Component() {
  return <div>Hello</div>;
}
```

### Ahora (Next.js 13+ / React 18+)
```tsx
// ✅ Sin import de React
export function Component() {
  return <div>Hello</div>;
}
```

---

## ✅ Cuándo SÍ Importar de React

### 1. Hooks
```tsx
import { useState, useEffect, useContext } from 'react';

export function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log(count);
  }, [count]);
  
  return <div>{count}</div>;
}
```

### 2. Tipos TypeScript (Opcional)
```tsx
// Opción 1: Sin import (recomendado)
interface Props {
  children: React.ReactNode;
  onClick: React.MouseEventHandler;
}

// Opción 2: Con import
import type { ReactNode, MouseEventHandler } from 'react';

interface Props {
  children: ReactNode;
  onClick: MouseEventHandler;
}
```

### 3. APIs Específicas
```tsx
import { forwardRef, memo, lazy, Suspense } from 'react';

export const MemoComponent = memo(function Component() {
  return <div>Memoized</div>;
});
```

---

## 📋 Reglas Simples

| Caso | Import Necesario | Ejemplo |
|------|------------------|---------|
| JSX básico | ❌ No | `<div>Hello</div>` |
| Componentes | ❌ No | `export function Component() {}` |
| Hooks | ✅ Sí | `import { useState } from 'react'` |
| Tipos | ⚠️ Opcional | `React.ReactNode` o `import { ReactNode }` |
| APIs avanzadas | ✅ Sí | `import { memo } from 'react'` |

---

## 🎯 Recomendaciones

### ✅ Hacer
```tsx
// Componente simple
export function Button({ children }: { children: React.ReactNode }) {
  return <button>{children}</button>;
}

// Con hooks
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### ❌ No Hacer
```tsx
// ❌ Import innecesario
import React from 'react';

export function Button() {
  return <button>Click</button>;
}

// ❌ Import innecesario de tipos
import { ReactNode } from 'react';

interface Props {
  children: ReactNode; // Usa React.ReactNode en su lugar
}
```

---

## 🔧 Migración Automática

Para limpiar imports innecesarios en tu proyecto:

```bash
# Buscar archivos con import React innecesario
grep -r "import React from 'react'" src/

# O en Windows PowerShell
Get-ChildItem -Recurse -Filter *.tsx | Select-String "import React from 'react'"
```

---

## 📚 Más Información

- [React 17 - New JSX Transform](https://react.dev/blog/2020/09/22/introducing-the-new-jsx-transform)
- [Next.js - React Essentials](https://nextjs.org/docs/getting-started/react-essentials)
