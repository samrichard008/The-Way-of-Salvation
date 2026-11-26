import React, { useState } from 'react';
import { ArrowLeft, Check, Monitor, Plus } from 'lucide-react';
import type {
  LanguageCode,
  PresentationFormat,
  ProjectLanguageMode,
  StudioSettings,
  ThemeId,
} from '../types/presentation';
import { STUDIO_THEMES } from '../data/themes';

interface NewPresentationViewProps {
  settings: StudioSettings;
  initialThemeId?: ThemeId;
  onCancel: () => void;
  onCreate: (payload: {
    title: string;
    subtitle: string;
    author: string;
    languageMode: ProjectLanguageMode;
    activeLanguage: LanguageCode;
    slideCount: number;
    format: PresentationFormat;
    themeId: ThemeId;
  }) => void;
}

const LANGUAGE_CHOICES: Array<{
  value: ProjectLanguageMode;
  label: string;
  sublabel: string;
}> = [
  { value: 'ta', label: 'Tamil (தமிழ்)', sublabel: 'Noto Sans Tamil typography' },
  { value: 'en', label: 'English', sublabel: 'Classic & modern English' },
  { value: 'si', label: 'Sinhala (සිංහල)', sublabel: 'Noto Sans Sinhala typography' },
  {
    value: 'all',
    label: 'All Three Languages',
    sublabel: 'Independent Tamil, English & Sinhala editions',
  },
];

export const NewPresentationView: React.FC<NewPresentationViewProps> = ({
  settings,
  initialThemeId,
  onCancel,
  onCreate,
}) => {
  const [title, setTitle] = useState('The Way of Salvation');
  const [subtitle, setSubtitle] = useState(
    'Present the Word. Share the Truth. Transform Lives.'
  );
  const [author, setAuthor] = useState('Grace Covenant Church');
  const [languageMode, setLanguageMode] = useState<ProjectLanguageMode>('all');
  const [slideCount, setSlideCount] = useState(10);
  const [format, setFormat] = useState<PresentationFormat>(settings.defaultFormat);
  const [themeId, setThemeId] = useState<ThemeId>(
    initialThemeId ?? settings.defaultThemeId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeLanguage: LanguageCode =
      languageMode === 'all' ? settings.defaultLanguage : languageMode;

    onCreate({
      title: title.trim() || 'The Way of Salvation',
      subtitle: subtitle.trim(),
      author: author.trim() || 'Ministry Media Team',
      languageMode,
      activeLanguage,
      slideCount,
      format,
      themeId,
    });
  };

  return (
    <div className="mx-auto max-w-[1040px] px-6 py-8 lg:px-10">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#F5F1E8]/70 transition-colors hover:text-[#D4AF67] cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="mt-5 border-b border-[#D4AF67]/20 pb-6">
        <h1
          className="text-2xl font-bold text-white sm:text-3xl"
          style={{ fontFamily: '"Cinzel", Georgia, serif' }}
        >
          Create New Presentation
        </h1>
        <p className="mt-1.5 text-sm text-[#F5F1E8]/70">
          Configure your 10-slide theological structure, language edition,
          projector aspect ratio, and sanctuary visual theme.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Presentation Details */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="proj-title"
              className="block text-sm font-medium text-[#F5F1E8]"
            >
              Presentation Title
            </label>
            <input
              id="proj-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Way of Salvation — Sunday Evangelism"
              className="w-full rounded-lg border border-[#D4AF67]/25 bg-[#10243C] px-4 py-2.5 text-sm text-white placeholder-[#F5F1E8]/35 focus:border-[#D4AF67] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="proj-author"
              className="block text-sm font-medium text-[#F5F1E8]"
            >
              Author / Church Name
            </label>
            <input
              id="proj-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g., Pastor David / New Life Assembly"
              className="w-full rounded-lg border border-[#D4AF67]/25 bg-[#10243C] px-4 py-2.5 text-sm text-white placeholder-[#F5F1E8]/35 focus:border-[#D4AF67] focus:outline-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="proj-subtitle"
              className="block text-sm font-medium text-[#F5F1E8]"
            >
              Subtitle / Occasion
            </label>
            <input
              id="proj-subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Present the Word. Share the Truth. Transform Lives."
              className="w-full rounded-lg border border-[#D4AF67]/25 bg-[#10243C] px-4 py-2.5 text-sm text-white placeholder-[#F5F1E8]/35 focus:border-[#D4AF67] focus:outline-none"
            />
          </div>
        </section>

        {/* Language Mode */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Language Edition</h2>
            <p className="text-xs text-[#F5F1E8]/60">
              All three languages remain independently editable inside the Slide
              Editor with zero language mixing.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LANGUAGE_CHOICES.map((choice) => {
              const selected = languageMode === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => setLanguageMode(choice.value)}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'border-[#D4AF67] bg-[#163152]'
                      : 'border-[#D4AF67]/20 bg-[#10243C]/65 hover:border-[#D4AF67]/45'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {choice.label}
                    </span>
                    {selected && <Check className="h-4 w-4 text-[#D4AF67] shrink-0" />}
                  </div>
                  <span className="mt-1 text-xs text-[#F5F1E8]/60">
                    {choice.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Format & Slide Count */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white">
              Presentation Format
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(['16:9', '4:3'] as PresentationFormat[]).map((fmt) => {
                const selected = format === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#D4AF67] bg-[#163152]'
                        : 'border-[#D4AF67]/20 bg-[#10243C]/65 hover:border-[#D4AF67]/45'
                    }`}
                  >
                    <Monitor className="h-5 w-5 text-[#D4AF67] shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {fmt === '16:9' ? '16:9 Full HD' : '4:3 Standard'}
                      </div>
                      <div className="text-xs text-[#F5F1E8]/60">
                        {fmt === '16:9' ? 'Widescreen projector' : 'Classic hall screen'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="slide-count"
                className="text-sm font-semibold text-white"
              >
                Slide Count
              </label>
              <span className="font-mono text-sm font-semibold text-[#D4AF67] tabular-nums">
                {slideCount} slides
              </span>
            </div>
            <div className="rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/65 p-4">
              <input
                id="slide-count"
                type="range"
                min={1}
                max={15}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full accent-[#D4AF67] cursor-pointer"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-[#F5F1E8]/60">
                <span>1 slide</span>
                <span className="text-[#D4AF67]">
                  Default 10: Complete Way of Salvation sequence
                </span>
                <span>15 slides</span>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Selection */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Visual Theme</h2>
            <p className="text-xs text-[#F5F1E8]/60">
              Each slide still receives its own unique Biblical background image
              and can be customized individually.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STUDIO_THEMES.map((theme) => {
              const selected = themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeId(theme.id)}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'border-[#D4AF67] bg-[#163152]'
                      : 'border-[#D4AF67]/20 bg-[#10243C]/65 hover:border-[#D4AF67]/45'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">
                        {theme.name}
                      </span>
                      {selected && <Check className="h-4 w-4 text-[#D4AF67]" />}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#F5F1E8]/65">
                      {theme.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {theme.previewSwatches.map((hex, i) => (
                      <span
                        key={i}
                        className="h-5 w-8 rounded border border-white/20"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                    <span className="ml-auto text-[11px] text-[#F5F1E8]/55">
                      {theme.defaults.fontFamily}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#D4AF67]/20 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-[#F5F1E8] transition-colors hover:bg-white/5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF67] px-6 py-2.5 text-sm font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Presentation
          </button>
        </div>
      </form>
    </div>
  );
};
