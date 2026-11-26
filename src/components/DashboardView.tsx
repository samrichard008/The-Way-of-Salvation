import React, { useState } from 'react';
import {
  ArrowRight,
  Copy,
  Edit3,
  FolderOpen,
  Languages,
  Layers,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  AppSection,
  PresentationProject,
  StudioSettings,
} from '../types/presentation';
import { HERO_CROSS_IMAGE, LANGUAGE_META, getThemeById } from '../data/themes';
import { SlideCanvas } from './SlideCanvas';

interface DashboardViewProps {
  projects: PresentationProject[];
  activeProjectId: string | null;
  settings: StudioSettings;
  onNavigate: (section: AppSection) => void;
  onOpenProject: (projectId: string) => void;
  onPresentProject: (projectId: string, startSlideIndex?: number) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  activeProjectId,
  settings,
  onNavigate,
  onOpenProject,
  onPresentProject,
  onDuplicateProject,
  onDeleteProject,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const totalSlides = projects.reduce((sum, p) => sum + p.slides.length, 0);
  const completedCount = projects.filter((p) => p.completed).length;
  const recentProjects = projects.slice(0, 4);
  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  const projectToDelete = projects.find((p) => p.id === confirmDeleteId) ?? null;

  return (
    <div className="mx-auto max-w-[1320px] space-y-10 px-6 py-8 lg:px-10">
      {/* Cinematic Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[#D4AF67]/25 bg-[#10243C]">
        <div className="relative min-h-[340px] lg:min-h-[380px]">
          {!heroImgFailed ? (
            <img
              src={HERO_CROSS_IMAGE}
              alt="Weathered wooden cross standing on a rocky Judean hilltop at golden sunrise"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#081629] via-[#10243C] to-[#1D3557]" />
          )}

          {/* Measured Cinematic Scrim */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(8,22,41,0.92) 0%, rgba(8,22,41,0.74) 52%, rgba(8,22,41,0.28) 100%)',
            }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs font-medium tracking-widest text-[#D4AF67]">
                AI BIBLE PRESENTATION STUDIO · தமிழ் · ENGLISH · සිංහල
              </p>

              <h1
                className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
                style={{ fontFamily: '"Cinzel", Georgia, serif' }}
              >
                THE WAY OF SALVATION
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-[#F5F1E8]/85 sm:text-lg">
                Present the Word. Share the Truth. Transform Lives. Craft
                cinematic 10-slide Gospel presentations in Tamil, English, and
                Sinhala with independent per-slide AI design and church
                projector exports.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('new-presentation')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF67] px-5 py-3 text-sm font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF67] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create New Presentation
              </button>

