# 📊 Diagrama de Casos de Uso - English27

## 🎯 Descripción General

Este documento describe todos los casos de uso del sistema English27, una plataforma educativa gamificada para el aprendizaje de inglés. El sistema tiene tres tipos de actores principales: **Estudiantes**, **Docentes** y **Administradores**.

---

## 👥 Actores del Sistema

### 1. 👨‍🎓 Estudiante
Usuario que utiliza la plataforma para aprender inglés a través de actividades gamificadas.

### 2. 👨‍🏫 Docente
Usuario que crea y gestiona contenido educativo, asigna actividades y supervisa el progreso de los estudiantes.

### 3. 👨‍💼 Administrador
Usuario con permisos completos que gestiona usuarios, configuraciones del sistema y supervisa la plataforma.

### 4. 🤖 Sistema (Actor Secundario)
El sistema automatizado que ejecuta procesos en segundo plano (cálculo de niveles, otorgamiento de badges, etc.).

---

## 📋 Casos de Uso por Actor

## 👨‍🎓 ESTUDIANTE

### 🔐 Autenticación y Perfil
- **CU-E01**: Registrarse en la plataforma
- **CU-E02**: Iniciar sesión
- **CU-E03**: Cerrar sesión
- **CU-E04**: Ver perfil personal
- **CU-E05**: Editar información de perfil
- **CU-E06**: Cambiar contraseña
- **CU-E07**: Recuperar contraseña

### 📊 Dashboard y Progreso
- **CU-E08**: Ver dashboard personalizado
- **CU-E09**: Ver estadísticas de progreso
- **CU-E10**: Ver nivel actual y puntos
- **CU-E11**: Ver racha de días activos (streak)
- **CU-E12**: Ver historial de actividades completadas

### 🎯 Misiones y Actividades
- **CU-E13**: Ver misiones disponibles
- **CU-E14**: Iniciar una misión
- **CU-E15**: Completar actividad de tipo Quiz
- **CU-E16**: Completar actividad de tipo Matching
- **CU-E17**: Completar actividad de tipo Fill in the Blank
- **CU-E18**: Completar actividad de tipo Ordering
- **CU-E19**: Completar actividad de tipo Multiple Choice
- **CU-E20**: Completar actividad de tipo True/False
- **CU-E21**: Ver retroalimentación de actividad
- **CU-E22**: Reintentar actividad
- **CU-E23**: Completar misión completa
- **CU-E24**: Ver progreso de misión actual

### 🏆 Gamificación
- **CU-E25**: Ver badges ganados
- **CU-E26**: Ver badges disponibles
- **CU-E27**: Recibir notificación de badge ganado
- **CU-E28**: Ver tabla de clasificación (leaderboard)
- **CU-E29**: Ver historial de puntos
- **CU-E30**: Ver bonificaciones por racha

### 📚 Contenido Educativo
- **CU-E31**: Ver actividades asignadas por docente
- **CU-E32**: Filtrar misiones por dificultad
- **CU-E33**: Filtrar misiones por tipo (grammar, vocabulary, etc.)
- **CU-E34**: Buscar misiones por tema

### 🌐 Configuración
- **CU-E35**: Cambiar idioma de interfaz (ES/EN)
- **CU-E36**: Ver notificaciones

---

## 👨‍🏫 DOCENTE

### 🔐 Autenticación (Hereda de Estudiante)
- **CU-D01**: Todos los casos de uso de autenticación de estudiante (CU-E01 a CU-E07)

### 📊 Dashboard Docente
- **CU-D02**: Ver dashboard de docente
- **CU-D03**: Ver estadísticas de estudiantes
- **CU-D04**: Ver resumen de actividades creadas

### 👥 Gestión de Estudiantes
- **CU-D05**: Ver lista de estudiantes
- **CU-D06**: Ver progreso individual de estudiante
- **CU-D07**: Ver progreso grupal de estudiantes
- **CU-D08**: Filtrar estudiantes por nivel
- **CU-D09**: Buscar estudiante
- **CU-D10**: Ver historial de actividades de estudiante
- **CU-D11**: Ver badges ganados por estudiante

