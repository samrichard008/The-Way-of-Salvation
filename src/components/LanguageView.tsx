import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Edit3, Languages } from 'lucide-react';
import type {
  LanguageCode,
  PresentationProject,
  SlideLanguageContent,
} from '../types/presentation';
import { LANGUAGE_META } from '../data/themes';

interface LanguageViewProps {
  project: PresentationProject | null;
  onUpdateProject: (updated: PresentationProject) => void;
  onOpenSlideInEditor: (slideIndex: number) => void;
  onCreateNew: () => void;
}

export const LanguageView: React.FC<LanguageViewProps> = ({
  project,
  onUpdateProject,
  onOpenSlideInEditor,
  onCreateNew,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <Languages className="mx-auto h-10 w-10 text-[#D4AF67]" />
        <h2 className="mt-4 text-xl font-semibold text-white">
          No Active Presentation
        </h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">
          Create a presentation to manage Tamil, English, and Sinhala content
          independently.
        </p>
        <button
          type="button"
          onClick={onCreateNew}
          className="mt-6 rounded-lg bg-[#D4AF67] px-5 py-2.5 text-sm font-semibold text-[#081629] hover:bg-[#E2C27D] cursor-pointer"
        >
          Create Presentation
        </button>
      </div>
    );
  }

  const safeIdx = Math.min(selectedIdx, project.slides.length - 1);
  const slide = project.slides[safeIdx];

  const updateSlideLanguage = (
    lang: LanguageCode,
    patch: Partial<SlideLanguageContent>
  ) => {
    const nextSlides = project.slides.map((s, idx) =>
      idx === safeIdx
        ? {
            ...s,
            content: {
              ...s.content,
              [lang]: { ...s.content[lang], ...patch },
            },
            lastUpdated: new Date().toISOString(),
          }
        : s
    );
    onUpdateProject({
      ...project,
      slides: nextSlides,
      updatedAt: new Date().toISOString(),
    });
  };

  const updatePointText = (
    lang: LanguageCode,
    pointId: string,
    field: 'label' | 'reference',
    value: string
  ) => {
    const current = slide.content[lang];
    updateSlideLanguage(lang, {
      points: current.points.map((pt) =>
        pt.id === pointId ? { ...pt, [field]: value } : pt
      ),
    });
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF67]/20 pb-5">
        <div>
          <h1
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: '"Cinzel", Georgia, serif' }}
          >
            Trilingual Language Management
          </h1>
          <p className="mt-1 text-sm text-[#F5F1E8]/65">
            Edit Tamil (தமிழ்), English, and Sinhala (සිංහල) versions side by
            side. Languages are stored independently and never mixed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#F5F1E8]/60">Active Preview Language:</span>
          <div className="flex items-center gap-1 rounded-lg border border-[#D4AF67]/25 bg-[#10243C] p-1">
            {(['ta', 'en', 'si'] as LanguageCode[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() =>
                  onUpdateProject({ ...project, activeLanguage: lang })
                }
                className={`rounded-md px-3 py-1 text-xs font-semibold cursor-pointer ${
                  project.activeLanguage === lang
                    ? 'bg-[#D4AF67] text-[#081629]'
                    : 'text-[#F5F1E8]/75 hover:text-white'
                }`}
              >
                {LANGUAGE_META[lang].nativeName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slide Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {project.slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                idx === safeIdx
                  ? 'border-[#D4AF67] bg-[#D4AF67] text-[#081629]'
                  : 'border-white/12 bg-[#10243C]/70 text-[#F5F1E8]/80 hover:border-[#D4AF67]/45'
              }`}
            >
              {String(s.order).padStart(2, '0')}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onOpenSlideInEditor(safeIdx)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF67]/40 px-3.5 py-1.5 text-xs font-semibold text-[#D4AF67] hover:bg-[#D4AF67]/15 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Open Slide {String(slide.order).padStart(2, '0')} in Canvas Editor
        </button>
      </div>

      {/* 3-Column Independent Language Editors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {(['ta', 'en', 'si'] as LanguageCode[]).map((lang) => {
          const data = slide.content[lang];
          const meta = LANGUAGE_META[lang];
          const fontClass =
            lang === 'ta'
              ? 'font-lang-ta'
              : lang === 'si'
              ? 'font-lang-si'
              : 'font-lang-en';

          return (
            <section
              key={lang}
              className={`flex flex-col space-y-4 rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/75 p-5 ${fontClass}`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {meta.nativeName}
                  </h2>
                  <p className="text-xs text-[#F5F1E8]/55">
                    {meta.englishName} · {meta.defaultFont}
                  </p>
                </div>

                {data.needsTranslationReview ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateSlideLanguage(lang, { needsTranslationReview: false })
                    }
                    title="Click to confirm scripture/prayer wording verified"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200 cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Verify wording
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#F5F1E8]/65">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={data.title}
                    onChange={(e) =>
                      updateSlideLanguage(lang, { title: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-sm font-semibold text-white focus:border-[#D4AF67] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#F5F1E8]/65">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={data.subtitle}
                    onChange={(e) =>
                      updateSlideLanguage(lang, { subtitle: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
                  />
                </div>

                {slide.isPrayerSlide ? (
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#F5F1E8]/65">
                      Acceptance Prayer
                    </label>
                    <textarea
                      rows={12}
                      value={data.prayerText ?? ''}
                      onChange={(e) =>
                        updateSlideLanguage(lang, { prayerText: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#081629] p-3 text-xs leading-relaxed text-white focus:border-[#D4AF67] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div className="text-[11px] font-semibold text-[#D4AF67]">
                      Points & Scripture References ({data.points.length})
                    </div>
                    {data.points.map((pt, idx) => (
                      <div
                        key={pt.id}
                        className="space-y-1.5 rounded-lg border border-white/10 bg-[#081629]/75 p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-[#D4AF67] tabular-nums">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <input
                            type="text"
                            value={pt.label}
                            onChange={(e) =>
                              updatePointText(lang, pt.id, 'label', e.target.value)
                            }
                            className="w-full bg-transparent text-xs font-medium text-white focus:outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          value={pt.reference}
                          onChange={(e) =>
                            updatePointText(lang, pt.id, 'reference', e.target.value)
                          }
                          placeholder="Bible reference"
                          className="w-full border-t border-white/8 bg-transparent pt-1 text-[11px] text-[#D4AF67] placeholder-[#F5F1E8]/30 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
