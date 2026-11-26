import type { LanguageCode, Slide, SlideDesignSettings } from '../types/presentation';

export interface ServerHealthStatus {
  ok: boolean;
  geminiConfigured: boolean;
  textModel: string;
  liveImageGenerationAvailable: boolean;
  liveImageLimitationNote: string;
}

export interface AIDesignResponse {
  slideNumber: number;
  model: string;
  design: Partial<SlideDesignSettings> & {
    visualPrompt: string;
    designRationale: string;
  };
}

export interface AIBackgroundResponse {
  slideNumber: number;
  model: string;
  enhancedPrompt: string;
  liveImageAvailable: boolean;
}

export async function fetchServerHealth(): Promise<ServerHealthStatus> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Server health check failed (${res.status})`);
  }
  return (await res.json()) as ServerHealthStatus;
}

export async function generateSlideAIDesign(params: {
  slide: Slide;
  language: LanguageCode;
  themeName: string;
  customDirection?: string;
}): Promise<AIDesignResponse> {
  const localized = params.slide.content[params.language];
  const res = await fetch('/api/ai/generate-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slideNumber: params.slide.order,
      language: params.language,
      themeName: params.themeName,
      title: localized.title,
      subtitle: localized.subtitle,
      pointsCount: localized.points.length,
      isPrayerSlide: Boolean(params.slide.isPrayerSlide),
      visualDescription: params.slide.background.prompt,
      customDirection: params.customDirection ?? '',
    }),
  });

  const data = (await res.json()) as AIDesignResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `AI design request failed (${res.status})`);
  }
  return data;
}

export async function requestAIBackgroundArtDirection(params: {
  slideNumber: number;
  subject: string;
  visualDescription: string;
  stylePreset: string;
  mode: 'prompt' | 'live-image';
}): Promise<AIBackgroundResponse> {
  const res = await fetch('/api/ai/generate-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await res.json()) as AIBackgroundResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `AI background request failed (${res.status})`);
  }
  return data;
}
