import axios, { AxiosInstance } from "axios";
import { MascotConfig, MascotAssetsResult, MascotPreviewResult } from "../types";
import { ApiError } from "../middleware/error.middleware";

const HF_API_URL = "https://router.huggingface.co/hf-inference";
const IMAGE_MODEL = "stabilityai/stable-diffusion-3-medium-diffusers";
const TEXT_MODEL = "google/gemma-2-2b-it";
const HF_HUB_API = "https://huggingface.co/api/models";

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

function resolveCharacterType(config: MascotConfig): string {
  if (config.characterType !== "ai_choice") {
    return config.characterType === "other" ? config.customCharacterType : config.characterType;
  }

  const theme = config.theme;
  const themeToCharacter: Record<string, string> = {
    space: "alien or small explorer robot",
    dinosaurs: "friendly dinosaur",
    pirates: "parrot or small pirate creature",
    magic: "fantasy creature",
    underwater: "sea creature",
    animals: "cute animal",
    nature: "nature spirit or animal",
    technology: "friendly robot",
    medieval: "medieval fantasy character",
    racing: "racing character",
    other: "unique character fitting the custom theme",
  };

  return themeToCharacter[theme] ?? "friendly character fitting the theme";
}

function resolveAppearance(characterType: string): string {
  const lower = characterType.toLowerCase();
  if (lower.includes("robot") || lower.includes("mech")) {
    return "Compact, cute robot with expressive LED eyes, round friendly proportions, small size — clearly a machine, NOT a human or child";
  }
  if (
    lower.includes("animal") ||
    lower.includes("dinosaur") ||
    lower.includes("creature") ||
    lower.includes("dragon") ||
    lower.includes("sea")
  ) {
    return "Friendly, small animal-sized creature with expressive face and clear species characteristics — NOT a human or child";
  }
  if (
    lower.includes("fantasy") ||
    lower.includes("fairy") ||
    lower.includes("elf") ||
    lower.includes("magical") ||
    lower.includes("spirit")
  ) {
    return "Magical non-human creature with fantastical features (wings, horns, ethereal glow, etc.) — clearly a fantasy being, NOT a plain human child";
  }
  if (lower.includes("magic") || lower.includes("wizard") || lower.includes("witch")) {
    return "Magical character with fantasy costume, wand or magical accessories — human-like but clearly a magical being with distinctive magical traits";
  }
  if (
    lower.includes("person") ||
    lower.includes("human") ||
    lower.includes("child") ||
    lower.includes("kid")
  ) {
    return "Child-like, approximately 7-8 years old equivalent, friendly and approachable human character";
  }
  // ai_choice or generic
  return "Friendly, distinctive character with clear non-human or fantasy traits, small and approachable";
}

function buildMascotPrompt(config: MascotConfig): string {
  const theme = config.theme === "other" ? config.customTheme : config.theme;
  const characterType = resolveCharacterType(config);
  const personality = config.personality.join(", ");
  const visualStyle = config.visualStyle;
  const specialDetails = config.specialDetails.trim().slice(0, 100);

  const styleLabels: Record<string, string> = {
    cartoon_3d: "Cartoon 3D, soft rendering, vibrant colors",
    illustration: "Children's book illustration, watercolor style, soft edges",
    anime: "Anime style, clean lines, expressive eyes, cel shaded",
    soft_fantasy: "Soft fantasy, dreamy atmosphere, pastel palette, magical glow",
  };

  const styleDescription = styleLabels[visualStyle] ?? visualStyle;
  const appearance = resolveAppearance(characterType);

  const identity = `
CHARACTER IDENTITY:
- Type/Species: ${characterType}
- Appearance: ${appearance}
- Personality traits: ${personality}
- World/Setting: ${theme}
- Primary colors: Harmonious palette fitting ${theme} theme, warm and inviting
- Clothing/Accessories: ${characterType.toLowerCase().includes("robot") ? `Mechanical details and joints matching ${theme} world` : `Simple, distinctive outfit matching ${theme} world`}${specialDetails ? `, including: ${specialDetails}` : ""}
- Visual style: ${styleDescription}
- Distinctive features: Clear silhouette, recognizable face, consistent proportions, memorable design elements
- Name reference: ${config.nameMode === "teacher" && config.teacherName.trim() ? config.teacherName.trim() : "(AI-generated, not shown in image)"}
`.trim();

  const compositionRules = `
COMPOSITION RULES (CRITICAL):
- Create ONE SINGLE IMAGE containing a 2×2 GRID of FOUR POSES of the EXACT SAME CHARACTER
- Each quadrant contains ONE pose of the SAME character — no other characters
- Character must maintain IDENTICAL: face, eyes, base expression, proportions, body, colors, clothing, accessories, art style across ALL four quadrants
- No part of any character crosses the central dividing lines
- Each character stays completely within its own quadrant
- Approximate equal character size in all four quadrants
- Consistent camera framing across quadrants
- Transparent background across the entire image (pure white or solid flat color with no gradients, no textures, no scenery — suitable for PNG cutout)
- NO text, NO numbers, NO letters, NO speech bubbles, NO watermarks, NO UI elements
- NO additional characters, NO decorative elements crossing quadrants
`.trim();

  const poses = `
POSE 1 (TOP-LEFT) — EXPLAIN:
Character explaining a math lesson to the viewer. Looking directly at the viewer/child. One hand raised, the other making an explanatory/teaching gesture. Pose conveys: "I'm going to show you how to do this." Friendly, encouraging, attentive expression. Full body visible within quadrant.

POSE 2 (TOP-RIGHT) — POINT:
Character pointing clearly to one side. Leaving sufficient visual space around the character for later placement of virtual blackboard content. Pose conveys: "Look here." Friendly, guiding expression. Full body visible within quadrant.

POSE 3 (BOTTOM-LEFT) — THINK:
Character in a thoughtful pose, pondering a math problem, encouraging the child to think. Hand to chin or equivalent thinking gesture. Curious, concentrated but always friendly expression. Pose conveys: "Think about the answer." Full body visible within quadrant.

POSE 4 (BOTTOM-RIGHT) — CELEBRATE:
Character celebrating a correct answer. Arms raised, jump or joy gesture. Genuinely happy and proud, energetic but child-friendly. Pose conveys: "Great job!" Full body visible within quadrant.
`.trim();

  return `${identity}\n\n${compositionRules}\n\n${poses}`;
}

