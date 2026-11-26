import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Image as ImageIcon,
  Layout,
  Loader2,
  Maximize2,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  ImagePosition,
  LanguageCode,
  OverlayGradientStyle,
  PresentationProject,
  ReferenceStyle,
  Slide,
  SlideDesignSettings,
  SlideLanguageContent,
  SlideLayoutId,
  SpacingDensity,
  StudioSettings,
  TextAlignment,
} from '../types/presentation';
import {
  FONT_OPTIONS,
  LANGUAGE_META,
  STUDIO_BACKDROPS,
  getThemeById,
} from '../data/themes';
import {
  generateSlideAIDesign,
  requestAIBackgroundArtDirection,
} from '../lib/aiClient';
import { exportSingleSlidePNG } from '../lib/exporter';
import { SlideCanvas } from './SlideCanvas';

interface SlideEditorViewProps {
  project: PresentationProject;
  settings: StudioSettings;
  selectedSlideIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onSelectSlide: (index: number) => void;
  onUpdateProject: (updated: PresentationProject, pushHistory?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveNow: () => void;
  onPresent: (startSlideIndex: number) => void;
  onExportLogged: (info: {
    format: 'png';
    languageScope: LanguageCode;
    slideCount: number;
    fileName: string;
  }) => void;
}

const LAYOUT_OPTIONS: Array<{ id: SlideLayoutId; label: string }> = [
  { id: 'cinematic-left', label: 'Cinematic Left' },
  { id: 'centered-proclamation', label: 'Centered Proclamation' },
  { id: 'split-showcase', label: 'Split Showcase' },
  { id: 'two-column-scripture', label: 'Two-Column Scripture' },
  { id: 'prayer-sanctuary', label: 'Prayer Sanctuary' },
  { id: 'minimal-editorial', label: 'Minimal Editorial' },
];

const GRADIENT_OPTIONS: Array<{ id: OverlayGradientStyle; label: string }> = [
  { id: 'left-dark', label: 'Left Cinematic Gradient' },
  { id: 'bottom-dark', label: 'Bottom Dramatic Gradient' },
  { id: 'radial-vignette', label: 'Radial Sanctuary Vignette' },
  { id: 'full-scrim', label: 'Uniform Scrim' },
  { id: 'light-sanctuary', label: 'Light Daylight Veil' },
];

export const SlideEditorView: React.FC<SlideEditorViewProps> = ({
  project,
  settings,
  selectedSlideIndex,
  canUndo,
  canRedo,
  onSelectSlide,
  onUpdateProject,
  onUndo,
  onRedo,
  onSaveNow,
  onPresent,
  onExportLogged,
}) => {
  const [inspectorTab, setInspectorTab] = useState<'content' | 'design' | 'background'>('content');
  const [zoom, setZoom] = useState<number>(100);
  const [aiDesignLoading, setAiDesignLoading] = useState(false);
  const [aiDesignError, setAiDesignError] = useState<string | null>(null);
  const [aiDesignDirection, setAiDesignDirection] = useState('');

  const [aiBgLoading, setAiBgLoading] = useState(false);
  const [aiBgError, setAiBgError] = useState<string | null>(null);
  const [aiBgNotice, setAiBgNotice] = useState<string | null>(null);

  const [pngExporting, setPngExporting] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const safeIndex = Math.min(
    Math.max(selectedSlideIndex, 0),
    Math.max(project.slides.length - 1, 0)
  );
  const activeSlide = project.slides[safeIndex];
  const activeLang = project.activeLanguage;
  const theme = getThemeById(project.themeId);

  if (!activeSlide) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-[#F5F1E8]/70">
        No slides in this presentation.
      </div>
    );
  }

  const localized = activeSlide.content[activeLang];

  // Helper: updates ONLY the currently selected slide — never alters other slides
  const updateActiveSlide = (
    updater: (slide: Slide) => Slide,
    pushHistory = true
  ) => {
    const nextSlides = project.slides.map((s, idx) =>
      idx === safeIndex
        ? { ...updater(s), lastUpdated: new Date().toISOString() }
        : s
    );
    onUpdateProject(
      {
        ...project,
        slides: nextSlides,
        updatedAt: new Date().toISOString(),
      },
      pushHistory
    );
  };

  const updateLocalizedContent = (
    patch: Partial<SlideLanguageContent>,
    pushHistory = true
  ) => {
    updateActiveSlide(
      (s) => ({
        ...s,
        content: {
          ...s.content,
          [activeLang]: {
            ...s.content[activeLang],
            ...patch,
          },
        },
      }),
      pushHistory
    );
  };

