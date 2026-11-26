import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeString(value: unknown, maxLength = 800): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

  // Health & capability status (never exposes API keys)
  app.get('/api/health', (_req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const configured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
    res.json({
      ok: true,
      geminiConfigured: configured,
      textModel: 'gemini-4-hydrogen',
      liveImageGenerationAvailable: false,
      liveImageLimitationNote:
        'Live raster AI image generation requires a billing-enabled Gemini API key. You can generate AI art direction prompts with Gemini, choose from the 11 built-in 4K-style Biblical backdrops, or upload your own high-resolution image.',
    });
  });

  // Individual slide AI Design Generator (ONLY operates on the single requested slide)
  app.post('/api/ai/generate-design', async (req: Request, res: Response) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in AI Studio Settings > Secrets.',
      });
      return;
    }

    const slideNumber = Number(req.body?.slideNumber);
    const language = sanitizeString(req.body?.language, 10);
    const themeName = sanitizeString(req.body?.themeName, 80);
    const title = sanitizeString(req.body?.title, 200);
    const subtitle = sanitizeString(req.body?.subtitle, 300);
    const pointsCount = Math.min(Math.max(Number(req.body?.pointsCount) || 3, 0), 12);
    const isPrayerSlide = Boolean(req.body?.isPrayerSlide);
    const visualDescription = sanitizeString(req.body?.visualDescription, 500);
    const customDirection = sanitizeString(req.body?.customDirection, 400);

    if (!Number.isInteger(slideNumber) || slideNumber < 1 || slideNumber > 30) {
      res.status(400).json({ error: 'Invalid slideNumber. Must be an integer between 1 and 30.' });
      return;
    }

    if (!['ta', 'en', 'si'].includes(language)) {
      res.status(400).json({ error: 'Invalid language. Must be ta, en, or si.' });
      return;
    }

    const allowedLayouts = [
      'cinematic-left',
      'centered-proclamation',
      'split-showcase',
      'two-column-scripture',
      'prayer-sanctuary',
      'minimal-editorial',
    ];

    const allowedGradients = [
      'left-dark',
      'bottom-dark',
      'radial-vignette',
      'full-scrim',
      'light-sanctuary',
    ];

    const allowedAlignments = ['left', 'center', 'right'];
    const allowedSpacings = ['compact', 'comfortable', 'spacious'];
    const allowedRefStyles = ['inline', 'gold-accent', 'subtle-bar'];
    const allowedImagePositions = ['center', 'top', 'bottom', 'left', 'right'];

    const systemInstruction = `You are a master church media director and Christian presentation designer for "THE WAY OF SALVATION – AI Bible Presentation Studio".
Your task is to design visual layout and styling parameters for ONE SINGLE SLIDE ONLY.
Strict rules:
1. NEVER invent, alter, or return Bible verses. Only return visual design tokens and a text-free 16:9 Biblical visual art direction prompt.
2. Keep church projector legibility paramount (high contrast between textColor and overlay scrim).
3. For Prayer slides (Slide 9), prefer "prayer-sanctuary" or "centered-proclamation" with warm reverent balance.
4. For slides with 5+ points (like Slide 3, Slide 5, Slide 10), prefer "two-column-scripture" or "cinematic-left" with compact or comfortable spacing so text never overflows.
5. Keep colors within a regal, reverent Christian palette (deep navy #081629, midnight blue #10243C, royal gold #D4AF67, crisp white #FFFFFF, soft cream #F5F1E8, or warm alabaster for Minimal White theme).
6. Visual prompt MUST specify a 16:9 photorealistic Biblical cinematic scene with NO text, NO letters, NO watermarks, and NO logos.`;

    const prompt = `Design Slide ${slideNumber} of "The Way of Salvation" presentation.
Language: ${language === 'ta' ? 'Tamil' : language === 'si' ? 'Sinhala' : 'English'}
Active Theme: ${themeName || 'Christian Cinematic'}
Slide Title: ${title || `Slide ${slideNumber}`}
Subtitle: ${subtitle || 'None'}
Number of bullet/scripture items: ${pointsCount}
Is Acceptance Prayer slide: ${isPrayerSlide ? 'Yes' : 'No'}
Current visual concept: ${visualDescription || 'Cinematic Biblical environment'}
Additional pastor/designer instruction: ${customDirection || 'Create a balanced, awe-inspiring church projector slide design with strong visual hierarchy and royal gold accents.'}

Allowed layouts: ${allowedLayouts.join(', ')}
Allowed overlayGradient: ${allowedGradients.join(', ')}
Allowed alignment: ${allowedAlignments.join(', ')}
Allowed spacing: ${allowedSpacings.join(', ')}
Allowed referenceStyle: ${allowedRefStyles.join(', ')}
Allowed imagePosition: ${allowedImagePositions.join(', ')}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              layout: { type: Type.STRING, description: 'One of the allowed layout IDs.' },
              overlayGradient: { type: Type.STRING, description: 'One of the allowed overlay gradient styles.' },
              overlayOpacity: { type: Type.NUMBER, description: 'Number between 0.35 and 0.85 for readable projector contrast.' },
              backgroundColor: { type: Type.STRING, description: 'Hex color string like #081629.' },
              textColor: { type: Type.STRING, description: 'Hex color string like #FFFFFF or #F5F1E8.' },
              accentColor: { type: Type.STRING, description: 'Hex color string like #D4AF67.' },
              alignment: { type: Type.STRING, description: 'left, center, or right.' },
              spacing: { type: Type.STRING, description: 'compact, comfortable, or spacious.' },
              titleSize: { type: Type.INTEGER, description: 'Title size in px between 38 and 58.' },
              bodySize: { type: Type.INTEGER, description: 'Body size in px between 18 and 28.' },
              referenceStyle: { type: Type.STRING, description: 'inline, gold-accent, or subtle-bar.' },
              imagePosition: { type: Type.STRING, description: 'center, top, bottom, left, or right.' },
              visualPrompt: {
                type: Type.STRING,
                description: 'Refined 16:9 photorealistic cinematic Biblical scene description without any text or watermarks.',
              },
              designRationale: {
                type: Type.STRING,
                description: '1-2 concise sentences explaining why this layout and lighting suits this specific slide.',
              },
            },
            required: [
              'layout',
              'overlayGradient',
              'overlayOpacity',
              'backgroundColor',
              'textColor',
              'accentColor',
              'alignment',
              'spacing',
              'titleSize',
              'bodySize',
              'referenceStyle',
              'imagePosition',
              'visualPrompt',
              'designRationale',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
        return;
      }

      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;

      const safeDesign = {
        layout: allowedLayouts.includes(String(parsed.layout)) ? String(parsed.layout) : 'cinematic-left',
        overlayGradient: allowedGradients.includes(String(parsed.overlayGradient))
          ? String(parsed.overlayGradient)
          : 'left-dark',
        overlayOpacity: Math.min(Math.max(Number(parsed.overlayOpacity) || 0.62, 0.25), 0.9),
        backgroundColor: hexPattern.test(String(parsed.backgroundColor)) ? String(parsed.backgroundColor) : '#081629',
        textColor: hexPattern.test(String(parsed.textColor)) ? String(parsed.textColor) : '#FFFFFF',
        accentColor: hexPattern.test(String(parsed.accentColor)) ? String(parsed.accentColor) : '#D4AF67',
        alignment: allowedAlignments.includes(String(parsed.alignment)) ? String(parsed.alignment) : 'left',
        spacing: allowedSpacings.includes(String(parsed.spacing)) ? String(parsed.spacing) : 'comfortable',
        titleSize: Math.min(Math.max(Math.round(Number(parsed.titleSize) || 46), 34), 60),
        bodySize: Math.min(Math.max(Math.round(Number(parsed.bodySize) || 22), 16), 30),
        referenceStyle: allowedRefStyles.includes(String(parsed.referenceStyle))
          ? String(parsed.referenceStyle)
          : 'gold-accent',
        imagePosition: allowedImagePositions.includes(String(parsed.imagePosition))
          ? String(parsed.imagePosition)
          : 'center',
        visualPrompt: sanitizeString(parsed.visualPrompt, 600),
        designRationale: sanitizeString(parsed.designRationale, 400),
      };

      res.json({
        slideNumber,
        model: 'gemini-4-hydrogen',
        design: safeDesign,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown Gemini API error';
      console.error('Gemini design generation error:', message);
      res.status(502).json({
        error: `AI design generation failed: ${message}`,
      });
    }
  });

  // AI Background Art Direction & Live Image Capability Check
  app.post('/api/ai/generate-background', async (req: Request, res: Response) => {
    const ai = createGeminiClient();
    const slideNumber = Number(req.body?.slideNumber) || 1;
    const subject = sanitizeString(req.body?.subject, 200);
    const visualDescription = sanitizeString(req.body?.visualDescription, 500);
    const stylePreset = sanitizeString(req.body?.stylePreset, 100) || 'Christian Cinematic 4K';
    const mode = sanitizeString(req.body?.mode, 30) || 'prompt';

    if (!subject && !visualDescription) {
      res.status(400).json({ error: 'Please provide a slide subject or visual description.' });
      return;
    }

    if (mode === 'live-image') {
      // Honestly communicate the billing-enabled image model limitation without faking success
      res.status(402).json({
        error:
          'Live AI image rendering requires a billing-enabled Gemini API key (paid tier). Use "Upload Custom Image" to import your own church photography, select from the 11 pre-rendered 4K Biblical backdrops in the Studio Library, or refine the art direction prompt with Gemini.',
        code: 'PAID_IMAGE_KEY_REQUIRED',
      });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in AI Studio Settings > Secrets.',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write a single, vivid, church-projector-ready 16:9 cinematic photography prompt for Slide ${slideNumber}: "${subject}".
Current visual idea: ${visualDescription}
Visual style: ${stylePreset}

Requirements:
- Photorealistic Biblical environment with rich atmospheric depth and natural volumetric lighting
- 16:9 widescreen composition leaving clean negative space on the left or center for overlaid white/gold Bible text
- Strictly NO embedded text, NO words, NO logos, NO watermarks
- Keep under 75 words, plain descriptive prose only.`,
      });

      const enhancedPrompt = sanitizeString(response.text, 700);
      if (!enhancedPrompt) {
        res.status(502).json({ error: 'Gemini returned an empty prompt. Please try again.' });
        return;
      }

      res.json({
        slideNumber,
        model: 'gemini-4-hydrogen',
        enhancedPrompt,
        liveImageAvailable: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown Gemini API error';
      console.error('Gemini prompt generation error:', message);
      res.status(502).json({ error: `AI art direction failed: ${message}` });
    }
  });

  if (IS_PRODUCTION) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THE WAY OF SALVATION Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
