import React, { useMemo, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { LanguageCode, ThemeId } from '../types/presentation';
import { STUDIO_THEMES } from '../data/themes';
import { createSlideFromBlueprint } from '../data/salvationContent';
import { SlideCanvas } from './SlideCanvas';

interface TemplatesViewProps {
  onUseTemplate: (themeId: ThemeId) => void;
  onApplyThemeToActive?: (themeId: ThemeId) => void;
  activeProjectTitle?: string;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  onUseTemplate,
  onApplyThemeToActive,
  activeProjectTitle,
}) => {
  const [previewLang, setPreviewLang] = useState<LanguageCode>('en');
  const [previewSlideOrder, setPreviewSlideOrder] = useState<number>(5);
  const [appliedThemeId, setAppliedThemeId] = useState<ThemeId | null>(null);

  const previewSlides = useMemo(() => {
    const map: Record<string, ReturnType<typeof createSlideFromBlueprint>> = {};
    for (const theme of STUDIO_THEMES) {
      map[theme.id] = createSlideFromBlueprint(
        previewSlideOrder,
        theme.id,
        `tpl-${theme.id}`
      );
    }
    return map;
  }, [previewSlideOrder]);

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF67]/20 pb-5">
        <div>
          <h1
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: '"Cinzel", Georgia, serif' }}
          >
            Sanctuary Presentation Themes
          </h1>
          <p className="mt-1 text-sm text-[#F5F1E8]/65">
            Preview all 6 Christian presentation themes live across Tamil,
            English, and Sinhala.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-[#D4AF67]/20 bg-[#10243C] p-1">
            {([1, 5, 9] as const).map((ord) => (
              <button
                key={ord}
                type="button"
                onClick={() => setPreviewSlideOrder(ord)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  previewSlideOrder === ord
                    ? 'bg-[#D4AF67] text-[#081629]'
                    : 'text-[#F5F1E8]/70 hover:text-white'
                }`}
              >
                {ord === 1 ? 'Slide 01' : ord === 5 ? 'Slide 05' : 'Slide 09 Prayer'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[#D4AF67]/20 bg-[#10243C] p-1">
            {(['ta', 'en', 'si'] as LanguageCode[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setPreviewLang(lang)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  previewLang === lang
                    ? 'bg-[#D4AF67] text-[#081629]'
                    : 'text-[#F5F1E8]/70 hover:text-white'
                }`}
              >
                {lang === 'ta' ? 'தமிழ்' : lang === 'si' ? 'සිංහල' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {STUDIO_THEMES.map((theme) => {
          const sampleSlide = previewSlides[theme.id];
          const justApplied = appliedThemeId === theme.id;

          return (
            <div
              key={theme.id}
              className="overflow-hidden rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/80"
            >
              <div className="border-b border-[#D4AF67]/15">
                <SlideCanvas
                  slide={sampleSlide}
                  language={previewLang}
                  format="16:9"
                  totalSlides={10}
                  churchAuthor="Sanctuary Media Ministry"
                />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-white">
                    {theme.name}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    {theme.previewSwatches.map((hex, i) => (
                      <span
                        key={i}
                        className="h-4 w-6 rounded border border-white/20"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-1.5 text-sm leading-relaxed text-[#F5F1E8]/65">
                  {theme.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => onUseTemplate(theme.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF67] px-4 py-2 text-xs font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Create With Theme
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {onApplyThemeToActive && activeProjectTitle && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyThemeToActive(theme.id);
                        setAppliedThemeId(theme.id);
                        setTimeout(() => setAppliedThemeId(null), 2400);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67]/60 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {justApplied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#D4AF67]" />
                          Applied to Active Project
                        </>
                      ) : (
                        <>Apply to Current Project</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