### 🎯 Gestión de Misiones
- **CU-D12**: Crear nueva misión
- **CU-D13**: Editar misión existente
- **CU-D14**: Eliminar misión
- **CU-D15**: Activar/Desactivar misión
- **CU-D16**: Ver lista de misiones creadas
- **CU-D17**: Duplicar misión
- **CU-D18**: Configurar dificultad de misión
- **CU-D19**: Configurar puntos base de misión
- **CU-D20**: Asignar orden a misiones

### 📝 Gestión de Actividades
- **CU-D21**: Crear actividad tipo Quiz
- **CU-D22**: Crear actividad tipo Matching
- **CU-D23**: Crear actividad tipo Fill in the Blank
- **CU-D24**: Crear actividad tipo Ordering
- **CU-D25**: Crear actividad tipo Multiple Choice
- **CU-D26**: Crear actividad tipo True/False
- **CU-D27**: Editar actividad existente
- **CU-D28**: Eliminar actividad
- **CU-D29**: Configurar puntos de actividad
- **CU-D30**: Configurar límite de tiempo de actividad
- **CU-D31**: Activar/Desactivar actividad
- **CU-D32**: Reordenar actividades dentro de misión

### 📊 Reportes y Análisis
- **CU-D33**: Generar reporte de progreso de estudiante
- **CU-D34**: Generar reporte grupal
- **CU-D35**: Ver estadísticas de misiones
- **CU-D36**: Ver tasa de completitud de actividades
- **CU-D37**: Ver tiempo promedio de completitud
- **CU-D38**: Exportar reportes

### 💬 Comunicación
- **CU-D39**: Enviar mensaje a estudiante
- **CU-D40**: Ver mensajes recibidos
- **CU-D41**: Enviar anuncio grupal

### 🎁 Bonificaciones
- **CU-D42**: Otorgar puntos manuales a estudiante
- **CU-D43**: Ver historial de puntos otorgados

---

## 👨‍💼 ADMINISTRADOR

### 🔐 Autenticación (Hereda de Estudiante)
- **CU-A01**: Todos los casos de uso de autenticación (CU-E01 a CU-E07)

### 📊 Dashboard Administrador
- **CU-A02**: Ver dashboard administrativo
- **CU-A03**: Ver estadísticas globales del sistema
- **CU-A04**: Ver métricas de uso
- **CU-A05**: Ver usuarios activos en tiempo real

### 👥 Gestión de Usuarios
- **CU-A06**: Ver lista de todos los usuarios
- **CU-A07**: Crear nuevo usuario
- **CU-A08**: Editar usuario existente
- **CU-A09**: Eliminar usuario
- **CU-A10**: Activar/Desactivar cuenta de usuario
- **CU-A11**: Aprobar solicitud de registro
- **CU-A12**: Rechazar solicitud de registro
- **CU-A13**: Cambiar rol de usuario
- **CU-A14**: Resetear contraseña de usuario
- **CU-A15**: Ver historial de actividad de usuario
- **CU-A16**: Filtrar usuarios por rol
- **CU-A17**: Filtrar usuarios por estado

### 🎯 Gestión de Contenido (Hereda de Docente)
- **CU-A18**: Todos los casos de uso de gestión de misiones (CU-D12 a CU-D20)
- **CU-A19**: Todos los casos de uso de gestión de actividades (CU-D21 a CU-D32)
- **CU-A20**: Ver todas las misiones del sistema
- **CU-A21**: Editar misiones de cualquier docente
- **CU-A22**: Eliminar misiones de cualquier docente

### 🏆 Gestión de Gamificación
- **CU-A23**: Crear nuevo badge
- **CU-A24**: Editar badge existente
- **CU-A25**: Eliminar badge
- **CU-A26**: Activar/Desactivar badge
- **CU-A27**: Configurar criterios de badge
- **CU-A28**: Configurar recompensa de badge
- **CU-A29**: Otorgar badge manualmente
- **CU-A30**: Ver estadísticas de badges

