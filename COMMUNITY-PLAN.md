# Archive Community - Plan de Implementación

## Resumen del Proyecto

Crear un sistema de comunidad tipo foro/4chan donde los holders del "Archive Community Pass" (NFT) pueden comentar en los memes, votar comentarios y moderar contenido mediante votación comunitaria.

---

## 1. NFT Pass - Especificaciones

| Parámetro | Valor |
|-----------|-------|
| Nombre | Archive Community Pass |
| Blockchain | Base |
| Supply | Ilimitado |
| Precio | 0.0005 ETH (~$1.50 USD) |
| Plataforma | OpenSea (sin contrato propio) |

### Creación en OpenSea (Manual)

1. Ir a OpenSea → Create → Collection
2. Nombre: "Archive Community Pass"
3. Blockchain: Base
4. Crear NFT dentro de la colección:
   - Nombre: "Community Pass"
   - Supply: Ilimitado (o el deseado)
   - Precio: 0.0005 ETH

### Verificación de Ownership

```javascript
// Verificar si wallet tiene el Pass via OpenSea API
async function hasPass(walletAddress) {
  const response = await fetch(
    `https://api.opensea.io/api/v2/chain/base/account/${walletAddress}/nfts?collection=archive-community-pass`,
    { headers: { 'x-api-key': process.env.OPENSEA_API_KEY } }
  );
  const data = await response.json();
  return data.nfts.length > 0;
}
```

### Ventajas de usar OpenSea

| Aspecto | Beneficio |
|---------|-----------|
| Seguridad | Contratos auditados por OpenSea |
| Costo | $0 (no hay deploy) |
| Marketplace | Usuarios pueden comprar/vender en OpenSea |
| Confianza | Plataforma conocida |
| Simplicidad | Sin código de contratos |

---

## 2. Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                     (Next.js + React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Wallet    │  │  Comentarios │  │    Moderación      │  │
│  │   Connect   │  │     Feed     │  │    (Reportes)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│                   (Next.js API Routes)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  /api/user  │  │/api/comments│  │  /api/moderation    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│       SUPABASE          │     │        BLOCKCHAIN           │
│      (PostgreSQL)       │     │          (Base)             │
│                         │     │                             │
│  - users                │     │  - NFT Pass Contract        │
│  - comments             │     │  - Verificación holdings    │
│  - votes                │     │                             │
│  - reports              │     │                             │
└─────────────────────────┘     └─────────────────────────────┘
```

---

## 3. Base de Datos (Supabase)

### Tabla: users

| Columna | Tipo | Descripción |
|---------|------|-------------|
| wallet_address | VARCHAR(42) PK | Dirección wallet (lowercase) |
| alias | VARCHAR(20) | Alias personalizado (único, opcional) |
| show_alias | BOOLEAN | true=mostrar alias, false=mostrar wallet |
| created_at | TIMESTAMP | Fecha registro |
| updated_at | TIMESTAMP | Última actualización |

**Restricciones:**
- alias: máximo 20 caracteres, alfanumérico + guiones
- alias: filtro de palabras prohibidas

### Tabla: comments

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | ID único |
| meme_id | VARCHAR(10) | ID del meme (de OpenSea) |
| user_wallet | VARCHAR(42) FK | Autor del comentario |
| content | TEXT | Contenido (máx 500 chars) |
| parent_id | UUID FK NULL | ID comentario padre (si es respuesta) |
| is_hidden | BOOLEAN | Oculto por moderación |
| created_at | TIMESTAMP | Fecha creación |

**Restricciones:**
- content: máximo 500 caracteres
- Máximo 2 niveles de anidación (comentario → respuesta)

### Tabla: comment_votes

| Columna | Tipo | Descripción |
|---------|------|-------------|
| comment_id | UUID FK | Comentario votado |
| user_wallet | VARCHAR(42) | Quien vota |
| vote_type | SMALLINT | 1=upvote, -1=downvote |
| created_at | TIMESTAMP | Fecha del voto |

