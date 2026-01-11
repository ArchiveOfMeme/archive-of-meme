# Sistema de Minado V2 - Especificación Completa

> **Documento de referencia** para implementar el nuevo sistema de minado de Archive of Meme.
> Fecha: 2026-01-11

---

## 1. Resumen Ejecutivo

### Sistema Anterior (V1)
```
Usuario pulsa "Mine Now" → Recibe puntos instantáneamente → Cooldown 4h → Repetir
```

### Sistema Nuevo (V2)
```
Usuario pulsa "Mine Now" → Inicia sesión de minado 4h →
Puntos se acumulan gradualmente → Usuario hace "Claim" →
Recibe todos los puntos → Puede iniciar nueva sesión
```

---

## 2. Mecánica del Nuevo Sistema

### 2.1 Flujo Principal

1. **Estado Inicial**: Usuario ve botón "Mine Now" con timer en `00:00:00`

2. **Iniciar Sesión**: Usuario pulsa "Mine Now"
   - Se calcula el `earning_rate` (puntos/minuto) basado en su miner y bonuses
   - Timer cambia a `04:00:00` y empieza a bajar
   - Aparece pop-up: "Mining session started!"
   - Se guarda `session_started_at` en la BD

3. **Durante el Minado** (4 horas):
   - Timer cuenta hacia atrás: `03:59:59`, `03:59:58`...
   - Puntos se acumulan gradualmente según el `earning_rate`
   - Pantalla muestra: puntos acumulados y earning rate
   - **El minero sigue trabajando aunque el usuario cierre la app**

4. **Claim Disponible**:
   - **Free miners**: Pueden hacer claim con mínimo **5 puntos**
   - **NFT miners** (Basic/Pro/Ultra): Pueden hacer claim con mínimo **10 puntos**
   - Botón "Claim" se activa cuando alcanza el mínimo

5. **Hacer Claim**:
   - Usuario pulsa "Claim"
   - Recibe TODOS los puntos acumulados de golpe
   - Sesión termina (`session_started_at` = null)
   - Puede iniciar nueva sesión inmediatamente

6. **Sesión Completa (4h)**:
   - Si pasan las 4 horas completas, el minero se detiene
   - Los puntos quedan acumulados esperando claim
   - Aparece recuadro: "Mining complete! X points ready to claim"

### 2.2 Reconexión del Usuario

Si el usuario cierra la app y vuelve:
- El sistema calcula cuánto tiempo pasó desde `session_started_at`
- Muestra los puntos acumulados hasta ese momento
- Si pasaron las 4h, muestra el máximo de puntos
- Usuario puede hacer claim

---

## 3. Puntos y Earning Rates

### 3.1 Puntos Base por Miner (por sesión de 4h)

| Miner Level | Puntos/4h | Puntos/min | Puntos/seg |
|-------------|-----------|------------|------------|
| **Free**    | 15        | 0.0625     | 0.00104    |
| **Basic**   | 50        | 0.2083     | 0.00347    |
| **Pro**     | 150       | 0.6250     | 0.01042    |
| **Ultra**   | 400       | 1.6667     | 0.02778    |

### 3.2 Sistema de Bonuses

Los bonuses se aplican al earning rate y se calculan al **INICIAR** la sesión.

#### Streak Bonus (días consecutivos minando)
| Días | Bonus |
|------|-------|
| 1    | +0%   |
| 2    | +5%   |
| 3    | +10%  |
| 4    | +15%  |
| 5    | +20%  |
| 6    | +25%  |
| 7+   | +30%  |

**Importante**: El streak cuenta desde el momento que **INICIAS** la sesión de minado.

#### Level Bonus (basado en lifetime points)
| Level    | Min Points | Bonus |
|----------|------------|-------|
| Bronze   | 0          | +0%   |
| Silver   | 1,000      | +5%   |
| Gold     | 5,000      | +10%  |
| Platinum | 20,000     | +15%  |
| Diamond  | 100,000    | +25%  |
| Legend   | 500,000    | +30%  |

#### Meme NFT Bonus
| Memes | Bonus |
|-------|-------|
| 0     | +0%   |
| 1-2   | +2%   |
| 3-5   | +5%   |
| 6-10  | +8%   |
| 11+   | +10%  |

#### OG Pass Bonus
- Si tiene OG Pass: **+5%**

### 3.3 Cálculo del Earning Rate

