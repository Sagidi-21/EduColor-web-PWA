import axios, { AxiosInstance } from "axios";
import { MascotConfig, MascotAssetsResult, MascotPreviewResult } from "../types";
import { ApiError } from "../middleware/error.middleware";

const HF_API_URL = "https://router.huggingface.co/hf-inference";
const IMAGE_MODEL = "black-forest-labs/FLUX.1-dev";
const TEXT_MODEL = "google/gemma-2-2b-it";

let hfClient: AxiosInstance | undefined;

function getHfClient(): AxiosInstance {
  if (!hfClient) {
    hfClient = axios.create({
      baseURL: HF_API_URL,
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN ?? ""}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });

    hfClient.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.code === "ECONNABORTED" || err.code === "ECONNRESET") {
          return Promise.reject(
            new ApiError(
              `HF request timeout: ${err.message}`,
              504,
              false,
              "La API no responde en este momento. Por favor, intenta más tarde.",
            ),
          );
        }
        if (err.response) {
          const status = err.response.status;
          const detail = err.response.data?.error ?? err.response.data?.message ?? "Error de HF";
          if (status === 401) {
            return Promise.reject(
              new ApiError(
                `HF API error ${status}: ${detail}`,
                401,
                false,
                "Token de Hugging Face inválido o no configurado",
              ),
            );
          }
          if (status === 403) {
            return Promise.reject(
              new ApiError(
                `HF API error ${status}: ${detail}`,
                403,
                false,
                "Token sin permisos o modelo no accesible",
              ),
            );
          }
          if (status === 503) {
            return Promise.reject(
              new ApiError(
                `HF API error ${status}: ${detail}`,
                503,
                false,
                "Modelo cargándose, intenta en unos segundos",
              ),
            );
          }
          return Promise.reject(new ApiError(`HF API error ${status}: ${detail}`, 502, false));
        }
        return Promise.reject(
          new ApiError(
            `Request failed: ${err.message}`,
            502,
            false,
            "La API no responde en este momento. Por favor, intenta más tarde.",
          ),
        );
      },
    );
  }

  return hfClient;
}

const SYSTEM_PROMPT = `You are a character designer for a children's educational mathematics application.

Design one original recurring companion character for children aged 6 to 8.

The character must be:
- friendly
- warm
- expressive
- easy to recognize
- visually simple enough to remain consistent across multiple poses
- appropriate for a primary-school educational environment
- non-threatening
- non-violent
- free of horror elements
- free of weapons
- free of sexualized elements
- free of political or religious symbolism
- free of recognizable copyrighted characters
- suitable for repeated use in a mathematics learning application

The character must have a clear silhouette and a small number of distinctive visual features.

Do not create text, logos, watermarks, UI elements or written labels in the image.

Create an original character rather than imitating an existing franchise or copyrighted character.`;

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isTransient =
        err?.code === "ECONNABORTED" ||
        err?.code === "ECONNRESET" ||
        (err instanceof ApiError &&
          (err.statusCode >= 500 || err.statusCode === 503 || err.statusCode === 429)) ||
        (err?.response && err.response.status >= 500) ||
        err?.response?.status === 429;
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new ApiError("No se pudo completar la generación tras varios intentos", 502, false);
}

function buildMascotPrompt(config: MascotConfig): string {
  const theme = config.theme === "other" ? config.customTheme : config.theme;
  const characterTypeLabel =
    config.characterType === "ai_choice"
      ? "AI choice"
      : config.characterType === "other"
        ? config.customCharacterType
        : config.characterType;
  const personality = config.personality.join(", ");
  const visualStyle = config.visualStyle;

  let prompt = `Class theme: ${theme}

Character type: ${characterTypeLabel}

Personality: ${personality}

Visual style: ${visualStyle}`;

  if (config.nameMode === "teacher" && config.teacherName.trim()) {
    prompt += `\n\nName: ${config.teacherName}`;
  }

  if (config.specialDetails.trim()) {
    prompt += `\n\nTeacher's additional detail: ${config.specialDetails}`;
  }

  prompt += `\n\nCreate the character as a single coherent visual identity.

The theme should influence the character's design without overwhelming the character.

The character should look like a friendly educational companion, not like a generic stock illustration.

Use a clean composition and make the complete character clearly visible.

The design must be suitable as a reference image for generating additional poses of the same character later.

Prioritize character consistency, recognizable facial features, clothing, colors, proportions and accessories.`;

  return prompt;
}

