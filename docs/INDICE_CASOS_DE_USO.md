# 📚 Índice de Documentación - Diagrama de Casos de Uso

## 📖 Documentos Creados

Esta carpeta contiene la documentación completa del diagrama de casos de uso del sistema English27.

---

## 📄 Documentos Disponibles

### 1. 📊 DIAGRAMA_CASOS_DE_USO.md
**Descripción:** Documento principal con todos los casos de uso del sistema.

**Contenido:**
- ✅ 175 casos de uso detallados
- ✅ 4 actores del sistema (Estudiante, Docente, Administrador, Sistema)
- ✅ Casos de uso organizados por categoría
- ✅ Relaciones entre casos de uso (include, extend, generalización)
- ✅ Matriz de casos de uso por actor
- ✅ Descripción detallada de casos de uso principales
- ✅ Casos de uso críticos identificados
- ✅ Priorización por fases de implementación

**Casos de Uso por Actor:**
- 👨‍🎓 Estudiante: 41 casos de uso
- 👨‍🏫 Docente: 53 casos de uso
- 👨‍💼 Administrador: 71 casos de uso
- 🤖 Sistema: 10 procesos automáticos

**Cuándo usar:** Para entender todos los casos de uso del sistema y sus relaciones.

---

### 2. 🎨 diagrama_casos_uso.puml
**Descripción:** Diagrama UML en formato PlantUML para generar visualización gráfica.

**Contenido:**
- ✅ Diagrama UML completo
- ✅ Actores con iconos
- ✅ Casos de uso agrupados por paquetes
- ✅ Relaciones de herencia entre actores
- ✅ Relaciones include y extend
- ✅ Notas explicativas
- ✅ Estadísticas por actor

