# 🎯 Resumen Ejecutivo - Diagrama de Casos de Uso English27

## 📊 Estadísticas Generales

### Total de Casos de Uso: **175**

| Actor | Casos de Uso | Porcentaje |
|-------|--------------|------------|
| 👨‍🎓 Estudiante | 41 | 23.4% |
| 👨‍🏫 Docente | 53 | 30.3% |
| 👨‍💼 Administrador | 71 | 40.6% |
| 🤖 Sistema | 10 | 5.7% |

---

## 🎯 Casos de Uso Más Importantes

### Top 10 Casos de Uso Críticos

1. **UC-E02: Iniciar Sesión** ⭐⭐⭐⭐⭐
   - Sin esto, el sistema no funciona
   - Debe ser extremadamente robusto y seguro
   - Implementar con autenticación de Supabase

2. **UC-E14: Iniciar Misión** ⭐⭐⭐⭐⭐
   - Core del sistema educativo
   - Debe crear registro en `gamification_mission_attempts`
   - Validar que la misión esté activa

3. **UC-E15 a UC-E20: Completar Actividades** ⭐⭐⭐⭐⭐
   - Funcionalidad principal del aprendizaje
   - Cada tipo de actividad necesita su propia lógica de validación
   - Debe actualizar progreso en tiempo real

4. **UC-E23: Completar Misión** ⭐⭐⭐⭐⭐
   - Dispara múltiples procesos automáticos
   - Actualiza nivel, puntos, badges
   - Debe ser transaccional (todo o nada)

5. **UC-S01: Calcular Nivel de Estudiante** ⭐⭐⭐⭐⭐
   - Proceso automático crítico
   - Debe ejecutarse al completar misión
   - Actualiza `progreso_estudiantes.nivel_actual`

6. **UC-S02: Actualizar Racha Diaria** ⭐⭐⭐⭐
   - Core del engagement
   - Debe ejecutarse en cada actividad
   - Lógica: mismo día = no cambio, día consecutivo = +1, día salteado = reset

7. **UC-S03: Verificar y Otorgar Badges** ⭐⭐⭐⭐
   - Gamificación automática
   - Debe verificar todos los badges activos
   - Otorgar solo si cumple criterios y no lo tiene

8. **UC-D12: Crear Misión** ⭐⭐⭐⭐
   - Sin contenido, no hay sistema
   - Debe validar todos los campos
   - Permitir agregar actividades inmediatamente

9. **UC-D21 a UC-D26: Crear Actividades** ⭐⭐⭐⭐
   - Creación de contenido educativo
   - Cada tipo tiene estructura JSON diferente en `content_data`
   - Validar estructura JSON antes de guardar

10. **UC-A06: Gestión de Usuarios** ⭐⭐⭐⭐
    - Administración básica
    - Debe respetar RLS
    - Auditar todos los cambios

---

## 🔄 Flujos de Trabajo Principales

### Flujo 1: Estudiante Completa una Misión

```
1. UC-E13: Ver Misiones Disponibles
   ↓
2. UC-E14: Iniciar Misión
   ↓
3. UC-E15-E20: Completar Actividades (repetir para cada actividad)
   ├─→ UC-E21: Ver Retroalimentación
   ├─→ UC-S02: Actualizar Racha
   └─→ UC-S04: Registrar Transacción de Puntos
   ↓
4. UC-E23: Completar Misión
   ├─→ UC-S01: Calcular Nivel
   ├─→ UC-S03: Verificar y Otorgar Badges
   │   └─→ UC-S06: Enviar Notificación
   └─→ UC-S05: Actualizar Leaderboard
```

### Flujo 2: Docente Crea Contenido

```
1. UC-D12: Crear Misión
   ├─→ Configurar título, descripción, dificultad
   └─→ Configurar puntos base
   ↓
2. UC-D21-D26: Crear Actividades (repetir)
   ├─→ Definir tipo de actividad
   ├─→ Configurar content_data (JSON)
   └─→ Configurar puntos y tiempo límite
   ↓
3. UC-D15: Activar Misión
   ↓
4. Misión disponible para estudiantes
```

### Flujo 3: Sistema Otorga Badge Automáticamente

```
1. Estudiante completa acción (misión, actividad, etc.)
   ↓
2. UC-S03: Verificar y Otorgar Badges
   ├─→ Obtener todos los badges activos
   ├─→ Para cada badge:
   │   ├─→ Verificar si usuario ya lo tiene
   │   ├─→ Evaluar criterio
   │   └─→ Si cumple:
   │       ├─→ Crear registro en gamification_user_badges
   │       ├─→ UC-S04: Registrar puntos de recompensa
   │       └─→ UC-S06: Enviar notificación
   └─→ UC-S05: Actualizar Leaderboard
```