**PK:** (comment_id, user_wallet)

### Tabla: reports

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | ID único |
| comment_id | UUID FK | Comentario reportado |
| reporter_wallet | VARCHAR(42) | Quien reporta |
| reason | VARCHAR(100) | Razón del reporte |
| status | VARCHAR(20) | pending / voting / resolved |
| created_at | TIMESTAMP | Fecha reporte |
| voting_ends_at | TIMESTAMP NULL | Cuándo termina votación |

### Tabla: moderation_votes

| Columna | Tipo | Descripción |
|---------|------|-------------|
| report_id | UUID FK | Reporte votado |
| user_wallet | VARCHAR(42) | Quien vota |
| vote | VARCHAR(10) | keep / remove |
| created_at | TIMESTAMP | Fecha del voto |

**PK:** (report_id, user_wallet)

### Tabla: banned_words

| Columna | Tipo | Descripción |
|---------|------|-------------|
| word | VARCHAR(50) PK | Palabra prohibida |

---

## 4. Sistema de Moderación

### Parámetros

| Parámetro | Valor | Configurable |
|-----------|-------|--------------|
| REPORTS_TO_TRIGGER_VOTE | 3 | Sí |
| VOTING_DURATION_HOURS | 24 | Sí |
| REMOVE_THRESHOLD_PERCENT | 60 | Sí |

### Flujo de Moderación

```
[Comentario publicado]
         │
         ▼
[Usuario reporta] ──────────────────┐
         │                          │
         ▼                          │
¿Reportes >= 3? ───NO──────────────►│ Esperar más reportes
         │                          │
        YES                         │
         │                          │
         ▼                          │
[Abrir votación 24h]                │
         │                          │
         ▼                          │
[Holders votan keep/remove]         │
         │                          │
         ▼                          │
¿Pasaron 24h?                       │
         │                          │
        YES                         │
         │                          │
         ▼                          │
¿Votos "remove" >= 60%?             │
         │                          │
    ┌────┴────┐                     │
   YES       NO                     │
    │         │                     │
    ▼         ▼                     │
[Ocultar]  [Mantener]               │
[comment]  [visible]                │
```

---

## 5. API Endpoints

### Usuarios

```
POST /api/user/profile
  - Crear/actualizar perfil (alias, show_alias)
  - Body: { alias?, show_alias }
  - Auth: Wallet signature

GET /api/user/[wallet]
  - Obtener perfil público
  - Response: { wallet, alias, show_alias, created_at }
```

### Comentarios

```
GET /api/comments/[meme_id]
  - Listar comentarios de un meme
  - Query: ?page=1&limit=20
  - Response: { comments: [...], total, hasMore }

POST /api/comments
  - Crear comentario
  - Body: { meme_id, content, parent_id? }
  - Auth: Wallet signature + NFT verification

DELETE /api/comments/[id]
  - Eliminar propio comentario
  - Auth: Wallet signature (solo autor)
```

### Votos

```
POST /api/comments/[id]/vote
  - Votar comentario
  - Body: { vote_type: 1 | -1 }
  - Auth: Wallet signature + NFT verification

DELETE /api/comments/[id]/vote
  - Eliminar voto
  - Auth: Wallet signature
```

### Moderación

```
POST /api/reports
  - Reportar comentario
  - Body: { comment_id, reason }
  - Auth: Wallet signature + NFT verification

GET /api/moderation/active
  - Listar votaciones activas
  - Auth: Wallet signature + NFT verification

POST /api/moderation/[report_id]/vote
  - Votar en moderación
  - Body: { vote: "keep" | "remove" }
  - Auth: Wallet signature + NFT verification
```

---

## 6. Componentes Frontend

### Nuevos Componentes

