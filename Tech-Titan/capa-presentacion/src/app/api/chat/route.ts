import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

interface CoreMessage {
  role:    "system" | "user" | "assistant" | "tool";
  content: string | { type: string; text?: string }[];
}

// El prompt del sistema define la identidad y objetivo del asistente
const BASE_SYSTEM = `Eres un experto en hardware de Tech-Titan. Tu meta es ayudar al usuario a optimizar su presupuesto y rendimiento. Responde siempre en español, de forma concisa y técnica. Máximo 3 oraciones.`;

// ─── Mock contextual (modo demo sin API key) ──────────────────────────────────

function pickDemoResponse(userMsg: string, ctx: string): string {
  const q = userMsg.toLowerCase();

  if (q.includes("gpu") || q.includes("gráfica") || q.includes("video"))
    return "Para tu build AM5, la RTX 4070 Super ofrece la mejor relación precio/rendimiento con DLSS 3.5. A $599 USD encaja dentro de un presupuesto gaming premium. ¿Tu monitor es 1440p o 4K?";
  if (q.includes("psu") || q.includes("fuente") || q.includes("watts"))
    return ctx.includes("120W")
      ? "Con 120W de TDP del Ryzen 7800X3D, necesitas mínimo 650W 80+ Gold. La Corsair RM750x es ideal: silenciosa, confiable y con margen para una GPU RTX 4070 futura."
      : "Para un build completo recomiendo una PSU de 750W 80+ Gold. La relación watt/dólar es óptima y garantiza estabilidad a largo plazo.";
  if (q.includes("temp") || q.includes("cool") || q.includes("refriger"))
    return "Para el Ryzen 7800X3D, un Noctua NH-D15 o AIO 240mm son perfectos. El 3D V-Cache es sensible al calor, así que evita overclocking y prioriza la temperatura máxima por debajo de 85°C.";
  if (q.includes("ddr5") || q.includes("ram") || q.includes("memoria"))
    return "Con plataforma AM5 y B650, 32GB DDR5-6000 CL30 es el sweet spot de rendimiento. G.Skill Flare X5 es lo que ya tienes en tu build y es una excelente elección.";
  if (ctx.includes("AM5") && (q.includes("compatible") || q.includes("build")))
    return "Tu build AM5 con B650 y DDR5 es 100% compatible ✓. Solo necesitas agregar GPU y PSU para completar el sistema. ¿Cuál es tu presupuesto total?";
  return "¡Hola! Soy el asistente AI de Tech-Titan en modo demo. Para respuestas generadas por GPT-4o, configura OPENAI_API_KEY en .env.local. ¿En qué puedo ayudarte con tu build?";
}

async function mockStream(text: string): Promise<Response> {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const words = text.split(" ");
      for (let i = 0; i < words.length; i++) {
        const token = (i === 0 ? "" : " ") + words[i];
        const escaped = token.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        ctrl.enqueue(enc.encode(`0:"${escaped}"\n`));
        await new Promise<void>((r) => setTimeout(r, 28));
      }
      ctrl.enqueue(enc.encode('d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'));
      ctrl.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "x-vercel-ai-data-stream": "v1" },
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

interface ChatBody {
  messages: CoreMessage[];
  data?: { buildContext?: string };
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json() as ChatBody;
  const { messages, data } = body;
  const buildContext = data?.buildContext ?? "";

  const lastUserContent = [...messages].reverse().find((m) => m.role === "user")?.content;
  const lastText = typeof lastUserContent === "string" ? lastUserContent : "";

  const system = buildContext
    ? `${BASE_SYSTEM}\n\nComponentes actuales del usuario: ${buildContext}`
    : BASE_SYSTEM;

  // Modo demo cuando no hay API key
  if (!process.env.OPENAI_API_KEY) {
    return mockStream(pickDemoResponse(lastText, buildContext));
  }

  try {
    const result = streamText({
      model:          openai("gpt-4o-mini"),
      system,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages:       messages as any,
      maxOutputTokens: 200,
      temperature:    0.7,
    });
    return result.toTextStreamResponse();
  } catch {
    // Fallback a demo si el modelo falla
    return mockStream(pickDemoResponse(lastText, buildContext));
  }
}
