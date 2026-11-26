import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  RotateCcw,
  X,
} from 'lucide-react';
import type {
  LanguageCode,
  PresentationProject,
  StudioSettings,
} from '../types/presentation';
import { LANGUAGE_META } from '../data/themes';
import { SlideCanvas } from './SlideCanvas';

interface PresentationPlayerProps {
  project: PresentationProject;
  settings: StudioSettings;
  initialSlideIndex?: number;
  onExit: () => void;
}

export const PresentationPlayer: React.FC<PresentationPlayerProps> = ({
  project,
  settings,
  initialSlideIndex = 0,
  onExit,
}) => {
  const [slideIndex, setSlideIndex] = useState(
    Math.min(Math.max(initialSlideIndex, 0), Math.max(project.slides.length - 1, 0))
  );
  const [language, setLanguage] = useState<LanguageCode>(project.activeLanguage);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const playerRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const totalSlides = project.slides.length;
  const activeSlide = project.slides[slideIndex];

  const goNext = useCallback(() => {
    setSlideIndex((i) => Math.min(totalSlides - 1, i + 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => Math.max(0, i - 1));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && playerRef.current) {
        await playerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be restricted in nested iframes; stay in full-viewport modal gracefully
    }
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 3200);
  }, []);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [revealControls]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      revealControls();
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setSlideIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setSlideIndex(totalSlides - 1);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => undefined);
        }
        onExit();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onExit, revealControls, toggleFullscreen, totalSlides]);

  if (!activeSlide) return null;

  return (
    <div
      ref={playerRef}
      onMouseMove={revealControls}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none"
    >
      {/* Projector Slide Stage */}
      <div
        onClick={goNext}
        className="flex h-full w-full cursor-pointer items-center justify-center p-0 sm:p-4"
      >
        <div
          className={`w-full ${
            project.format === '16:9'
              ? 'max-w-[min(100vw,calc(100vh*16/9))]'
              : 'max-w-[min(100vw,calc(100vh*4/3))]'
          }`}
        >
          <SlideCanvas
            slide={activeSlide}
            language={language}
            format={project.format}
            totalSlides={totalSlides}
            churchAuthor={
              settings.includeChurchFooter ? project.author : undefined
            }
            includeFooter={settings.includeChurchFooter}
          />
        </div>
      </div>

      {/* Auto-Hiding Sanctuary Projection Controls */}
      <div
        className={`fixed inset-x-0 bottom-5 z-20 flex justify-center px-4 transition-opacity duration-200 ${
          controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#D4AF67]/35 bg-[#081629]/92 px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            title="Start from Slide 01"
            onClick={(e) => {
              e.stopPropagation();
              setSlideIndex(0);
            }}
            className="rounded-lg p-2 text-[#F5F1E8]/80 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={slideIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:border-[#D4AF67] disabled:opacity-35 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <span className="px-3 font-mono text-sm font-semibold text-[#D4AF67] tabular-nums">
            {String(slideIndex + 1).padStart(2, '0')} /{' '}
            {String(totalSlides).padStart(2, '0')}
          </span>

          <button
            type="button"
            disabled={slideIndex >= totalSlides - 1}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:border-[#D4AF67] disabled:opacity-35 cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-white/15" />

          {/* Live Trilingual Switcher for Multilingual Services */}
          <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-black/35 p-0.5">
            {(['ta', 'en', 'si'] as LanguageCode[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguage(lang);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  language === lang
                    ? 'bg-[#D4AF67] text-[#081629]'
                    : 'text-[#F5F1E8]/75 hover:text-white'
                }`}
              >
                {LANGUAGE_META[lang].nativeName}
              </button>
            ))}
          </div>

          <div className="mx-1 h-5 w-px bg-white/15" />

          <button
            type="button"
            title="Toggle Fullscreen (F)"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="rounded-lg p-2 text-[#F5F1E8]/80 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            title="Exit Presentation (Esc)"
            onClick={(e) => {
              e.stopPropagation();
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => undefined);
              }
              onExit();
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-red-600/85 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};