```javascript
// Fórmula
basePoints = MINER_POINTS[minerLevel]; // 15, 50, 150, o 400
totalBonus = streakBonus + levelBonus + memeBonus + passBonus;
totalBonus = Math.min(totalBonus, 1.0); // Cap en 100%

totalPointsIn4h = basePoints * (1 + totalBonus);
earningRatePerMinute = totalPointsIn4h / 240;
earningRatePerSecond = totalPointsIn4h / 14400;
```

### 3.4 Ejemplo de Cálculo

**Usuario con**:
- Ultra Miner (400 pts base)
- Streak de 7 días (+30%)
- Level Gold (+10%)
- 5 Memes (+5%)
- OG Pass (+5%)

```
totalBonus = 0.30 + 0.10 + 0.05 + 0.05 = 0.50 (50%)
totalPointsIn4h = 400 * 1.50 = 600 pts
earningRatePerMinute = 600 / 240 = 2.5 pts/min
earningRatePerSecond = 600 / 14400 = 0.0417 pts/seg
```

---

## 4. Mínimo para Claim

| Miner Type | Mínimo Puntos |
|------------|---------------|
| Free       | 5 puntos      |
| Basic      | 10 puntos     |
| Pro        | 10 puntos     |
| Ultra      | 10 puntos     |

### Tiempo para alcanzar mínimo (sin bonuses)

| Miner | Mínimo | Tiempo para alcanzar |
|-------|--------|----------------------|
| Free  | 5 pts  | 80 minutos (1h 20m)  |
| Basic | 10 pts | 48 minutos           |
| Pro   | 10 pts | 16 minutos           |
| Ultra | 10 pts | 6 minutos            |

---

## 5. Streak - Cómo Funciona

### 5.1 Reglas del Streak

1. **El streak cuenta desde que INICIAS una sesión** (no desde claim)

2. **Mantener streak**: Debes iniciar una nueva sesión dentro de **28 horas** desde que iniciaste la anterior

3. **Incrementar streak**: Si pasan **más de 20 horas** desde el inicio de la sesión anterior, el streak incrementa

4. **Perder streak**: Si pasan **más de 28 horas** sin iniciar nueva sesión, streak vuelve a 1

### 5.2 Ejemplo

```
Lunes 10:00    → Inicias sesión → streak = 1
Lunes 14:00    → Claim (4h después)
Martes 08:00   → Inicias sesión (22h después del inicio anterior) → streak = 2
Martes 12:00   → Claim
Miércoles 09:00 → Inicias sesión (25h después) → streak = 3
...
```

---

## 6. Cambios en Base de Datos

### 6.1 Nuevos Campos en `mining_users`

```sql
ALTER TABLE mining_users ADD COLUMN IF NOT EXISTS
  mining_session_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE mining_users ADD COLUMN IF NOT EXISTS
  mining_session_earning_rate DECIMAL(10,6) DEFAULT NULL;

ALTER TABLE mining_users ADD COLUMN IF NOT EXISTS
  mining_session_total_points DECIMAL(10,2) DEFAULT NULL;

ALTER TABLE mining_users ADD COLUMN IF NOT EXISTS
  total_mines INT DEFAULT 0;

-- Comentario: session_started_at = NULL significa que no hay sesión activa
```

### 6.2 Significado de los Campos

| Campo | Descripción |
|-------|-------------|
| `mining_session_started_at` | Timestamp cuando inició la sesión actual. NULL = sin sesión |
| `mining_session_earning_rate` | Puntos por segundo calculados al iniciar sesión |
| `mining_session_total_points` | Total de puntos que ganará en 4h (para mostrar en UI) |
| `total_mines` | Contador de sesiones completadas (para badges) |

---

## 7. Cambios en Backend

### 7.1 Constantes Actualizadas (`src/lib/mining.js`)

```javascript
// CAMBIO: Free ahora da 15 puntos
export const MINER_POINTS = {
  Free: 15,    // Antes: 10
  Basic: 50,
  Pro: 150,
  Ultra: 400,
};

// NUEVO: Duración de sesión en milisegundos
export const MINING_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas

// NUEVO: Mínimo de puntos para claim
export const MIN_CLAIM_POINTS = {
  Free: 5,
  Basic: 10,
  Pro: 10,
  Ultra: 10,
};
```

### 7.2 Nuevas Funciones

#### `startMiningSession(wallet)`
```javascript
// Inicia una nueva sesión de minado
// - Verifica que no haya sesión activa
// - Calcula earning rate con bonuses actuales
// - Actualiza streak
// - Guarda session_started_at en BD
// - Retorna: { success, earningRate, totalPoints, sessionEndsAt }
```

