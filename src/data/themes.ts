import type { LanguageCode, SlideDesignSettings, ThemeId } from '../types/presentation';

export interface StudioTheme {
  id: ThemeId;
  name: string;
  description: string;
  isLight: boolean;
  previewSwatches: [string, string, string];
  defaults: Pick<
    SlideDesignSettings,
    | 'backgroundColor'
    | 'textColor'
    | 'accentColor'
    | 'overlayOpacity'
    | 'overlayGradient'
    | 'referenceStyle'
    | 'fontFamily'
  >;
}

export interface StudioBackdropAsset {
  id: string;
  slideHint: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  defaultPrompt: string;
}

export const HERO_CROSS_IMAGE = '/src/assets/images/hero_cinematic_cross_1795665761875.jpg';

export const STUDIO_BACKDROPS: StudioBackdropAsset[] = [
  {
    id: 'slide-01-eden',
    slideHint: 1,
    title: 'Garden of Eden Dawn',
    subtitle: 'Slide 01 · Original Man',
    imageUrl: '/src/assets/images/slide_01_eden_garden_1795665763970.jpg',
    defaultPrompt:
      'A beautiful Garden of Eden at golden sunrise, Adam and Eve in the distance, crystal river, lush olive and fruit trees, warm heavenly sunlight, peaceful Biblical atmosphere, 16:9 cinema, no text.',
  },
  {
    id: 'slide-02-fall',
    slideHint: 2,
    title: 'Darkening Eden & Forbidden Fruit',
    subtitle: 'Slide 02 · Fundamental Problems',
    imageUrl: '/src/assets/images/slide_02_forbidden_fruit_1795665764150.jpg',
    defaultPrompt:
      'Forbidden fruit hanging on a shadowed branch in a darkening Garden of Eden as storm clouds gather, dramatic chiaroscuro lighting symbolizing spiritual separation, 16:9 cinema, no text.',
  },
  {
    id: 'slide-03-chains',
    slideHint: 3,
    title: 'Burdened Chains in Mist',
    subtitle: 'Slide 03 · State of Non-believer',
    imageUrl: '/src/assets/images/slide_03_state_nonbeliever_1795665764374.jpg',
    defaultPrompt:
      'Heavy weathered iron chains on cold stone, solitary distressed human silhouette in deep midnight mist, dark atmospheric Biblical drama, 16:9 cinema, no text.',
  },
  {
    id: 'slide-04-canyon',
    slideHint: 4,
    title: 'The Impassable Canyon',
    subtitle: 'Slide 04 · Human Efforts',
    imageUrl: '/src/assets/images/slide_04_human_efforts_canyon_1795665766455.jpg',
    defaultPrompt:
      'A vast deep rocky canyon separating humanity and God, three broken stone paths and fallen wooden bridges failing to cross the abyss, faint golden light on the far summit, 16:9 cinema, no text.',
  },
  {
    id: 'slide-05-cross-bridge',
    slideHint: 5,
    title: 'Illuminated Cross Bridge',
    subtitle: 'Slide 05 · God’s Method',
    imageUrl: '/src/assets/images/slide_05_gods_method_cross_1795665766456.jpg',
    defaultPrompt:
      'A magnificent illuminated wooden cross connecting both cliffs across a deep rocky canyon, radiant royal gold light pouring across the midnight sky, 16:9 cinema, no text.',
  },
  {
    id: 'slide-06-crown-path',
    slideHint: 6,
    title: 'Royal Crown & Radiant Pathway',
    subtitle: 'Slide 06 · Three Roles of Christ',
    imageUrl: '/src/assets/images/slide_06_three_roles_christ_1795665769728.jpg',
    defaultPrompt:
      'Ancient royal gold crown on carved stone beside a sunlit glowing pathway rising toward a radiant cross on a hilltop, deep navy and gold atmospheric depth, 16:9 cinema, no text.',
  },
  {
    id: 'slide-07-freedom',
    slideHint: 7,
    title: 'Broken Iron Chains at Sunrise',
    subtitle: 'Slide 07 · Solution to All Problems',
    imageUrl: '/src/assets/images/slide_07_broken_chains_freedom_1795665769127.jpg',
    defaultPrompt:
      'Shattered heavy iron chains on sunlit stone as radiant morning rays illuminate an open valley road with a person walking toward freedom, 16:9 cinema, no text.',
  },
  {
    id: 'slide-08-door',
    slideHint: 8,
    title: 'Warm Light at the Wooden Door',
    subtitle: 'Slide 08 · How to Receive Salvation',
    imageUrl: '/src/assets/images/slide_08_door_of_heart_1795665770098.jpg',
    defaultPrompt:
      'Ancient arched wooden door slightly ajar in a dark stone room, warm luminous royal gold light streaming inward illuminating floating dust particles, reverent Biblical mood, 16:9 cinema, no text.',
  },
  {
    id: 'slide-09-prayer',
    slideHint: 9,
    title: 'Sanctuary Kneeling in Prayer',
    subtitle: 'Slide 09 · Acceptance Prayer',
    imageUrl: '/src/assets/images/slide_09_acceptance_prayer_1795665771019.jpg',
    defaultPrompt:
      'A person kneeling humbly in sincere prayer inside a quiet ancient stone sanctuary beneath a warm vertical shaft of golden heavenly light, deep navy shadows, 16:9 cinema, no text.',
  },
  {
    id: 'slide-10-dove',
    slideHint: 10,
    title: 'White Dove Over the World',
    subtitle: 'Slide 10 · Blessings of God’s Children',
    imageUrl: '/src/assets/images/slide_10_blessings_dove_1795665774445.jpg',
    defaultPrompt:
      'Radiant white dove soaring across a majestic deep navy and royal gold dawn sky above luminous clouds and a sunlit curved globe horizon, rays of peace and hope, 16:9 cinema, no text.',
  },
  {
    id: 'hero-hilltop-cross',
    slideHint: 0,
    title: 'Hilltop Cross at Dawn',
    subtitle: 'Studio Hero · Cover Backdrop',
    imageUrl: HERO_CROSS_IMAGE,
    defaultPrompt:
      'Majestic weathered wooden cross standing on a rocky Judean hilltop at dawn, deep navy twilight sky parting into radiant royal gold sunbeams, 16:9 cinema, no text.',
  },
];