---

## 🏗️ Recomendaciones de Implementación

### Fase 1: MVP (4-6 semanas)

**Objetivo:** Sistema funcional básico

**Casos de Uso a Implementar:**
- ✅ Autenticación completa (UC-E01 a UC-E07)
- ✅ Dashboard básico (UC-E08 a UC-E12)
- ✅ Ver y completar misiones (UC-E13, UC-E14, UC-E23)
- ✅ Completar actividades básicas (UC-E15, UC-E19, UC-E20)
- ✅ Sistema de niveles (UC-S01, UC-S04)
- ✅ Crear misiones (UC-D12)
- ✅ Crear actividades básicas (UC-D21, UC-D25, UC-D26)

**Entregables:**
- Estudiante puede completar misiones
- Docente puede crear contenido
- Sistema calcula niveles automáticamente
- Dashboard muestra progreso básico

**Prioridad:** 🔴 CRÍTICA

---

### Fase 2: Gamificación (3-4 semanas)

**Objetivo:** Sistema de engagement completo

**Casos de Uso a Implementar:**
- ✅ Sistema de badges (UC-E25, UC-E26, UC-E27)
- ✅ Verificación automática de badges (UC-S03, UC-S06)
- ✅ Sistema de rachas (UC-E11, UC-S02, UC-S07, UC-S09, UC-S10)
- ✅ Leaderboard (UC-E28, UC-S05)
- ✅ Historial de puntos (UC-E29)
- ✅ Gestión de badges admin (UC-A23 a UC-A30)

**Entregables:**
- Badges se otorgan automáticamente
- Racha funciona correctamente
- Leaderboard en tiempo real
- Admin puede crear badges personalizados

**Prioridad:** 🟠 ALTA

---

### Fase 3: Gestión Avanzada (4-5 semanas)

**Objetivo:** Herramientas completas para docentes y admins

**Casos de Uso a Implementar:**
- ✅ Gestión de estudiantes (UC-D05 a UC-D11)
- ✅ Todas las actividades restantes (UC-E16, UC-E17, UC-E18)
- ✅ Todas las creaciones de actividades (UC-D22, UC-D23, UC-D24)
- ✅ Reportes docente (UC-D33 a UC-D38)
- ✅ Gestión de usuarios admin (UC-A06 a UC-A17)
- ✅ Configuración del sistema (UC-A31 a UC-A38)

**Entregables:**
- Docente puede ver progreso detallado
- Docente puede generar reportes
- Admin puede gestionar usuarios
- Admin puede configurar sistema

**Prioridad:** 🟡 MEDIA

---

### Fase 4: Características Premium (3-4 semanas)

**Objetivo:** Funcionalidades avanzadas y pulido

**Casos de Uso a Implementar:**
- ✅ Sistema de mensajería (UC-D39 a UC-D41)
- ✅ Reportes avanzados (UC-A39 to UC-A44)
- ✅ Bonificaciones manuales (UC-D42, UC-D43)
- ✅ Gestión avanzada de puntos (UC-A45 a UC-A47)
- ✅ Filtros y búsquedas (UC-E32, UC-E33, UC-E34)
- ✅ Reintentos de actividades (UC-E22)

**Entregables:**
- Sistema de mensajería funcional
- Reportes exportables
- Bonificaciones manuales
- Búsquedas y filtros avanzados

**Prioridad:** 🟢 BAJA

---

## 🔐 Consideraciones de Seguridad por Caso de Uso

### Nivel de Seguridad CRÍTICO 🔴

**Casos de Uso:**
- UC-E01: Registrarse (validación de email, contraseña fuerte)
- UC-E02: Iniciar Sesión (rate limiting, protección brute force)
- UC-E06: Cambiar Contraseña (verificar contraseña actual)
- UC-E07: Recuperar Contraseña (token temporal, expiración)
- UC-A08: Editar Usuario (verificar permisos)
- UC-A09: Eliminar Usuario (soft delete, auditoría)
- UC-A13: Cambiar Rol Usuario (auditoría obligatoria)

**Medidas:**
- Implementar rate limiting
- Usar bcrypt para contraseñas
- Tokens JWT con expiración
- Auditoría completa de cambios
- RLS en todas las tablas

### Nivel de Seguridad ALTO 🟠