  const updateDesign = (
    patch: Partial<SlideDesignSettings>,
    pushHistory = true
  ) => {
    updateActiveSlide(
      (s) => ({
        ...s,
        design: {
          ...s.design,
          ...patch,
        },
      }),
      pushHistory
    );
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    onUpdateProject({ ...project, activeLanguage: lang }, false);
  };

  const handleCycleLayout = () => {
    const idx = LAYOUT_OPTIONS.findIndex((l) => l.id === activeSlide.design.layout);
    const next = LAYOUT_OPTIONS[(idx + 1) % LAYOUT_OPTIONS.length];
    updateDesign({ layout: next.id });
  };

  // Independent per-slide AI Design Generation (ONLY affects activeSlide)
  const handleGenerateAIDesign = async () => {
    setAiDesignLoading(true);
    setAiDesignError(null);
    try {
      const result = await generateSlideAIDesign({
        slide: activeSlide,
        language: activeLang,
        themeName: theme.name,
        customDirection: aiDesignDirection,
      });

      const d = result.design;
      updateActiveSlide((s) => ({
        ...s,
        design: {
          ...s.design,
          layout: (d.layout as SlideLayoutId) ?? s.design.layout,
          overlayGradient:
            (d.overlayGradient as OverlayGradientStyle) ?? s.design.overlayGradient,
          overlayOpacity:
            typeof d.overlayOpacity === 'number'
              ? settings.enforceHighContrastScrim
                ? Math.max(d.overlayOpacity, 0.5)
                : d.overlayOpacity
              : s.design.overlayOpacity,
          backgroundColor: d.backgroundColor ?? s.design.backgroundColor,
          textColor: d.textColor ?? s.design.textColor,
          accentColor: d.accentColor ?? s.design.accentColor,
          alignment: (d.alignment as TextAlignment) ?? s.design.alignment,
          spacing: (d.spacing as SpacingDensity) ?? s.design.spacing,
          titleSize: typeof d.titleSize === 'number' ? d.titleSize : s.design.titleSize,
          bodySize: typeof d.bodySize === 'number' ? d.bodySize : s.design.bodySize,
          referenceStyle:
            (d.referenceStyle as ReferenceStyle) ?? s.design.referenceStyle,
          imagePosition:
            (d.imagePosition as ImagePosition) ?? s.design.imagePosition,
        },
        background: {
          ...s.background,
          prompt: d.visualPrompt || s.background.prompt,
        },
        aiDesignRationale: d.designRationale,
      }));
    } catch (err: unknown) {
      setAiDesignError(
        err instanceof Error ? err.message : 'AI design generation failed.'
      );
    } finally {
      setAiDesignLoading(false);
    }
  };

  // Refine AI Background Prompt with Gemini (ONLY affects activeSlide)
  const handleRefineArtDirection = async () => {
    setAiBgLoading(true);
    setAiBgError(null);
    setAiBgNotice(null);
    try {
      const result = await requestAIBackgroundArtDirection({
        slideNumber: activeSlide.order,
        subject: localized.title,
        visualDescription: activeSlide.background.prompt,
        stylePreset: settings.aiStylePreset,
        mode: 'prompt',
      });
      updateActiveSlide((s) => ({
        ...s,
        background: {
          ...s.background,
          prompt: result.enhancedPrompt,
        },
      }));
      setAiBgNotice(
        `Gemini updated the 16:9 Biblical scene prompt for Slide ${String(activeSlide.order).padStart(2, '0')} without altering slide text.`
      );
    } catch (err: unknown) {
      setAiBgError(
        err instanceof Error ? err.message : 'Failed to refine art direction prompt.'
      );
    } finally {
      setAiBgLoading(false);
    }
  };

  // Live AI Image synthesis request — transparently handles paid-tier limitation
  const handleGenerateLiveImage = async () => {
    setAiBgLoading(true);
    setAiBgError(null);
    setAiBgNotice(null);
    try {
      await requestAIBackgroundArtDirection({
        slideNumber: activeSlide.order,
        subject: localized.title,
        visualDescription: activeSlide.background.prompt,
        stylePreset: settings.aiStylePreset,
        mode: 'live-image',
      });
    } catch (err: unknown) {
      setAiBgError(
        err instanceof Error
          ? err.message
          : 'Live AI image generation is currently unavailable. Please upload a custom image or select a backdrop from the Studio Library below.'
      );
    } finally {
      setAiBgLoading(false);
    }
  };