#### `getMiningSessionStatus(wallet)`
```javascript
// Obtiene estado de la sesión actual
// - Calcula puntos acumulados hasta ahora
// - Calcula tiempo restante
// - Retorna: {
//     hasActiveSession,
//     pointsAccumulated,
//     timeRemaining,
//     earningRate,
//     canClaim,
//     minClaimPoints
//   }
```

#### `claimMiningSession(wallet)`
```javascript
// Hace claim de los puntos acumulados
// - Verifica que haya sesión activa
// - Verifica mínimo de puntos
// - Calcula puntos finales
// - Suma puntos al usuario
// - Limpia session_started_at
// - Registra transacción
// - Retorna: { success, pointsClaimed, newTotal }
```

### 7.3 Función `canMine()` Modificada

```javascript
// ANTES: Verificaba cooldown de 4h
// AHORA: Verifica si hay sesión activa

export function canStartSession(user) {
  // Si tiene sesión activa, no puede iniciar otra
  if (user.mining_session_started_at) {
    return {
      canStart: false,
      reason: 'SESSION_ACTIVE',
      sessionStartedAt: user.mining_session_started_at
    };
  }

  return { canStart: true };
}
```

### 7.4 Función `calculateNewStreak()` Modificada

```javascript
// AHORA: Streak basado en inicio de sesión, no en claim
export function calculateNewStreak(user) {
  // last_session_started_at es el timestamp del INICIO de la sesión anterior
  if (!user.last_session_started_at) {
    return 1; // Primera sesión
  }

  const lastSessionStart = new Date(user.last_session_started_at);
  const now = new Date();
  const hoursDiff = (now - lastSessionStart) / (1000 * 60 * 60);

  if (hoursDiff <= 28) {
    // Dentro del período válido
    if (hoursDiff >= 20) {
      return user.current_streak + 1; // Nuevo día, incrementa
    }
    return user.current_streak; // Mismo día, mantiene
  }

  return 1; // Más de 28h, pierde streak
}
```

---

## 8. Cambios en API Endpoints

### 8.1 `POST /api/mining/start` (NUEVO)

**Request:**
```json
{ "wallet": "0x..." }
```

**Response (éxito):**
```json
{
  "success": true,
  "session": {
    "startedAt": "2026-01-11T10:00:00Z",
    "endsAt": "2026-01-11T14:00:00Z",
    "durationMs": 14400000,
    "earningRate": {
      "perSecond": 0.0417,
      "perMinute": 2.5,
      "perHour": 150
    },
    "totalPoints": 600,
    "minerLevel": "Ultra",
    "bonuses": {
      "streak": 0.30,
      "level": 0.10,
      "memes": 0.05,
      "pass": 0.05,
      "total": 0.50
    }
  },
  "streak": {
    "current": 7,
    "isNew": false
  }
}
```

**Response (error - sesión activa):**
```json
{
  "success": false,
  "error": "SESSION_ACTIVE",
  "message": "Ya tienes una sesión de minado activa",
  "session": {
    "startedAt": "2026-01-11T08:00:00Z",
    "pointsAccumulated": 150,
    "timeRemaining": 7200000
  }
}
```

### 8.2 `GET /api/mining/session` (NUEVO)

**Request:**
```
GET /api/mining/session?wallet=0x...
```

**Response (con sesión activa):**
```json
{
  "hasActiveSession": true,
  "session": {
    "startedAt": "2026-01-11T10:00:00Z",
    "endsAt": "2026-01-11T14:00:00Z",
    "elapsedMs": 3600000,
    "remainingMs": 10800000,
    "earningRate": {
      "perSecond": 0.0417,
      "perMinute": 2.5
    },
    "pointsAccumulated": 150.12,
    "totalPoints": 600,
    "progress": 25.02,
    "minerLevel": "Ultra"
  },
  "claim": {
    "canClaim": true,
    "minPoints": 10,
    "currentPoints": 150.12
  }
}
```

**Response (sin sesión):**
```json
{
  "hasActiveSession": false,
  "canStartSession": true,
  "lastSessionEndedAt": "2026-01-11T08:00:00Z"
}
```

### 8.3 `POST /api/mining/claim` (NUEVO)

**Request:**
```json
{ "wallet": "0x..." }
```

**Response (éxito):**
```json
{
  "success": true,
  "claimed": {
    "points": 150,
    "sessionDuration": 3600000,
    "earningRate": 2.5
  },
  "user": {
    "lifetimePoints": 5150,
    "seasonPoints": 1150,
    "level": "Gold"
  },
  "badges": [],
  "canStartNewSession": true
}
```

