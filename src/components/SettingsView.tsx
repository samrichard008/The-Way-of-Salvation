import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  RefreshCw,
  Server,
  Upload,
} from 'lucide-react';
import type {
  LanguageCode,
  PresentationFormat,
  PresentationProject,
  StudioSettings,
  ThemeId,
} from '../types/presentation';
import { FONT_OPTIONS, LANGUAGE_META, STUDIO_THEMES } from '../data/themes';
import { fetchServerHealth, type ServerHealthStatus } from '../lib/aiClient';

interface SettingsViewProps {
  settings: StudioSettings;
  projects: PresentationProject[];
  onUpdateSettings: (next: StudioSettings) => void;
  onImportBackup: (imported: PresentationProject[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  projects,
  onUpdateSettings,
  onImportBackup,
}) => {
  const [health, setHealth] = useState<ServerHealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const checkServer = async () => {
    setHealthError(null);
    try {
      const status = await fetchServerHealth();
      setHealth(status);
    } catch (err: unknown) {
      setHealthError(
        err instanceof Error ? err.message : 'Unable to reach studio server.'
      );
    }
  };

  useEffect(() => {
    checkServer();
  }, []);

  const patchSettings = (patch: Partial<StudioSettings>) => {
    onUpdateSettings({ ...settings, ...patch });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  const handleDownloadBackup = () => {
    const payload = JSON.stringify(
      {
        studio: 'THE WAY OF SALVATION – AI Bible Presentation Studio',
        exportedAt: new Date().toISOString(),
        projects,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `way-of-salvation-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          projects?: PresentationProject[];
        };
        if (!Array.isArray(parsed.projects) || parsed.projects.length === 0) {
          setImportStatus('Invalid backup file: no presentation projects found.');
          return;
        }
        onImportBackup(parsed.projects);
        setImportStatus(
          `Imported ${parsed.projects.length} presentation project(s) into local storage.`
        );
      } catch {
        setImportStatus('Could not parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-8 px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF67]/20 pb-5">
        <div>
          <h1
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: '"Cinzel", Georgia, serif' }}
          >
            Studio Settings
          </h1>
          <p className="mt-1 text-sm text-[#F5F1E8]/65">
            Configure defaults for new presentations, typography, AI style
            direction, and export fidelity.
          </p>
        </div>

        {savedToast && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <Check className="h-4 w-4" />
            Settings saved
          </span>
        )}
      </div>

      {/* Presentation Defaults */}
      <section className="space-y-5 rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/75 p-6">
        <h2 className="text-base font-semibold text-white">
          Presentation Defaults
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F5F1E8]/75">
              Default Language
            </label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) =>
                patchSettings({ defaultLanguage: e.target.value as LanguageCode })
              }
              className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
            >
              {(['ta', 'en', 'si'] as LanguageCode[]).map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_META[code].nativeName} ({LANGUAGE_META[code].englishName})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F5F1E8]/75">
              Default Theme
            </label>
            <select
              value={settings.defaultThemeId}
              onChange={(e) =>
                patchSettings({ defaultThemeId: e.target.value as ThemeId })
              }
              className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
            >
              {STUDIO_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F5F1E8]/75">
              Default Slide Size
            </label>
            <select
              value={settings.defaultFormat}
              onChange={(e) =>
                patchSettings({
                  defaultFormat: e.target.value as PresentationFormat,
                })
              }
              className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
            >
              <option value="16:9">16:9 Full HD Widescreen</option>
              <option value="4:3">4:3 Standard Sanctuary Screen</option>
            </select>
          </div>
        </div>

        {/* Default Fonts per Language */}
        <div className="grid grid-cols-1 gap-5 border-t border-white/10 pt-5 md:grid-cols-3">
          {(['ta', 'en', 'si'] as LanguageCode[]).map((lang) => (
            <div key={lang} className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F5F1E8]/75">
                Default Font ({LANGUAGE_META[lang].nativeName})
              </label>
              <select
                value={settings.defaultFonts[lang]}
                onChange={(e) =>
                  patchSettings({
                    defaultFonts: {
                      ...settings.defaultFonts,
                      [lang]: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* AI Image & Server-Side Gemini Configuration */}
      <section className="space-y-5 rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/75 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              AI Design & Server-Side Gemini Integration
            </h2>
            <p className="mt-0.5 text-xs text-[#F5F1E8]/60">
              API credentials remain exclusively on the backend server via
              environment secrets and are never exposed in the browser.
            </p>
          </div>

          <button
            type="button"
            onClick={checkServer}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-[#F5F1E8] hover:border-[#D4AF67]/50 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Status
          </button>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#081629]/80 p-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Server className="h-4 w-4 text-[#D4AF67]" />
            <span>Server-Side Gemini API Status</span>
          </div>

          {healthError ? (
            <p className="mt-2 text-red-300">{healthError}</p>
          ) : health ? (
            <div className="mt-2.5 space-y-1.5 text-[#F5F1E8]/80">
              <div>
                Slide Design & Prompt Model:{' '}
                <span className="font-mono text-[#D4AF67]">
                  {health.textModel}
                </span>{' '}
                ·{' '}
                <span
                  className={
                    health.geminiConfigured
                      ? 'text-emerald-300'
                      : 'text-amber-300'
                  }
                >
                  {health.geminiConfigured
                    ? 'Connected via Server Secret'
                    : 'Awaiting GEMINI_API_KEY in Settings > Secrets'}
                </span>
              </div>
              <div className="text-[#F5F1E8]/65">
                {health.liveImageLimitationNote}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[#F5F1E8]/55">Checking server connection...</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F5F1E8]/75">
              AI Visual Style Preset
            </label>
            <select
              value={settings.aiStylePreset}
              onChange={(e) => patchSettings({ aiStylePreset: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
            >
              <option value="Christian Cinematic 4K">Christian Cinematic 4K</option>
              <option value="Classical Biblical Painting">Classical Biblical Painting</option>
              <option value="Warm Sanctuary Photography">Warm Sanctuary Photography</option>
              <option value="Epic Dramatic Light">Epic Dramatic Light</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#081629]/60 px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-white">
                High-Contrast Projector Scrim Guard
              </div>
              <div className="text-[11px] text-[#F5F1E8]/60">
                Keeps AI-generated slide overlays ≥ 50% opacity for sanctuary
                readability.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enforceHighContrastScrim}
              onChange={(e) =>
                patchSettings({ enforceHighContrastScrim: e.target.checked })
              }
              className="h-4 w-4 accent-[#D4AF67]"
            />
          </div>
        </div>
      </section>

      {/* Export Settings */}
      <section className="space-y-5 rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/75 p-6">
        <h2 className="text-base font-semibold text-white">Export Settings</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F5F1E8]/75">
              PowerPoint (.pptx) Mode
            </label>
            <select
              value={settings.pptxMode}
              onChange={(e) =>
                patchSettings({
                  pptxMode: e.target.value as 'editable' | 'visual',
                })
              }
              className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
            >
              <option value="editable">Editable Text Layers + HD Backdrops</option>
              <option value="visual">
                Exact Visual Fidelity (Best for Tamil/Sinhala PCs)
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F5F1E8]/75">
              PNG / PDF Export Resolution
            </label>
            <select
              value={settings.pngScale}
              onChange={(e) =>
                patchSettings({ pngScale: Number(e.target.value) as 1 | 2 })
              }
              className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
            >
              <option value={1}>Full HD (1920 × 1080)</option>
              <option value={2}>Ultra HD 4K (3840 × 2160)</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#081629]/60 px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-white">
                Include Church Footer
              </div>
              <div className="text-[11px] text-[#F5F1E8]/60">
                Show church name & slide counter
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.includeChurchFooter}
              onChange={(e) =>
                patchSettings({ includeChurchFooter: e.target.checked })
              }
              className="h-4 w-4 accent-[#D4AF67]"
            />
          </div>
        </div>
      </section>

      {/* Local Project Backup */}
      <section className="space-y-4 rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/75 p-6">
        <h2 className="text-base font-semibold text-white">
          Local Storage Backup & Restore
        </h2>
        <p className="text-xs text-[#F5F1E8]/65">
          Download all your presentations as a portable JSON backup or restore
          them on another church computer.
        </p>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF67] px-4 py-2 text-xs font-semibold text-[#081629] hover:bg-[#E2C27D] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export Studio Backup (.json)
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-[#F5F1E8] hover:border-[#D4AF67]/50 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-[#D4AF67]" />
            Restore From Backup
          </button>
        </div>

        {importStatus && (
          <p className="text-xs text-[#D4AF67]">{importStatus}</p>
        )}
      </section>
    </div>
  );
};
