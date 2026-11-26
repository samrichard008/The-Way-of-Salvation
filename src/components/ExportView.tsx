import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import type {
  ExportHistoryEntry,
  LanguageCode,
  PresentationProject,
  StudioSettings,
} from '../types/presentation';
import { LANGUAGE_META } from '../data/themes';
import {
  exportProjectPDF,
  exportProjectPPTX,
  exportProjectZIP,
  exportSingleSlidePNG,
  type ExportProgress,
} from '../lib/exporter';

interface ExportViewProps {
  projects: PresentationProject[];
  activeProjectId: string | null;
  exportHistory: ExportHistoryEntry[];
  settings: StudioSettings;
  onLogExport: (entry: Omit<ExportHistoryEntry, 'id' | 'exportedAt'>) => void;
  onClearHistory: () => void;
  onCreateNew: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  projects,
  activeProjectId,
  exportHistory,
  settings,
  onLogExport,
  onClearHistory,
  onCreateNew,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjectId ?? projects[0]?.id ?? ''
  );
  const [languageScope, setLanguageScope] = useState<LanguageCode | 'all'>('en');
  const [singleSlideIndex, setSingleSlideIndex] = useState(0);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const project =
    projects.find((p) => p.id === selectedProjectId) ?? projects[0] ?? null;

  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <Download className="mx-auto h-10 w-10 text-[#D4AF67]" />
        <h2 className="mt-4 text-xl font-semibold text-white">
          No Presentations to Export
        </h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">
          Create a 10-slide presentation first to export PowerPoint, PDF, PNG, or
          ZIP packages.
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

  const targetLanguages: LanguageCode[] =
    languageScope === 'all' ? ['ta', 'en', 'si'] : [languageScope];

  const isBusy = progress !== null;

  const runExport = async (format: 'pptx' | 'pdf' | 'png' | 'zip') => {
    setError(null);
    setSuccessMessage(null);

    try {
      if (format === 'pptx') {
        const exportedFiles: string[] = [];
        for (const lang of targetLanguages) {
          const fileName = await exportProjectPPTX({
            project,
            language: lang,
            settings,
            onProgress: setProgress,
          });
          exportedFiles.push(fileName);
        }
        onLogExport({
          projectId: project.id,
          projectTitle: project.title,
          format: 'pptx',
          languageScope,
          slideCount: project.slides.length * targetLanguages.length,
          fileName: exportedFiles.join(', '),
        });
        setSuccessMessage(
          `Exported PowerPoint (${exportedFiles.length} file${exportedFiles.length > 1 ? 's' : ''}) successfully.`
        );
      } else if (format === 'pdf') {
        const exportedFiles: string[] = [];
        for (const lang of targetLanguages) {
          const fileName = await exportProjectPDF({
            project,
            language: lang,
            settings,
            onProgress: setProgress,
          });
          exportedFiles.push(fileName);
        }
        onLogExport({
          projectId: project.id,
          projectTitle: project.title,
          format: 'pdf',
          languageScope,
          slideCount: project.slides.length * targetLanguages.length,
          fileName: exportedFiles.join(', '),
        });
        setSuccessMessage(
          `Exported PDF (${exportedFiles.length} file${exportedFiles.length > 1 ? 's' : ''}) successfully.`
        );
      } else if (format === 'png') {
        const safeIdx = Math.min(singleSlideIndex, project.slides.length - 1);
        const slide = project.slides[safeIdx];
        const exportedFiles: string[] = [];
        for (let i = 0; i < targetLanguages.length; i++) {
          const lang = targetLanguages[i];
          setProgress({
            current: i + 1,
            total: targetLanguages.length,
            label: `Rendering Slide ${String(slide.order).padStart(2, '0')} (${LANGUAGE_META[lang].englishName})`,
          });
          const fileName = await exportSingleSlidePNG({
            project,
            slide,
            language: lang,
            settings,
          });
          exportedFiles.push(fileName);
        }
        onLogExport({
          projectId: project.id,
          projectTitle: project.title,
          format: 'png',
          languageScope,
          slideCount: targetLanguages.length,
          fileName: exportedFiles.join(', '),
        });
        setSuccessMessage(`Downloaded PNG (${exportedFiles.join(', ')}).`);
      } else if (format === 'zip') {
        const fileName = await exportProjectZIP({
          project,
          languages: targetLanguages,
          settings,
          onProgress: setProgress,
        });
        onLogExport({
          projectId: project.id,
          projectTitle: project.title,
          format: 'zip',
          languageScope,
          slideCount: project.slides.length * targetLanguages.length,
          fileName,
        });
        setSuccessMessage(`Downloaded ZIP archive (${fileName}).`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed. Please retry.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1260px] space-y-8 px-6 py-8 lg:px-10">
      <div className="border-b border-[#D4AF67]/20 pb-5">
        <h1
          className="text-2xl font-bold text-white sm:text-3xl"
          style={{ fontFamily: '"Cinzel", Georgia, serif' }}
        >
          Export Centre & History
        </h1>
        <p className="mt-1 text-sm text-[#F5F1E8]/65">
          Export high-resolution 16:9 / 4:3 church presentations in PowerPoint,
          PDF, PNG, or multi-language ZIP packages.
        </p>
      </div>

      {/* Export Scope Controls */}
      <section className="grid grid-cols-1 gap-5 rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/75 p-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#D4AF67]">
            Presentation to Export
          </label>
          <select
            value={project.id}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSingleSlideIndex(0);
            }}
            className="w-full rounded-lg border border-white/15 bg-[#081629] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF67] focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.slides.length} slides · {p.format})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#D4AF67]">
            Language Version
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                { id: 'ta', label: 'தமிழ்' },
                { id: 'en', label: 'English' },
                { id: 'si', label: 'සිංහල' },
                { id: 'all', label: 'All 3 Versions' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLanguageScope(opt.id)}
                className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  languageScope === opt.id
                    ? 'border-[#D4AF67] bg-[#D4AF67] text-[#081629]'
                    : 'border-white/15 bg-[#081629] text-[#F5F1E8]/80 hover:border-[#D4AF67]/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Progress & Status Messages */}
      {progress && (
        <div className="rounded-xl border border-[#D4AF67]/35 bg-[#10243C] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-white">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF67]" />
              {progress.label}
            </span>
            <span className="font-mono text-[#D4AF67] tabular-nums">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#081629]">
            <div
              className="h-full bg-[#D4AF67] transition-all duration-150"
              style={{
                width: `${Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Working Export Format Cards */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 1. PowerPoint (.pptx) */}
        <div className="flex flex-col justify-between rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/80 p-6">
          <div>
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="h-6 w-6 text-[#D4AF67]" />
              <span className="font-mono text-xs text-[#F5F1E8]/55">
                .PPTX · {settings.pptxMode === 'editable' ? 'Editable Text' : 'Visual Fidelity'}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">
              Export PowerPoint (.pptx)
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#F5F1E8]/65">
              Generates a {project.format} PowerPoint presentation preserving
              original slide order, high-resolution Biblical backgrounds, and
              full scripture references.
            </p>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runExport('pptx')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF67] px-4 py-2.5 text-sm font-semibold text-[#081629] hover:bg-[#E2C27D] disabled:opacity-55 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export PowerPoint
            {languageScope === 'all' ? ' (3 Separate Files)' : ''}
          </button>
        </div>

        {/* 2. PDF (.pdf) */}
        <div className="flex flex-col justify-between rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/80 p-6">
          <div>
            <div className="flex items-center justify-between">
              <FileText className="h-6 w-6 text-[#D4AF67]" />
              <span className="font-mono text-xs text-[#F5F1E8]/55">
                .PDF · Print & Projector Ready
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">
              Export PDF Document (.pdf)
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#F5F1E8]/65">
              Renders every slide with authentic Tamil, English, and Sinhala
              fonts locked in place for zero font substitution on any device.
            </p>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runExport('pdf')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF67] px-4 py-2.5 text-sm font-semibold text-[#081629] hover:bg-[#E2C27D] disabled:opacity-55 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export PDF{languageScope === 'all' ? ' (3 Separate Files)' : ''}
          </button>
        </div>

        {/* 3. Individual Slide PNG */}
        <div className="flex flex-col justify-between rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/80 p-6">
          <div>
            <div className="flex items-center justify-between">
              <FileImage className="h-6 w-6 text-[#D4AF67]" />
              <span className="font-mono text-xs text-[#F5F1E8]/55">
                .PNG · Full HD 1920×1080
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">
              Export Individual PNG
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#F5F1E8]/65">
              Export a single slide as a crisp full-resolution PNG for church
              screens, livestream lower-thirds, or social announcements.
            </p>

            <div className="mt-4">
              <select
                value={singleSlideIndex}
                onChange={(e) => setSingleSlideIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-white/15 bg-[#081629] px-3 py-2 text-xs text-white focus:border-[#D4AF67] focus:outline-none"
              >
                {project.slides.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    Slide {String(s.order).padStart(2, '0')} —{' '}
                    {s.content[languageScope === 'all' ? 'en' : languageScope].title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runExport('png')}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF67]/50 bg-[#D4AF67]/15 px-4 py-2.5 text-sm font-semibold text-[#ebd49d] hover:bg-[#D4AF67]/25 disabled:opacity-55 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download Slide PNG
          </button>
        </div>

        {/* 4. All Slides as ZIP */}
        <div className="flex flex-col justify-between rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/80 p-6">
          <div>
            <div className="flex items-center justify-between">
              <FileArchive className="h-6 w-6 text-[#D4AF67]" />
              <span className="font-mono text-xs text-[#F5F1E8]/55">
                .ZIP · Complete Image Pack
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">
              Export All Slides as ZIP
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#F5F1E8]/65">
              Packages all {project.slides.length} slides as high-resolution PNG
              images organized by language folder for EasyWorship, ProPresenter,
              or OBS.
            </p>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runExport('zip')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF67]/50 bg-[#D4AF67]/15 px-4 py-2.5 text-sm font-semibold text-[#ebd49d] hover:bg-[#D4AF67]/25 disabled:opacity-55 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download All Slides (.zip)
          </button>
        </div>
      </section>

      {/* Export History Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D4AF67]/15 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Export History</h2>
            <p className="text-xs text-[#F5F1E8]/55">
              Recent PowerPoint, PDF, PNG, and ZIP exports saved locally.
            </p>
          </div>

          {exportHistory.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F5F1E8]/60 hover:text-red-300 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear History
            </button>
          )}
        </div>

        {exportHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#10243C]/35 px-6 py-10 text-center text-sm text-[#F5F1E8]/55">
            No exports recorded yet. Export a presentation above to track it
            here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/70">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-[#F5F1E8]/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Format</th>
                  <th className="px-4 py-3 font-medium">Language</th>
                  <th className="px-4 py-3 font-medium text-right">Slides</th>
                  <th className="px-4 py-3 font-medium">File Name</th>
                  <th className="px-4 py-3 font-medium text-right">Exported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-[#F5F1E8]/85">
                {exportHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/3">
                    <td className="px-4 py-3 font-medium text-white">
                      {item.projectTitle}
                    </td>
                    <td className="px-4 py-3 font-mono uppercase text-[#D4AF67]">
                      {item.format}
                    </td>
                    <td className="px-4 py-3">
                      {item.languageScope === 'all'
                        ? 'All 3 Languages'
                        : LANGUAGE_META[item.languageScope].nativeName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {item.slideCount}
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-3 font-mono text-[11px] text-[#F5F1E8]/65">
                      {item.fileName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F5F1E8]/60 tabular-nums whitespace-nowrap">
                      {new Date(item.exportedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