**Casos de Uso:**
- UC-D12 a UC-D32: Gestión de contenido (validar ownership)
- UC-A23 a UC-A47: Gestión admin (verificar rol)
- UC-D42: Otorgar puntos manuales (auditar)
- UC-A46: Ajustar puntos manualmente (auditar)

**Medidas:**
- Verificar ownership antes de editar/eliminar
- Verificar rol de administrador
- Registrar en logs de auditoría
- Validar límites (ej: no más de 10000 puntos)

### Nivel de Seguridad MEDIO 🟡

**Casos de Uso:**
- UC-E15 a UC-E20: Completar actividades (validar respuestas server-side)
- UC-E23: Completar misión (verificar que todas las actividades estén completadas)
- UC-D05 a UC-D11: Ver progreso estudiantes (RLS)

**Medidas:**
- Validación server-side de respuestas
- No confiar en datos del cliente
- Aplicar RLS correctamente
- Verificar que el usuario tiene acceso

---

## 📊 Métricas de Éxito por Caso de Uso

### Métricas para Estudiantes

| Caso de Uso | Métrica Clave | Objetivo |
|-------------|---------------|----------|
| UC-E02: Iniciar Sesión | Tasa de éxito | > 99% |
| UC-E14: Iniciar Misión | Conversión | > 70% |
| UC-E15-E20: Completar Actividades | Tasa de completitud | > 80% |
| UC-E23: Completar Misión | Tiempo promedio | < 20 min |
| UC-E28: Ver Leaderboard | Engagement | > 50% usuarios |

### Métricas para Docentes

| Caso de Uso | Métrica Clave | Objetivo |
|-------------|---------------|----------|
| UC-D12: Crear Misión | Tiempo de creación | < 10 min |
| UC-D21-D26: Crear Actividades | Actividades por misión | 5-10 |
| UC-D33: Generar Reportes | Tiempo de generación | < 5 seg |
| UC-D06: Ver Progreso Individual | Frecuencia de uso | > 3x/semana |

### Métricas para Sistema

| Caso de Uso | Métrica Clave | Objetivo |
|-------------|---------------|----------|
| UC-S01: Calcular Nivel | Tiempo de ejecución | < 100ms |
| UC-S02: Actualizar Racha | Precisión | 100% |
| UC-S03: Verificar Badges | Tiempo de ejecución | < 200ms |
| UC-S04: Registrar Transacción | Integridad | 100% |

---

## 🎨 Diseño de UI por Caso de Uso

### Pantallas Principales Necesarias

1. **Pantalla de Login** (UC-E02)
   - Formulario simple
   - Opción "Recordarme"
   - Link a recuperar contraseña
   - Link a registro

2. **Dashboard Estudiante** (UC-E08)
   - Tarjeta de nivel y puntos (UC-E10)
   - Tarjeta de racha (UC-E11)
   - Lista de misiones disponibles (UC-E13)
   - Badges recientes (UC-E25)
   - Gráfico de progreso (UC-E09)

3. **Pantalla de Misión** (UC-E14, UC-E24)
   - Información de la misión
   - Barra de progreso
   - Lista de actividades
   - Botón "Iniciar" o "Continuar"

4. **Pantalla de Actividad** (UC-E15-E20)
   - Enunciado claro
   - Área de respuesta (según tipo)
   - Temporizador (si aplica)
   - Botón "Enviar"
   - Retroalimentación (UC-E21)

5. **Pantalla de Leaderboard** (UC-E28)
   - Top 10 usuarios
   - Posición del usuario actual
   - Filtros (por periodo, por nivel)

6. **Panel de Creación de Misión** (UC-D12)
   - Formulario multi-paso
   - Preview en tiempo real
   - Validación inline

7. **Panel de Creación de Actividad** (UC-D21-D26)
   - Selector de tipo de actividad
   - Formulario dinámico según tipo
   - Preview de la actividad

8. **Dashboard Docente** (UC-D02)
   - Estadísticas de estudiantes (UC-D03)
   - Misiones creadas (UC-D04)
   - Progreso grupal (UC-D07)
   - Acceso rápido a reportes (UC-D33)

9. **Dashboard Admin** (UC-A02)
   - Estadísticas globales (UC-A03)
   - Usuarios pendientes de aprobación (UC-A11)
   - Métricas de uso (UC-A04)
   - Acceso a configuración (UC-A31-A38)

10. **Panel de Gestión de Badges** (UC-A23-A30)
    - Lista de badges
    - Formulario de creación/edición
    - Estadísticas de badges ganados

---