**Cómo usar:**
1. Copiar el contenido del archivo
2. Pegar en [PlantUML Online Editor](https://www.plantuml.com/plantuml/uml/)
3. Generar imagen PNG o SVG
4. Exportar para presentaciones

**Cuándo usar:** Para generar diagramas visuales profesionales para documentación o presentaciones.

---

### 3. 📈 RESUMEN_CASOS_DE_USO.md
**Descripción:** Resumen ejecutivo con estadísticas, priorización y recomendaciones.

**Contenido:**
- ✅ Estadísticas generales del sistema
- ✅ Top 10 casos de uso críticos con calificación
- ✅ Flujos de trabajo principales
- ✅ Priorización de implementación por fases (MVP, Gamificación, Gestión, Premium)
- ✅ Consideraciones de seguridad por nivel (Crítico, Alto, Medio)
- ✅ Métricas de éxito por caso de uso
- ✅ Diseño de UI necesario
- ✅ Procesos automáticos detallados
- ✅ Validaciones necesarias por tipo de actividad
- ✅ Optimizaciones recomendadas (BD, Frontend)
- ✅ Checklist de implementación

**Fases de Implementación:**
1. **Fase 1 - MVP** (4-6 semanas): Sistema funcional básico
2. **Fase 2 - Gamificación** (3-4 semanas): Badges, rachas, leaderboard
3. **Fase 3 - Gestión Avanzada** (4-5 semanas): Reportes, gestión de usuarios
4. **Fase 4 - Premium** (3-4 semanas): Mensajería, reportes avanzados

**Cuándo usar:** Para planificar la implementación, priorizar trabajo y entender métricas de éxito.

---

### 4. 💻 EJEMPLOS_IMPLEMENTACION_CASOS_USO.md
**Descripción:** Ejemplos completos de código para implementar casos de uso clave.

**Contenido:**
- ✅ UC-E14: Iniciar Misión (API, Service, Component)
- ✅ UC-E15: Completar Actividad Quiz (API, Component)
- ✅ UC-E23: Completar Misión (Database Function, API)
- ✅ UC-S01: Calcular Nivel (Trigger, TypeScript)
- ✅ UC-S02: Actualizar Racha (Database Function)
- ✅ UC-S03: Verificar y Otorgar Badges (Database Function)
- ✅ UC-D12: Crear Misión (React Component)
- ✅ UC-D21: Crear Actividad Quiz (pendiente en documento)

**Tecnologías:**
- Next.js 15 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- React Server Components
- API Routes

**Cuándo usar:** Para implementar casos de uso específicos con ejemplos de código completos.

---

### 5. 🖼️ diagrama_casos_uso.png
**Descripción:** Imagen generada del diagrama de casos de uso.

**Contenido:**
- ✅ Diagrama visual profesional
- ✅ Actores con iconos de colores
- ✅ Casos de uso agrupados por categorías
- ✅ Relaciones visuales
- ✅ Leyenda con totales

**Cuándo usar:** Para presentaciones, documentación visual o referencias rápidas.

---

## 🗺️ Guía de Uso

### Para Desarrolladores

**Empezar a implementar:**
1. Leer `DIAGRAMA_CASOS_DE_USO.md` para entender todos los casos de uso
2. Revisar `RESUMEN_CASOS_DE_USO.md` para ver la priorización
3. Usar `EJEMPLOS_IMPLEMENTACION_CASOS_USO.md` como referencia de código
4. Implementar siguiendo las fases definidas

**Implementar un caso de uso específico:**
1. Buscar el caso de uso en `DIAGRAMA_CASOS_DE_USO.md`
2. Leer la descripción detallada (precondiciones, flujo, postcondiciones)
3. Verificar si hay ejemplo de código en `EJEMPLOS_IMPLEMENTACION_CASOS_USO.md`
4. Revisar consideraciones de seguridad en `RESUMEN_CASOS_DE_USO.md`
5. Implementar siguiendo el patrón establecido

---

### Para Project Managers

**Planificar sprints:**
1. Revisar `RESUMEN_CASOS_DE_USO.md` - Sección "Priorización de Implementación"
2. Seleccionar casos de uso según la fase actual
3. Estimar esfuerzo basado en complejidad indicada
4. Asignar a desarrolladores

**Hacer seguimiento:**
1. Usar el checklist de implementación en `RESUMEN_CASOS_DE_USO.md`
2. Verificar métricas de éxito definidas
3. Revisar casos de uso críticos completados

---

### Para Diseñadores UI/UX

**Diseñar pantallas:**
1. Revisar `RESUMEN_CASOS_DE_USO.md` - Sección "Diseño de UI por Caso de Uso"
2. Ver las 10 pantallas principales necesarias
3. Leer flujos de trabajo en `RESUMEN_CASOS_DE_USO.md`
4. Diseñar siguiendo los casos de uso relacionados

**Validar diseños:**
1. Verificar que cada pantalla cubre los casos de uso asignados
2. Revisar flujos alternativos en `DIAGRAMA_CASOS_DE_USO.md`
3. Asegurar que se muestran validaciones y errores

---

### Para QA / Testers

**Crear casos de prueba:**
1. Leer caso de uso en `DIAGRAMA_CASOS_DE_USO.md`
2. Crear test cases para:
   - Flujo principal
   - Flujos alternativos
   - Flujos de excepción
3. Verificar validaciones en `RESUMEN_CASOS_DE_USO.md`

**Priorizar testing:**
1. Empezar con casos de uso críticos (🔴) en `RESUMEN_CASOS_DE_USO.md`
2. Continuar con casos de uso de alta prioridad (🟠)
3. Verificar métricas de éxito definidas

---

## 📊 Estadísticas Rápidas

| Métrica | Valor |
|---------|-------|
| **Total Casos de Uso** | 175 |
| **Casos de Uso Estudiante** | 41 (23.4%) |
| **Casos de Uso Docente** | 53 (30.3%) |
| **Casos de Uso Administrador** | 71 (40.6%) |
| **Procesos Automáticos** | 10 (5.7%) |
| **Casos de Uso Críticos** | 10 |
| **Pantallas Principales** | 10 |
| **Fases de Implementación** | 4 |
| **Duración Estimada Total** | 14-19 semanas |

---

## 🔗 Referencias Cruzadas

### Casos de Uso Relacionados con Documentación Existente

**DATABASE_SCHEMA_GAMIFICATION.md:**
- UC-E14: Iniciar Misión → `gamification_mission_attempts`
- UC-E15-E20: Completar Actividades → `gamification_activity_attempts`
- UC-E23: Completar Misión → Trigger `update_student_progress_on_mission_complete`
- UC-S01: Calcular Nivel → `progreso_estudiantes.nivel_actual`
- UC-S02: Actualizar Racha → `gamification_streaks`
- UC-S03: Verificar Badges → `gamification_badges`, `gamification_user_badges`

**GAMIFICATION_MISSIONS.md:**
- UC-D12: Crear Misión → Estructura de misiones
- UC-D21-D26: Crear Actividades → Tipos de actividades
- UC-E13: Ver Misiones → Listado de misiones

**API_REST_ESTANDAR.md:**
- Todos los casos de uso → Endpoints REST estándar
- Estructura de respuestas
- Manejo de errores

---

## 🎯 Casos de Uso por Prioridad

### 🔴 CRÍTICA (Fase 1 - MVP)

1. UC-E02: Iniciar Sesión
2. UC-E14: Iniciar Misión
3. UC-E15: Completar Actividad Quiz
4. UC-E19: Completar Multiple Choice
5. UC-E20: Completar True/False
6. UC-E23: Completar Misión
7. UC-S01: Calcular Nivel
8. UC-S04: Registrar Transacción Puntos
9. UC-D12: Crear Misión
10. UC-D21: Crear Actividad Quiz

**Duración:** 4-6 semanas

---

### 🟠 ALTA (Fase 2 - Gamificación)

1. UC-E25: Ver Badges Ganados
2. UC-E26: Ver Badges Disponibles
3. UC-E27: Recibir Notificación Badge
4. UC-E28: Ver Leaderboard
5. UC-E11: Ver Racha Diaria
6. UC-S02: Actualizar Racha
7. UC-S03: Verificar y Otorgar Badges
8. UC-S06: Enviar Notificación
9. UC-A23: Crear Badge
10. UC-A27: Configurar Criterios Badge

**Duración:** 3-4 semanas

---

### 🟡 MEDIA (Fase 3 - Gestión)

1. UC-D05: Ver Lista Estudiantes
2. UC-D06: Ver Progreso Individual
3. UC-D33: Generar Reportes
4. UC-E16: Completar Matching
5. UC-E17: Completar Fill in Blank
6. UC-E18: Completar Ordering
7. UC-A06: Ver Todos los Usuarios
8. UC-A11: Aprobar Registro
9. UC-A31: Configurar Puntos Misión
10. UC-A34: Configurar Umbrales Niveles

**Duración:** 4-5 semanas

---

### 🟢 BAJA (Fase 4 - Premium)

1. UC-D39: Enviar Mensaje a Estudiante
2. UC-D41: Enviar Anuncio Grupal
3. UC-D42: Otorgar Puntos Manuales
4. UC-A39: Ver Reporte Global
5. UC-A43: Exportar Datos
6. UC-A44: Ver Logs Auditoría
7. UC-E22: Reintentar Actividad
8. UC-E32: Filtrar Misiones por Dificultad
9. UC-E33: Filtrar Misiones por Tipo
10. UC-E34: Buscar Misiones por Tema

**Duración:** 3-4 semanas

---

## 🔐 Casos de Uso por Nivel de Seguridad

### 🔴 CRÍTICO

- UC-E01: Registrarse
- UC-E02: Iniciar Sesión
- UC-E06: Cambiar Contraseña
- UC-E07: Recuperar Contraseña
- UC-A08: Editar Usuario
- UC-A09: Eliminar Usuario
- UC-A13: Cambiar Rol Usuario

**Medidas:**
- Rate limiting obligatorio
- Bcrypt para contraseñas
- Tokens JWT con expiración
- Auditoría completa
- RLS estricto

---

### 🟠 ALTO

- UC-D12 a UC-D32: Gestión de contenido
- UC-A23 a UC-A47: Gestión admin
- UC-D42: Otorgar puntos manuales
- UC-A46: Ajustar puntos manualmente

**Medidas:**
- Verificar ownership
- Verificar rol de administrador
- Registrar en logs
- Validar límites

---

### 🟡 MEDIO

- UC-E15 a UC-E20: Completar actividades
- UC-E23: Completar misión
- UC-D05 a UC-D11: Ver progreso estudiantes

**Medidas:**
- Validación server-side
- No confiar en cliente
- Aplicar RLS
- Verificar acceso

---

## 📝 Plantillas de Documentación

### Para Agregar un Nuevo Caso de Uso

```markdown
### CU-XXX: [Nombre del Caso de Uso]

**Actor Principal:** [Estudiante/Docente/Administrador/Sistema]

**Precondiciones:**
- [Condición 1]
- [Condición 2]

**Flujo Principal:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]
...

**Postcondiciones:**
- [Resultado 1]
- [Resultado 2]

**Flujos Alternativos:**
- Xa. [Condición alternativa]: [Acción]

**Flujos de Excepción:**
- Xe. [Error]: [Manejo]

**Relaciones:**
- <<include>> [CU relacionado]
- <<extend>> [CU relacionado]

**Prioridad:** [Crítica/Alta/Media/Baja]
**Complejidad:** [1-10]
**Tiempo Estimado:** [X horas/días]
```

---

## 🚀 Próximos Pasos

### Documentación Adicional Recomendada

1. **Casos de Prueba Detallados**
   - Test cases para cada caso de uso
   - Casos positivos, negativos y de borde
   - Criterios de aceptación

2. **Wireframes y Mockups**
   - Diseños de las 10 pantallas principales
   - Flujos de usuario visuales
   - Prototipos interactivos

3. **Especificaciones Técnicas**
   - Endpoints API completos
   - Estructura de datos detallada
   - Queries SQL optimizadas

4. **Manual de Usuario**
   - Guía para estudiantes
   - Guía para docentes
   - Guía para administradores

5. **Documentación de Deployment**
   - Proceso de despliegue
   - Configuración de entornos
   - Monitoreo y logs

---

## 📞 Contacto y Soporte

Para preguntas sobre los casos de uso:
- 📧 Revisar documentación existente primero
- 📚 Consultar ejemplos de implementación
- 🐛 Reportar inconsistencias en la documentación

---

## 📅 Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2024-12-16 | 1.0 | Creación inicial de toda la documentación de casos de uso |

---

**Última actualización:** 2024-12-16  
**Versión:** 1.0  
**Estado:** ✅ Completo  
**Total de Documentos:** 5