  // Regenerate Background: rotates through studio Biblical backdrops for THIS slide only without losing text
  const handleRegenerateStudioBackdrop = () => {
    const currentIdx = STUDIO_BACKDROPS.findIndex(
      (b) => b.imageUrl === activeSlide.background.imageUrl
    );
    const nextBackdrop =
      STUDIO_BACKDROPS[(currentIdx + 1) % STUDIO_BACKDROPS.length];
    updateActiveSlide((s) => ({
      ...s,
      background: {
        ...s.background,
        imageUrl: nextBackdrop.imageUrl,
        source: 'studio',
        assetId: nextBackdrop.id,
      },
    }));
    setAiBgNotice(
      `Applied "${nextBackdrop.title}" to Slide ${String(activeSlide.order).padStart(2, '0')}. Slide text preserved.`
    );
    setAiBgError(null);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAiBgError('Please choose a valid image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setAiBgError('Image exceeds 12 MB limit. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      updateActiveSlide((s) => ({
        ...s,
        background: {
          ...s.background,
          imageUrl: dataUrl,
          source: 'upload',
          assetId: undefined,
        },
      }));
      setAiBgError(null);
      setAiBgNotice(
        `Uploaded custom background "${file.name}" to Slide ${String(activeSlide.order).padStart(2, '0')}.`
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownloadSlidePNG = async () => {
    setPngExporting(true);
    try {
      const fileName = await exportSingleSlidePNG({
        project,
        slide: activeSlide,
        language: activeLang,
        settings,
      });
      onExportLogged({
        format: 'png',
        languageScope: activeLang,
        slideCount: 1,
        fileName,
      });
    } finally {
      setPngExporting(false);
    }
  };

  const handleSaveClick = () => {
    onSaveNow();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleAddPoint = () => {
    const nextPoint = {
      id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label:
        activeLang === 'ta'
          ? 'புதிய போதனைப் புள்ளி'
          : activeLang === 'si'
          ? 'නව ඉගැන්වීමේ කරුණ'
          : 'New Teaching Point',
      reference: '',
    };
    updateLocalizedContent({ points: [...localized.points, nextPoint] });
  };

  const handleUpdatePoint = (
    pointId: string,
    field: 'label' | 'reference' | 'scriptureNote',
    value: string
  ) => {
    updateLocalizedContent({
      points: localized.points.map((pt) =>
        pt.id === pointId ? { ...pt, [field]: value } : pt
      ),
    });
  };

  const handleDeletePoint = (pointId: string) => {
    updateLocalizedContent({
      points: localized.points.filter((pt) => pt.id !== pointId),
    });
  };

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col overflow-hidden bg-[#081629]">
      {/* Hidden Custom Background Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUploadImage}
        className="hidden"
      />

      {/* Editor Sub-Header: Language Switcher & Individual Slide Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF67]/20 bg-[#0B1B32] px-4 py-2.5">
        {/* Independent Language Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-[#D4AF67]/25 bg-[#081629] p-1">
            {(['ta', 'en', 'si'] as LanguageCode[]).map((lang) => (
              <button
                key={lang}
                type="button"
                title={`Switch all slide text to ${LANGUAGE_META[lang].englishName}`}
                onClick={() => handleLanguageChange(lang)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeLang === lang
                    ? 'bg-[#D4AF67] text-[#081629]'
                    : 'text-[#F5F1E8]/75 hover:text-white'
                }`}
              >
                {LANGUAGE_META[lang].nativeName}
              </button>
            ))}
          </div>

          <span className="hidden text-xs text-[#F5F1E8]/55 xl:inline">
            Editing Slide {String(activeSlide.order).padStart(2, '0')} ·{' '}
            {project.format}
          </span>
        </div>

        {/* Individual Per-Slide Action Controls (Never regenerates other slides) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            title="Edit text, scripture references, and prayer for this slide"
            onClick={() => {
              setInspectorTab('content');
              setTimeout(() => titleInputRef.current?.focus(), 60);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-[#10243C] px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#D4AF67]" />
            Edit Content
          </button>

          <button
            type="button"
            title="Open AI Background Studio for this slide only"
            onClick={() => setInspectorTab('background')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-[#10243C] px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#D4AF67]" />
            AI Background
          </button>

          <button
            type="button"
            disabled={aiDesignLoading}
            title="Generate Gemini AI layout & visual design for ONLY this slide"
            onClick={handleGenerateAIDesign}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF67]/50 bg-[#D4AF67]/15 px-3 py-1.5 text-xs font-semibold text-[#ebd49d] transition-colors hover:bg-[#D4AF67]/25 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {aiDesignLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {aiDesignLoading
              ? `Designing Slide ${String(activeSlide.order).padStart(2, '0')}...`
              : 'Generate AI Design'}
          </button>

          <button
            type="button"
            title="Swap to next Biblical background scene for this slide without losing text"
            onClick={handleRegenerateStudioBackdrop}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-[#10243C] px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#D4AF67]" />
            Regenerate BG
          </button>

          <button
            type="button"
            title="Cycle slide layout structure"
            onClick={handleCycleLayout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-[#10243C] px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Layout className="h-3.5 w-3.5 text-[#D4AF67]" />
            Change Layout
          </button>

          <button
            type="button"
            title="Save slide immediately to browser storage"
            onClick={handleSaveClick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-[#10243C] px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {savedNotice ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Save className="h-3.5 w-3.5 text-[#D4AF67]" />
            )}
            {savedNotice ? 'Saved' : 'Save Slide'}
          </button>

          <button
            type="button"
            disabled={pngExporting}
            title="Download this slide as a high-resolution PNG image"
            onClick={handleDownloadSlidePNG}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-[#10243C] px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67]/50 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {pngExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 text-[#D4AF67]" />
            )}
            PNG
          </button>

          <button
            type="button"
            title="Preview this slide full-screen"
            onClick={() => onPresent(safeIndex)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF67] px-3 py-1.5 text-xs font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            Preview Slide
          </button>
        </div>
      </div>

      {/* Main 3-Column Editor Workspace */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: 10-Slide Filmstrip */}
        <aside className="hidden w-[256px] shrink-0 flex-col border-r border-[#D4AF67]/15 bg-[#0A182E] lg:flex">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-xs font-semibold text-[#F5F1E8]/80">
              Slides ({project.slides.length})
            </span>
            <span className="text-[11px] text-[#D4AF67]">
              {LANGUAGE_META[activeLang].nativeName}
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {project.slides.map((slide, idx) => {
              const isSelected = idx === safeIndex;
              const slideTitle = slide.content[activeLang].title;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => {
                    onSelectSlide(idx);
                    setAiDesignError(null);
                    setAiBgError(null);
                    setAiBgNotice(null);
                  }}
                  className={`group w-full rounded-lg border p-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#D4AF67] bg-[#142B4B]'
                      : 'border-white/8 bg-[#10243C]/45 hover:border-[#D4AF67]/40'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-[11px] font-semibold tabular-nums ${
                        isSelected ? 'text-[#D4AF67]' : 'text-[#F5F1E8]/55'
                      }`}
                    >
                      Slide {String(slide.order).padStart(2, '0')}
                    </span>
                    <span className="truncate text-[11px] font-medium text-[#F5F1E8]/85">
                      {slideTitle}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded border border-white/10">
                    <SlideCanvas
                      slide={slide}
                      language={activeLang}
                      format={project.format}
                      totalSlides={project.slides.length}
                      includeFooter={false}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER WORKSPACE: Live 16:9 / 4:3 Canvas Preview */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#061121]">
          {/* Mobile / Tablet Slide Switcher Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-[#0A182E] px-3 py-2 lg:hidden">
            {project.slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => onSelectSlide(idx)}
                className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                  idx === safeIndex
                    ? 'bg-[#D4AF67] text-[#081629]'
                    : 'bg-[#10243C] text-[#F5F1E8]/70'
                }`}
              >
                {String(slide.order).padStart(2, '0')}
              </button>
            ))}
          </div>

          {/* Feedback / AI Error Banners (Honest & Clear) */}
          {(aiDesignError || activeSlide.aiDesignRationale) && (
            <div className="border-b border-white/10 bg-[#0D1E36] px-5 py-2.5 text-xs">
              {aiDesignError ? (
                <div className="flex items-center justify-between gap-3 text-red-300">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {aiDesignError}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiDesignError(null)}
                    className="text-[#F5F1E8]/60 hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                activeSlide.aiDesignRationale && (
                  <div className="flex items-center justify-between gap-3 text-[#F5F1E8]/80">
                    <span>
                      <span className="font-semibold text-[#D4AF67]">
                        AI Design Note (Slide{' '}
                        {String(activeSlide.order).padStart(2, '0')}):
                      </span>{' '}
                      {activeSlide.aiDesignRationale}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Canvas Viewport */}
          <div className="flex flex-1 items-center justify-center overflow-auto p-6 lg:p-10">
            <div
              className="transition-transform duration-150 ease-out"
              style={{
                width: `${Math.min(Math.max(zoom, 50), 150)}%`,
                maxWidth: zoom <= 100 ? '940px' : '1420px',
              }}
            >
              <div className="overflow-hidden rounded-xl border border-[#D4AF67]/35 shadow-2xl shadow-black/60">
                <SlideCanvas
                  slide={activeSlide}
                  language={activeLang}
                  format={project.format}
                  totalSlides={project.slides.length}
                  churchAuthor={
                    settings.includeChurchFooter ? project.author : undefined
                  }
                  includeFooter={settings.includeChurchFooter}
                  interactive
                  onTitleClick={() => {
                    setInspectorTab('content');
                    setTimeout(() => titleInputRef.current?.focus(), 60);
                  }}
                />
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: Inspector (Content / Design / AI Background) */}
        <aside className="flex w-full max-w-[340px] shrink-0 flex-col border-l border-[#D4AF67]/15 bg-[#0A182E] sm:w-[340px]">
          {/* Inspector Mode Tabs */}
          <div className="grid grid-cols-3 border-b border-white/10 p-1.5">
            {(
              [
                { id: 'content', label: 'Content' },
                { id: 'design', label: 'Design' },
                { id: 'background', label: 'Background' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInspectorTab(tab.id)}
                className={`rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  inspectorTab === tab.id
                    ? 'bg-[#D4AF67] text-[#081629]'
                    : 'text-[#F5F1E8]/70 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {/* TAB 1: CONTENT EDITOR */}
            {inspectorTab === 'content' && (
              <>
                <div className="border-b border-white/10 pb-3">
                  <div className="text-xs font-semibold text-[#D4AF67]">
                    Slide {String(activeSlide.order).padStart(2, '0')} ·{' '}
                    {LANGUAGE_META[activeLang].nativeName} Content
                  </div>
                  <p className="mt-1 text-[11px] text-[#F5F1E8]/55">
                    Changes save only to the {LANGUAGE_META[activeLang].englishName}{' '}
                    edition so languages never mix.
                  </p>
                </div>

                {localized.needsTranslationReview && (
                  <div className="rounded-lg border border-amber-400/35 bg-amber-500/10 p-3 text-xs text-amber-100">
                    <div className="font-semibold text-amber-300">
                      Scripture / Prayer Verification Reminder
                    </div>
                    <p className="mt-1 leading-relaxed text-amber-100/85">
                      {localized.reviewNote ||
                        'Confirm this text matches your church’s exact printed Bible translation before presenting.'}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        updateLocalizedContent({ needsTranslationReview: false })
                      }
                      className="mt-2 text-xs font-semibold text-[#D4AF67] underline underline-offset-2 cursor-pointer"
                    >
                      Mark wording as verified
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#F5F1E8]/75">
                      Section Kicker
                    </label>
                    <input
                      type="text"
                      value={localized.kicker}
                      onChange={(e) =>
                        updateLocalizedContent({ kicker: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#F5F1E8]/75">
                      Slide Heading
                    </label>
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={localized.title}
                      onChange={(e) =>
                        updateLocalizedContent({ title: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-sm font-semibold text-white focus:border-[#D4AF67] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#F5F1E8]/75">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={localized.subtitle}
                      onChange={(e) =>
                        updateLocalizedContent({ subtitle: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
                    />
                  </div>
                </div>

                {activeSlide.isPrayerSlide ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#F5F1E8]/75">
                      Acceptance Prayer Text
                    </label>
                    <textarea
                      rows={11}
                      value={localized.prayerText ?? ''}
                      onChange={(e) =>
                        updateLocalizedContent({ prayerText: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#10243C] p-3 text-xs leading-relaxed text-white focus:border-[#D4AF67] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        Points & Bible References ({localized.points.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPoint}
                        className="inline-flex items-center gap-1 rounded-md border border-[#D4AF67]/40 px-2 py-1 text-[11px] font-semibold text-[#D4AF67] hover:bg-[#D4AF67]/15 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        Add Point
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {localized.points.map((pt, idx) => (
                        <div
                          key={pt.id}
                          className="space-y-2 rounded-lg border border-white/10 bg-[#10243C]/65 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-[#D4AF67] tabular-nums">
                              Point {String(idx + 1).padStart(2, '0')}
                            </span>
                            <button
                              type="button"
                              title="Remove point"
                              onClick={() => handleDeletePoint(pt.id)}
                              className="text-[#F5F1E8]/45 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={pt.label}
                            onChange={(e) =>
                              handleUpdatePoint(pt.id, 'label', e.target.value)
                            }
                            placeholder="Point heading"
                            className="w-full rounded border border-white/12 bg-[#081629] px-2.5 py-1.5 text-xs font-medium text-white focus:border-[#D4AF67] focus:outline-none"
                          />

                          <input
                            type="text"
                            value={pt.reference}
                            onChange={(e) =>
                              handleUpdatePoint(
                                pt.id,
                                'reference',
                                e.target.value
                              )
                            }
                            placeholder="Bible reference (e.g., John 3:16)"
                            className="w-full rounded border border-white/12 bg-[#081629] px-2.5 py-1.5 text-xs text-[#D4AF67] placeholder-[#F5F1E8]/30 focus:border-[#D4AF67] focus:outline-none"
                          />

                          <input
                            type="text"
                            value={pt.scriptureNote ?? ''}
                            onChange={(e) =>
                              handleUpdatePoint(
                                pt.id,
                                'scriptureNote',
                                e.target.value
                              )
                            }
                            placeholder="Optional verbatim verse quotation (paste from Bible)"
                            className="w-full rounded border border-white/10 bg-[#081629] px-2.5 py-1.5 text-[11px] text-[#F5F1E8]/80 placeholder-[#F5F1E8]/30 focus:border-[#D4AF67] focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#F5F1E8]/75">
                    Slide Footer Label
                  </label>
                  <input
                    type="text"
                    value={localized.footerLabel ?? ''}
                    onChange={(e) =>
                      updateLocalizedContent({ footerLabel: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* TAB 2: DESIGN & TYPOGRAPHY SETTINGS */}
            {inspectorTab === 'design' && (
              <>
                {/* AI Single-Slide Design Assistant */}
                <div className="space-y-2.5 rounded-lg border border-[#D4AF67]/30 bg-[#10243C]/80 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#D4AF67]">
                      Single-Slide AI Design (Gemini)
                    </span>
                    <span className="font-mono text-[11px] text-[#F5F1E8]/55">
                      Slide {String(activeSlide.order).padStart(2, '0')}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={aiDesignDirection}
                    onChange={(e) => setAiDesignDirection(e.target.value)}
                    placeholder="Optional direction (e.g., centered warm cathedral style)"
                    className="w-full rounded border border-white/15 bg-[#081629] px-2.5 py-1.5 text-xs text-white placeholder-[#F5F1E8]/35 focus:border-[#D4AF67] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={aiDesignLoading}
                    onClick={handleGenerateAIDesign}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF67] px-3 py-2 text-xs font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] disabled:opacity-60 cursor-pointer"
                  >
                    {aiDesignLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {aiDesignLoading
                      ? 'Generating Design...'
                      : `Generate AI Design for Slide ${String(activeSlide.order).padStart(2, '0')}`}
                  </button>
                </div>

                {/* Layout Settings */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white">
                    Layout Structure
                  </label>
                  <select
                    value={activeSlide.design.layout}
                    onChange={(e) =>
                      updateDesign({ layout: e.target.value as SlideLayoutId })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
                  >
                    {LAYOUT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Settings */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="text-xs font-semibold text-white">
                    Typography & Text Settings
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#F5F1E8]/70">
                      Font Family
                    </label>
                    <select
                      value={activeSlide.design.fontFamily}
                      onChange={(e) =>
                        updateDesign({ fontFamily: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-[11px] text-[#F5F1E8]/70">
                      <span>Heading Size</span>
                      <span className="font-mono tabular-nums">
                        {activeSlide.design.titleSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={64}
                      value={activeSlide.design.titleSize}
                      onChange={(e) =>
                        updateDesign({ titleSize: Number(e.target.value) })
                      }
                      className="w-full accent-[#D4AF67]"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-[11px] text-[#F5F1E8]/70">
                      <span>Body Size</span>
                      <span className="font-mono tabular-nums">
                        {activeSlide.design.bodySize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={32}
                      value={activeSlide.design.bodySize}
                      onChange={(e) =>
                        updateDesign({ bodySize: Number(e.target.value) })
                      }
                      className="w-full accent-[#D4AF67]"
                    />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <label className="space-y-1 text-[11px] text-[#F5F1E8]/70">
                      <span>Text</span>
                      <input
                        type="color"
                        value={activeSlide.design.textColor}
                        onChange={(e) =>
                          updateDesign({ textColor: e.target.value })
                        }
                        className="h-8 w-full cursor-pointer rounded border border-white/15 bg-[#10243C] p-0.5"
                      />
                    </label>
                    <label className="space-y-1 text-[11px] text-[#F5F1E8]/70">
                      <span>Accent</span>
                      <input
                        type="color"
                        value={activeSlide.design.accentColor}
                        onChange={(e) =>
                          updateDesign({ accentColor: e.target.value })
                        }
                        className="h-8 w-full cursor-pointer rounded border border-white/15 bg-[#10243C] p-0.5"
                      />
                    </label>
                    <label className="space-y-1 text-[11px] text-[#F5F1E8]/70">
                      <span>Canvas</span>
                      <input
                        type="color"
                        value={activeSlide.design.backgroundColor}
                        onChange={(e) =>
                          updateDesign({ backgroundColor: e.target.value })
                        }
                        className="h-8 w-full cursor-pointer rounded border border-white/15 bg-[#10243C] p-0.5"
                      />
                    </label>
                  </div>
                </div>

                {/* Alignment & Spacing */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="text-xs font-semibold text-white">
                    Alignment & Spacing
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'left', icon: AlignLeft, label: 'Left' },
                        { id: 'center', icon: AlignCenter, label: 'Center' },
                        { id: 'right', icon: AlignRight, label: 'Right' },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateDesign({ alignment: item.id })}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium cursor-pointer ${
                            activeSlide.design.alignment === item.id
                              ? 'border-[#D4AF67] bg-[#D4AF67]/20 text-white'
                              : 'border-white/12 bg-[#10243C] text-[#F5F1E8]/70'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(['compact', 'comfortable', 'spacious'] as SpacingDensity[]).map(
                      (sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => updateDesign({ spacing: sp })}
                          className={`rounded-lg border py-1.5 text-xs font-medium capitalize cursor-pointer ${
                            activeSlide.design.spacing === sp
                              ? 'border-[#D4AF67] bg-[#D4AF67]/20 text-white'
                              : 'border-white/12 bg-[#10243C] text-[#F5F1E8]/70'
                          }`}
                        >
                          {sp}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Overlay & Image Settings */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="text-xs font-semibold text-white">
                    Overlay & Image Framing
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#F5F1E8]/70">
                      Overlay Style
                    </label>
                    <select
                      value={activeSlide.design.overlayGradient}
                      onChange={(e) =>
                        updateDesign({
                          overlayGradient: e.target.value as OverlayGradientStyle,
                        })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
                    >
                      {GRADIENT_OPTIONS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-[11px] text-[#F5F1E8]/70">
                      <span>Overlay Opacity</span>
                      <span className="font-mono tabular-nums">
                        {Math.round(activeSlide.design.overlayOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={92}
                      value={Math.round(activeSlide.design.overlayOpacity * 100)}
                      onChange={(e) =>
                        updateDesign({
                          overlayOpacity: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-[#D4AF67]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#F5F1E8]/70">
                      Image Focal Position
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {(['left', 'top', 'center', 'bottom', 'right'] as ImagePosition[]).map(
                        (pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => updateDesign({ imagePosition: pos })}
                            className={`rounded border py-1 text-[11px] capitalize cursor-pointer ${
                              activeSlide.design.imagePosition === pos
                                ? 'border-[#D4AF67] bg-[#D4AF67]/20 text-white'
                                : 'border-white/10 bg-[#10243C] text-[#F5F1E8]/65'
                            }`}
                          >
                            {pos}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Bible Reference Settings */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="text-xs font-semibold text-white">
                    Bible Reference Settings
                  </div>

                  <label className="flex items-center justify-between text-xs text-[#F5F1E8]/80 cursor-pointer">
                    <span>Show Bible References</span>
                    <input
                      type="checkbox"
                      checked={activeSlide.design.showReferences}
                      onChange={(e) =>
                        updateDesign({ showReferences: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#D4AF67]"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-[#F5F1E8]/80 cursor-pointer">
                    <span>Show Slide Number</span>
                    <input
                      type="checkbox"
                      checked={activeSlide.design.showSlideNumber}
                      onChange={(e) =>
                        updateDesign({ showSlideNumber: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#D4AF67]"
                    />
                  </label>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#F5F1E8]/70">
                      Reference Display Style
                    </label>
                    <select
                      value={activeSlide.design.referenceStyle}
                      onChange={(e) =>
                        updateDesign({
                          referenceStyle: e.target.value as ReferenceStyle,
                        })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
                    >
                      <option value="gold-accent">Gold Line Underneath</option>
                      <option value="inline">Inline Dash Separator</option>
                      <option value="subtle-bar">Underlined Editorial Bar</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: DEDICATED AI BACKGROUND GENERATOR */}
            {inspectorTab === 'background' && (
              <>
                <div className="border-b border-white/10 pb-3">
                  <div className="text-xs font-semibold text-[#D4AF67]">
                    AI Background Studio · Slide{' '}
                    {String(activeSlide.order).padStart(2, '0')}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#F5F1E8]/60">
                    Backgrounds are strictly text-free 16:9 Biblical
                    environments. Swapping or uploading an image never alters
                    your editable scripture text.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#F5F1E8]/80">
                    Biblical Scene Visual Prompt
                  </label>
                  <textarea
                    rows={4}
                    value={activeSlide.background.prompt}
                    onChange={(e) =>
                      updateActiveSlide((s) => ({
                        ...s,
                        background: { ...s.background, prompt: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#10243C] p-2.5 text-xs leading-relaxed text-white focus:border-[#D4AF67] focus:outline-none"
                  />

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      disabled={aiBgLoading}
                      onClick={handleRefineArtDirection}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF67]/50 bg-[#D4AF67]/15 px-3 py-2 text-xs font-semibold text-[#ebd49d] hover:bg-[#D4AF67]/25 disabled:opacity-60 cursor-pointer"
                    >
                      {aiBgLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="h-3.5 w-3.5" />
                      )}
                      Refine Prompt With Gemini
                    </button>

                    <button
                      type="button"
                      disabled={aiBgLoading}
                      onClick={handleGenerateLiveImage}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#10243C] px-3 py-2 text-xs font-medium text-white hover:border-[#D4AF67]/50 disabled:opacity-60 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#D4AF67]" />
                      Generate Live AI Image
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF67] px-3 py-2 text-xs font-semibold text-[#081629] hover:bg-[#E2C27D] cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Custom Image
                    </button>
                  </div>
                </div>

                {aiBgNotice && (
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-200">
                    {aiBgNotice}
                  </div>
                )}

                {aiBgError && (
                  <div className="rounded-lg border border-amber-400/35 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                      <span>{aiBgError}</span>
                    </div>
                  </div>
                )}

                {/* Built-in 4K-style Studio Biblical Backdrop Library */}
                <div className="space-y-2.5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      Cinematic Biblical Library ({STUDIO_BACKDROPS.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {STUDIO_BACKDROPS.map((asset) => {
                      const active =
                        activeSlide.background.imageUrl === asset.imageUrl;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            updateActiveSlide((s) => ({
                              ...s,
                              background: {
                                ...s.background,
                                imageUrl: asset.imageUrl,
                                source: 'studio',
                                assetId: asset.id,
                              },
                            }));
                            setAiBgError(null);
                            setAiBgNotice(
                              `Applied "${asset.title}" to Slide ${String(activeSlide.order).padStart(2, '0')}.`
                            );
                          }}
                          className={`group overflow-hidden rounded-lg border text-left transition-colors cursor-pointer ${
                            active
                              ? 'border-[#D4AF67] bg-[#142B4B]'
                              : 'border-white/10 bg-[#10243C]/60 hover:border-[#D4AF67]/50'
                          }`}
                        >
                          <div className="aspect-video w-full overflow-hidden bg-[#081629]">
                            <img
                              src={asset.imageUrl}
                              alt={asset.title}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-2">
                            <div className="truncate text-[11px] font-semibold text-white">
                              {asset.title}
                            </div>
                            <div className="truncate text-[10px] text-[#F5F1E8]/55">
                              {asset.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* BOTTOM TOOLBAR */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D4AF67]/20 bg-[#0A182E] px-4 py-2">
        {/* Slide Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={() => onSelectSlide(Math.max(0, safeIndex - 1))}
            className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] hover:border-[#D4AF67]/50 disabled:opacity-35 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>

          <span className="px-2 font-mono text-xs font-semibold text-[#D4AF67] tabular-nums">
            {String(safeIndex + 1).padStart(2, '0')} /{' '}
            {String(project.slides.length).padStart(2, '0')}
          </span>

          <button
            type="button"
            disabled={safeIndex >= project.slides.length - 1}
            onClick={() =>
              onSelectSlide(Math.min(project.slides.length - 1, safeIndex + 1))
            }
            className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] hover:border-[#D4AF67]/50 disabled:opacity-35 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Zoom Out"
            onClick={() => setZoom((z) => Math.max(55, z - 15))}
            className="rounded-md p-1.5 text-[#F5F1E8]/75 hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-mono text-xs text-[#F5F1E8]/80 tabular-nums">
            {zoom}%
          </span>
          <button
            type="button"
            title="Zoom In"
            onClick={() => setZoom((z) => Math.min(145, z + 15))}
            className="rounded-md p-1.5 text-[#F5F1E8]/75 hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Fit to Screen"
            onClick={() => setZoom(100)}
            className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1 text-xs font-medium text-[#F5F1E8]/80 hover:border-[#D4AF67]/50 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="h-3 w-3" />
            Fit
          </button>
        </div>

        {/* Undo / Redo / Present */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canUndo}
            title="Undo"
            onClick={onUndo}
            className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] hover:border-[#D4AF67]/50 disabled:opacity-35 cursor-pointer"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            type="button"
            disabled={!canRedo}
            title="Redo"
            onClick={onRedo}
            className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] hover:border-[#D4AF67]/50 disabled:opacity-35 cursor-pointer"
          >
            <Redo2 className="h-3.5 w-3.5" />
            Redo
          </button>
          <button
            type="button"
            onClick={() => onPresent(0)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#D4AF67] px-3 py-1.5 text-xs font-semibold text-[#081629] hover:bg-[#E2C27D] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            Preview Presentation
          </button>
        </div>
      </footer>
    </div>
  );
};