## 🔄 Procesos Automáticos Detallados

### UC-S01: Calcular Nivel de Estudiante

**Trigger:** Después de completar misión (UC-E23)

**Algoritmo:**
```typescript
function calcularNivel(puntosTotal: number): number {
  const umbrales = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  
  for (let i = umbrales.length - 1; i >= 0; i--) {
    if (puntosTotal >= umbrales[i]) {
      return i + 1;
    }
  }
  
  return 1;
}
```

**Acciones:**
1. Obtener puntos totales del estudiante
2. Calcular nivel según umbrales
3. Actualizar `progreso_estudiantes.nivel_actual`
4. Si cambió de nivel, enviar notificación

---

### UC-S02: Actualizar Racha Diaria

**Trigger:** Después de completar cualquier actividad (UC-E15-E20)

**Algoritmo:**
```typescript
function actualizarRacha(userId: string, fechaActividad: Date) {
  const racha = obtenerRacha(userId);
  const ultimaActividad = racha.last_activity_date;
  
  if (esMismoDia(fechaActividad, ultimaActividad)) {
    // No hacer nada
    return racha;
  }
  
  if (esDiaConsecutivo(fechaActividad, ultimaActividad)) {
    // Incrementar racha
    racha.current_streak += 1;
    racha.total_active_days += 1;
    
    if (racha.current_streak > racha.longest_streak) {
      racha.longest_streak = racha.current_streak;
    }
  } else {
    // Racha rota, resetear
    racha.current_streak = 1;
    racha.total_active_days += 1;
    racha.streak_started_at = fechaActividad;
  }
  
  racha.last_activity_date = fechaActividad;
  actualizarRachaEnBD(racha);
  
  return racha;
}
```

**Acciones:**
1. Obtener racha actual del usuario
2. Comparar fecha de última actividad
3. Incrementar, mantener o resetear según corresponda
4. Actualizar `gamification_streaks`
5. Si racha es múltiplo de 3, 7, 14 o 30, aplicar bonificación (UC-S07)

---

### UC-S03: Verificar y Otorgar Badges

**Trigger:** Después de calcular nivel (UC-S01)

**Algoritmo:**
```typescript
async function verificarYOtorgarBadges(userId: string) {
  const badgesActivos = await obtenerBadgesActivos();
  const badgesUsuario = await obtenerBadgesUsuario(userId);
  const badgesIds = badgesUsuario.map(b => b.badge_id);
  
  for (const badge of badgesActivos) {
    // Si ya tiene el badge, skip
    if (badgesIds.includes(badge.id)) continue;
    
    // Verificar criterio
    const cumpleCriterio = await verificarCriterio(
      userId, 
      badge.criteria_type, 
      badge.criteria_value
    );
    
    if (cumpleCriterio) {
      // Otorgar badge
      await crearUserBadge(userId, badge.id);
      
      // Otorgar puntos de recompensa
      await registrarTransaccionPuntos(
        userId,
        badge.points_reward,
        'badge_earned',
        badge.id
      );
      
      // Enviar notificación
      await enviarNotificacion(userId, {
        tipo: 'badge_ganado',
        badgeId: badge.id,
        badgeName: badge.name,
        puntos: badge.points_reward
      });
    }
  }
}

async function verificarCriterio(
  userId: string, 
  tipo: string, 
  valor: number
): Promise<boolean> {
  switch (tipo) {
    case 'missions_completed':
      const misionesCompletadas = await contarMisionesCompletadas(userId);
      return misionesCompletadas >= valor;
      
    case 'points_reached':
      const puntosTotales = await obtenerPuntosTotales(userId);
      return puntosTotales >= valor;
      
    case 'streak_days':
      const racha = await obtenerRacha(userId);
      return racha.current_streak >= valor;
      
    case 'perfect_scores':
      const perfectos = await contarScoresPerfectos(userId);
      return perfectos >= valor;
      
    case 'speed_bonus':
      const rapidos = await contarCompletacionesRapidas(userId);
      return rapidos >= valor;
      
    default:
      return false;
  }
}
```

**Acciones:**
1. Obtener todos los badges activos
2. Obtener badges que ya tiene el usuario
3. Para cada badge que no tiene:
   - Verificar si cumple el criterio
   - Si cumple, otorgar badge
   - Registrar transacción de puntos
   - Enviar notificación

---

## 📝 Validaciones Necesarias

### Por Tipo de Actividad