// Dev-only: return the exact prompt that would be sent to HF for a given config
export function getMascotPromptForConfig(config: MascotConfig): string {
  return `${SYSTEM_PROMPT}\n\n${buildMascotPrompt(config)}`;
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

function buildLegacyMascotPrompt(config: MascotConfig): string {
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

export interface MascotPoseGridResult {
  imageUrl: string;
}

export async function generateMascotPoseGrid(config: MascotConfig): Promise<MascotPoseGridResult> {
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

    return { imageUrl };
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

  const basePrompt = buildLegacyMascotPrompt(config);
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

async function checkModelAvailability(): Promise<{
  modelAvailable: boolean;
  modelInference: "warm" | "cold" | "unknown" | "error";
  provider: "live" | "staging" | "missing" | "error";
}> {
  try {
    const [inferenceRes, providerRes] = await Promise.all([
      axios.get(`${HF_HUB_API}/${IMAGE_MODEL}?expand[]=inference`, { timeout: 8000 }),
      axios.get(`${HF_HUB_API}/${IMAGE_MODEL}?expand[]=inferenceProviderMapping`, {
        timeout: 8000,
      }),
    ]);

    const inferenceValue = inferenceRes.data?.inference;
    const modelInference = (
      inferenceValue === "warm" ? "warm" : inferenceValue ? "cold" : "unknown"
    ) as "warm" | "cold" | "unknown" | "error";

    const providerMapping = providerRes.data?.inferenceProviderMapping ?? {};
    const hfInference = providerMapping["hf-inference"];
    let provider = "missing" as "live" | "staging" | "missing" | "error";
    if (hfInference && hfInference.task === "text-to-image") {
      provider =
        hfInference.status === "live"
          ? "live"
          : hfInference.status === "staging"
            ? "staging"
            : "missing";
    }

    const modelAvailable =
      modelInference !== "error" && provider !== "error" && provider !== "missing";
    return { modelAvailable, modelInference, provider };
  } catch {
    return { modelAvailable: false, modelInference: "error" as const, provider: "error" as const };
  }
}

export async function checkHfConnection(): Promise<{
  ok: boolean;
  tokenValid: boolean;
  modelAvailable: boolean;
  providerLive: boolean;
  modelInference: "warm" | "cold" | "unknown" | "error";
  message: string;
  checks: {
    token: "ok" | "fail" | "skipped";
    modelInference: "warm" | "cold" | "unknown" | "error";
    provider: "live" | "staging" | "missing" | "error";
  };
  models?: string[];
  error?: string;
}> {
  let tokenValid: boolean;
  let models: string[];

  try {
    const res = await axios.get("https://router.huggingface.co/v1/models", {
      headers: { Authorization: `Bearer ${process.env.HF_TOKEN ?? ""}` },
      timeout: 15000,
    });
    models = Array.isArray(res.data)
      ? res.data.map((m: any) => m.id)
      : (res.data?.data?.map((m: any) => m.id) ?? []);
    tokenValid = true;
  } catch (err: any) {
    const { modelAvailable, modelInference, provider } = await checkModelAvailability();
    const providerLive = provider === "live";

    return {
      ok: false,
      tokenValid: false,
      modelAvailable,
      providerLive,
      modelInference,
      message: `Token inválido o no configurado: ${err.message}`,
      checks: {
        token: "fail",
        modelInference,
        provider,
      },
      error: `Error de conexión: ${err.message}`,
    };
  }

  const { modelAvailable, modelInference, provider } = await checkModelAvailability();
  const providerLive = provider === "live";
  const ok = tokenValid && modelAvailable && providerLive;

  let message: string;
  if (!tokenValid) {
    message = "Token HF inválido";
  } else if (!modelAvailable) {
    message = "Modelo no accesible";
  } else if (!providerLive) {
    message = "Proveedor de inferencia no disponible";
  } else if (modelInference === "warm") {
    message = "Generación disponible";
  } else if (modelInference === "cold") {
    message = "Preparando generación";
  } else {
    message = "Estado de generación incierto";
  }

  return {
    ok,
    tokenValid,
    modelAvailable,
    providerLive,
    modelInference,
    message,
    checks: {
      token: tokenValid ? "ok" : "fail",
      modelInference,
      provider,
    },
    models: models.slice(0, 20),
  };
}
