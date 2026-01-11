# DISEÑO HOME - Archive of Meme

> Documento de diseño para la página Home en PWA Mobile y Desktop Web.
>
> **Estado:** PWA Mobile ✅ IMPLEMENTADO | Desktop ⏳ PENDIENTE
> **Última actualización:** Enero 2026

---

## FILOSOFÍA DE DISEÑO

### Dos experiencias diferentes:
- **PWA Mobile:** Diseño app-like, compacto, táctil, orientado a acción
- **Desktop Web:** Diseño profesional, espacioso, informativo, elegante

### Principios:
1. Usuario conectado ve su perfil y progreso
2. Usuario no conectado ve pantalla de bienvenida atractiva
3. Acciones principales siempre visibles
4. Información relevante sin saturar
5. Badge verificado si tiene NFTs comprados

---

## BADGE VERIFICADO

**Regla:** Si el usuario tiene CUALQUIER NFT comprado, aparece el tick de verificado.

**Prioridad de NFT mostrado junto al nombre:**
1. Ultra Miner → "Ultra Miner"
2. Pro Miner → "Pro Miner"
3. Basic Miner → "Basic Miner"
4. OG Pass → "OG Pass Holder"
5. Memes → "X Memes Collector"

---

## PWA MOBILE HOME ✅ IMPLEMENTADO

**Archivo:** `src/components/mobile/MobileHome.jsx`

### Estructura Visual:

```
┌─────────────────────────────────────┐
│         HEADER (MobileLayout)       │
│  [Logo]  ARCHIVE           [🔔][👛] │
├─────────────────────────────────────┤
│                                     │
│  ╭─────────────────────────────────╮│
│  │ 1. PROFILE CARD                 ││
│  │ ┌────┐                          ││
│  │ │ 🥇 │  0xABC...123  ✓ ✅       ││
│  │ │    │  OG Pass Holder          ││
│  │ └────┘  🥇 Gold   🔥 5d streak  ││
│  ╰─────────────────────────────────╯│
│                                     │
│  ╭─────────╮╭─────────╮╭─────────╮  │
│  │ 2. STATS GRID                 │  │
│  │   ⭐    ││   🏆    ││   🖼️    │  │
│  │ 124.5K  ││  #42    ││    3    │  │
│  │ Points  ││  Rank   ││  NFTs   │  │
│  ╰─────────╯╰─────────╯╰─────────╯  │
│                                     │
│  ╭─────────────────────────────────╮│
│  │ 3. MINE CTA (verde si ready)    ││
│  │  ⛏️  Mine Now!      +150+ pts  ││
│  │  ───────────────────────────── ││
│  │  ⏳  Next mine in 2h 30m       ││ (gris si cooldown)
│  ╰─────────────────────────────────╯│
│                                     │
│  ╭─────────────────────────────────╮│
│  │ 4. EVENT BANNER (solo si hay)   ││
│  │ 🚀 Meme Monday      Ends: 12h  ││
│  │    1.5x points active!         ││
│  ╰─────────────────────────────────╯│
│                                     │
│  ╭─────────────────────────────────╮│
│  │ 5. LIVE ACTIVITY                ││
│  │ 🟢 Live Activity                ││
│  │ ⛏️ 0xDEF... mined +150    2m   ││
│  │ 🎉 0x123... reached Gold  5m   ││
│  │ 🏅 0xABC... earned badge 10m   ││
│  ╰─────────────────────────────────╯│
│                                     │
│  ╭─────────────────────────────────╮│
│  │ 6. REFERRALS                    ││
│  │ 👥 3 friends invited  [Invite+]││
│  │    +450 bonus pts earned       ││
│  ╰─────────────────────────────────╯│
│                                     │
│  ╭─────────────────────────────────╮│
│  │ 7. EXPLORE NFTs                 ││
│  │ ┌───┐ ┌───┐ ┌───┐              ││
│  │ │👑 │ │⛏️ │ │🖼️ │              ││
│  │ │OG │ │Min│ │Mem│  → OpenSea   ││
│  │ └───┘ └───┘ └───┘              ││
│  ╰─────────────────────────────────╯│
│                                     │
├─────────────────────────────────────┤
│  BOTTOM TAB BAR (MobileLayout)      │
│   🏠    ⛏️    🛒    📊    👤       │
│  Home  Mine  Shop Stats Profile     │
└─────────────────────────────────────┘
```

### Estados especiales:

