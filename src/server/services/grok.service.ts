import axios, { AxiosInstance } from "axios";
import { MascotConfig, MascotAssetsResult, MascotPreviewResult } from "../types";
import { ApiError } from "../middleware/error.middleware";

const GROK_API_URL = "https://api.x.ai/v1";
const IMAGE_MODEL = "grok-2-image-1212";
const TEXT_MODEL = "grok-2-1212";

const xaiClient: AxiosInstance = axios.create({
  baseURL: GROK_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

xaiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === "ECONNABORTED" || err.code === "ECONNRESET") {
      return Promise.reject(
        new ApiError(
          `xAI request timeout: ${err.message}`,
          504,
          false,
          "La API no responde en este momento. Por favor, intenta más tarde.",
        ),
      );
    }
    if (err.response) {
      const status = err.response.status;
      const detail = err.response.data?.error ?? err.response.data?.message ?? "Error de xAI";
      if (status === 429) {
        return Promise.reject(
          new ApiError(
            `xAI API error ${status}: ${detail}`,
            429,
            false,
            "Has alcanzado el límite de generaciones. Por favor, intenta más tarde.",
          ),
        );
      }
      return Promise.reject(new ApiError(`xAI API error ${status}: ${detail}`, 502, false));
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
        (err instanceof ApiError && (err.statusCode >= 500 || err.statusCode === 429)) ||
        (err?.response && err.response.status >= 500) ||
        err?.response?.status === 429;
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
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

export async function generateMascotName(config: MascotConfig): Promise<string> {
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
    const res = await xaiClient.post("/chat/completions", {
      model: TEXT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
      temperature: 0.7,
    });

    const raw = res.data.choices[0].message.content.trim();
    return raw.replace(/^["']|["']$/g, "").trim();
  });
}

export async function generateMascotWithGrok(config: MascotConfig): Promise<MascotPreviewResult> {
  return withRetry(async () => {
    const prompt = `${SYSTEM_PROMPT}\n\n${buildMascotPrompt(config)}`;

    const res = await xaiClient.post("/images/generations", {
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      response_format: "url",
      aspect_ratio: "1:1",
    });

    const imageUrl = res.data?.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No se recibió la URL de la imagen de xAI");
    }

    const name =
      config.nameMode === "teacher" && config.teacherName.trim()
        ? config.teacherName.trim()
        : await generateMascotName(config);

    const description = generateDescription(config, name);

    return { id: "", imageUrl, name, description };
  });
}

const ASSET_PROMPTS: Record<string, string> = {
  explain: `Create the approved character in an explanatory teaching pose.

The character should appear to be helping a child solve a mathematics exercise.

Use a friendly, clear gesture directed toward the exercise area.

The expression should be encouraging and attentive.

Keep the entire character visible.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.`,

  think: `Create the approved character in a thoughtful pose.

The character is trying to solve a mathematics problem and encouraging the child to think.

Use a friendly, curious facial expression.

Keep the same character identity, proportions, clothing, colors and accessories.

Keep the entire character visible.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.`,

  celebrate: `Create the approved character celebrating a successful mathematics answer.

The character should look genuinely happy and proud, with an energetic but child-friendly pose.

Keep the exact approved character identity.

Keep the entire character visible.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.`,

  encourage: `Create the approved character encouraging a child who is solving a mathematics exercise.

Use a positive gesture such as a thumbs-up, supportive hand gesture or similarly clear encouraging pose.

The expression should communicate: "You can do it!"

Keep the exact approved character identity.

Keep the entire character visible.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.`,

  header: `Create the approved character as a friendly header/avatar asset for a children's mathematics application.

The character should face the viewer with a warm, welcoming expression.

Compose the character so it works perfectly inside a circular UI container.

Keep the character centered and leave safe margins around the head and important visual features.

Do NOT draw a circle around the character.

Keep the exact approved character identity.

Do not add text, logos, watermarks or UI elements.`,

  blackboard: `Create the approved character holding a physical classroom blackboard.

The blackboard must have a simple, attractive wooden frame and a completely empty writing surface.

The character must be positioned so the application can place interactive exercise-selection content on the blackboard later.

The board must contain NO generated text, numbers, equations, buttons, icons or decorations that could interfere with the application UI.

Keep the exact approved character identity.

The entire character and the complete board must be visible.

Do not add logos or watermarks.`,
};

const ASSET_POSE_INSTRUCTIONS = `Use the supplied approved character reference as the exact visual identity.

Do not redesign the character.

Preserve:
- face
- species/type
- body proportions
- colors
- clothing
- accessories
- distinctive features
- overall visual style

Only change the requested pose, expression and composition.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.`;

export async function generateMascotAssetsWithGrok(
  referenceImage: string,
): Promise<MascotAssetsResult> {
  const assetKeys = ["explain", "think", "celebrate", "encourage", "header", "blackboard"] as const;

  const results = await Promise.all(
    assetKeys.map(async (key) => {
      const prompt = `${ASSET_POSE_INSTRUCTIONS}\n\n${ASSET_PROMPTS[key]}`;
      const url = await generateAssetWithReference(referenceImage, prompt);
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

async function generateAssetWithReference(
  referenceImage: string,
  posePrompt: string,
): Promise<string> {
  return withRetry(async () => {
    const res = await xaiClient.post("/images/edits", {
      model: IMAGE_MODEL,
      prompt: posePrompt,
      image: {
        url: referenceImage,
        type: "image_url",
      },
    });

    const url = res.data?.url ?? res.data?.data?.[0]?.url;
    if (!url) {
      throw new Error("No se recibió la URL del asset de xAI");
    }
    return url;
  });
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
