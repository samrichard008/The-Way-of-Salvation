import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Edit3,
  Loader2,
  Play,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import type {
  PresentationProject,
  Slide,
  SlideLayoutId,
  StudioSettings,
  OverlayGradientStyle,
  TextAlignment,
  SpacingDensity,
  ReferenceStyle,
  ImagePosition,
} from '../types/presentation';
import { LANGUAGE_META, getThemeById } from '../data/themes';
import {
  generateSlideAIDesign,
  requestAIBackgroundArtDirection,
} from '../lib/aiClient';
import { SlideCanvas } from './SlideCanvas';

interface AIDesignStudioViewProps {
  project: PresentationProject | null;
  settings: StudioSettings;
  onUpdateProject: (updated: PresentationProject) => void;
  onOpenSlideInEditor: (slideIndex: number) => void;
  onPresentSlide: (slideIndex: number) => void;
  onCreateNew: () => void;
}

export const AIDesignStudioView: React.FC<AIDesignStudioViewProps> = ({
  project,
  settings,
  onUpdateProject,
  onOpenSlideInEditor,
  onPresentSlide,
  onCreateNew,
}) => {
  const [busySlideId, setBusySlideId] = useState<string | null>(null);
  const [busyMode, setBusyMode] = useState<'design' | 'prompt' | null>(null);
  const [errorBySlide, setErrorBySlide] = useState<Record<string, string>>({});
  const [uploadTargetSlideId, setUploadTargetSlideId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-[#D4AF67]" />
        <h2 className="mt-4 text-xl font-semibold text-white">
          No Active Presentation
        </h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">
          Create a presentation first to use per-slide Gemini AI design and
          Biblical background art direction.
        </p>
        <button
          type="button"
          onClick={onCreateNew}
          className="mt-6 rounded-lg bg-[#D4AF67] px-5 py-2.5 text-sm font-semibold text-[#081629] hover:bg-[#E2C27D] cursor-pointer"
        >
          Create New Presentation
        </button>
      </div>
    );
  }

  const theme = getThemeById(project.themeId);
  const lang = project.activeLanguage;

  const updateSingleSlide = (slideId: string, updater: (s: Slide) => Slide) => {
    const nextSlides = project.slides.map((s) =>
      s.id === slideId
        ? { ...updater(s), lastUpdated: new Date().toISOString() }
        : s
    );
    onUpdateProject({
      ...project,
      slides: nextSlides,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleGenerateSingleSlideDesign = async (slide: Slide) => {
    setBusySlideId(slide.id);
    setBusyMode('design');
    setErrorBySlide((prev) => ({ ...prev, [slide.id]: '' }));

    try {
      const result = await generateSlideAIDesign({
        slide,
        language: lang,
        themeName: theme.name,
      });
      const d = result.design;
      updateSingleSlide(slide.id, (s) => ({
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
      setErrorBySlide((prev) => ({
        ...prev,
        [slide.id]:
          err instanceof Error ? err.message : 'AI design generation failed.',
      }));
    } finally {
      setBusySlideId(null);
      setBusyMode(null);
    }
  };

  const handleRefineSinglePrompt = async (slide: Slide) => {
    setBusySlideId(slide.id);
    setBusyMode('prompt');
    setErrorBySlide((prev) => ({ ...prev, [slide.id]: '' }));

    try {
      const result = await requestAIBackgroundArtDirection({
        slideNumber: slide.order,
        subject: slide.content[lang].title,
        visualDescription: slide.background.prompt,
        stylePreset: settings.aiStylePreset,
        mode: 'prompt',
      });
      updateSingleSlide(slide.id, (s) => ({
        ...s,
        background: {
          ...s.background,
          prompt: result.enhancedPrompt,
        },
      }));
    } catch (err: unknown) {
      setErrorBySlide((prev) => ({
        ...prev,
        [slide.id]:
          err instanceof Error ? err.message : 'Prompt refinement failed.',
      }));
    } finally {
      setBusySlideId(null);
      setBusyMode(null);
    }
  };

  const handleUploadForSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetSlideId) return;
    const targetId = uploadTargetSlideId;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      updateSingleSlide(targetId, (s) => ({
        ...s,
        background: {
          ...s.background,
          imageUrl: dataUrl,
          source: 'upload',
          assetId: undefined,
        },
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setUploadTargetSlideId(null);
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 px-6 py-8 lg:px-10">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUploadForSlide}
        className="hidden"
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF67]/20 pb-5">
        <div>
          <h1
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: '"Cinzel", Georgia, serif' }}
          >
            AI Design Studio
          </h1>
          <p className="mt-1 text-sm text-[#F5F1E8]/65">
            Project: <span className="text-white">{project.title}</span> ·{' '}
            {LANGUAGE_META[lang].nativeName} · Each slide generates
            independently so no other slide is ever overwritten.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {project.slides.map((slide, idx) => {
          const isBusy = busySlideId === slide.id;
          const err = errorBySlide[slide.id];
          const localized = slide.content[lang];

          return (
            <article
              key={slide.id}
              className="overflow-hidden rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/80"
            >
              <div className="border-b border-[#D4AF67]/15">
                <SlideCanvas
                  slide={slide}
                  language={lang}
                  format={project.format}
                  totalSlides={project.slides.length}
                  churchAuthor={
                    settings.includeChurchFooter ? project.author : undefined
                  }
                  includeFooter={settings.includeChurchFooter}
                />
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs font-semibold text-[#D4AF67] tabular-nums">
                      Slide {String(slide.order).padStart(2, '0')} ·{' '}
                      {slide.design.layout}
                    </div>
                    <h2 className="mt-0.5 text-base font-semibold text-white">
                      {localized.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Open in Slide Editor"
                      onClick={() => onOpenSlideInEditor(idx)}
                      className="rounded-lg border border-white/15 p-2 text-[#F5F1E8]/75 hover:border-[#D4AF67] hover:text-white cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Preview this slide"
                      onClick={() => onPresentSlide(idx)}
                      className="rounded-lg border border-white/15 p-2 text-[#F5F1E8]/75 hover:border-[#D4AF67] hover:text-white cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-[#F5F1E8]/65">
                  <span className="font-medium text-[#F5F1E8]/85">
                    Visual Prompt:
                  </span>{' '}
                  {slide.background.prompt}
                </p>

                {slide.aiDesignRationale && (
                  <p className="rounded-lg border border-[#D4AF67]/20 bg-[#081629]/60 px-3 py-2 text-xs text-[#F5F1E8]/80">
                    {slide.aiDesignRationale}
                  </p>
                )}

                {err && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-2.5 text-xs text-red-200">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleGenerateSingleSlideDesign(slide)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF67] px-3 py-1.5 text-xs font-semibold text-[#081629] hover:bg-[#E2C27D] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isBusy && busyMode === 'design' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Generate AI Design
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleRefineSinglePrompt(slide)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-[#F5F1E8] hover:border-[#D4AF67]/50 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isBusy && busyMode === 'prompt' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5 text-[#D4AF67]" />
                    )}
                    Refine Art Prompt
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadTargetSlideId(slide.id);
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-[#F5F1E8] hover:border-[#D4AF67]/50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 text-[#D4AF67]" />
                    Upload BG
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