```
src/components/
├── community/
│   ├── WalletConnect.jsx      # Botón conectar wallet
│   ├── PassGate.jsx           # Verificar NFT Pass
│   ├── MintPass.jsx           # UI para mintear Pass
│   ├── UserProfile.jsx        # Config de perfil
│   ├── CommentSection.jsx     # Sección comentarios en meme
│   ├── Comment.jsx            # Un comentario individual
│   ├── CommentForm.jsx        # Formulario nuevo comentario
│   ├── VoteButtons.jsx        # Botones upvote/downvote
│   ├── ReportButton.jsx       # Botón reportar
│   └── ModerationPanel.jsx    # Panel votaciones activas
```

### Librerías Necesarias

```json
{
  "dependencies": {
    "@rainbow-me/rainbowkit": "^2.x",     // Wallet connection UI
    "wagmi": "^2.x",                       // React hooks for Ethereum
    "viem": "^2.x",                        // Ethereum utilities
    "@supabase/supabase-js": "^2.x"        // Database client
  }
}
```

---

## 7. UI/UX - Diseño

### Página del Meme (actualizada)

```
┌──────────────────────────────────────────────────────────────┐
│  ARCHIVE OF MEME                    [Connect Wallet] 🔗      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │                    [IMAGEN MEME]                       │  │
│  │                                                        │  │
│  │  Angry Tomato                                          │  │
│  │  The angry Triple H meme...                            │  │
│  │                                                        │  │
│  │  [X Share]                              [BUY]          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  💬 COMMUNITY (12 comments)           [Pass Required]  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ 🟣 CryptoApe42                    2h ago    ⚑   │  │  │
│  │  │                                                  │  │  │
│  │  │ Este meme es legendario, lo compré en cuanto    │  │  │
│  │  │ lo vi 🔥                                        │  │  │
│  │  │                                                  │  │  │
│  │  │ ▲ 15   ▼ 2                         [Reply]      │  │  │
│  │  │                                                  │  │  │
│  │  │   └─ 0x1a2b...3c4d                 1h ago       │  │  │
│  │  │      Totalmente de acuerdo!                      │  │  │
│  │  │      ▲ 5   ▼ 0                                   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ 🟢 MemeCollector                  30m ago   ⚑   │  │  │
│  │  │                                                  │  │  │
│  │  │ El mejor meme de la semana sin duda              │  │  │
│  │  │                                                  │  │  │
│  │  │ ▲ 8   ▼ 1                          [Reply]      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Write a comment...                    [Send]    │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ⚠️ Don't have a Pass? [Mint for 0.0005 ETH]          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Modal Mint Pass

```
┌─────────────────────────────────────────┐
│                                         │
│      🎫 Archive Community Pass          │
│                                         │
│      ┌─────────────────────────┐        │
│      │                         │        │
│      │    [IMAGEN DEL PASS]    │        │
│      │                         │        │
│      └─────────────────────────┘        │
│                                         │
│   Join the Archive community and        │
│   participate in meme discussions.      │
│                                         │
│   Price: 0.0005 ETH (~$1.50)            │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │         [MINT PASS]             │   │
│   └─────────────────────────────────┘   │
│                                         │
│              [Cancel]                   │
└─────────────────────────────────────────┘
```

### Panel de Moderación

```
┌─────────────────────────────────────────────────────────────┐
│  ⚖️ ACTIVE VOTES                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Comment by 0x1a2b...3c4d on "Angry Tomato"           │  │
│  │  "Contenido reportado aquí..."                        │  │
│  │                                                       │  │
│  │  Reported by: 3 users                                 │  │
│  │  Reason: Spam                                         │  │
│  │  Time left: 18h 32m                                   │  │
│  │                                                       │  │
│  │  Current votes:  Keep: 45%  │  Remove: 55%            │  │
│  │  ████████████░░░░░░░░░░░░░░                           │  │
│  │                                                       │  │
│  │  [👍 KEEP]                    [👎 REMOVE]             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Fases de Implementación

