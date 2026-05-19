import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres Tech-Titan AI, un ingeniero experto en hardware de PC con 20 años de experiencia.
Evalúa el ensamble que recibes y responde EXACTAMENTE en este formato:

⚡ DIAGNÓSTICO

[1-2 oraciones sobre el tipo de build]

🎯 CASOS DE USO ÓPTIMOS
• [caso 1]
• [caso 2]
• [caso 3]

🔧 CONSEJO TÉCNICO
[Un consejo técnico específico y concreto sobre cómo mejorar el build]

STATUS: [BUILD VALIDADO ✓ o INCOMPLETO ⚠]

Sé conciso, técnico y futurista. Usa datos reales de los componentes.`;

// ─── Provider factory ─────────────────────────────────────────────────────────
// Prioridad: Groq (gratis + rápido) > OpenAI > Mock

function getProvider() {
  if (process.env.GROQ_API_KEY) {
    return {
      model: createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey:  process.env.GROQ_API_KEY,
      })("llama-3.3-70b-versatile"),
      name: "Groq · LLaMA 3.3 70B",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      model: createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o-mini"),
      name: "OpenAI · GPT-4o mini",
    };
  }
  return null;
}

// ─── Mock audit for demo mode ─────────────────────────────────────────────────

interface ComponentInfo {
  category:  string;
  name:      string;
  metadata?: Record<string, unknown>;
  price?:    number;
}

function buildMockAudit(components: ComponentInfo[]): string {
  const cpu = components.find((c) => c.category === "CPU");
  const mb  = components.find((c) => c.category === "Motherboard");
  const ram = components.find((c) => c.category === "RAM");
  const gpu = components.find((c) => c.category === "GPU");
  const psu = components.find((c) => c.category === "PSU");

  const is7800X3D = cpu?.name.includes("7800X3D");
  const isIntelK  = cpu?.name.includes("13900K");
  const platform  = is7800X3D ? "AMD AM5 + DDR5" : isIntelK ? "Intel LGA1700 + DDR5" : "x86";
  const useCase   = is7800X3D ? "gaming AAA y retención de caché de juego (3D V-Cache)" : "cargas de trabajo multi-núcleo intensivas";

  const tdp = Number(cpu?.metadata?.["tdp_watts"] ?? 0);
  const hasGpu = Boolean(gpu);
  const totalTdp = tdp + (hasGpu ? 220 : 0);
  const recPsu  = Math.ceil((totalTdp * 1.35) / 50) * 50;

  return `⚡ DIAGNÓSTICO

Build de plataforma ${platform} orientado a ${useCase}. La combinación ${cpu?.name ?? "CPU"} + ${mb?.name ?? "MB"} garantiza compatibilidad de socket y generación DDR.

🎯 CASOS DE USO ÓPTIMOS
• Gaming AAA a 1440p/4K con framerate estable >120fps
• Streaming y contenido simultáneo sin throttling térmico
• Compilación y desarrollo de software con tiempos mínimos

🔧 CONSEJO TÉCNICO
${!hasGpu
  ? `Agrega una GPU RTX 4070 Super (220W TDP). Con tu ${cpu?.name ?? "CPU"}, el cuello de botella estará en la tarjeta gráfica, no en el procesador. Instala también una PSU ≥${recPsu}W 80+ Gold para el sistema completo.`
  : `Instala tu RAM en configuración Dual-Channel en los slots A2+B2 de la ${mb?.name ?? "placa"} para maximizar el ancho de banda y reducir la latencia hasta un 15% vs canal único.`
}

STATUS: ${components.length >= 3 ? "BUILD VALIDADO ✓" : "INCOMPLETO ⚠ — Faltan componentes"}`;
}

// ─── Mock streaming helper ────────────────────────────────────────────────────

async function streamMock(text: string): Promise<Response> {
  const enc    = new TextEncoder();
  const words  = text.split(" ");
  const stream = new ReadableStream({
    async start(ctrl) {
      for (let i = 0; i < words.length; i++) {
        const token   = (i === 0 ? "" : " ") + words[i];
        const escaped = token.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
        ctrl.enqueue(enc.encode(`0:"${escaped}"\n`));
        await new Promise<void>((r) => setTimeout(r, 22));
      }
      ctrl.enqueue(enc.encode('d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'));
      ctrl.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1",
      "X-AI-Provider": "demo-mock",
    },
  });
}

// ─── Request schema ───────────────────────────────────────────────────────────

interface AuditBody {
  components: ComponentInfo[];
  totalPrice?: number;
  totalTdp?:   number;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  const { components = [], totalPrice = 0, totalTdp = 0 } =
    (await req.json()) as Partial<AuditBody>;

  // Build the user message
  const componentList = components
    .map((c) => {
      const specs = Object.entries(c.metadata ?? {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      return `• ${c.category}: ${c.name}${specs ? ` (${specs})` : ""}${c.price ? ` — $${c.price}` : ""}`;
    })
    .join("\n");

  const userMessage = [
    "Audita este ensamble de PC:",
    componentList || "• (sin componentes seleccionados)",
    totalPrice > 0 ? `\nPrecio total: $${totalPrice} USD` : "",
    totalTdp   > 0 ? `TDP estimado: ${totalTdp}W` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Demo mode — no API keys
  const provider = getProvider();
  if (!provider) {
    return streamMock(buildMockAudit(components));
  }

  // Live AI mode
  try {
    const result = streamText({
      model:          provider.model,
      system:         SYSTEM_PROMPT,
      messages:       [{ role: "user", content: userMessage }],
      maxOutputTokens: 450,
      temperature:    0.7,
    });

    const response = result.toTextStreamResponse();
    response.headers.set("X-AI-Provider", provider.name);
    return response;

  } catch {
    // Fallback to mock if AI call fails
    return streamMock(buildMockAudit(components));
  }
}