export const STUDIO_THEMES: StudioTheme[] = [
  {
    id: 'christian-cinematic',
    name: 'Christian Cinematic',
    description: 'Deep navy shadows, luminous royal gold accents, and crisp cream typography crafted for sanctuary projection.',
    isLight: false,
    previewSwatches: ['#081629', '#10243C', '#D4AF67'],
    defaults: {
      backgroundColor: '#081629',
      textColor: '#FFFFFF',
      accentColor: '#D4AF67',
      overlayOpacity: 0.64,
      overlayGradient: 'left-dark',
      referenceStyle: 'gold-accent',
      fontFamily: 'Cinzel',
    },
  },
  {
    id: 'bible-classic',
    name: 'Bible Classic',
    description: 'Warm cathedral charcoal, antique parchment ivory, and refined manuscript gold rules.',
    isLight: false,
    previewSwatches: ['#14110E', '#2A2118', '#C9A45C'],
    defaults: {
      backgroundColor: '#14110E',
      textColor: '#FAF6EE',
      accentColor: '#C9A45C',
      overlayOpacity: 0.68,
      overlayGradient: 'radial-vignette',
      referenceStyle: 'subtle-bar',
      fontFamily: 'Cormorant Garamond',
    },
  },
  {
    id: 'modern-church',
    name: 'Modern Church',
    description: 'Contemporary midnight slate canvas with bold geometric display type and bright amber scripture markers.',
    isLight: false,
    previewSwatches: ['#0B192C', '#162C4A', '#E2B659'],
    defaults: {
      backgroundColor: '#0B192C',
      textColor: '#FFFFFF',
      accentColor: '#E2B659',
      overlayOpacity: 0.6,
      overlayGradient: 'left-dark',
      referenceStyle: 'gold-accent',
      fontFamily: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'golden-cross',
    name: 'Golden Cross',
    description: 'High-contrast obsidian night sky elevating burnished sovereign gold headlines and glowing scripture references.',
    isLight: false,
    previewSwatches: ['#070D19', '#141E33', '#DFB656'],
    defaults: {
      backgroundColor: '#070D19',
      textColor: '#FBF8F1',
      accentColor: '#DFB656',
      overlayOpacity: 0.7,
      overlayGradient: 'bottom-dark',
      referenceStyle: 'gold-accent',
      fontFamily: 'Cinzel',
    },
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Bright sunlit alabaster veil with deep navy text and dignified muted gold rules for daylight chapels and print.',
    isLight: true,
    previewSwatches: ['#F8F5EE', '#EAE2D2', '#A67F38'],
    defaults: {
      backgroundColor: '#F8F5EE',
      textColor: '#081629',
      accentColor: '#A67F38',
      overlayOpacity: 0.8,
      overlayGradient: 'light-sanctuary',
      referenceStyle: 'subtle-bar',
      fontFamily: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'dark-royal-blue',
    name: 'Dark Royal Blue',
    description: 'Regal deep sapphire backdrop with luminous champagne gold accents and balanced editorial spacing.',
    isLight: false,
    previewSwatches: ['#091B36', '#122D54', '#E5C787'],
    defaults: {
      backgroundColor: '#091B36',
      textColor: '#F5F1E8',
      accentColor: '#E5C787',
      overlayOpacity: 0.66,
      overlayGradient: 'full-scrim',
      referenceStyle: 'inline',
      fontFamily: 'Cormorant Garamond',
    },
  },
];

export const FONT_OPTIONS: Array<{ value: string; label: string; category: string }> = [
  { value: 'Cinzel', label: 'Cinzel (Cinematic Serif)', category: 'Display' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (Classic Serif)', category: 'Editorial' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Modern Sans)', category: 'English' },
  { value: 'Inter', label: 'Inter (Clean Sans)', category: 'English' },
  { value: 'Noto Sans Tamil', label: 'Noto Sans Tamil (தமிழ்)', category: 'Tamil' },
  { value: 'Noto Sans Sinhala', label: 'Noto Sans Sinhala (සිංහල)', category: 'Sinhala' },
];

export const LANGUAGE_META: Record<
  LanguageCode,
  { code: LanguageCode; nativeName: string; englishName: string; defaultFont: string; slideWord: string; ofWord: string }
> = {
  ta: {
    code: 'ta',
    nativeName: 'தமிழ்',
    englishName: 'Tamil',
    defaultFont: 'Noto Sans Tamil',
    slideWord: 'ஸ்லைடு',
    ofWord: '/',
  },
  en: {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    defaultFont: 'Plus Jakarta Sans',
    slideWord: 'Slide',
    ofWord: 'of',
  },
  si: {
    code: 'si',
    nativeName: 'සිංහල',
    englishName: 'Sinhala',
    defaultFont: 'Noto Sans Sinhala',
    slideWord: 'විනිවිදකය',
    ofWord: '/',
  },
};

export function getThemeById(themeId: ThemeId): StudioTheme {
  return STUDIO_THEMES.find((t) => t.id === themeId) ?? STUDIO_THEMES[0];
}

export function resolveSlideFont(selectedFont: string, language: LanguageCode): string {
  if (language === 'ta') {
    return `"Noto Sans Tamil", "${selectedFont}", sans-serif`;
  }
  if (language === 'si') {
    return `"Noto Sans Sinhala", "${selectedFont}", sans-serif`;
  }
  return `"${selectedFont}", "Plus Jakarta Sans", "Inter", sans-serif`;
}
