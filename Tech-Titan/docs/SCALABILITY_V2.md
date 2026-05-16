# Tech-Titan — Escalabilidad de Plataforma (Sprint 6)

## Visión General

Este documento describe cómo la integración de Vercel AI SDK y Auth.js (NextAuth v5)
permite a Tech-Titan escalar de una aplicación demo a una plataforma con millones de
usuarios, sin rediseñar la arquitectura.

---

## 1. Asistente AI — Vercel AI SDK

### Arquitectura

```
Browser (useChat)
  → POST /api/chat (Next.js Route Handler, Edge Runtime)
  → streamText() — GPT-4o-mini (OpenAI) o mock local
  → SSE token-by-token stream
  → Cliente actualiza UI en tiempo real
```

### Por qué escala

| Factor | Implementación | Impacto |
|--------|---------------|---------|
| **Edge Runtime** | Next.js Route Handler corre en el edge (Vercel/Cloudflare Workers) | Latencia < 50ms desde cualquier región |
| **Streaming SSE** | `streamText().toDataStreamResponse()` — no bloquea el servidor | 10 000 usuarios concurrentes en una sola instancia |
| **Contexto dinámico** | El build del usuario se incluye en cada request | Sin estado servidor-lado — stateless by design |
| **Mock fallback** | Si `OPENAI_API_KEY` no está configurada, respuestas locales | Zero-cost para demos y CI/CD |

### Costo a escala

- GPT-4o-mini: ~$0.00015/1K input tokens
- Para 1M conversaciones de 10 mensajes: ≈ $150/mes
- Con caché de respuestas frecuentes (Redis): reducción del 40-60%

### Prompt del Sistema

```
Eres un experto en hardware de Tech-Titan. Tu meta es ayudar al usuario
a optimizar su presupuesto y rendimiento.
```

El contexto del build actual se inyecta dinámicamente en cada request,
manteniendo el asistente alineado con la selección actual del usuario.

---

## 2. Autenticación — Auth.js v5 (NextAuth)

### Arquitectura

```
Browser  →  /api/auth/[...nextauth]  →  Provider OAuth (GitHub / Google)
                                        ↓
                                    JWT Session (httpOnly cookie)
                                        ↓
                               Session disponible en Server + Client Components
```

### Por qué escala

| Factor | Implementación | Impacto |
|--------|---------------|---------|
| **JWT stateless** | Sin sesiones en DB — el token es la fuente de verdad | Sin bottleneck de sesiones a millones de usuarios |
| **Edge compatible** | Auth.js v5 corre en edge middleware | Verificación de autenticación < 1ms por request |
| **OAuth federado** | Google + GitHub — sin gestión de passwords | Sin vectores de ataque por credenciales débiles |
| **Server Components** | `auth()` en RSC sin client round-trip | -1 waterfall por página autenticada |

### Flujo de Sesión

```typescript
// Server Component (Next.js App Router)
const session = await auth();
if (!session) redirect("/login");

// Client Component
const { data: session } = useSession();
```

### Escalabilidad de OAuth

- GitHub: sin límite de usuarios (rate limit por app: 5000 req/h)
- Google: sin límite de usuarios en OAuth 2.0 estándar
- Tokens JWT firmados con `AUTH_SECRET` — rotación sin downtime

---

## 3. Tabla `user_builds` — PostgreSQL JSONB

### Schema

```sql
CREATE TABLE user_builds (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      VARCHAR(255)  NOT NULL,         -- ID del proveedor OAuth
  user_email   VARCHAR(255)  NOT NULL,
  build_name   VARCHAR(255)  NOT NULL,
  components   JSONB         NOT NULL,          -- Array de componentes serializados
  total_price  INTEGER       NOT NULL DEFAULT 0,
  total_tdp    INTEGER       NOT NULL DEFAULT 0,
  is_valid     BOOLEAN       NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_builds_user_id ON user_builds (user_id);
```

### Por qué JSONB y no columnas relacionales