#### Quiz (UC-D21, UC-E15)
```typescript
interface QuizContentData {
  questions: Array<{
    question: string;
    options: string[];
    correct: number; // índice de la respuesta correcta
  }>;
}

// Validaciones:
- questions.length > 0
- Cada question tiene texto no vacío
- Cada question tiene al menos 2 options
- correct es un índice válido (0 <= correct < options.length)
```

#### Matching (UC-D22, UC-E16)
```typescript
interface MatchingContentData {
  pairs: Array<{
    left: string;
    right: string;
  }>;
}

// Validaciones:
- pairs.length >= 2
- Cada left y right tienen texto no vacío
- No hay duplicados en left
- No hay duplicados en right
```

#### Fill in the Blank (UC-D23, UC-E17)
```typescript
interface FillInBlankContentData {
  sentence: string;
  blanks: Array<{
    position: number;
    answer: string;
    alternatives?: string[];
  }>;
}

// Validaciones:
- sentence contiene al menos un "_"
- blanks.length > 0
- Cada position es válido
- Cada answer tiene texto no vacío
```

---

## 🚀 Optimizaciones Recomendadas

### Optimizaciones de Base de Datos

1. **Índices Compuestos**
   ```sql
   -- Para consultas de leaderboard
   CREATE INDEX idx_progreso_leaderboard 
   ON progreso_estudiantes(puntaje_total DESC, nivel_actual DESC);
   
   -- Para consultas de misiones de usuario
   CREATE INDEX idx_mission_attempts_user_status 
   ON gamification_mission_attempts(user_id, status, completed_at DESC);
   ```

2. **Vistas Materializadas**
   ```sql
   -- Vista de leaderboard (actualizar cada hora)
   CREATE MATERIALIZED VIEW leaderboard_view AS
   SELECT 
     u.id_usuario,
     u.nombre,
     u.apellido,
     p.puntaje_total,
     p.nivel_actual,
     COUNT(DISTINCT ub.badge_id) as badges_count,
     ROW_NUMBER() OVER (ORDER BY p.puntaje_total DESC) as rank
   FROM usuarios u
   JOIN progreso_estudiantes p ON p.id_estudiante = u.id_usuario
   LEFT JOIN gamification_user_badges ub ON ub.user_id = u.id_usuario
   WHERE u.rol = 'estudiante' AND u.estado_cuenta = 'activo'
   GROUP BY u.id_usuario, p.id_progreso
   ORDER BY p.puntaje_total DESC;
   ```

3. **Caching**
   - Cachear badges activos (raramente cambian)
   - Cachear configuración del sistema (raramente cambia)
   - Cachear leaderboard (actualizar cada 5 minutos)

### Optimizaciones de Frontend

1. **Lazy Loading**
   - Cargar actividades de misión bajo demanda
   - Cargar historial de actividades con paginación
   - Cargar leaderboard completo solo cuando se solicita

2. **Optimistic Updates**
   - Al completar actividad, actualizar UI inmediatamente
   - Si falla, revertir cambios
   - Mejora percepción de velocidad

3. **Real-time Updates**
   - Usar Supabase Realtime para leaderboard
   - Notificaciones de badges en tiempo real
   - Actualización de racha en tiempo real

---

## 📚 Documentación Adicional Necesaria

Para cada caso de uso, crear:

1. **Especificación Funcional**
   - Descripción detallada
   - Precondiciones
   - Postcondiciones
   - Flujo principal
   - Flujos alternativos
   - Flujos de excepción

2. **Especificación Técnica**
   - Endpoints API necesarios
   - Estructura de datos
   - Validaciones
   - Lógica de negocio
   - Queries SQL

3. **Casos de Prueba**
   - Casos de prueba positivos
   - Casos de prueba negativos
   - Casos de prueba de borde
   - Casos de prueba de integración

4. **Documentación de UI**
   - Wireframes
   - Mockups
   - Flujo de usuario
   - Interacciones

---

## ✅ Checklist de Implementación

### Para Cada Caso de Uso

- [ ] Especificación funcional escrita
- [ ] Especificación técnica escrita
- [ ] Diseño de UI aprobado
- [ ] Endpoints API implementados
- [ ] Validaciones implementadas
- [ ] RLS configurado
- [ ] Lógica de negocio implementada
- [ ] Tests unitarios escritos
- [ ] Tests de integración escritos
- [ ] Documentación actualizada
- [ ] Code review completado
- [ ] QA testing completado
- [ ] Deployed a staging
- [ ] User acceptance testing
- [ ] Deployed a production

---

**Documento creado:** 2024-12-16  
**Versión:** 1.0  
**Estado:** ✅ Completo