**No conectado:**
```
┌─────────────────────────────────────┐
│         WELCOME SCREEN              │
│                                     │
│           ┌────────┐                │
│           │  LOGO  │                │
│           └────────┘                │
│                                     │
│       Archive of Meme               │
│                                     │
│   Mine points, collect NFTs,        │
│   and join the community            │
│                                     │
│   ╭─────────────────────────────╮   │
│   │     Connect Wallet          │   │
│   ╰─────────────────────────────╯   │
│                                     │
│   Free to play. No purchase req.    │
│                                     │
│     ⛏️        🏆        🎁          │
│    Mine    Compete    Earn          │
└─────────────────────────────────────┘
```

**No registrado (wallet conectado pero nuevo):**
```
┌─────────────────────────────────────┐
│           👋                        │
│        Welcome!                     │
│                                     │
│   Join the Archive and start        │
│   mining points                     │
│                                     │
│   ╭─────────────────────────────╮   │
│   │      Start Mining           │   │
│   ╰─────────────────────────────╯   │
└─────────────────────────────────────┘
```

### Componentes creados:

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `MobileHome` | `components/mobile/MobileHome.jsx` | Componente principal |
| `ProfileCard` | Dentro de MobileHome | Perfil con badge verificado |
| `StatsGrid` | Dentro de MobileHome | 3 cards de stats |
| `MineCTA` | Dentro de MobileHome | Botón principal de minar |
| `EventBanner` | Dentro de MobileHome | Banner de evento activo |
| `ActivitySection` | Dentro de MobileHome | Feed de actividad live |
| `ReferralsSection` | Dentro de MobileHome | Referidos y bonus |
| `ExploreSection` | Dentro de MobileHome | Links a NFTs en OpenSea |

---

## DESKTOP WEB HOME ⏳ PENDIENTE

**Archivo a crear:** `src/components/desktop/DesktopHome.jsx`

### Estructura Visual Propuesta:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                      │
│  [Logo] ARCHIVE OF MEME          [Search...]         [🔔] [Connect Wallet]  │
├────────────┬─────────────────────────────────────────────────┬───────────────┤
│            │                                                 │               │
│  SIDEBAR   │              CONTENIDO PRINCIPAL                │   TRENDING    │
│            │                                                 │   SIDEBAR     │
│  🏠 Home   │  ╭───────────────────────────────────────────╮ │               │
│  🔍 Explore│  │ 1. PROFILE CARD (horizontal, elegante)    │ │  Live Activity│
│  ⛏️ Mining │  │                                           │ │  ───────────  │
│  🛒 Shop   │  │ [Avatar]  0xABC...123  ✓ OG Pass Holder  │ │  0xDEF mined  │
│  📊 Stats  │  │           🥇 Gold Level  •  🔥 5d streak  │ │  0x123 level  │
│  🏆 Rank   │  │                                           │ │  0xABC badge  │
│            │  │  ┌────────┐ ┌────────┐ ┌────────┐        │ │               │
│            │  │  │124,500 │ │ #42    │ │ 3 NFTs │        │ │  ───────────  │
│            │  │  │Points  │ │ Rank   │ │ Owned  │        │ │               │
│            │  │  └────────┘ └────────┘ └────────┘        │ │  Season       │
│            │  ╰───────────────────────────────────────────╯ │  Progress     │
│            │                                                 │  ───────────  │
│            │  ╭───────────────────────────────────────────╮ │  [████░░] 45d │
│            │  │ 2. EVENT / SEASON BANNER                  │ │               │
│            │  │ 🚀 Meme Monday ACTIVE        12h left     │ │  ───────────  │
│            │  │    1.5x mining points on all activities   │ │               │
│            │  ╰───────────────────────────────────────────╯ │  Top Miners   │
│            │                                                 │  ───────────  │
│            │  ╭───────────────────────────────────────────╮ │  🥇 0xAAA 50K │
│            │  │ 3. QUICK ACTIONS (horizontal cards)       │ │  🥈 0xBBB 45K │
│            │  │                                           │ │  🥉 0xCCC 40K │
│            │  │ ┌─────────────┐ ┌─────────────┐          │ │               │
│            │  │ │  ⛏️ MINE    │ │  🛒 SHOP    │          │ │               │
│            │  │ │  Ready!     │ │  Upgrades   │          │ │               │
│            │  │ │  +150 pts   │ │  & Boosts   │          │ │               │
│            │  │ └─────────────┘ └─────────────┘          │ │               │
│            │  ╰───────────────────────────────────────────╯ │               │
│            │                                                 │               │
│            │  ╭───────────────────────────────────────────╮ │               │
│            │  │ 4. YOUR NFTs / COLLECTION                 │ │               │
│            │  │                                           │ │               │
│            │  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐             │ │               │
│            │  │ │ 👑 │ │ ⛏️ │ │ 🖼️ │ │ 🖼️ │   [View All]│ │               │
│            │  │ │Pass│ │Pro │ │Doge│ │Trol│             │ │               │
│            │  │ └────┘ └────┘ └────┘ └────┘             │ │               │
│            │  ╰───────────────────────────────────────────╯ │               │
│            │                                                 │               │
│            │  ╭───────────────────────────────────────────╮ │               │
│            │  │ 5. REFERRALS                              │ │               │
│            │  │ 👥 Invite friends & earn bonus points     │ │               │
│            │  │ 3 invited • +450 pts earned  [Copy Link]  │ │               │
│            │  ╰───────────────────────────────────────────╯ │               │
│            │                                                 │               │
├────────────┴─────────────────────────────────────────────────┴───────────────┤
│  FOOTER (opcional)                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Diferencias clave Desktop vs PWA:

| Aspecto | PWA Mobile | Desktop Web |
|---------|------------|-------------|
| Layout | 1 columna | 3 columnas |
| Profile | Card vertical compacta | Card horizontal espaciada |
| Stats | 3 cards pequeñas | Integrado en profile card |
| Mine CTA | Botón grande central | Card con más info |
| Activity | Sección inline | Sidebar derecho |
| Navigation | Bottom tab bar | Sidebar izquierdo |
| Espaciado | Compacto (4px-8px gaps) | Amplio (16px-24px gaps) |
| Touch targets | Grandes (48px+) | Estándar |
| Animaciones | Más pronunciadas | Sutiles |

### Colores y estilos:

```css
/* Variables existentes */
--bg-primary: #0a0a0a;
--bg-secondary: #0f0f0f;
--bg-card: #1a1a1a;
--bg-elevated: #2a2a2a;
--text-primary: #ffffff;
--text-secondary: #a0a0a0;
--text-muted: #666666;
--accent-primary: #00ff88;

/* Gradientes para cards */
Stats: from-yellow-500/20 to-orange-500/20 (points)
       from-purple-500/20 to-pink-500/20 (rank)
       from-blue-500/20 to-cyan-500/20 (NFTs)

Event: from-blue-600/20 to-purple-600/20

Referrals: from-purple-500/10 to-pink-500/10
```

---

## IMPLEMENTACIÓN PENDIENTE

### Para completar Desktop Home:

1. Crear `src/components/desktop/DesktopHome.jsx`
2. Actualizar `src/app/page.js` para usar DesktopHome
3. Mantener el sidebar izquierdo existente (DesktopLayout)
4. Crear/actualizar TrendingSidebar con activity + season + top miners

### Archivos a modificar:
- `src/app/page.js` - Cambiar DesktopFeed por DesktopHome
- `src/components/desktop/TrendingSidebar.jsx` - Actualizar contenido

### Archivos a crear:
- `src/components/desktop/DesktopHome.jsx` - Nuevo componente principal

---

## NOTAS ADICIONALES

### API endpoints usados en Home:

| Endpoint | Datos |
|----------|-------|
| `/api/mining/user?wallet=X` | Perfil, puntos, nivel, NFTs, cooldown |
| `/api/events` | Evento activo |
| `/api/activity?limit=5` | Actividad reciente |
| `/api/referrals?wallet=X` | Datos de referidos |
| `/api/seasons?active=true` | Temporada activa |

### Lógica de verificación:

```javascript
// Usuario verificado si tiene cualquier NFT
const hasNFT = user.miner?.hasMiner ||
               user.nfts?.passCount > 0 ||
               user.nfts?.memeCount > 0;

// NFT más importante para mostrar
function getImportantNFT(user) {
  if (user.miner?.level === 'Ultra') return 'Ultra Miner';
  if (user.miner?.level === 'Pro') return 'Pro Miner';
  if (user.miner?.level === 'Basic') return 'Basic Miner';
  if (user.nfts?.passCount > 0) return 'OG Pass Holder';
  if (user.nfts?.memeCount > 0) return `${user.nfts.memeCount} Meme Collector`;
  return null;
}
```

---

## SIGUIENTE PASO

Implementar `DesktopHome.jsx` siguiendo el diseño especificado arriba.
