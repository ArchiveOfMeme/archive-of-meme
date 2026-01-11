# Configuración de Alchemy Webhooks

Este documento explica cómo configurar los webhooks de Alchemy para que los NFTs de los usuarios se actualicen automáticamente cuando compran o venden.

## ¿Por qué Webhooks?

Sin webhooks, el sistema tendría que llamar a OpenSea cada vez que un usuario hace "Start Mining", lo cual:
- Tarda 30-60 segundos
- Puede fallar por rate limits
- Mala experiencia de usuario

Con webhooks:
- "Start Mining" es instantáneo (<200ms)
- Los NFTs se actualizan automáticamente cuando hay cambios
- Escalable a miles de usuarios

## Paso 1: Crear cuenta en Alchemy

1. Ve a https://dashboard.alchemy.com/
2. Crea una cuenta gratuita
3. Crea una app en la red **Base Mainnet**

## Paso 2: Configurar el Webhook

1. En el dashboard de Alchemy, ve a **Webhooks** (menú lateral)
2. Haz clic en **Create Webhook**
3. Configura:

| Campo | Valor |
|-------|-------|
| **Chain** | Base Mainnet |
| **Network** | Mainnet |
| **Webhook Type** | NFT Activity |
| **Webhook URL** | `https://tu-dominio.com/api/webhooks/alchemy` |

4. En **NFT Filters**, añade los 3 contratos:

```
0x132e7e2b63070adc4169ef9f9d5f8af2be91f4f5  (Miners)
0xa11233cd58e76d1a149c86bac503742636c8f60c  (Memes)
0xca84fa4b3e0956ed97015c0b2d42750f122244f7  (Pass)
```

5. Haz clic en **Create Webhook**

## Paso 3: Variables de Entorno (Opcional)

Si quieres verificar la firma de los webhooks (recomendado para producción):

1. En Alchemy, copia el **Signing Key** del webhook
2. Añádelo a tu `.env.local`:

```
ALCHEMY_WEBHOOK_SIGNING_KEY=tu_signing_key_aqui
```

## Paso 4: Probar el Webhook

### Verificar que el endpoint responde:

```bash
curl https://tu-dominio.com/api/webhooks/alchemy
```

Debería responder:
```json
{
  "status": "active",
  "message": "Alchemy webhook endpoint is ready",
  "monitored_contracts": 3
}
```

### Probar con un evento real:

1. Transfiere un NFT de las colecciones monitoreadas
2. Revisa los logs del servidor
3. Deberías ver: `[Alchemy Webhook] Updated cache for 0x...`

## Arquitectura Final

```
Usuario compra NFT en OpenSea
         │
         ▼ (1-5 segundos)
   Blockchain (Base)
         │
         ▼ (detecta evento)
   Alchemy Webhook
         │
         ▼ (POST request)
   /api/webhooks/alchemy
         │
         ▼ (actualiza)
   Base de datos (Supabase)
         │
         ▼
   Usuario abre app → datos ya actualizados
   Usuario hace "Mine Now" → instantáneo
```

## Troubleshooting

### El webhook no llega
- Verifica que la URL es correcta y accesible públicamente
- Revisa los logs en Alchemy dashboard
- Asegúrate de que los contratos están bien escritos

### Los NFTs no se actualizan
- Verifica que tienes `OPENSEA_API_KEY` configurado
- Revisa los logs del servidor para errores
- Comprueba que el usuario está registrado en la DB

### Desarrollo local
Para probar webhooks en desarrollo local, usa [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Luego usa la URL de ngrok como Webhook URL en Alchemy.

## Notas

- El tier gratuito de Alchemy permite ~100 webhooks/segundo
- Los webhooks solo se disparan cuando hay transfers de los contratos monitoreados
- El registro de usuarios (POST /api/mining/user) sigue verificando NFTs para usuarios nuevos
