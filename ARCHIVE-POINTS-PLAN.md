# ARCHIVE POINTS - Plan de Implementación

> Sistema de Gamificación, Retención y Crecimiento para Archive of Meme

**Versión:** 1.0
**Fecha:** 2026-01-09
**Estado:** En desarrollo

---

## Índice

1. [Visión General](#visión-general)
2. [Principios de Diseño](#principios-de-diseño)
3. [Sistema de Temporadas](#sistema-de-temporadas)
4. [EARN - Ganar Puntos](#earn---ganar-puntos)
5. [BURN - Quemar Puntos](#burn---quemar-puntos)
6. [COMPETE - Leaderboards](#compete---leaderboards)
7. [HOLD - Beneficios Holders](#hold---beneficios-holders)
8. [Viral Loop](#viral-loop)
9. [Arquitectura Técnica](#arquitectura-técnica)
10. [Fases de Implementación](#fases-de-implementación)
11. [Checklist de Desarrollo](#checklist-de-desarrollo)

---

## Visión General

### Objetivo
Construir una comunidad masiva antes de un posible token, sin quemarla por farming excesivo.

### Pilares
- **Hábito diario** - Usuarios que vuelven cada día
- **Identidad cultural** - Comunidad de amantes de memes
- **Monetización temprana** - NFTs con utilidad real
- **Opcionalidad futura** - Posible token/airdrop sin compromiso

### Qué NO es
- ❌ Un tap-to-earn vacío
- ❌ Un esquema Ponzi de referidos
- ❌ Un sistema dominado por ballenas
- ❌ Promesas de tokens garantizados

### Qué SÍ es
- ✅ Motor de comunidad
- ✅ Sistema de filtrado de usuarios valiosos
- ✅ Embudo de monetización (NFTs)
- ✅ Base limpia para futuro token (opcional)

---

## Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Anti-inflación** | Temporadas + burns reales evitan devaluación |
| **Actividad > Pasividad** | Los multiplicadores requieren engagement |
| **Pay-to-accelerate** | NFTs aceleran, no garantizan victoria |
| **Early ≠ Eterno** | Usuarios nuevos pueden competir cada temporada |
| **Puntos = Poder útil** | Solo valen si los usas (burns) |

---

## Sistema de Temporadas

### Configuración
- **Duración:** 30 días
- **Reset:** Leaderboards y Season Points
- **Persistente:** Lifetime Points (para snapshots)

### Tipos de Puntos

| Tipo | Uso | Reset |
|------|-----|-------|
| **Season Points** | Rankings, rewards de temporada | Cada 30 días |
| **Lifetime Points** | Peso en futuros airdrops, status OG | Nunca |

### Por qué temporadas
- Evita inflación infinita
- Usuarios nuevos tienen oportunidad real
- Crea urgencia y engagement
- Permite rotar rewards

---

## EARN - Ganar Puntos

### Acciones Base

| Acción | Puntos | Cooldown | Notas |
|--------|--------|----------|-------|
| **Daily Check-in** | 100 | 24h | Click consciente, no auto-tap |
| **Streak Bonus** | +5%/día | - | Máx +30% (día 6+), se pierde si fallas |
| **Boost Tap** | 50 | 4h | Máx 3 al día |
| **Conectar Wallet** | 200 | Una vez | Bonus inicial |

### Streak System

```
Día 1: 100 pts (base)
Día 2: 105 pts (+5%)
Día 3: 110 pts (+10%)
Día 4: 115 pts (+15%)
Día 5: 120 pts (+20%)
Día 6: 125 pts (+25%)
Día 7+: 130 pts (+30% máximo)

Si fallas un día → streak = 0, bonus = 0%
```

### Multiplicadores NFT

| Holder de... | Bonus | Requisito |
|--------------|-------|-----------|
| NFT Pass | +15% | Actividad semanal |
| 1+ Meme NFT | +30% | Actividad semanal |
| 5+ Meme NFTs | +60% | Actividad semanal |

**Regla crítica:** Los multiplicadores requieren al menos 1 check-in en los últimos 7 días. Holder inactivo = sin bonus.

### Sistema de Referidos

| Acción | Reward |
|--------|--------|
| Referir usuario que se registra | 300 pts |
| Bonus de actividad del referido | 10% de sus puntos |
| **Límite temporal** | Solo 30 días |
| **Límite cantidad** | Máx 10 referidos activos |

**Anti-parasitismo:** No hay referidos "forever". Después de 30 días, el bonus termina.

### Cálculo Final de Puntos

```
Puntos Finales = Puntos Base × (1 + Streak Bonus) × (1 + NFT Bonus)

Ejemplo:
- Check-in base: 100 pts
- Streak día 7: +30%
- Tiene 2 NFTs: +30%
- Total: 100 × 1.30 × 1.30 = 169 pts
```

---

## BURN - Quemar Puntos

### Filosofía
> Si no quemas puntos, no progresas. Los puntos acumulados sin usar son puntos desperdiciados.

### Rewards Funcionales (Prioridad)

| Reward | Costo | Límite | Descripción |
|--------|-------|--------|-------------|
| **Protección Streak** | 2,000 pts | 1/semana | Salva tu streak si fallas un día |
| **Boost x2 (24h)** | 5,000 pts | 2/semana | Duplica puntos por 24h |
| **Acceso Early Drop** | 10,000 pts | Por drop | Whitelist para próximo NFT |

### Rewards de Status

| Reward | Costo | Límite | Descripción |
|--------|-------|--------|-------------|
| **NFT Pass Gratis** | 50,000 pts | 5/mes | Pass de comunidad |
| **Badge Season NFT** | 25,000 pts | Ilimitado | Badge exclusivo de temporada |
| **Rol OG** | 100,000 pts | 100 total | Status permanente |
| **Entrada Sorteo** | 5,000 pts | Ilimitado | Chance de ganar NFT |

### Importancia del Burn para Airdrop

```
Los puntos QUEMADOS cuentan para el snapshot de airdrop.
Más burns = mayor allocation potencial.

Esto evita:
- Acumuladores pasivos
- Bots que solo farmean
- Multi-wallets sin actividad real
```

---

## COMPETE - Leaderboards

### MVP: Leaderboard Único (Fase 1)

| Posición | Premio Season |
|----------|---------------|
| #1 | NFT gratis + 5,000 pts |
| #2-5 | 3,000 pts |
| #6-20 | 1,000 pts |
| Top 100 | Badge "Top 100 Season X" |

### Futuro: Leaderboards Separados (Fase 2+)

| Leaderboard | Criterio |
|-------------|----------|
| **Global** | Season Points totales |
| **Nuevos** | Usuarios < 30 días |
| **Comunidad** | Engagement (comentarios, etc.) |
| **Holders** | Solo usuarios con NFTs |

---

## HOLD - Beneficios Holders

### Snapshot Mensual

Variables para calcular peso en airdrop:

| Factor | Peso | Descripción |
|--------|------|-------------|
| Cantidad NFTs | 25% | Más NFTs = más peso |
| Tiempo holding | 25% | Diamond hands bonus |
| Lifetime Points | 20% | Puntos totales históricos |
| Season participadas | 15% | Consistencia |
| Puntos quemados | 15% | Engagement real |

### Comunicación

```
"Los holders de NFTs de Archive of Meme serán elegibles
para un POSIBLE airdrop futuro de $ARCH token.

Factores que aumentan tu allocation potencial:
- Cantidad de NFTs
- Tiempo holding
- Actividad en Archive Points
- Puntos quemados

No hay garantías. No es una promesa de valor futuro."
```

---

## Viral Loop

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Ver meme → Check-in → Ganar puntos →                      │
│                                                             │
│  Decisión: ¿Guardar / Quemar / Proteger streak?            │
│                                                             │
│  → Mejor posición en leaderboard →                         │
│                                                             │
│  → Invitar amigos (máx 10, 30 días) →                      │
│                                                             │
│  → Querer boost → Comprar NFT Pass (+15%) →                │
│                                                             │
│  → Querer más → Comprar meme NFTs (+30-60%) →              │
│                                                             │
│  → HODL para posible airdrop →                             │
│                                                             │
│  → Snapshot mensual → Expectativa futura                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitectura Técnica

### Stack
- **Frontend:** Next.js (existente)
- **Backend:** API Routes Next.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Wallet connect (existente)
- **NFT Verification:** OpenSea API (existente)

### Modelo de Datos (Supabase)

#### Tabla: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet VARCHAR(42) UNIQUE NOT NULL,
  lifetime_points INTEGER DEFAULT 0,
  season_points INTEGER DEFAULT 0,
  burned_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  last_checkin TIMESTAMP,
  last_boost TIMESTAMP,
  boosts_today INTEGER DEFAULT 0,
  referral_code VARCHAR(10) UNIQUE,
  referred_by UUID REFERENCES users(id),
  referred_at TIMESTAMP,
  nft_count INTEGER DEFAULT 0,
  has_pass BOOLEAN DEFAULT FALSE,
  last_nft_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: `point_transactions`
```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'checkin', 'boost', 'referral', 'burn', 'reward'
  description TEXT,
  season INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tipos: checkin, boost, referral_bonus, referral_earned, burn, reward_claimed, leaderboard_prize
```

#### Tabla: `referrals`
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  points_earned INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL, -- 30 días después de registro
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: `seasons`
```sql
CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: `rewards`
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'streak_protection', 'boost_2x', 'early_access', 'nft_pass', 'badge', 'og_role'
  cost INTEGER NOT NULL,
  season INTEGER,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: `leaderboard_snapshots`
```sql
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season INTEGER NOT NULL,
  user_id UUID REFERENCES users(id),
  rank INTEGER NOT NULL,
  season_points INTEGER NOT NULL,
  prize_type VARCHAR(50),
  prize_amount INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Auth & User
```
GET  /api/points/user          → Datos del usuario actual
POST /api/points/connect       → Registrar/conectar wallet
```

#### Earn
```
POST /api/points/checkin       → Check-in diario
POST /api/points/boost         → Boost tap (cada 4h)
GET  /api/points/streak        → Info del streak actual
```

#### Referrals
```
GET  /api/points/referral-code → Obtener código de referido
POST /api/points/use-referral  → Usar código al registrarse
GET  /api/points/my-referrals  → Ver mis referidos y earnings
```

#### Burn & Rewards
```
GET  /api/points/rewards       → Rewards disponibles
POST /api/points/burn          → Canjear reward
GET  /api/points/my-rewards    → Mis rewards canjeados
```

#### Leaderboard
```
GET  /api/points/leaderboard   → Top 100 de la temporada
GET  /api/points/my-rank       → Mi posición actual
```

#### Season
```
GET  /api/points/season        → Info temporada actual
GET  /api/points/history       → Historial de temporadas
```

---

## Fases de Implementación

### Fase 1: MVP Core (2 semanas)

**Objetivo:** Sistema funcional básico

| Componente | Descripción | Prioridad |
|------------|-------------|-----------|
| Database setup | Tablas en Supabase | P0 |
| User registration | Wallet → usuario | P0 |
| Daily check-in | +100 pts base | P0 |
| Streak system | Bonus +5%/día | P0 |
| Boost tap | +50 pts, 4h cooldown | P0 |
| NFT verification | Multiplicadores | P0 |
| Season points | Separar season/lifetime | P0 |
| Leaderboard básico | Top 100 | P1 |
| UI Points dashboard | Ver puntos, streak | P0 |
| UI Check-in button | Botón principal | P0 |

### Fase 2: Engagement (2-3 semanas)

**Objetivo:** Retención y viralidad

| Componente | Descripción | Prioridad |
|------------|-------------|-----------|
| Referral system | Código + 30 días + límite | P0 |
| Streak protection | Burn 2,000 pts | P1 |
| Boost x2 reward | Burn 5,000 pts | P1 |
| Early access reward | Burn 10,000 pts | P1 |
| UI Referrals | Panel de referidos | P1 |
| UI Rewards shop | Canjear rewards | P1 |
| Notifications | Recordatorios streak | P2 |

### Fase 3: Competition (2 semanas)

**Objetivo:** Gamificación avanzada

| Componente | Descripción | Prioridad |
|------------|-------------|-----------|
| Season end logic | Snapshot + reset | P0 |
| Leaderboard prizes | Distribución auto | P1 |
| Badge NFTs | Minteo de badges | P2 |
| NFT Pass reward | Claim gratis | P2 |
| Multiple leaderboards | Global, nuevos, holders | P2 |

### Fase 4: Growth (Futuro)

| Componente | Descripción |
|------------|-------------|
| Misiones semanales | Tasks específicas |
| Mini-games | Juegos con riesgo |
| Staking puntos | Lock para multiplicar |
| Snapshot engine | Para posible airdrop |
| Token preparation | Si se decide lanzar |

---

## Checklist de Desarrollo

### Fase 1 - MVP Core

#### Database
- [ ] Crear proyecto Supabase (o usar existente)
- [ ] Crear tabla `users`
- [ ] Crear tabla `point_transactions`
- [ ] Crear tabla `seasons`
- [ ] Crear primera temporada
- [ ] Configurar RLS (Row Level Security)

#### Backend APIs
- [ ] `GET /api/points/user` - Datos usuario
- [ ] `POST /api/points/checkin` - Check-in diario
- [ ] `POST /api/points/boost` - Boost tap
- [ ] `GET /api/points/leaderboard` - Top 100
- [ ] `GET /api/points/season` - Info temporada
- [ ] Integrar verificación NFT existente

#### Frontend UI
- [ ] Componente `PointsDashboard` - Stats principales
- [ ] Componente `CheckinButton` - Botón de check-in
- [ ] Componente `StreakDisplay` - Mostrar streak
- [ ] Componente `BoostButton` - Botón boost
- [ ] Componente `Leaderboard` - Tabla rankings
- [ ] Página `/points` - Dashboard principal
- [ ] Integrar en Header (mostrar puntos)

#### Testing
- [ ] Test check-in no permite doble
- [ ] Test streak se rompe correctamente
- [ ] Test multiplicadores NFT funcionan
- [ ] Test boost respeta cooldown
- [ ] Test leaderboard ordena bien

### Fase 2 - Engagement

#### Database
- [ ] Crear tabla `referrals`
- [ ] Crear tabla `rewards`
- [ ] Añadir columna `referral_code` a users

#### Backend APIs
- [ ] `GET /api/points/referral-code`
- [ ] `POST /api/points/use-referral`
- [ ] `GET /api/points/my-referrals`
- [ ] `GET /api/points/rewards`
- [ ] `POST /api/points/burn`
- [ ] Cron job: desactivar referrals expirados

#### Frontend UI
- [ ] Componente `ReferralPanel`
- [ ] Componente `RewardsShop`
- [ ] Componente `MyRewards`
- [ ] Share referral link functionality
- [ ] Notificación streak en peligro

### Fase 3 - Competition

#### Backend
- [ ] Cron job: finalizar temporada
- [ ] Lógica snapshot leaderboard
- [ ] Distribución premios automática
- [ ] Nueva temporada automática

#### Frontend
- [ ] Componente `SeasonCountdown`
- [ ] Componente `SeasonHistory`
- [ ] Animación fin de temporada
- [ ] Celebración premios

---

## Métricas de Éxito

### KPIs Principales

| Métrica | Target Mes 1 | Target Mes 3 |
|---------|--------------|--------------|
| Usuarios registrados | 500 | 5,000 |
| DAU (Daily Active Users) | 100 | 1,000 |
| Retention D7 | 30% | 40% |
| Retention D30 | 15% | 25% |
| NFTs vendidos (por puntos) | 10 | 100 |
| Referrals exitosos | 50 | 500 |

### Métricas Secundarias

| Métrica | Qué indica |
|---------|------------|
| Avg streak length | Engagement diario |
| Points burned / earned ratio | Salud de la economía |
| Leaderboard distribution | Competitividad |
| Referral conversion rate | Viralidad |

---

## Notas Legales

### Disclaimers Requeridos

```
IMPORTANTE: Archive Points es un sistema de gamificación.
Los puntos NO son tokens, NO tienen valor monetario,
y NO garantizan ningún beneficio futuro.

La mención de "posible airdrop" es especulativa y
NO constituye una promesa de distribución de tokens.

Los NFTs son coleccionables digitales sin garantía
de valor futuro.
```

### En la UI siempre mostrar:
- "Posible" antes de cualquier mención de airdrop
- "Los puntos no tienen valor monetario"
- Link a términos y condiciones

---

## Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-09 | 1.0 | Documento inicial |

---

## Contacto

**Proyecto:** Archive of Meme
**Web:** https://archiveofmeme.fun
**Twitter:** @Arch_AoM