**Response (error - mínimo no alcanzado):**
```json
{
  "success": false,
  "error": "MIN_POINTS_NOT_REACHED",
  "message": "Necesitas mínimo 10 puntos para hacer claim",
  "currentPoints": 8.5,
  "minPoints": 10
}
```

### 8.4 `GET /api/mining/user` (MODIFICADO)

Agregar información de sesión al response existente:

```json
{
  "registered": true,
  "wallet": "0x...",
  "points": { ... },
  "level": { ... },
  "streak": { ... },
  "miner": { ... },
  "session": {
    "active": true,
    "startedAt": "2026-01-11T10:00:00Z",
    "endsAt": "2026-01-11T14:00:00Z",
    "earningRate": 2.5,
    "totalPoints": 600,
    "pointsAccumulated": 150,
    "canClaim": true,
    "minClaimPoints": 10
  }
}
```

---

## 9. Cambios en Frontend

### 9.1 Hook `useMining.js` - Nuevas Funciones

```javascript
export function useMining() {
  // ... estados existentes ...

  const [session, setSession] = useState(null);
  const [accumulatedPoints, setAccumulatedPoints] = useState(0);

  // Iniciar sesión de minado
  const startSession = useCallback(async () => {
    const res = await fetch('/api/mining/start', {
      method: 'POST',
      body: JSON.stringify({ wallet: address }),
    });
    // ...
  }, [address]);

  // Hacer claim
  const claimSession = useCallback(async () => {
    const res = await fetch('/api/mining/claim', {
      method: 'POST',
      body: JSON.stringify({ wallet: address }),
    });
    // ...
  }, [address]);

  // Actualizar puntos acumulados en tiempo real
  useEffect(() => {
    if (!session?.active) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(session.startedAt).getTime();
      const points = Math.min(
        elapsed * session.earningRatePerMs,
        session.totalPoints
      );
      setAccumulatedPoints(points);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  return {
    // ... existentes ...
    session,
    accumulatedPoints,
    startSession,
    claimSession,
  };
}
```

### 9.2 Componente `MinerCard` - Nuevos Estados

| Estado | UI |
|--------|-----|
| Sin sesión | Botón "Mine Now", timer `00:00:00` |
| Sesión activa, < mínimo | Timer bajando, puntos subiendo, "Claim" deshabilitado |
| Sesión activa, ≥ mínimo | Timer bajando, puntos subiendo, "Claim" habilitado |
| Sesión completada (4h) | Timer `00:00:00`, "Claim" habilitado, mensaje "Mining complete!" |

### 9.3 UI Elements

```
┌─────────────────────────────────────┐
│         ⭐ 5,150 pts                │
│         💎 Gold Level               │
│                                     │
│      ┌─────────────────┐           │
│      │   Ultra Miner   │           │
│      │     [IMG]       │           │
│      └─────────────────┘           │
│                                     │
│   Earning Rate: 2.5 pts/min         │
│   Session Total: 600 pts            │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ ████████░░░░░░░░░░░░  25%   │  │
│   └─────────────────────────────┘  │
│                                     │
│   Time Remaining: 03:00:00          │
│   Points Accumulated: 150.5         │
│                                     │
│   ┌─────────────────────────────┐  │
│   │         CLAIM               │  │
│   │      (min: 10 pts)          │  │
│   └─────────────────────────────┘  │
│                                     │
│   🔥 Streak: 7 days (+30%)          │
└─────────────────────────────────────┘
```

---

## 10. Pop-ups y Mensajes

### 10.1 Al Iniciar Sesión

```
┌─────────────────────────────────────┐
│              ⛏️                      │
│     Mining Session Started!         │
│                                     │
│   Your miner is now working for     │
│   the next 4 hours.                 │
│                                     │
│   Earning: 2.5 pts/min              │
│   Total: 600 pts in 4h              │
│                                     │
│   🔥 Streak: 7 days                 │
│                                     │
│          [ Got it! ]                │
└─────────────────────────────────────┘
```

### 10.2 Al Reconectarse con Sesión Activa

```
┌─────────────────────────────────────┐
│              ⛏️                      │
│     Welcome Back, Miner!            │
│                                     │
│   Your miner has been working.      │
│                                     │
│   Points accumulated: 342.5         │
│   Time remaining: 01:23:45          │
│                                     │
│   [ Continue Mining ]  [ Claim ]    │
└─────────────────────────────────────┘
```

