# Plan: API Connection Status Chip in MascotaScreen

## Goal
Add a chip/badge in the top-right corner of the header on step 6 ("Un detalle especial") that displays whether **image generation for the mascot is actually available**.

## Key Findings

### Current Health Check (Insufficient)
- `/api/mascot/health-hf` calls `checkHfConnection()` 
- Only validates HF_TOKEN works and can list models
- Does **NOT** verify `stabilityai/stable-diffusion-3-medium-diffusers` is available

### Reliable Check (Via Hugging Face Hub API)
The model `stabilityai/stable-diffusion-3-medium-diffusers` can be checked WITHOUT generating an image:

1. **Model inference status:** `GET https://huggingface.co/api/models/stabilityai/stable-diffusion-3-medium-diffusers?expand[]=inference`
   - Returns `"inference": "warm"` if available, or no `inference` field if cold/unknown

2. **Provider mapping:** `GET https://huggingface.co/api/models/stabilityai/stable-diffusion-3-medium-diffusers?expand[]=inferenceProviderMapping`
   - Returns `{"hf-inference": {"status": "live", "task": "text-to-image"}}` for our router

**Both endpoints are public (no token needed)** and confirm the model is servable via `router.huggingface.co/hf-inference`.

## Implementation

### Phase 1: Enhance Server Health Check (`huggingface.service.ts`)

Update `checkHfConnection()` to:
1. Keep existing token validation (calls `/v1/models`)
2. Add model availability check via Hub API (public, no token needed)
3. Return richer status indicating what was actually verified

**New response structure:**
```typescript
{
  ok: boolean;                    // overall: can generate?
  tokenValid: boolean;            // HF_TOKEN works
  modelAvailable: boolean;        // model exists and is accessible
  providerLive: boolean;          // hf-inference provider is live (status=live, task=text-to-image)
  modelInference: "warm" | "cold" | "unknown" | "error";
  message: string;                // human-readable summary
  checks: {
    token: "ok" | "fail" | "skipped";
    modelInference: "warm" | "cold" | "unknown" | "error";
    provider: "live" | "staging" | "missing" | "error";
  };
  models?: string[];
  error?: string;
}
```

**`ok` is true when:** `tokenValid && modelAvailable && providerLive` (NOT requiring `modelInference === "warm"`).

**Important:** The health check does NOT guarantee a specific generation will succeed. It verifies: valid token + model accessible + compatible provider available. No test generation is performed.

### Phase 2: Frontend Integration (`MascotaScreen.tsx`)

Add state, 10s timeout, AbortController for cleanup on rapid step changes.

Chip displays only 3 states:
- 🟡 **Comprobando…** - checking in progress
- 🟢 **Generación disponible** - `ok === true` (token + model + provider all OK)
- 🔴 **Generación no disponible** - `ok === false` (any check failed)

The backend's `modelInference` (`warm`/`cold`/`unknown`) remains available for diagnostics but doesn't affect the chip.

### Phase 3: CSS Styles

Discrete chip matching existing design.

## Files Modified

1. `src/server/services/huggingface.service.ts` - enhance `checkHfConnection()`
2. `src/server/controllers/mascot.controller.ts` - return new response structure
3. `src/features/mascota/MascotaScreen.tsx` - add chip logic
4. `src/features/mascota/MascotaScreen.css` - add chip styles

## Validation Scenarios

| Scenario | Expected Chip |
|----------|---------------|
| Valid token + model warm + provider live | 🟢 Generación disponible |
| Valid token + model cold + provider live | 🟢 Generación disponible |
| Valid token + model unknown + provider live | 🟢 Generación disponible |
| Invalid token | 🔴 Generación no disponible |
| Valid token but model not accessible | 🔴 Generación no disponible |
| Valid token + model available but provider not live | 🔴 Generación no disponible |
| Network timeout (10s) | 🔴 Generación no disponible |
| Rapid step 6 enter/exit | No stale state updates |

## Out of Scope
- Periodic re-checking
- Retry button
- Image generation test during health check
- Polling
- Automatic re-check