### ⚙️ Configuración del Sistema
- **CU-A31**: Configurar puntos por misión según dificultad
- **CU-A32**: Configurar puntos por actividad
- **CU-A33**: Configurar bonificación por racha
- **CU-A34**: Configurar umbrales de niveles
- **CU-A35**: Activar/Desactivar leaderboard
- **CU-A36**: Activar/Desactivar sistema de badges
- **CU-A37**: Configurar límites del sistema
- **CU-A38**: Ver configuración actual

### 📊 Reportes Avanzados
- **CU-A39**: Ver reporte global de progreso
- **CU-A40**: Ver reporte de uso del sistema
- **CU-A41**: Ver reporte de actividades más populares
- **CU-A42**: Ver reporte de badges más ganados
- **CU-A43**: Exportar datos del sistema
- **CU-A44**: Ver logs de auditoría

### 💰 Gestión de Puntos
- **CU-A45**: Ver historial global de transacciones de puntos
- **CU-A46**: Ajustar puntos de usuario manualmente
- **CU-A47**: Ver estadísticas de distribución de puntos

---

## 🤖 SISTEMA (Casos de Uso Automáticos)

### 🔄 Procesos Automáticos
- **CU-S01**: Calcular nivel de estudiante al completar misión
- **CU-S02**: Actualizar racha diaria de estudiante
- **CU-S03**: Verificar y otorgar badges automáticamente
- **CU-S04**: Registrar transacción de puntos
- **CU-S05**: Actualizar tabla de clasificación
- **CU-S06**: Enviar notificación de logro
- **CU-S07**: Calcular bonificación por racha
- **CU-S08**: Actualizar estadísticas de progreso
- **CU-S09**: Resetear racha si se rompe
- **CU-S10**: Actualizar longest_streak si aplica

---

## 🔗 Relaciones entre Casos de Uso

### Relaciones de Inclusión (<<include>>)

1. **CU-E15 a CU-E20** (Completar actividades) <<include>> **CU-E21** (Ver retroalimentación)
2. **CU-E23** (Completar misión) <<include>> **CU-S01** (Calcular nivel)
3. **CU-E23** (Completar misión) <<include>> **CU-S04** (Registrar transacción)
4. **CU-E15 a CU-E20** (Completar actividades) <<include>> **CU-S02** (Actualizar racha)
5. **CU-S01** (Calcular nivel) <<include>> **CU-S03** (Verificar badges)
6. **CU-S03** (Verificar badges) <<include>> **CU-S06** (Enviar notificación)
7. **CU-D12** (Crear misión) <<include>> **CU-D21 a CU-D26** (Crear actividades)

### Relaciones de Extensión (<<extend>>)

1. **CU-E22** (Reintentar actividad) <<extend>> **CU-E15 a CU-E20** (Completar actividades)
2. **CU-E27** (Recibir notificación de badge) <<extend>> **CU-S03** (Verificar badges)
3. **CU-S07** (Calcular bonificación por racha) <<extend>> **CU-S02** (Actualizar racha)
4. **CU-D42** (Otorgar puntos manuales) <<extend>> **CU-S04** (Registrar transacción)

### Relaciones de Generalización

1. **Docente** hereda todos los casos de uso de autenticación de **Estudiante**
2. **Administrador** hereda todos los casos de uso de autenticación de **Estudiante**
3. **Administrador** hereda casos de uso de gestión de contenido de **Docente**

---

## 📊 Matriz de Casos de Uso por Actor

| Categoría | Estudiante | Docente | Administrador | Sistema |
|-----------|------------|---------|---------------|---------|
| Autenticación | 7 | 7 | 7 | 0 |
| Dashboard | 5 | 3 | 4 | 0 |
| Gestión de Usuarios | 0 | 11 | 12 | 0 |
| Misiones | 12 | 9 | 14 | 0 |
| Actividades | 9 | 12 | 12 | 0 |
| Gamificación | 6 | 2 | 8 | 10 |
| Reportes | 0 | 6 | 6 | 0 |
| Configuración | 2 | 0 | 8 | 0 |
| Comunicación | 0 | 3 | 0 | 0 |
| **TOTAL** | **41** | **53** | **71** | **10** |

---

## 🎨 Diagrama Visual (Descripción)

### Estructura del Diagrama