### 10.3 Sesión Completada (4h)

```
┌─────────────────────────────────────┐
│              🎉                      │
│     Mining Complete!                │
│                                     │
│   Your miner worked for 4 hours     │
│   and generated:                    │
│                                     │
│          ⭐ 600 pts                 │
│                                     │
│          [ CLAIM ]                  │
└─────────────────────────────────────┘
```

### 10.4 Claim Exitoso

```
┌─────────────────────────────────────┐
│              ✅                      │
│     Points Claimed!                 │
│                                     │
│   + 342 pts added to your balance   │
│                                     │
│   New total: 5,492 pts              │
│                                     │
│   [ Start New Session ]  [ Close ]  │
└─────────────────────────────────────┘
```

---

## 11. Edge Cases y Consideraciones

### 11.1 Usuario cierra la app durante minado
- Sesión continúa en BD
- Al reconectarse, se calculan puntos acumulados
- Puede hacer claim si tiene mínimo

### 11.2 Pasan más de 4h sin claim
- Puntos se quedan en el máximo calculado
- No se pierden
- Usuario puede hacer claim cuando quiera
- **No puede iniciar nueva sesión hasta hacer claim**

### 11.3 Usuario intenta iniciar sesión con sesión activa
- Error: "Ya tienes una sesión activa"
- Debe hacer claim primero

### 11.4 Claim con menos del mínimo
- Error: "Necesitas mínimo X puntos"
- No se permite

### 11.5 Cambio de NFTs durante sesión
- **Los bonuses NO cambian** durante la sesión
- Se calcularon al inicio y se mantienen
- El nuevo NFT aplicará en la siguiente sesión

### 11.6 Streak expira durante sesión
- Si el usuario no inicia nueva sesión en 28h, el streak se pierde
- La sesión actual mantiene su bonus (calculado al inicio)
- La siguiente sesión tendrá streak = 1

---

## 12. Orden de Implementación

### Fase 1: Backend ✅
1. [x] Agregar campos nuevos a BD (`mining_session_*`)
2. [x] Actualizar constantes (`MINER_POINTS.Free = 15`, etc.)
3. [x] Crear función `startMiningSession()`
4. [x] Crear función `getMiningSessionStatus()`
5. [x] Crear función `claimMiningSession()`
6. [x] Modificar `calculateNewStreak()` para nuevo comportamiento
7. [x] Crear endpoints `/api/mining/start`, `/api/mining/session`, `/api/mining/claim`
8. [x] Modificar `/api/mining/user` para incluir datos de sesión

### Fase 2: Frontend ✅
1. [x] Actualizar hook `useMining.js` con nuevas funciones
2. [x] Modificar `MinerCard` para nuevos estados
3. [x] Implementar contador de puntos en tiempo real
4. [x] Implementar countdown en tiempo real (`liveRemainingMs`)
5. [x] Implementar lógica de reconexión

### Fase 3: Testing ✅
1. [x] Test: Iniciar sesión correctamente
2. [x] Test: Puntos se acumulan bien
3. [x] Test: Claim con mínimo correcto
4. [x] Test: Reconexión muestra datos correctos
5. [x] Test: Streak se calcula bien
6. [ ] Test: 4h completas funciona (pendiente tiempo real)
7. [ ] Test: Edge cases

---

## 13. Migración de Usuarios Existentes

Para usuarios que ya tienen datos en el sistema V1:

1. `mining_session_started_at` = NULL (sin sesión activa)
2. `last_mining_at` existente se mantiene para referencia
3. Streak existente se mantiene
4. Puntos existentes se mantienen

**No se pierde ningún dato de usuarios existentes.**

---

## 14. Preguntas Frecuentes

**¿Por qué Free ahora da 15 pts en vez de 10?**
Para que los free miners puedan alcanzar el mínimo de 5 pts para claim en un tiempo razonable (~80 min).

**¿Se pueden perder puntos si no hago claim?**
No. Los puntos acumulados nunca se pierden. Se quedan esperando claim.

**¿Puedo cerrar la app mientras mino?**
Sí. El minero sigue trabajando. Al volver, tus puntos estarán acumulados.

**¿Qué pasa si mi sesión termina hace días y no he hecho claim?**
Los puntos siguen ahí. Puedes hacer claim cuando quieras. Pero tu streak probablemente se habrá perdido si pasaron más de 28h sin iniciar nueva sesión.

---

*Documento generado para Archive of Meme - Mining System V2*