### Fase 1: NFT Pass en OpenSea (Manual - Lo haces tú)
- [ ] Crear colección "Archive Community Pass" en OpenSea (Base)
- [ ] Diseñar imagen del Pass
- [ ] Crear NFT con supply ilimitado
- [ ] Configurar precio 0.0005 ETH
- [ ] Anotar el "collection slug" (ej: archive-community-pass)

### Fase 2: Infraestructura Base
- [ ] Crear cuenta Supabase y configurar proyecto
- [ ] Crear tablas en base de datos
- [ ] Configurar Row Level Security (RLS)
- [ ] Instalar dependencias (rainbowkit, wagmi, viem, supabase)
- [ ] Configurar providers de wallet

### Fase 3: Autenticación
- [ ] Implementar WalletConnect component
- [ ] Crear API de verificación de NFT (via OpenSea API)
- [ ] Implementar firma de mensajes para auth
- [ ] Crear/actualizar perfil de usuario

### Fase 4: Sistema de Comentarios
- [ ] API CRUD de comentarios
- [ ] Componente CommentSection
- [ ] Componente Comment (con respuestas anidadas)
- [ ] Componente CommentForm
- [ ] Sistema de votos (upvote/downvote)
- [ ] Filtro de palabras prohibidas

### Fase 5: Sistema de Moderación
- [ ] API de reportes
- [ ] Lógica de apertura de votación
- [ ] Panel de votaciones activas
- [ ] Cron job para resolver votaciones (o función serverless)
- [ ] Ocultar comentarios removidos

### Fase 6: UI/UX Polish
- [ ] Diseño responsive
- [ ] Estados de loading
- [ ] Manejo de errores
- [ ] Animaciones/transiciones
- [ ] Testing en móvil

### Fase 7: Deploy y Testing
- [ ] Testing completo end-to-end
- [ ] Deploy a producción
- [ ] Monitoreo de errores
- [ ] Documentación

---

## 9. Variables de Entorno Necesarias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Solo servidor

# Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=xxx

# NFT Pass (colección en OpenSea)
NEXT_PUBLIC_PASS_COLLECTION_SLUG=archive-community-pass

# Existentes
OPENSEA_API_KEY=xxx
```

---

## 10. Seguridad

### Consideraciones

1. **Verificación de NFT en cada request**
   - No confiar solo en frontend
   - Verificar en backend antes de cada acción

2. **Rate limiting**
   - Máximo 10 comentarios por hora por wallet
   - Máximo 50 votos por hora por wallet

3. **Sanitización de inputs**
   - Escapar HTML en comentarios
   - Filtrar palabras prohibidas
   - Validar longitud de campos

4. **Row Level Security (Supabase)**
   - Users solo pueden editar su propio perfil
   - Comentarios solo pueden ser eliminados por autor
   - Votos verificados por wallet

5. **Firma de mensajes**
   - Usar SIWE (Sign-In With Ethereum) para autenticar
   - Verificar firma en backend

---

## 11. Costos Estimados

| Servicio | Costo | Notas |
|----------|-------|-------|
| Supabase | $0 | Free tier (500MB, 50K requests/mes) |
| Vercel | $0 | Free tier actual |
| OpenSea | $0 | Crear colección es gratis |
| WalletConnect | $0 | Free tier |

**Total inicial: $0**

**Ingresos potenciales:** Cada Pass vendido = 0.0005 ETH para ti (menos 2.5% fee OpenSea)

---

## 12. Próximos Pasos

1. **Aprobar este plan** ✓
2. **Fase 1:** Crear NFT Pass en OpenSea (lo haces tú)
3. **Fase 2:** Configurar Supabase + dependencias
4. **Fase 3:** Implementar autenticación wallet
5. **Fase 4:** Sistema de comentarios
6. **Fase 5:** Moderación comunitaria
7. **Fase 6:** Pulir UI/UX
8. **Fase 7:** Testing y deploy

---

*Documento creado: 2026-01-08*
*Última actualización: 2026-01-08*
*Versión: 2.0 - Actualizado para usar OpenSea en lugar de contrato propio*