```
┌─────────────────────────────────────────────────────────────────┐
│                     SISTEMA ENGLISH27                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  👨‍🎓 ESTUDIANTE                                                   │
│  ├── Autenticación (7 CU)                                        │
│  ├── Dashboard y Progreso (5 CU)                                 │
│  ├── Misiones y Actividades (12 CU)                              │
│  ├── Gamificación (6 CU)                                         │
│  ├── Contenido Educativo (4 CU)                                  │
│  └── Configuración (2 CU)                                        │
│                                                                   │
│  👨‍🏫 DOCENTE (hereda autenticación de Estudiante)                │
│  ├── Dashboard Docente (3 CU)                                    │
│  ├── Gestión de Estudiantes (11 CU)                              │
│  ├── Gestión de Misiones (9 CU)                                  │
│  ├── Gestión de Actividades (12 CU)                              │
│  ├── Reportes y Análisis (6 CU)                                  │
│  ├── Comunicación (3 CU)                                         │
│  └── Bonificaciones (2 CU)                                       │
│                                                                   │
│  👨‍💼 ADMINISTRADOR (hereda de Estudiante y Docente)              │
│  ├── Dashboard Administrador (4 CU)                              │
│  ├── Gestión de Usuarios (12 CU)                                 │
│  ├── Gestión de Contenido (heredado + 5 CU adicionales)          │
│  ├── Gestión de Gamificación (8 CU)                              │
│  ├── Configuración del Sistema (8 CU)                            │
│  ├── Reportes Avanzados (6 CU)                                   │
│  └── Gestión de Puntos (3 CU)                                    │
│                                                                   │
│  🤖 SISTEMA (Procesos Automáticos)                               │
│  ├── Cálculo de Niveles (1 CU)                                   │
│  ├── Gestión de Rachas (3 CU)                                    │
│  ├── Gestión de Badges (2 CU)                                    │
│  ├── Transacciones de Puntos (1 CU)                              │
│  ├── Notificaciones (1 CU)                                       │
│  └── Actualizaciones de Estadísticas (2 CU)                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Descripción Detallada de Casos de Uso Principales

### CU-E14: Iniciar una Misión

**Actor Principal:** Estudiante  
**Precondiciones:** 
- Usuario autenticado como estudiante
- Misión está activa
- Estudiante no ha completado la misión

**Flujo Principal:**
1. Estudiante selecciona una misión del listado
2. Sistema muestra detalles de la misión (título, descripción, dificultad, puntos)
3. Estudiante hace clic en "Iniciar Misión"
4. Sistema crea registro en `gamification_mission_attempts` con status 'in_progress'
5. Sistema muestra la primera actividad de la misión
6. Sistema inicia temporizador

**Postcondiciones:**
- Se crea un intento de misión
- El estudiante puede comenzar a completar actividades

**Flujos Alternativos:**
- 3a. Misión ya iniciada: Sistema muestra progreso actual

---

### CU-E15: Completar Actividad de tipo Quiz

**Actor Principal:** Estudiante  
**Actores Secundarios:** Sistema

**Precondiciones:**
- Misión iniciada
- Actividad no completada previamente o permite reintentos

**Flujo Principal:**
1. Sistema muestra pregunta y opciones de respuesta
2. Estudiante selecciona respuesta(s)
3. Estudiante hace clic en "Enviar"
4. Sistema valida respuesta
5. Sistema calcula puntos obtenidos
6. Sistema crea registro en `gamification_activity_attempts`
7. Sistema actualiza progreso de misión
8. **<<include>> CU-E21**: Sistema muestra retroalimentación
9. **<<include>> CU-S02**: Sistema actualiza racha
10. Sistema muestra siguiente actividad o completa misión

**Postcondiciones:**
- Actividad marcada como completada
- Puntos registrados
- Racha actualizada

**Flujos Alternativos:**
- 4a. Respuesta incorrecta: Sistema muestra retroalimentación negativa
- 10a. Era última actividad: **<<include>> CU-E23** (Completar misión)

---

### CU-E23: Completar Misión Completa

**Actor Principal:** Estudiante  
**Actores Secundarios:** Sistema

**Precondiciones:**
- Todas las actividades de la misión completadas

**Flujo Principal:**
1. Sistema detecta que todas las actividades están completadas
2. Sistema calcula puntaje total de la misión
3. Sistema actualiza `gamification_mission_attempts.status` a 'completed'
4. **<<include>> CU-S01**: Sistema calcula y actualiza nivel del estudiante
5. **<<include>> CU-S04**: Sistema registra transacción de puntos
6. **<<include>> CU-S03**: Sistema verifica elegibilidad para badges
7. Sistema muestra pantalla de felicitación con:
   - Puntos ganados
   - Nuevo nivel (si cambió)
   - Badges ganados (si aplica)
   - Estadísticas de la misión
8. Sistema actualiza `progreso_estudiantes`

**Postcondiciones:**
- Misión marcada como completada
- Puntos agregados al total del estudiante
- Nivel actualizado si corresponde
- Badges otorgados si cumple criterios

---

### CU-D12: Crear Nueva Misión

**Actor Principal:** Docente

**Precondiciones:**
- Usuario autenticado como docente o administrador

**Flujo Principal:**
1. Docente accede a panel de creación de misiones
2. Sistema muestra formulario de nueva misión
3. Docente ingresa:
   - Número de unidad
   - Tema
   - Título
   - Descripción
   - Nivel de dificultad (fácil, medio, difícil)
   - Tipo de misión (grammar, vocabulary, etc.)
   - Duración estimada
   - Puntos base
4. Docente hace clic en "Crear Misión"
5. Sistema valida datos
6. Sistema crea registro en `gamification_missions`
7. Sistema muestra mensaje de éxito
8. **<<include>> CU-D21 a CU-D26**: Docente puede agregar actividades

**Postcondiciones:**
- Nueva misión creada
- Misión disponible para agregar actividades

**Flujos Alternativos:**
- 5a. Datos inválidos: Sistema muestra errores de validación

---

### CU-D21: Crear Actividad tipo Quiz

**Actor Principal:** Docente

**Precondiciones:**
- Misión creada
- Usuario autenticado como docente o administrador

**Flujo Principal:**
1. Docente selecciona misión
2. Docente hace clic en "Agregar Actividad"
3. Docente selecciona tipo "Quiz"
4. Sistema muestra formulario de quiz
5. Docente ingresa:
   - Título de actividad
   - Instrucciones
   - Preguntas con opciones múltiples
   - Respuestas correctas
   - Puntos por pregunta
   - Límite de tiempo (opcional)
6. Docente hace clic en "Guardar Actividad"
7. Sistema valida datos
8. Sistema crea registro en `gamification_activities` con `content_data` en formato JSON
9. Sistema muestra mensaje de éxito

**Postcondiciones:**
- Actividad creada y asociada a la misión
- Actividad disponible para estudiantes

---

### CU-A23: Crear Nuevo Badge

**Actor Principal:** Administrador

**Precondiciones:**
- Usuario autenticado como administrador

**Flujo Principal:**
1. Administrador accede a panel de badges
2. Administrador hace clic en "Crear Badge"
3. Sistema muestra formulario
4. Administrador ingresa:
   - Nombre del badge
   - Descripción
   - Icono/emoji
   - Tipo de badge (achievement, milestone, special, seasonal)
   - Tipo de criterio (missions_completed, points_reached, etc.)
   - Valor del criterio (umbral)
   - Puntos de recompensa
   - Rareza (common, rare, epic, legendary)
5. Administrador hace clic en "Crear"
6. Sistema valida datos
7. Sistema crea registro en `gamification_badges`
8. Sistema muestra mensaje de éxito

**Postcondiciones:**
- Nuevo badge creado
- Badge disponible para ser ganado por estudiantes

---

### CU-S03: Verificar y Otorgar Badges Automáticamente

**Actor Principal:** Sistema

**Precondiciones:**
- Estudiante completó una acción que puede desbloquear badges

**Flujo Principal:**
1. Sistema obtiene todos los badges activos
2. Para cada badge:
   - Sistema verifica si estudiante ya lo tiene
   - Sistema evalúa criterio del badge:
     - `missions_completed`: Cuenta misiones completadas
     - `points_reached`: Verifica puntos totales
     - `streak_days`: Verifica racha actual
     - `perfect_scores`: Cuenta scores del 100%
     - `speed_bonus`: Cuenta completaciones rápidas
3. Si cumple criterio y no tiene el badge:
   - Sistema crea registro en `gamification_user_badges`
   - Sistema otorga puntos de recompensa
   - **<<include>> CU-S04**: Sistema registra transacción de puntos
   - **<<extend>> CU-S06**: Sistema envía notificación

**Postcondiciones:**
- Badges otorgados si cumple criterios
- Puntos de recompensa agregados
- Notificaciones enviadas

---

## 🔍 Casos de Uso Críticos

Los siguientes casos de uso son críticos para el funcionamiento del sistema:

1. **CU-E02** (Iniciar sesión) - Sin esto, nadie puede usar el sistema
2. **CU-E14** (Iniciar misión) - Funcionalidad core del estudiante
3. **CU-E15 a CU-E20** (Completar actividades) - Funcionalidad core del aprendizaje
4. **CU-S01** (Calcular nivel) - Core de gamificación
5. **CU-S02** (Actualizar racha) - Core de engagement
6. **CU-D12** (Crear misión) - Sin esto, no hay contenido
7. **CU-A06** (Gestión de usuarios) - Administración básica

---

## 📈 Priorización de Implementación

### Fase 1 - MVP (Mínimo Producto Viable)
- Autenticación completa (CU-E01 a CU-E07)
- Dashboard básico estudiante (CU-E08 a CU-E12)
- Completar actividades básicas (CU-E13 a CU-E24)
- Crear misiones y actividades (CU-D12, CU-D21 a CU-D26)
- Sistema automático de niveles (CU-S01, CU-S04)

### Fase 2 - Gamificación
- Sistema de badges (CU-E25 a CU-E27, CU-S03, CU-S06)
- Sistema de rachas (CU-E11, CU-S02, CU-S07, CU-S09, CU-S10)
- Leaderboard (CU-E28)
- Gestión de badges admin (CU-A23 a CU-A30)

### Fase 3 - Gestión Avanzada
- Gestión de estudiantes (CU-D05 a CU-D11)
- Reportes docente (CU-D33 a CU-D38)
- Gestión de usuarios admin (CU-A06 a CU-A17)
- Configuración del sistema (CU-A31 a CU-A38)

### Fase 4 - Características Avanzadas
- Sistema de mensajería (CU-D39 a CU-D41)
- Reportes avanzados (CU-A39 a CU-A44)
- Bonificaciones manuales (CU-D42, CU-D43, CU-A45 a CU-A47)

---

## 📊 Métricas de Éxito

Para cada caso de uso, se deben medir:

- **Tasa de éxito**: % de veces que el caso de uso se completa exitosamente
- **Tiempo promedio**: Tiempo que toma completar el caso de uso
- **Frecuencia de uso**: Cuántas veces se ejecuta el caso de uso
- **Errores**: Cantidad de errores encontrados

---

## 🔐 Consideraciones de Seguridad

### Validaciones Necesarias por Caso de Uso

- **Autenticación**: Todos los CU requieren verificación de sesión activa
- **Autorización**: Verificar rol del usuario antes de ejecutar CU
- **Validación de datos**: Todos los formularios deben validar entrada
- **RLS (Row Level Security)**: Aplicado en todos los CU que acceden a BD
- **Rate limiting**: Aplicar en CU de autenticación y creación de contenido

---

## 📝 Notas de Implementación

1. **Todos los casos de uso de estudiante** están implementados con RLS para garantizar que solo vean sus propios datos
2. **Los casos de uso de docente** tienen acceso a datos de sus estudiantes asignados
3. **Los casos de uso de administrador** tienen acceso completo pero con auditoría
4. **Los casos de uso del sistema** se ejecutan con permisos elevados pero están auditados
5. **Todas las transacciones de puntos** quedan registradas en `gamification_points_transactions`

---

**Documento creado:** 2024-12-16  
**Versión:** 1.0  
**Estado:** ✅ Completo  
**Total de Casos de Uso:** 175 (41 Estudiante + 53 Docente + 71 Administrador + 10 Sistema)