1. **Flexibilidad**: Nuevos metadatos de hardware (PCIe gen, DDR6) no requieren ALTER TABLE
2. **Queries potentes**: `metadata->>'socket_type' = 'AM5'` es indexable
3. **Compatibilidad futura**: El schema de componentes puede evolucionar sin migraciones

### Escalabilidad de la DB

| Escenario | Estrategia |
|-----------|-----------|
| 100K builds | PostgreSQL single instance (actual) |
| 10M builds | Read replicas + connection pooling (PgBouncer) |
| 100M builds | Partición por `user_id` hash + Citus distributed PostgreSQL |

---

## 4. Stripe Mock — Flujo Transaccional

### Estado actual (Sprint 6)

La pasarela de pago es una simulación de 3 pasos:
```
idle → processing (1.6s) → verifying (1.3s) → approved → redirect /checkout/success
```

### Integración real con Stripe (Sprint 7)

```typescript
// Crear PaymentIntent en el servidor
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalPrice * 100, // en centavos
  currency: "usd",
  metadata: { userId, buildId },
});

// Confirmar en el cliente con @stripe/react-stripe-js
const { error } = await stripe.confirmCardPayment(paymentIntent.client_secret, {
  payment_method: { card: cardElement },
});
```

### Por qué Stripe escala

- Webhook idempotente: `payment_intent.succeeded` → actualizar `user_builds.paid = true`
- Stripe maneja el PCI compliance — nosotros nunca tocamos datos de tarjeta
- SLA 99.99% uptime

---

## 5. SEO & Performance (next/image + Metadata dinámico)

### Metadata dinámico

```typescript
// En cualquier page.tsx del App Router
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `${product.name} | Tech Titan`,
    description: `${product.name} — Socket ${product.metadata.socket_type}`,
    openGraph: { images: [{ url: product.imageUrl }] },
  };
}
```

### Optimización de imágenes con next/image

```tsx
<Image
  src={product.imageUrl}
  alt={product.name}
  width={400} height={300}
  priority     // para imágenes above-the-fold
  placeholder="blur"
  blurDataURL={product.blurHash}
/>
```

### Core Web Vitals target

| Métrica | Target | Técnica |
|---------|--------|---------|
| LCP | < 2.5s | `priority` en imagen hero, next/font local |
| FID | < 100ms | Zero blocking JS en Server Components |
| CLS | < 0.1 | Dimensiones explícitas en next/image |
| TTFB | < 200ms | Edge Runtime + Vercel CDN |

---

## 6. Arquitectura de Millones de Usuarios

```
                          ┌─────────────────────────────────────┐
                          │         VERCEL EDGE NETWORK          │
  Usuarios (1M+)          │  ┌──────────┐     ┌──────────────┐  │
  ────────────────────────►  │ Next.js  │────►│  AI Route    │  │
  requests distribuidos   │  │ App Router│    │  (Edge Fn)   │  │
                          │  └────┬─────┘     └──────┬───────┘  │
                          │       │                  │           │
                          └───────┼──────────────────┼───────────┘
                                  │                  │
                    ┌─────────────▼──────┐    ┌──────▼────────┐
                    │   MedusaJS API     │    │  OpenAI API   │
                    │   (Node.js)        │    │  (GPT-4o-mini)│
                    └─────────┬──────────┘    └───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼──────┐  ┌────▼─────┐  ┌─────▼──────┐
    │  PostgreSQL 15  │  │  Redis   │  │  Auth.js   │
    │  (user_builds,  │  │  (cache, │  │  (JWT      │
    │   hardware_     │  │   queue) │  │   sessions)│
    │   components)   │  └──────────┘  └────────────┘
    └─────────────────┘
```

### Conclusión

La combinación de:
- **Vercel AI SDK** (streaming stateless + edge)
- **Auth.js v5** (JWT federado + OAuth)
- **TanStack Query** (cache inteligente en cliente)
- **Redis** (event bus + cache de validaciones)
- **PostgreSQL JSONB** (schema flexible para hardware)

...permite que Tech-Titan pase de 100 a 100M usuarios cambiando
**configuración de infraestructura** (réplicas, CDN regions, pools),
NO el código de la aplicación. Esto es lo que significa
**arquitectura escalable desde el día uno**.
