# Archive of Meme - Design System

> Sistema de diseño adaptativo: PWA Móvil vs Web Desktop

**Versión:** 1.0
**Fecha:** 2026-01-09
**Estado:** En desarrollo

---

## Índice

1. [Visión General](#visión-general)
2. [Principios de Diseño](#principios-de-diseño)
3. [Detección de Plataforma](#detección-de-plataforma)
4. [Diseño PWA Móvil](#diseño-pwa-móvil)
5. [Diseño Web Desktop](#diseño-web-desktop)
6. [Componentes Compartidos](#componentes-compartidos)
7. [Paleta de Colores](#paleta-de-colores)
8. [Tipografía](#tipografía)
9. [Estructura de Archivos](#estructura-de-archivos)
10. [Pasos de Implementación](#pasos-de-implementación)

---

## Visión General

### Objetivo
Crear dos experiencias visuales distintas pero coherentes:
- **PWA Móvil:** Experiencia de app nativa, optimizada para uso con una mano
- **Web Desktop:** Portal moderno y profesional, aprovechando el espacio de pantalla

### Filosofía
- **Mobile-first:** El diseño móvil es la base
- **Progressive Enhancement:** Desktop añade funcionalidades, no las quita
- **Consistencia:** Misma identidad de marca en ambas plataformas
- **Performance:** Carga rápida, transiciones suaves

---

## Principios de Diseño

| Principio | Móvil | Desktop |
|-----------|-------|---------|
| **Navegación** | Bottom tabs, gestos | Sidebar + Header |
| **Contenido** | Vertical, scroll infinito | Grid, paginación opcional |
| **Densidad** | Espaciado amplio, touch-friendly | Más compacto, hover states |
| **Jerarquía** | Una acción principal por pantalla | Múltiples acciones visibles |
| **Feedback** | Haptic, animaciones | Hover, transiciones |

---

## Detección de Plataforma

### Hook: `useDeviceMode`

```javascript
// Detecta el modo de visualización
const mode = useDeviceMode();
// Retorna: 'mobile-pwa' | 'mobile-web' | 'desktop'
```

### Criterios de detección

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ¿Es PWA instalada?                                        │
│  (display-mode: standalone)                                 │
│                                                             │
│  SÍ ─────────► mobile-pwa                                  │
│                                                             │
│  NO ─────────► ¿Ancho < 768px?                             │
│                │                                            │
│                ├── SÍ ──► mobile-web                       │
│                │                                            │
│                └── NO ──► desktop                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Diseño PWA Móvil

### Layout Principal

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │        Mini Header          │   │  ← Logo + Wallet (44px)
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │                             │   │
│  │         Content             │   │  ← Feed, Detail, Points
│  │         (Scroll)            │   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🏠    🔍    ⭐    👤      │   │  ← Bottom Tab Bar (56px)
│  │  Home Search Points Profile │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Características

1. **Mini Header (44px)**
   - Logo a la izquierda
   - Botón wallet a la derecha
   - Transparente con blur al hacer scroll

2. **Bottom Tab Bar (56px)**
   - 4 tabs: Home, Search, Points, Profile
   - Indicador de tab activo
   - Safe area para notch/home indicator

3. **Feed Móvil**
   - Cards full-width
   - Imagen prominente
   - Acciones debajo de la imagen
   - Pull-to-refresh

4. **Transiciones**
   - Slide horizontal entre tabs
   - Push/pop para navegación profunda
   - Fade para modales

### Páginas Móvil

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `MobileFeed` | Feed de memes scroll infinito |
| `/search` | `MobileSearch` | Búsqueda + filtros |
| `/points` | `MobilePoints` | Dashboard de puntos (existente) |
| `/profile` | `MobileProfile` | Wallet, settings, historial |
| `/meme/[id]` | `MobileDetail` | Detalle fullscreen |

---

## Diseño Web Desktop

### Layout Principal

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Logo        [Search...........................]    [Wallet] [NFT] │  │  ← Header (64px)
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────┐  ┌──────────────────────────────────┐  ┌─────────────────┐ │
│  │         │  │                                  │  │                 │ │
│  │  Side   │  │                                  │  │    Trending     │ │
│  │  bar    │  │         Main Content             │  │    Sidebar      │ │
│  │         │  │                                  │  │                 │ │
│  │  Home   │  │    ┌──────┐  ┌──────┐           │  │  Top Memes      │ │
│  │  Explore│  │    │ Card │  │ Card │           │  │  Leaderboard    │ │
│  │  Points │  │    └──────┘  └──────┘           │  │  Season Info    │ │
│  │  About  │  │    ┌──────┐  ┌──────┐           │  │                 │ │
│  │         │  │    │ Card │  │ Card │           │  │                 │ │
│  │         │  │    └──────┘  └──────┘           │  │                 │ │
│  │         │  │                                  │  │                 │ │
│  └─────────┘  └──────────────────────────────────┘  └─────────────────┘ │
│     240px              flex (min 600px)                   320px         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Footer: Links | Social | Legal                                    │  │  ← Footer (48px)
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Características

1. **Header Desktop (64px)**
   - Logo con nombre completo
   - Barra de búsqueda central
   - Botón wallet + menú dropdown
   - Links de navegación secundarios

2. **Sidebar Izquierdo (240px)**
   - Navegación principal
   - Links con iconos
   - Colapsable en pantallas medianas
   - Sticky position

3. **Main Content (flex)**
   - Grid de 2-3 columnas según ancho
   - Cards con hover effects
   - Infinite scroll o paginación

4. **Trending Sidebar (320px)**
   - Top memes de la semana
   - Mini leaderboard
   - Info de temporada
   - CTAs (Connect wallet, etc.)

5. **Footer (48px)**
   - Links importantes
   - Redes sociales
   - Legal

### Páginas Desktop

| Ruta | Layout | Contenido Principal |
|------|--------|---------------------|
| `/` | 3 columnas | Feed grid + Trending |
| `/explore` | 3 columnas | Búsqueda + Filtros avanzados |
| `/points` | 2 columnas | Dashboard expandido |
| `/meme/[id]` | 2 columnas | Detalle + Comentarios lado a lado |
| `/about` | 1 columna centrada | Info del proyecto |

---

## Componentes Compartidos

### Lógica (hooks)
- `useDeviceMode` - Detecta plataforma
- `useMemes` - Fetch y cache de memes
- `usePoints` - Sistema de puntos (existente)
- `useWallet` - Conexión wallet (existente)

### UI Compartida
- `MemeImage` - Imagen optimizada con placeholder
- `WalletButton` - Botón de conexión
- `PointsBadge` - Muestra puntos del usuario
- `LoadingSpinner` - Indicador de carga
- `Toast` - Notificaciones

### Estructura de componentes

```
src/components/
├── shared/              # Compartidos
│   ├── MemeImage.jsx
│   ├── WalletButton.jsx
│   ├── PointsBadge.jsx
│   └── ...
│
├── mobile/              # Solo móvil
│   ├── MobileLayout.jsx
│   ├── BottomTabBar.jsx
│   ├── MobileHeader.jsx
│   ├── MobileFeed.jsx
│   ├── MobileCard.jsx
│   └── ...
│
├── desktop/             # Solo desktop
│   ├── DesktopLayout.jsx
│   ├── DesktopHeader.jsx
│   ├── Sidebar.jsx
│   ├── TrendingSidebar.jsx
│   ├── DesktopFeed.jsx
│   ├── DesktopCard.jsx
│   └── ...
│
└── points/              # Sistema de puntos (existente)
    └── ...
```

---

## Paleta de Colores

### Base (Dark Mode)

| Variable | Hex | Uso |
|----------|-----|-----|
| `--bg-primary` | `#0a0a0a` | Fondo principal |
| `--bg-secondary` | `#121212` | Fondo elevado (desktop) |
| `--bg-card` | `#1a1a1a` | Cards, modales |
| `--bg-elevated` | `#2a2a2a` | Elementos elevados |
| `--border` | `#2a2a2a` | Bordes sutiles |

### Texto

| Variable | Hex | Uso |
|----------|-----|-----|
| `--text-primary` | `#ffffff` | Texto principal |
| `--text-secondary` | `#a0a0a0` | Texto secundario |
| `--text-muted` | `#666666` | Texto deshabilitado |

### Accent

| Variable | Hex | Uso |
|----------|-----|-----|
| `--accent-primary` | `#a5b4fc` | Accent principal (indigo claro) |
| `--accent-secondary` | `#818cf8` | Accent hover |
| `--accent-gold` | `#fbbf24` | Puntos, premios |
| `--accent-green` | `#22c55e` | Éxito, positivo |
| `--accent-red` | `#ef4444` | Error, peligro |
| `--accent-blue` | `#2081e2` | OpenSea, links |

---

## Tipografía

### Fuentes

```css
--font-sans: 'Geist', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', monospace;
```

### Escala

| Clase | Tamaño | Peso | Uso |
|-------|--------|------|-----|
| `text-xs` | 12px | 400 | Labels, metadata |
| `text-sm` | 14px | 400 | Body secundario |
| `text-base` | 16px | 400 | Body principal |
| `text-lg` | 18px | 500 | Subtítulos |
| `text-xl` | 20px | 600 | Títulos de card |
| `text-2xl` | 24px | 700 | Títulos de sección |
| `text-3xl` | 30px | 700 | Títulos de página |

---

## Estructura de Archivos

```
src/
├── app/
│   ├── layout.js              # Layout raíz
│   ├── page.js                # Home (detecta y renderiza)
│   ├── points/
│   │   └── page.js            # Puntos (ya adaptativo)
│   ├── meme/
│   │   └── [id]/
│   │       └── page.js        # Detalle meme
│   ├── search/
│   │   └── page.js            # Búsqueda (nuevo)
│   └── profile/
│       └── page.js            # Perfil (nuevo)
│
├── components/
│   ├── shared/
│   ├── mobile/
│   ├── desktop/
│   └── points/
│
├── hooks/
│   ├── useDeviceMode.js       # Nuevo
│   ├── useMemes.js            # Nuevo
│   ├── usePoints.js           # Existente
│   └── useRewards.js          # Existente
│
├── lib/
│   └── ...
│
└── styles/
    └── globals.css
```

---

## Pasos de Implementación

### Fase 1: Infraestructura (Primero)

- [ ] **1.1** Crear hook `useDeviceMode`
- [ ] **1.2** Actualizar `globals.css` con variables CSS
- [ ] **1.3** Crear componente `AdaptiveLayout` que detecta y renderiza

### Fase 2: Layout Móvil

- [ ] **2.1** Crear `MobileLayout` con estructura base
- [ ] **2.2** Crear `MobileHeader` (mini header)
- [ ] **2.3** Crear `BottomTabBar` con 4 tabs
- [ ] **2.4** Crear `MobileCard` (card de meme móvil)
- [ ] **2.5** Crear `MobileFeed` (feed con cards móviles)

### Fase 3: Layout Desktop

- [ ] **3.1** Crear `DesktopLayout` con 3 columnas
- [ ] **3.2** Crear `DesktopHeader` (header completo)
- [ ] **3.3** Crear `Sidebar` (navegación izquierda)
- [ ] **3.4** Crear `TrendingSidebar` (panel derecho)
- [ ] **3.5** Crear `DesktopCard` (card con hover)
- [ ] **3.6** Crear `DesktopFeed` (grid de cards)

### Fase 4: Páginas Adaptativas

- [ ] **4.1** Actualizar `/` para usar layouts adaptativos
- [ ] **4.2** Actualizar `/meme/[id]` para ambos modos
- [ ] **4.3** Crear `/search` (nueva página)
- [ ] **4.4** Crear `/profile` (nueva página)

### Fase 5: Pulido

- [ ] **5.1** Animaciones y transiciones
- [ ] **5.2** Pull-to-refresh en móvil
- [ ] **5.3** Keyboard shortcuts en desktop
- [ ] **5.4** Testing en dispositivos reales

---

## Referencias Visuales

### Apps similares (móvil)
- Instagram (feed, stories)
- Twitter/X (timeline, tabs)
- OpenSea app (NFT cards)
- Blur app (colecciones)

### Webs similares (desktop)
- OpenSea.io (grid, sidebar)
- Blur.io (diseño oscuro, datos)
- Foundation.app (minimalista, arte)
- Zora.co (moderno, tipografía)

---

## Notas Técnicas

### Performance
- Lazy loading de imágenes
- Virtualización para listas largas
- Skeleton loaders
- Prefetch de rutas

### Accesibilidad
- Focus states visibles
- ARIA labels
- Contraste adecuado
- Navegación por teclado

### PWA
- Offline fallback
- Cache de imágenes
- Push notifications (futuro)

---

## Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-09 | 1.0 | Documento inicial |