async function generateMascotName(config: MascotConfig): Promise<string> {
  const theme = config.theme === "other" ? config.customTheme : config.theme;
  const personality = config.personality.join(", ");

  const prompt = `Generate one short, memorable name for a character aimed at children aged 6–8.

Theme: ${theme}
Personality: ${personality}

The name must:
- be easy to pronounce in Spanish
- be easy to remember
- be suitable for school
- fit the theme when natural
- avoid trademarks and famous character names
- avoid numbers and unusual symbols

Return only the name.`;

  return withRetry(async () => {
    const res = await getHfClient().post(`/models/${TEXT_MODEL}`, {
      inputs: prompt,
      parameters: { max_new_tokens: 20, temperature: 0.7 },
    });

    const output = res.data?.[0]?.generated_text ?? res.data?.generated_text ?? "";
    const raw = typeof output === "string" ? output : JSON.stringify(output);
    return raw.replace(/^["']|["']$/g, "").trim();
  });
}

export async function generateMascotWithGrok(config: MascotConfig): Promise<MascotPreviewResult> {
  return withRetry(async () => {
    const prompt = `${SYSTEM_PROMPT}\n\n${buildMascotPrompt(config)}`;

    const res = await getHfClient().post(`/models/${IMAGE_MODEL}`, {
      inputs: prompt,
      parameters: { width: 1024, height: 1024, num_inference_steps: 28, guidance_scale: 3.5 },
    });

    const imageBuffer = res.data;
    if (!imageBuffer || !(imageBuffer instanceof ArrayBuffer)) {
      throw new Error("No se recibió imagen de Hugging Face");
    }

    const base64 = Buffer.from(imageBuffer).toString("base64");
    const imageUrl = `data:image/png;base64,${base64}`;

    const name =
      config.nameMode === "teacher" && config.teacherName.trim()
        ? config.teacherName.trim()
        : await generateMascotName(config);

    const description = generateDescription(config, name);

    return { id: "", imageUrl, name, description };
  });
}

const ASSET_PROMPTS: Record<string, string> = {
  explain: `Character in an explanatory teaching pose, helping a child solve a mathematics exercise. Friendly, clear gesture toward the exercise area. Encouraging and attentive expression. Full body visible. Clean style. No text, numbers, equations, speech bubbles, logos or watermarks.`,
  think: `Character in a thoughtful pose, trying to solve a mathematics problem and encouraging the child to think. Friendly, curious facial expression. Same character identity, proportions, clothing, colors and accessories. Full body visible. No text, numbers, equations, speech bubbles, logos or watermarks.`,
  celebrate: `Character celebrating a successful mathematics answer. Genuinely happy and proud, energetic but child-friendly pose. Exact same character identity. Full body visible. No text, numbers, equations, speech bubbles, logos or watermarks.`,
  encourage: `Character encouraging a child who is solving a mathematics exercise. Positive gesture such as thumbs-up or supportive hand gesture. Expression: "You can do it!" Exact same character identity. Full body visible. No text, numbers, equations, speech bubbles, logos or watermarks.`,
  header: `Character as friendly header/avatar asset for children's mathematics application. Facing viewer with warm, welcoming expression. Composed for circular UI container, centered with safe margins around head and features. NO circle drawn. Exact same character identity. No text, logos, watermarks or UI elements.`,
  blackboard: `Character holding a physical classroom blackboard with simple wooden frame and completely empty writing surface. Character positioned so app can place interactive content on the blackboard later. Board contains NO text, numbers, equations, buttons, icons or decorations. Exact same character identity. Full character and complete board visible. No logos or watermarks.`,
};

const ASSET_POSE_INSTRUCTIONS = `Use the same character visual identity across all images. Preserve: face, species/type, body proportions, colors, clothing, accessories, distinctive features, overall visual style. Only change the requested pose, expression and composition.`;

export async function generateMascotAssetsWithGrok(
  referenceImage: string,
  config: MascotConfig,
): Promise<MascotAssetsResult> {
  const assetKeys = ["explain", "think", "celebrate", "encourage", "header", "blackboard"] as const;

  const basePrompt = buildMascotPrompt(config);
  const characterPrompt = `${ASSET_POSE_INSTRUCTIONS}\n\n${basePrompt}\n\n`;

  const results = await Promise.all(
    assetKeys.map(async (key) => {
      const prompt = `${characterPrompt}\n\n${ASSET_PROMPTS[key]}`;
      const res = await getHfClient().post(`/models/${IMAGE_MODEL}`, {
        inputs: prompt,
        parameters: { width: 1024, height: 1024, num_inference_steps: 28, guidance_scale: 3.5 },
      });

      const imageBuffer = res.data;
      if (!imageBuffer || !(imageBuffer instanceof ArrayBuffer)) {
        throw new Error(`No se recibió imagen para ${key}`);
      }
      const base64 = Buffer.from(imageBuffer).toString("base64");
      const url = `data:image/png;base64,${base64}`;
      return { key, url } as const;
    }),
  );

  const assets: MascotAssetsResult["assets"] = {
    explain: "",
    think: "",
    celebrate: "",
    encourage: "",
    header: "",
    blackboard: "",
  };

  results.forEach(({ key, url }) => {
    assets[key] = url;
  });

  return { referenceImage, assets };
}

function generateDescription(config: MascotConfig, resolvedName: string): string {
  const theme = config.theme === "other" ? config.customTheme : config.theme;
  const personality = config.personality.join(", ");
  const themes: Record<string, string> = {
    space: "del espacio",
    dinosaurs: "de los dinosaurios",
    pirates: "de los piratas",
    magic: "del mundo mágico",
    underwater: "del mundo submarino",
    animals: "del mundo animal",
    nature: "de la naturaleza",
    technology: "de la tecnología",
    medieval: "medieval",
    racing: "de las carreras",
  };
  const themeLabel = themes[config.theme] ?? theme;

  return `${resolvedName}, un compañero curioso ${themeLabel} con personalidad ${personality}, diseñado para acompañar y motivar a niños de 6 a 8 años en sus aprendizajes de matemáticas.`;
}

export async function checkHfConnection(): Promise<{
  ok: boolean;
  models?: string[];
  error?: string;
}> {
  try {
    const res = await axios.get("https://router.huggingface.co/v1/models", {
      headers: { Authorization: `Bearer ${process.env.HF_TOKEN ?? ""}` },
      timeout: 15000,
    });
    const models = Array.isArray(res.data)
      ? res.data.map((m: any) => m.id)
      : res.data?.data?.map((m: any) => m.id) ?? [];
    return { ok: true, models: models.slice(0, 20) };
  } catch (err: any) {
    return { ok: false, error: `Error de conexión: ${err.message}` };
  }
}
