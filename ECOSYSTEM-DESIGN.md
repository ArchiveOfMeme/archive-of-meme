# ARCHIVE OF MEME - ECOSYSTEM DESIGN

> Documento de diseño del sistema de puntos, minería y economía auto-sostenible.
>
> **Versión:** 2.0
> **Fecha:** Enero 2026
> **Estado:** Diseño (pre-implementación)
> **Última actualización:** Modelo auto-sostenible inspirado en Notcoin/Hamster Kombat

---

## TABLA DE CONTENIDOS

1. [Visión General](#1-visión-general)
2. [Modelo Económico Auto-Sostenible](#2-modelo-económico-auto-sostenible)
3. [Sistema de Niveles](#3-sistema-de-niveles)
4. [Sistema de Minería](#4-sistema-de-minería)
5. [Sistema de Puntos](#5-sistema-de-puntos)
6. [Tienda de Upgrades](#6-tienda-de-upgrades)
7. [Sistema de NFTs](#7-sistema-de-nfts)
8. [Sistema de Badges](#8-sistema-de-badges)
9. [Pool de Premios Bonus](#9-pool-de-premios-bonus)
10. [Sistema de Referidos](#10-sistema-de-referidos)
11. [Temporadas](#11-temporadas)
12. [Canon de Memes](#12-canon-de-memes)
13. [Estructura de Páginas](#13-estructura-de-páginas)
14. [Dashboard del Usuario](#14-dashboard-del-usuario)
15. [Roadmap de Implementación](#16-roadmap-de-implementación)
16. [Métricas de Éxito](#17-métricas-de-éxito)
17. [Glosario](#18-glosario)

---

## 1. VISIÓN GENERAL

### 1.1 Qué es Archive of Meme

Archive of Meme es un museo digital de memes icónicos donde cada meme es preservado como un NFT coleccionable en la blockchain de Base.

### 1.2 Filosofía del Ecosistema

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   "LOS PUNTOS SON EL JUEGO, NO EL DINERO"                        ║
║                                                                   ║
║   • Cualquiera puede minar GRATIS                                ║
║   • Los puntos se gastan en upgrades que dan MÁS puntos          ║
║   • El objetivo es SUBIR DE NIVEL, no "cobrar"                   ║
║   • Los NFTs son ACELERADORES opcionales, no requisitos          ║
║   • Si hay ventas → bonus extra (no garantizado)                 ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 1.3 Inspiración: Notcoin y Hamster Kombat

Este modelo está inspirado en las plataformas más exitosas de 2024:

| Plataforma | Usuarios | Modelo Clave |
|------------|----------|--------------|
| **Notcoin** | 35M+ | Tap gratis → Upgrades → Leagues → Airdrop |
| **Hamster Kombat** | 300M+ | Tap gratis → Cards → PPH → Airdrop |

**Lo que copiamos:**
- Acceso GRATIS para todos
- Economía cerrada (puntos se gastan en upgrades)
- Niveles/Leagues como motivación principal
- Anticipación de valor futuro

**Lo que innovamos:**
- NFTs reales como boost opcionales
- Memes icónicos como coleccionables
- Canon votado por la comunidad
- Pool de premios bonus (si hay ventas)

### 1.4 El Ecosistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ARCHIVE OF MEME ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ┌─────────────┐                             │
│                         │   USUARIO   │                             │
│                         └──────┬──────┘                             │
│                                │                                    │
│              ┌─────────────────┼─────────────────┐                  │
│              │                 │                 │                  │
│              ▼                 ▼                 ▼                  │
│       ┌───────────┐     ┌───────────┐     ┌───────────┐            │
│       │   MINAR   │     │  COMPRAR  │     │ PARTICIPAR│            │
│       │  (GRATIS) │     │UPGRADES   │     │ COMUNIDAD │            │
│       └─────┬─────┘     └─────┬─────┘     └─────┬─────┘            │
│             │                 │                 │                  │
│             ▼                 │                 │                  │
│       ┌───────────┐           │                 │                  │
│       │  PUNTOS   │◄──────────┴─────────────────┘                  │
│       └─────┬─────┘                                                │
│             │                                                      │
│    ┌────────┼────────┬────────────┬─────────────┐                  │
│    │        │        │            │             │                  │
│    ▼        ▼        ▼            ▼             ▼                  │
│ ┌──────┐┌──────┐┌────────┐┌───────────┐┌────────────┐              │
│ │NIVEL ││BOOST ││COSMETIC││MYSTERY BOX││VOTO CANON  │              │
│ │SUBIR ││TEMP. ││BADGES  ││           ││            │              │
│ └──────┘└──────┘└────────┘└───────────┘└────────────┘              │
│                                                                     │
│         ════════════════════════════════════════════                │
│                    ECONOMÍA CERRADA                                 │
│              (No requiere ingresos externos)                        │
│         ════════════════════════════════════════════                │
│                                                                     │
│                    CAPA BONUS (OPCIONAL)                            │
│         ┌─────────────────────────────────────────┐                 │
│         │  Si hay ventas de NFT Miners/Memes:     │                 │
│         │  30% → Pool de premios reales           │                 │
│         │  (Sorteos mensuales si hay fondos)      │                 │
│         └─────────────────────────────────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.5 Principios Fundamentales

| Principio | Descripción |
|-----------|-------------|
| **Auto-sostenible** | Funciona sin ingresos externos |
| **Gratis primero** | Cualquiera puede participar sin pagar |
| **Niveles como meta** | La motivación es subir, no cobrar |
| **Simple** | Fácil de entender en 30 segundos |
| **Divertido** | El sistema es entretenido por sí mismo |

---

## 2. MODELO ECONÓMICO AUTO-SOSTENIBLE

### 2.1 Economía Cerrada (Core)

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   REGLA DE ORO: LOS PUNTOS ENTRAN Y SALEN, NUNCA SE "COBRAN"     ║
║                                                                   ║
║   Entrada de puntos:                                              ║
║   └── Mining (gratis o con NFT boost)                            ║
║   └── Check-in diario                                            ║
║   └── Referidos                                                  ║
║   └── Streak bonus                                               ║
║                                                                   ║
║   Salida de puntos (sinks):                                      ║
║   └── Upgrades de mining                                         ║
║   └── Boosts temporales                                          ║
║   └── Cosmetics/Badges                                           ║
║   └── Mystery Box                                                ║
║   └── Votos Canon                                                ║
║                                                                   ║
║   NO HAY: Conversión a dinero, retiros, ni premios garantizados  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 2.2 Flujo de Puntos

```
ENTRADAS (por día, usuario activo)          SALIDAS (sinks disponibles)
────────────────────────────────            ────────────────────────────

Mining FREE (6x/día):        60 pts    ──►  Boost x1.5 (24h):     200 pts
Check-in diario:             25 pts    ──►  Multitap (+2 pts):    500 pts
Streak bonus (día 7):       +30%       ──►  Energy Boost:         300 pts
                                       ──►  Skip Cooldown:        400 pts
─────────────────────────────────           ──►  Badge cosmético:    1,000 pts
Total base/día:            ~110 pts    ──►  Mystery Box:          500 pts
Con streak 7d:             ~143 pts    ──►  Voto Canon:           100 pts
                                       ──►  Marco perfil:       2,000 pts
```

### 2.3 Balance Económico

```
EJEMPLO: Usuario FREE activo (30 días)
┌───────────────────────────────────────┐
│ ENTRADAS                              │
├───────────────────────────────────────┤
│ Mining (6x × 10pts × 30):    1,800    │
│ Check-in (25 × 30):            750    │
│ Streak bonus promedio:         400    │
│ ──────────────────────────────────── │
│ TOTAL ENTRADA:              ~2,950    │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ SALIDAS (si usa sinks)                │
├───────────────────────────────────────┤
│ Boosts ocasionales:            600    │
│ Mystery boxes:               1,000    │
│ Votos Canon:                   300    │
│ ──────────────────────────────────── │
│ TOTAL SALIDA:               ~1,900    │
└───────────────────────────────────────┘

BALANCE NETO: +1,050 pts/mes
(Acumulación moderada que permite subir de nivel)
```

### 2.4 Capa Bonus: Pool de Premios (Opcional)

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   IMPORTANTE: Esta capa es ADICIONAL, no esencial                ║
║                                                                   ║
║   Si se venden NFTs (Miners, Memes, Pass):                       ║
║   ├── 70% → Operaciones (desarrollo, marketing)                  ║
║   └── 30% → Pool de premios BONUS                                ║
║                                                                   ║
║   El pool se sortea mensualmente SI hay fondos.                  ║
║   Si no hay ventas, el sistema sigue funcionando igual.          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 3. SISTEMA DE NIVELES

### 3.1 Filosofía

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   EL NIVEL ES LA META PRINCIPAL                                  ║
║                                                                   ║
║   Como las Leagues de Notcoin o el PPH de Hamster Kombat,        ║
║   los usuarios compiten por SUBIR DE NIVEL, no por dinero.       ║
║                                                                   ║
║   Los puntos para nivel se ACUMULAN, no se gastan.               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 3.2 Niveles y Beneficios

| Nivel | Icono | Puntos Lifetime | Mining Bonus | Desbloqueos |
|-------|-------|-----------------|--------------|-------------|
| **Bronze** | 🥉 | 0 | +0% | Mining básico, check-in |
| **Silver** | 🥈 | 1,000 | +5% | Badge Silver, perfil básico |
| **Gold** | 🥇 | 5,000 | +10% | Multitap disponible, Mystery Box |
| **Platinum** | 💎 | 20,000 | +15% | Perfil público, marco especial |
| **Diamond** | 👑 | 100,000 | +25% | Votar Canon, canal exclusivo |
| **Legend** | 🌟 | 500,000 | +30% | Hall of Fame, avatar animado |

### 3.3 Tiempo Estimado por Nivel

| Nivel | Usuario FREE | Con Miner Basic | Con Miner Elite |
|-------|--------------|-----------------|-----------------|
| Silver (1K) | ~9 días | ~3 días | <1 día |
| Gold (5K) | ~45 días | ~17 días | ~2 días |
| Platinum (20K) | ~6 meses | ~2 meses | ~8 días |
| Diamond (100K) | ~2.5 años | ~11 meses | ~42 días |
| Legend (500K) | ~12 años | ~4.5 años | ~7 meses |

### 3.4 Visualización en UI

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  TU NIVEL: 🥇 GOLD                                                  │
│                                                                     │
│  Puntos lifetime: 12,450                                            │
│  ████████████████░░░░░░░░░░░░░░░░  62% hacia Platinum              │
│                                                                     │
│  Próximo nivel: 💎 PLATINUM (20,000 pts)                            │
│  Te faltan: 7,550 pts                                               │
│                                                                     │
│  Bonus actual: +10% mining                                          │
│  Próximo bonus: +15% mining                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. SISTEMA DE MINERÍA

### 4.1 Principio: Gratis para Todos

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   CUALQUIER USUARIO PUEDE MINAR SIN COMPRAR NADA                 ║
║                                                                   ║
║   Los NFT Miners son ACELERADORES opcionales.                    ║
║   Un usuario FREE puede llegar a Legend, solo tarda más.         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 4.2 Puntos por Mining

| Tipo | Puntos Base | Con Streak 7d (+30%) | Con Nivel Gold (+10%) |
|------|-------------|----------------------|----------------------|
| **FREE** | 10 pts | 13 pts | 14 pts |
| **Miner Basic** | 50 pts | 65 pts | 72 pts |
| **Miner Pro** | 150 pts | 195 pts | 215 pts |
| **Miner Elite** | 400 pts | 520 pts | 572 pts |

### 4.3 Cooldown y Frecuencia

```
SISTEMA SIMPLE:

├── Cooldown: 4 horas entre mining
├── Máximo: 6 mining por día
├── Sin sistema de energía complejo
├── Sin degradación de mineros
└── Sin eficiencia variable

El usuario solo necesita:
1. Conectar wallet
2. Presionar "MINE" cada 4 horas
3. Ver sus puntos subir
```

### 4.4 Cálculo de Puntos

```
FÓRMULA SIMPLE:

PUNTOS = BASE × (1 + STREAK_BONUS + NIVEL_BONUS + OG_BONUS)

Donde:
├── BASE = 10 (free) / 50 (basic) / 150 (pro) / 400 (elite)
├── STREAK_BONUS = 0% a 30% según días consecutivos
├── NIVEL_BONUS = 0% a 30% según tu nivel
└── OG_BONUS = 5% si tienes OG Pass

EJEMPLO:
Usuario con Miner Pro, streak 5 días, nivel Gold, OG Pass:
150 × (1 + 0.20 + 0.10 + 0.05) = 150 × 1.35 = 202 pts
```

### 4.5 Streak de Minería

| Días Consecutivos | Bonus |
|-------------------|-------|
| 1 | +0% |
| 2 | +5% |
| 3 | +10% |
| 4 | +15% |
| 5 | +20% |
| 6 | +25% |
| 7+ | +30% (máximo) |

**Reglas:**
- Debes minar al menos 1 vez cada 24 horas
- Si pasan más de 28 horas sin minar, el streak se reinicia
- Puedes comprar "Streak Shield" (1,000 pts) para proteger una vez

### 4.6 Hard Cap de Bonus: Máximo +100%

```
Para evitar que los whales dominen completamente:

BONUS MÁXIMO COMBINADO = +100% (x2)

Ejemplo whale:
├── Streak 30 días: +30%
├── Nivel Legend: +30%
├── OG Pass: +5%
├── Boost activo: +50%
────────────────────────
Total teórico: +115%
Total aplicado: +100% (cap)

Esto significa:
├── Miner Elite máximo: 400 × 2 = 800 pts/mining
├── Usuario FREE máximo: 10 × 2 = 20 pts/mining
└── Ratio whale/free = 40x (vs 115x sin cap)
```

---

## 5. SISTEMA DE PUNTOS

### 5.1 Un Solo Tipo de Punto

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   PUNTOS ARCH                                                     ║
║                                                                   ║
║   Una única moneda para todo el ecosistema.                      ║
║   Simple de entender, fácil de trackear.                         ║
║                                                                   ║
║   • Se GANAN minando y participando                              ║
║   • Se GASTAN en upgrades y features                             ║
║   • Se ACUMULAN para subir de nivel                              ║
║   • NO se convierten a dinero                                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 5.2 Formas de Ganar Puntos

| Acción | Puntos | Frecuencia | Notas |
|--------|--------|------------|-------|
| **Mining FREE** | 10 pts | Cada 4h | Sin NFT requerido |
| **Mining con NFT** | 50-400 pts | Cada 4h | Según nivel de miner |
| **Check-in diario** | 25 pts | 1x/día | Solo requiere conectar |
| **Primer registro** | 100 pts | Una vez | Bono de bienvenida |
| **Referido activo** | 100 pts | Por referido | Cuando el referido mina 10 veces |
| **Bonus referido** | 5% | 30 días | De lo que gana tu referido |

### 5.3 Formas de Gastar Puntos (Sinks)

| Sink | Costo | Efecto | Duración |
|------|-------|--------|----------|
| **Boost x1.5** | 200 pts | +50% puntos en mining | 24 horas |
| **Boost x2** | 500 pts | +100% puntos en mining | 24 horas |
| **Multitap** | 500 pts | +2 pts extra por mining | Permanente |
| **Energy Boost** | 300 pts | +1 mining extra por día | 7 días |
| **Skip Cooldown** | 400 pts | Minar inmediatamente | 1 uso |
| **Streak Shield** | 1,000 pts | Protege streak 1 vez | Hasta usarse |
| **Badge cosmético** | 1,000 pts | Badge visible en perfil | Permanente |
| **Marco perfil** | 2,000 pts | Marco especial | Permanente |
| **Voto Canon** | 100 pts | 1 voto para Canon | 1 uso |
| **Mystery Box** | 500 pts | Chance de premio | 1 uso |

### 5.4 Puntos Lifetime vs Puntos Gastables

```
IMPORTANTE: Dos contadores separados

LIFETIME POINTS (nunca bajan):
├── Determinan tu NIVEL
├── Se acumulan con cada acción
├── No se pueden gastar
└── Son tu "puntuación total histórica"

AVAILABLE POINTS (suben y bajan):
├── Son los que puedes GASTAR
├── = Lifetime - Gastados
└── Los usas en upgrades, sinks, etc.

EJEMPLO:
├── Lifetime: 15,000 pts (eres Gold)
├── Gastados: 3,000 pts
├── Disponibles: 12,000 pts
└── Tu nivel sigue siendo Gold (basado en 15K lifetime)
```

---

## 6. TIENDA DE UPGRADES

### 6.1 Categorías

```
┌─────────────────────────────────────────────────────────────────────┐
│                        🛒 TIENDA DE UPGRADES                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [⚡ BOOSTS]  [🎨 COSMETICS]  [🎁 MYSTERY]  [🗳️ CANON]              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Boosts (Temporales y Permanentes)

| Item | Costo | Tipo | Efecto |
|------|-------|------|--------|
| **Boost x1.5** | 200 pts | Temporal (24h) | +50% en mining |
| **Boost x2** | 500 pts | Temporal (24h) | +100% en mining |
| **Multitap Lv1** | 500 pts | Permanente | +2 pts/mining |
| **Multitap Lv2** | 1,500 pts | Permanente | +5 pts/mining (requiere Lv1) |
| **Multitap Lv3** | 5,000 pts | Permanente | +10 pts/mining (requiere Lv2) |
| **Energy+** | 300 pts | Temporal (7d) | +1 mining/día |
| **Skip Cooldown** | 400 pts | 1 uso | Mina sin esperar |
| **Streak Shield** | 1,000 pts | 1 uso | Protege streak |

### 6.3 Cosmetics

| Item | Costo | Requisito | Efecto |
|------|-------|-----------|--------|
| **Badge "Early Miner"** | 500 pts | - | Badge visible |
| **Badge "Dedicated"** | 1,000 pts | 30 días activo | Badge dorado |
| **Marco Bronze** | 500 pts | Nivel Silver | Marco perfil |
| **Marco Silver** | 1,000 pts | Nivel Gold | Marco perfil |
| **Marco Gold** | 2,000 pts | Nivel Platinum | Marco perfil |
| **Marco Diamond** | 5,000 pts | Nivel Diamond | Marco animado |
| **Nombre color** | 1,500 pts | Nivel Gold | Nombre en color |

### 6.4 Mystery Box

```
┌─────────────────────────────────────────────────────────────────────┐
│                         🎁 MYSTERY BOX                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Costo: 500 pts                                                     │
│  Requisito: Nivel Gold o superior                                   │
│                                                                     │
│  POSIBLES PREMIOS:                                                  │
│  ├── 40% → 100-300 pts (recuperas algo)                            │
│  ├── 25% → Boost x1.5 gratis                                       │
│  ├── 15% → 500-800 pts (ganancia)                                  │
│  ├── 10% → Badge exclusivo "Lucky"                                 │
│  ├── 7%  → 1,000-2,000 pts (jackpot menor)                         │
│  └── 3%  → Upgrade permanente gratis                               │
│                                                                     │
│  Valor esperado: ~400 pts (house edge 20%)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.5 Votos Canon

```
┌─────────────────────────────────────────────────────────────────────┐
│                         🗳️ VOTOS CANON                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Costo: 100 pts por voto                                            │
│  Requisito: Nivel Diamond o superior                                │
│                                                                     │
│  Cada mes, la comunidad vota qué memes merecen entrar al           │
│  "Canon" - la colección permanente del museo.                       │
│                                                                     │
│  Los votos se queman (sink) y determinan qué memes se              │
│  preservan eternamente en Arweave.                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. SISTEMA DE NFTs

### 7.1 Tipos de NFTs

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TIPOS DE NFTs                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ⛏️ MINERO NFTs (Utilidad - OPCIONALES)                            │
│  ├── Aceleran el mining de puntos                                   │
│  ├── Tres niveles de poder                                          │
│  ├── NO expiran, son permanentes                                    │
│  └── NO son requeridos para participar                              │
│                                                                     │
│  🖼️ MEME NFTs (Coleccionables)                                      │
│  ├── Memes icónicos de internet                                     │
│  ├── Uno nuevo cada día/semana                                      │
│  ├── Bonus menor en mining (+2% por meme)                           │
│  └── Coleccionismo puro                                             │
│                                                                     │
│  🎫 PASS OG (Acceso Especial)                                       │
│  ├── +5% permanente en mining                                       │
│  ├── Acceso a comentar memes                                        │
│  ├── Badge OG exclusivo                                             │
│  └── Edición limitada                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 NFT Miners - Detalle

| Nivel | Nombre | Puntos/Mining | Precio Sugerido | ROI vs FREE* |
|-------|--------|---------------|-----------------|--------------|
| 0 | **FREE** | 10 pts | $0 | - |
| 1 | **Miner Basic** | 50 pts | $15-20 | 5x más rápido |
| 2 | **Miner Pro** | 150 pts | $35-50 | 15x más rápido |
| 3 | **Miner Elite** | 400 pts | $75-100 | 40x más rápido |

*ROI = Velocidad para alcanzar mismo nivel que usuario FREE

### 7.3 Importante: Sin Degradación

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   LOS NFT MINERS SON PERMANENTES                                 ║
║                                                                   ║
║   • No se degradan con uso                                       ║
║   • No necesitan reparación                                      ║
║   • No tienen "vida útil"                                        ║
║   • Son inversión única, no gasto recurrente                     ║
║                                                                   ║
║   Esto simplifica el sistema y da valor real al NFT.             ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 7.4 Bonus por Meme NFTs

| Memes Poseídos | Bonus Mining |
|----------------|--------------|
| 1-2 | +2% |
| 3-5 | +5% |
| 6-10 | +8% |
| 11+ | +10% (máx) |

### 7.5 OG Pass

| Beneficio | Descripción |
|-----------|-------------|
| **+5% mining** | Bonus permanente en todos los minados |
| **Comentar** | Solo OG Pass holders pueden comentar memes |
| **Badge OG** | Badge exclusivo permanente |
| **Acceso temprano** | Primeros en ver nuevos memes |

---

## 8. SISTEMA DE BADGES

### 8.1 Filosofía

Los badges son logros visibles que dan STATUS. Algunos se ganan automáticamente, otros se compran con puntos.

### 8.2 Badges Automáticos (se ganan)

```
⛏️ MINERÍA
├── First Mine: Primera minería
├── Miner 10: 10 minadas totales
├── Miner 50: 50 minadas totales
├── Miner 100: 100 minadas totales
├── Miner 500: 500 minadas totales
└── Miner 1000: 1000 minadas totales

🔥 STREAK
├── Streak 3: 3 días consecutivos
├── Streak 7: 7 días consecutivos
├── Streak 30: 30 días consecutivos
└── Streak 100: 100 días consecutivos

📈 NIVEL
├── Silver Member: Alcanzar Silver
├── Gold Member: Alcanzar Gold
├── Platinum Member: Alcanzar Platinum
├── Diamond Member: Alcanzar Diamond
└── Legend: Alcanzar Legend

🖼️ COLECCIÓN
├── Collector: 1 Meme NFT
├── Enthusiast: 5 Meme NFTs
├── Archivist: 10+ Meme NFTs

⭐ ESPECIALES
├── OG: Poseer OG Pass
├── Early Adopter: Registro primer mes
└── Referrer: 5+ referidos activos
```

### 8.3 Badges Comprables (tienda)

| Badge | Costo | Requisito |
|-------|-------|-----------|
| **Dedicated Fan** | 500 pts | 30 días activo |
| **True Believer** | 1,000 pts | Nivel Gold |
| **Diamond Hands** | 2,500 pts | Nivel Platinum |
| **Whale** | 10,000 pts | Nivel Diamond |

---

## 9. POOL DE PREMIOS BONUS

### 9.1 Importante: Es Opcional

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   EL POOL DE PREMIOS ES UN BONUS, NO EL CORE                     ║
║                                                                   ║
║   • El sistema funciona perfectamente SIN el pool                ║
║   • Solo existe SI hay ventas de NFTs                            ║
║   • Los usuarios NO deben esperar premios garantizados           ║
║   • Es un "cherry on top", no la razón para participar           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 9.2 Cómo se Llena el Pool

```
VENTA DE NFT (cualquiera):
├── 70% → Operaciones (desarrollo, marketing, creador)
└── 30% → Pool de premios

EJEMPLO:
Mes con $1,000 en ventas de NFT Miners:
├── $700 → Operaciones
└── $300 → Pool de premios

Mes con $0 en ventas:
└── Pool = $0 (no hay sorteo)
```

### 9.3 Sorteo Mensual (si hay fondos)

```
SI pool > $50:
├── Sorteo el último día del mes
├── 3 ganadores aleatorios (usuarios activos)
├── Distribución: 50% / 30% / 20%
└── Premios: Gift cards, merch, o crypto

SI pool < $50:
├── Se acumula para siguiente mes
└── O se da como prizes menores (badges exclusivos)

ELEGIBILIDAD:
├── Haber minado al menos 20 veces en el mes
├── Nivel Silver o superior
└── Cuenta activa (no bot)
```

---

## 10. SISTEMA DE REFERIDOS

### 10.1 Mecánica Simple

```
TÚ                              TU REFERIDO
 │                                   │
 │  Compartes tu código/link         │
 │ ─────────────────────────────────▶│
 │                                   │
 │                                   │ Se registra
 │                                   │
 │◀──── +100 pts ────────────────────│ (cuando mina 10 veces)
 │                                   │
 │                                   │ Sigue minando
 │                                   │
 │◀──── +5% de sus pts ──────────────│ (por 30 días)
 │                                   │
```

### 10.2 Reglas

| Regla | Valor |
|-------|-------|
| Bonus inicial | 100 pts (cuando referido mina 10 veces) |
| Bonus ongoing | 5% de lo que gana el referido |
| Duración bonus | 30 días |
| Máximo referidos | Sin límite |
| Auto-referido | Prohibido (baneado) |

### 10.3 Badges de Referidor

| Badge | Referidos Activos | Bonus Extra |
|-------|-------------------|-------------|
| **Networker** | 5+ | +1% extra (6% total) |
| **Ambassador** | 15+ | +2% extra (7% total) |
| **Leader** | 30+ | +3% extra (8% total) |

---

## 11. TEMPORADAS

### 11.1 Estructura

```
TEMPORADA = 90 días (3 meses)

├── Season Points: Se resetean cada temporada
├── Lifetime Points: NUNCA se resetean
├── Nivel: Basado en Lifetime, no cambia
└── Leaderboard: Basado en Season Points
```

### 11.2 Qué se Resetea

| Elemento | ¿Se resetea? |
|----------|--------------|
| Season Points | ✅ Sí, a 0 |
| Lifetime Points | ❌ No |
| Nivel | ❌ No |
| Badges | ❌ No |
| NFTs | ❌ No |
| Streak | ❌ No |
| Upgrades comprados | ❌ No |

### 11.3 Premios de Fin de Temporada

| Posición | Premio |
|----------|--------|
| #1 | Badge "Champion S1" + 10,000 pts |
| #2-3 | Badge "Podium" + 5,000 pts |
| #4-10 | Badge "Top 10" + 2,000 pts |
| #11-50 | Badge "Top 50" + 500 pts |
| #51-100 | Badge "Top 100" |

---

## 12. CANON DE MEMES

### 12.1 Qué es el Canon

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   EL CANON = COLECCIÓN PERMANENTE DEL MUSEO                      ║
║                                                                   ║
║   Cada mes, la comunidad (nivel Diamond+) vota qué memes         ║
║   merecen ser preservados ETERNAMENTE en Arweave.                ║
║                                                                   ║
║   Es un honor entrar al Canon - significa que ese meme           ║
║   es considerado históricamente importante por la comunidad.     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 12.2 Proceso de Votación

```
1. NOMINACIÓN (día 1-20 del mes)
   └── Cualquier nivel Gold+ puede nominar memes

2. VOTACIÓN (día 21-28)
   └── Solo nivel Diamond+ puede votar
   └── Costo: 100 pts por voto
   └── Máximo 10 votos por usuario

3. SELECCIÓN (día 29-30)
   └── Top 3 memes más votados entran al Canon
   └── Se preservan en Arweave (storage permanente)

4. CEREMONIA (día 1 siguiente mes)
   └── Anuncio público de nuevos memes del Canon
   └── Badges especiales para nominadores exitosos
```

---

## 13. ESTRUCTURA DE PÁGINAS

### 13.1 Mapa del Sitio

```
Archive of Meme
│
├── 🏠 HOME
│   ├── Meme del día
│   ├── Tu resumen (si conectado)
│   ├── Stats del ecosistema
│   └── CTA para empezar
│
├── 🔍 EXPLORE
│   ├── Galería de memes
│   ├── Canon (colección permanente)
│   └── Búsqueda
│
├── ⛏️ MINE
│   ├── Botón MINE (principal)
│   ├── Tu Meme Power
│   ├── Streak actual
│   ├── Próximo mining disponible
│   └── Historial de mining
│
├── 🛒 SHOP
│   ├── Boosts
│   ├── Cosmetics
│   ├── Mystery Box
│   └── NFT Miners (link OpenSea)
│
├── 🏆 LEADERBOARD
│   ├── Season ranking
│   ├── Lifetime ranking
│   └── Tu posición
│
├── 👤 PROFILE
│   ├── Tu nivel y progreso
│   ├── Tus badges
│   ├── Tus NFTs
│   ├── Estadísticas
│   └── Código referido
│
└── 📊 STATS (público)
    ├── Usuarios totales
    ├── Mining total
    └── Pool actual (si hay)
```

---

## 14. DASHBOARD DEL USUARIO

### 14.1 Vista Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ⛏️ MINE                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                    [ 🔨 MINE NOW ]                          │   │
│  │                                                             │   │
│  │                    +52 pts próximo mining                   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │    NIVEL      │  │    PUNTOS     │  │    STREAK     │           │
│  │   🥇 GOLD     │  │    12,450     │  │   🔥 7 días   │           │
│  │   62% → 💎    │  │  disponibles  │  │   +30% bonus  │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  MEME POWER: 52 pts/mining                                  │   │
│  │  ├── Base (Miner Basic): 50 pts                             │   │
│  │  ├── Streak 7d: +30%                                        │   │
│  │  ├── Nivel Gold: +10%                                       │   │
│  │  └── = 50 × 1.04 ≈ 52 pts                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PRÓXIMO MINING EN: 2h 34m                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 15. ROADMAP DE IMPLEMENTACIÓN

### 15.1 Fases

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  FASE 1: FUNDACIÓN ✅                                               │
│  ├── ✅ Sistema de mining con NFT                                   │
│  ├── ✅ Dashboard básico                                            │
│  ├── ✅ Leaderboard                                                 │
│  ├── ✅ Badges (13 activos)                                         │
│  └── ✅ OG Pass bonus                                               │
│                                                                     │
│  FASE 2: MODELO AUTO-SOSTENIBLE ✅                                 │
│  ├── ✅ Mining GRATIS para todos                                    │
│  ├── ✅ Sistema de niveles (Bronze → Legend)                        │
│  ├── ✅ Simplificar (sin degradación/energía)                       │
│  ├── ✅ Tienda de upgrades (boosts básicos)                        │
│  ├── ✅ Mystery Box                                                 │
│  └── ✅ Cosmetics (badges, frames, name colors)                     │
│                                                                     │
│  FASE 3: ENGAGEMENT ✅                                              │
│  ├── ✅ Sistema de referidos mejorado                               │
│  ├── ✅ Feed de actividad (live en Home)                            │
│  ├── ✅ Perfiles públicos (/profile/[wallet])                       │
│  └── ✅ Notificaciones in-app (campanita)                           │
│                                                                     │
│  FASE 4: COMUNIDAD ✅                                               │
│  ├── ⏳ Canon de memes (votación) - POSPUESTO hasta tener comunidad │
│  ├── ✅ Comentarios (OG Pass + notif respuestas + badges visibles) │
│  ├── ✅ Eventos especiales (Meme Monday + aniversarios + admin)     │
│  └── ✅ Temporadas (3 meses, premios Top 10, auto-activación 100u) │
│                                                                     │
│  FASE 5: EXPANSIÓN ⏳                                               │
│  ├── ⏳ Pool de premios bonus                                       │
│  ├── ⏳ Más NFTs y coleccionables                                   │
│  ├── ⏳ Mobile app (PWA)                                            │
│  └── ⏳ Integraciones                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 16. MÉTRICAS DE ÉXITO

### 16.1 KPIs Principales

| Métrica | Mes 1 | Mes 6 | Año 1 |
|---------|-------|-------|-------|
| **Usuarios registrados** | 100 | 1,000 | 10,000 |
| **Usuarios activos diarios** | 30 | 300 | 2,000 |
| **Mining diarios** | 100 | 1,500 | 10,000 |
| **Nivel Gold+** | 5 | 100 | 1,000 |
| **Retención 7 días** | 40% | 50% | 60% |

### 16.2 Indicadores de Salud

| Indicador | Saludable | Preocupante |
|-----------|-----------|-------------|
| Usuarios activos/registrados | >30% | <15% |
| Mining promedio/usuario/día | >3 | <1 |
| Uso de sinks | >20% usuarios | <5% usuarios |
| Streak promedio | >4 días | <2 días |

---

## 17. GLOSARIO

| Término | Definición |
|---------|------------|
| **Mining** | Acción de presionar botón cada 4h para obtener puntos |
| **Meme Power** | Cantidad de puntos que ganas por mining |
| **Streak** | Días consecutivos minando |
| **Sink** | Mecanismo para gastar puntos |
| **Nivel** | Tu rango basado en puntos lifetime |
| **Canon** | Colección permanente de memes históricos |
| **Season** | Período de 90 días con leaderboard separado |
| **Lifetime Points** | Total histórico de puntos (nunca baja) |
| **Available Points** | Puntos que puedes gastar |

---

## CONTROL DE VERSIONES

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Enero 2026 | Documento inicial |
| 1.1 | Enero 2026 | Anti-inflación, caps, lazy mining |
| 2.0 | Enero 2026 | **REDISEÑO COMPLETO**: Modelo auto-sostenible inspirado en Notcoin/Hamster. Mining gratis, niveles como core, economía cerrada, premios opcionales. Eliminada degradación y energía compleja. |

---

*Este documento es la guía maestra del ecosistema. Última actualización: Enero 2026.*