              {activeProject && (
                <button
                  type="button"
                  onClick={() => onOpenProject(activeProject.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF67]/40 bg-[#081629]/75 px-5 py-3 text-sm font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67] hover:bg-[#10243C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF67] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Edit3 className="h-4 w-4 text-[#D4AF67]" />
                  Continue Editing
                </button>
              )}

              {activeProject && (
                <button
                  type="button"
                  onClick={() => onPresentProject(activeProject.id, 0)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/12 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="h-4 w-4 text-[#D4AF67]" />
                  Start Presentation
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Studio Statistics Strip */}
      <section aria-label="Studio statistics">
        <div className="grid grid-cols-2 divide-y divide-[#D4AF67]/15 rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/70 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-6">
            <div className="text-xs font-medium text-[#F5F1E8]/60">
              Total Projects
            </div>
            <div className="mt-2 font-mono text-3xl font-semibold text-white tabular-nums">
              {projects.length}
            </div>
            <div className="mt-1 text-xs text-[#D4AF67]/85">
              Stored locally in browser
            </div>
          </div>

          <div className="p-6">
            <div className="text-xs font-medium text-[#F5F1E8]/60">
              Total Slides
            </div>
            <div className="mt-2 font-mono text-3xl font-semibold text-white tabular-nums">
              {totalSlides}
            </div>
            <div className="mt-1 text-xs text-[#F5F1E8]/55">
              10-slide Gospel structure
            </div>
          </div>

          <div className="p-6">
            <div className="text-xs font-medium text-[#F5F1E8]/60">
              Completed Presentations
            </div>
            <div className="mt-2 font-mono text-3xl font-semibold text-white tabular-nums">
              {completedCount}
            </div>
            <div className="mt-1 text-xs text-[#F5F1E8]/55">
              Ready for sanctuary projection
            </div>
          </div>

          <div className="p-6">
            <div className="text-xs font-medium text-[#F5F1E8]/60">
              Available Languages
            </div>
            <div className="mt-2 font-mono text-3xl font-semibold text-[#D4AF67] tabular-nums">
              3
            </div>
            <div className="mt-1 text-xs text-[#F5F1E8]/75">
              தமிழ் · English · සිංහල
            </div>
          </div>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF67]/15 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
            <p className="mt-1 text-sm text-[#F5F1E8]/65">
              Open any presentation to edit slides individually, switch
              languages, or project live.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D4AF67] transition-colors hover:text-[#ebd49d] whitespace-nowrap shrink-0 cursor-pointer"
          >
            View All Projects
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D4AF67]/30 bg-[#10243C]/40 px-6 py-16 text-center">
            <FolderOpen className="h-10 w-10 text-[#D4AF67]/70" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              No presentations yet
            </h3>
            <p className="mt-1 max-w-md text-sm text-[#F5F1E8]/65">
              Create your first 10-slide presentation of The Way of Salvation in
              Tamil, English, or Sinhala.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('new-presentation')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#D4AF67] px-5 py-2.5 text-sm font-semibold text-[#081629] hover:bg-[#E2C27D] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create New Presentation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {recentProjects.map((project) => {
              const firstSlide = project.slides[0];
              const theme = getThemeById(project.themeId);
              const langLabel =
                project.languageMode === 'all'
                  ? 'தமிழ் · English · සිංහල'
                  : LANGUAGE_META[project.languageMode].nativeName;

              return (
                <article
                  key={project.id}
                  className="group overflow-hidden rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/80 transition-colors hover:border-[#D4AF67]/50"
                >
                  <div
                    onClick={() => onOpenProject(project.id)}
                    className="relative cursor-pointer overflow-hidden border-b border-[#D4AF67]/15"
                  >
                    {firstSlide && (
                      <SlideCanvas
                        slide={firstSlide}
                        language={project.activeLanguage}
                        format={project.format}
                        totalSlides={project.slides.length}
                        churchAuthor={
                          settings.includeChurchFooter ? project.author : undefined
                        }
                        includeFooter={settings.includeChurchFooter}
                      />
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-white">
                          {project.title}
                        </h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#F5F1E8]/60">
                          <span>{project.author}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {project.slides.length} slides
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{project.format}</span>
                          <span aria-hidden="true">·</span>
                          <span>{theme.name}</span>
                        </p>
                      </div>
                      <span className="text-xs font-medium text-[#D4AF67] whitespace-nowrap shrink-0">
                        {project.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-[#F5F1E8]/70">
                      Languages: <span className="text-[#F5F1E8]">{langLabel}</span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenProject(project.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF67] px-3.5 py-2 text-xs font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Open Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => onPresentProject(project.id, 0)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-[#F5F1E8] transition-colors hover:border-[#D4AF67]/50 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 text-[#D4AF67]" />
                          Present
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Duplicate presentation"
                          onClick={() => onDuplicateProject(project.id)}
                          className="rounded-lg p-2 text-[#F5F1E8]/65 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete presentation"
                          onClick={() => setConfirmDeleteId(project.id)}
                          className="rounded-lg p-2 text-[#F5F1E8]/65 transition-colors hover:bg-red-500/15 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Studio Workflows */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <button
          type="button"
          onClick={() => onNavigate('ai-studio')}
          className="flex flex-col items-start rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/60 p-6 text-left transition-colors hover:border-[#D4AF67]/55 hover:bg-[#10243C] cursor-pointer"
        >
          <Sparkles className="h-5 w-5 text-[#D4AF67]" />
          <h3 className="mt-4 text-base font-semibold text-white">
            AI Design Studio
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#F5F1E8]/65">
            Generate cinematic layouts and Biblical visual direction for each
            slide independently without overwriting other slides.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF67]">
            Open AI Studio <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('languages')}
          className="flex flex-col items-start rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/60 p-6 text-left transition-colors hover:border-[#D4AF67]/55 hover:bg-[#10243C] cursor-pointer"
        >
          <Languages className="h-5 w-5 text-[#D4AF67]" />
          <h3 className="mt-4 text-base font-semibold text-white">
            Trilingual Scripture Manager
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#F5F1E8]/65">
            Manage Tamil (தமிழ்), English, and Sinhala (සිංහල) versions
            independently with scripture review protection.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF67]">
            Manage Languages <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('templates')}
          className="flex flex-col items-start rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/60 p-6 text-left transition-colors hover:border-[#D4AF67]/55 hover:bg-[#10243C] cursor-pointer"
        >
          <Layers className="h-5 w-5 text-[#D4AF67]" />
          <h3 className="mt-4 text-base font-semibold text-white">
            6 Sanctuary Themes
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#F5F1E8]/65">
            Choose from Christian Cinematic, Bible Classic, Modern Church,
            Golden Cross, Minimal White, and Dark Royal Blue.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF67]">
            Explore Themes <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>
      </section>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#D4AF67]/30 bg-[#10243C] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Delete Presentation?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#F5F1E8]/75">
              This will permanently remove{' '}
              <span className="font-semibold text-white">
                {projectToDelete.title}
              </span>{' '}
              and all {projectToDelete.slides.length} customized slides from
              browser storage.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-[#F5F1E8] hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  setConfirmDeleteId(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
