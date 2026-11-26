export type LanguageCode = 'ta' | 'en' | 'si';

export type ProjectLanguageMode = LanguageCode | 'all';

export type PresentationFormat = '16:9' | '4:3';

export type ThemeId =
  | 'christian-cinematic'
  | 'bible-classic'
  | 'modern-church'
  | 'golden-cross'
  | 'minimal-white'
  | 'dark-royal-blue';

export type SlideLayoutId =
  | 'cinematic-left'
  | 'centered-proclamation'
  | 'split-showcase'
  | 'two-column-scripture'
  | 'prayer-sanctuary'
  | 'minimal-editorial';

export type OverlayGradientStyle =
  | 'left-dark'
  | 'bottom-dark'
  | 'radial-vignette'
  | 'full-scrim'
  | 'light-sanctuary';

export type TextAlignment = 'left' | 'center' | 'right';
export type SpacingDensity = 'compact' | 'comfortable' | 'spacious';
export type ReferenceStyle = 'inline' | 'gold-accent' | 'subtle-bar';
export type ImagePosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface ScripturePoint {
  id: string;
  label: string;
  reference: string;
  scriptureNote?: string;
}

export interface SlideLanguageContent {
  kicker: string;
  title: string;
  subtitle: string;
  points: ScripturePoint[];
  prayerText?: string;
  footerLabel?: string;
  needsTranslationReview?: boolean;
  reviewNote?: string;
}

export interface SlideDesignSettings {
  layout: SlideLayoutId;
  fontFamily: string;
  titleSize: number;
  bodySize: number;
  refSize: number;
  textColor: string;
  accentColor: string;
  backgroundColor: string;
  overlayOpacity: number;
  overlayGradient: OverlayGradientStyle;
  alignment: TextAlignment;
  spacing: SpacingDensity;
  showReferences: boolean;
  referenceStyle: ReferenceStyle;
  imagePosition: ImagePosition;
  showSlideNumber: boolean;
}

export interface SlideBackgroundConfig {
  imageUrl: string;
  source: 'studio' | 'upload' | 'ai';
  prompt: string;
  assetId?: string;
}

export interface Slide {
  id: string;
  order: number;
  isPrayerSlide?: boolean;
  content: Record<LanguageCode, SlideLanguageContent>;
  design: SlideDesignSettings;
  background: SlideBackgroundConfig;
  aiDesignRationale?: string;
  lastUpdated: string;
}

export interface PresentationProject {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  languageMode: ProjectLanguageMode;
  activeLanguage: LanguageCode;
  format: PresentationFormat;
  themeId: ThemeId;
  completed: boolean;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportHistoryEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  format: 'pptx' | 'pdf' | 'png' | 'zip';
  languageScope: LanguageCode | 'all';
  slideCount: number;
  fileName: string;
  exportedAt: string;
}

export interface StudioSettings {
  defaultLanguage: LanguageCode;
  defaultThemeId: ThemeId;
  defaultFormat: PresentationFormat;
  defaultFonts: Record<LanguageCode, string>;
  aiStylePreset: string;
  enforceHighContrastScrim: boolean;
  pptxMode: 'editable' | 'visual';
  pngScale: 1 | 2;
  includeChurchFooter: boolean;
}

export type AppSection =
  | 'dashboard'
  | 'new-presentation'
  | 'projects'
  | 'templates'
  | 'editor'
  | 'ai-studio'
  | 'languages'
  | 'export'
  | 'settings';
