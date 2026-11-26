import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  Edit3,
  FolderOpen,
  Home,
  Languages,
  Layers,
  Menu,
  Play,
  Plus,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  AppSection,
  ExportHistoryEntry,
  LanguageCode,
  PresentationFormat,
  PresentationProject,
  ProjectLanguageMode,
  StudioSettings,
  ThemeId,
} from './types/presentation';
import { createSalvationPresentation } from './data/salvationContent';
import { getThemeById } from './data/themes';
import {
  DEFAULT_SETTINGS,
  clearExportHistory,
  deleteProjectById,
  loadExportHistory,
  loadProjects,
  loadStudioSettings,
  saveExportHistoryEntry,
  saveProject,
  saveStudioSettings,
} from './lib/storage';
import { DashboardView } from './components/DashboardView';
import { NewPresentationView } from './components/NewPresentationView';
import { ProjectsView } from './components/ProjectsView';
import { TemplatesView } from './components/TemplatesView';
import { SlideEditorView } from './components/SlideEditorView';
import { AIDesignStudioView } from './components/AIDesignStudioView';
import { LanguageView } from './components/LanguageView';
import { ExportView } from './components/ExportView';
import { SettingsView } from './components/SettingsView';
import { PresentationPlayer } from './components/PresentationPlayer';

const NAV_ITEMS: Array<{
  id: AppSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'new-presentation', label: 'New Presentation', icon: Plus },
  { id: 'projects', label: 'My Projects', icon: FolderOpen },
  { id: 'editor', label: 'Slide Editor', icon: Edit3 },
  { id: 'templates', label: 'Templates', icon: Layers },
  { id: 'ai-studio', label: 'AI Design Studio', icon: Sparkles },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'export', label: 'Export Centre', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SECTION_LABELS: Record<AppSection, string> = {
  dashboard: 'Dashboard',
  'new-presentation': 'Create New Presentation',
  projects: 'My Projects',
  editor: 'Slide Editor',
  templates: 'Templates & Themes',
  'ai-studio': 'AI Design Studio',
  languages: 'Language Management',
  export: 'Export Centre & History',
  settings: 'Studio Settings',
};

const StudioCrossLogo: React.FC = () => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className="h-7 w-7 shrink-0"
  >
    <rect
      x="1.5"
      y="1.5"
      width="29"
      height="29"
      rx="7"
      fill="#10243C"
      stroke="#D4AF67"
      strokeWidth="1.5"
    />
    <path
      d="M16 6.5V25.5M10.5 13H21.5"
      stroke="#D4AF67"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

export default function App() {
  const [section, setSection] = useState<AppSection>('dashboard');
  const [projects, setProjects] = useState<PresentationProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([]);
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [presetThemeForNew, setPresetThemeForNew] = useState<ThemeId | undefined>(
    undefined
  );

  // Full-screen presentation player state
  const [presenting, setPresenting] = useState<{
    projectId: string;
    startSlideIndex: number;
  } | null>(null);

  // Undo / Redo history stacks for the active project
  const [undoStack, setUndoStack] = useState<PresentationProject[]>([]);
  const [redoStack, setRedoStack] = useState<PresentationProject[]>([]);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [loadedProjects, loadedExports, loadedSettings] = await Promise.all([
        loadProjects(),
        loadExportHistory(),
        loadStudioSettings(),
      ]);
      if (!mounted) return;
      setProjects(loadedProjects);
      setActiveProjectId(loadedProjects[0]?.id ?? null);
      setExportHistory(loadedExports);
      setSettings(loadedSettings);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  const persistProjectDebounced = useCallback((proj: PresentationProject) => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveProject(proj).catch(() => undefined);
    }, 350);
  }, []);

  const handleUpdateProject = useCallback(
    (updated: PresentationProject, pushHistory = true) => {
      setProjects((prev) => {
        const previousVersion = prev.find((p) => p.id === updated.id);
        if (pushHistory && previousVersion) {
          setUndoStack((stack) => [...stack.slice(-24), previousVersion]);
          setRedoStack([]);
        }
        return prev.map((p) => (p.id === updated.id ? updated : p));
      });
      persistProjectDebounced(updated);
    },
    [persistProjectDebounced]
  );

  const handleUndo = useCallback(() => {
    if (!activeProject || undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, activeProject]);
    setProjects((prev) =>
      prev.map((p) => (p.id === previous.id ? previous : p))
    );
    saveProject(previous).catch(() => undefined);
  }, [activeProject, undoStack]);

  const handleRedo = useCallback(() => {
    if (!activeProject || redoStack.length === 0) return;
    const restored = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, activeProject]);
    setProjects((prev) =>
      prev.map((p) => (p.id === restored.id ? restored : p))
    );
    saveProject(restored).catch(() => undefined);
  }, [activeProject, redoStack]);

  const handleCreatePresentation = async (payload: {
    title: string;
    subtitle: string;
    author: string;
    languageMode: ProjectLanguageMode;
    activeLanguage: LanguageCode;
    slideCount: number;
    format: PresentationFormat;
    themeId: ThemeId;
  }) => {
    const created = createSalvationPresentation(payload);
    setProjects((prev) => [created, ...prev]);
    setActiveProjectId(created.id);
    setSelectedSlideIndex(0);
    setUndoStack([]);
    setRedoStack([]);
    setPresetThemeForNew(undefined);
    await saveProject(created);
    setSection('editor');
  };

  const handleOpenProject = (projectId: string, slideIndex = 0) => {
    setActiveProjectId(projectId);
    setSelectedSlideIndex(slideIndex);
    setUndoStack([]);
    setRedoStack([]);
    setSection('editor');
    setMobileMenuOpen(false);
  };

  const handleDuplicateProject = async (projectId: string) => {
    const source = projects.find((p) => p.id === projectId);
    if (!source) return;
    const now = new Date().toISOString();
    const copyId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duplicated: PresentationProject = {
      ...source,
      id: copyId,
      title: `${source.title} (Copy)`,
      completed: false,
      slides: source.slides.map((s) => ({
        ...s,
        id: `${copyId}-s${s.order}-${Math.random().toString(36).slice(2, 5)}`,
        content: {
          ta: { ...s.content.ta, points: s.content.ta.points.map((pt) => ({ ...pt })) },
          en: { ...s.content.en, points: s.content.en.points.map((pt) => ({ ...pt })) },
          si: { ...s.content.si, points: s.content.si.points.map((pt) => ({ ...pt })) },
        },
        design: { ...s.design },
        background: { ...s.background },
      })),
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [duplicated, ...prev]);
    await saveProject(duplicated);
  };

  const handleRenameProject = async (projectId: string, newTitle: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    const updated: PresentationProject = {
      ...target,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
    await saveProject(updated);
  };

  const handleToggleComplete = async (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    const updated: PresentationProject = {
      ...target,
      completed: !target.completed,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
    await saveProject(updated);
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProjectById(projectId);
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== projectId);
      if (activeProjectId === projectId) {
        setActiveProjectId(next[0]?.id ?? null);
        setSelectedSlideIndex(0);
      }
      return next;
    });
  };

  const handleApplyThemeToActive = (themeId: ThemeId) => {
    if (!activeProject) return;
    const theme = getThemeById(themeId);
    const updated: PresentationProject = {
      ...activeProject,
      themeId,
      slides: activeProject.slides.map((s) => ({
        ...s,
        design: {
          ...s.design,
          backgroundColor: theme.defaults.backgroundColor,
          textColor: theme.defaults.textColor,
          accentColor: theme.defaults.accentColor,
          overlayOpacity: theme.defaults.overlayOpacity,
          overlayGradient: s.isPrayerSlide
            ? theme.isLight
              ? 'light-sanctuary'
              : 'radial-vignette'
            : theme.defaults.overlayGradient,
          referenceStyle: theme.defaults.referenceStyle,
          fontFamily: theme.defaults.fontFamily,
        },
        lastUpdated: new Date().toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
    handleUpdateProject(updated, true);
  };

  const handleLogExport = async (
    entry: Omit<ExportHistoryEntry, 'id' | 'exportedAt'>
  ) => {
    const fullEntry: ExportHistoryEntry = {
      ...entry,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      exportedAt: new Date().toISOString(),
    };
    setExportHistory((prev) => [fullEntry, ...prev]);
    await saveExportHistoryEntry(fullEntry);
  };

  const handleClearExportHistory = async () => {
    await clearExportHistory();
    setExportHistory([]);
  };

  const handleUpdateSettings = async (next: StudioSettings) => {
    setSettings(next);
    await saveStudioSettings(next);
  };

  const handleImportBackup = async (imported: PresentationProject[]) => {
    for (const proj of imported) {
      await saveProject(proj);
    }
    const refreshed = await loadProjects();
    setProjects(refreshed);
    if (!activeProjectId && refreshed[0]) {
      setActiveProjectId(refreshed[0].id);
    }
  };

  const presentingProject = presenting
    ? projects.find((p) => p.id === presenting.projectId) ?? null
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#081629] text-[#F5F1E8]">
      {/* Desktop Studio Sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#D4AF67]/15 bg-[#061121] md:flex">
        <div className="flex h-[57px] items-center gap-2.5 border-b border-[#D4AF67]/15 px-4">
          <StudioCrossLogo />
          <span
            className="truncate text-sm font-bold tracking-wide text-white"
            style={{ fontFamily: '"Cinzel", Georgia, serif' }}
          >
            WAY OF SALVATION
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Studio navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'new-presentation') {
                    setPresetThemeForNew(undefined);
                  }
                  setSection(item.id);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#10243C] text-[#D4AF67] border border-[#D4AF67]/30'
                    : 'text-[#F5F1E8]/75 border border-transparent hover:bg-[#10243C]/60 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Project Quick Context */}
        {activeProject && (
          <div className="border-t border-[#D4AF67]/15 p-3.5">
            <div className="text-[11px] font-medium text-[#F5F1E8]/50">
              Active Presentation
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-white">
              {activeProject.title}
            </div>
            <div className="mt-1 text-[11px] text-[#D4AF67]/85 tabular-nums">
              {activeProject.slides.length} slides · {activeProject.format}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70"
          />
          <aside className="relative z-10 flex w-[260px] flex-col border-r border-[#D4AF67]/25 bg-[#061121]">
            <div className="flex h-[57px] items-center justify-between border-b border-[#D4AF67]/15 px-4">
              <div className="flex items-center gap-2.5">
                <StudioCrossLogo />
                <span
                  className="text-xs font-bold tracking-wide text-white"
                  style={{ fontFamily: '"Cinzel", Georgia, serif' }}
                >
                  WAY OF SALVATION
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded p-1 text-[#F5F1E8]/75 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                      active
                        ? 'bg-[#10243C] text-[#D4AF67]'
                        : 'text-[#F5F1E8]/80 hover:bg-[#10243C]/60'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Clean Top Workspace Header */}
        <header className="flex h-[57px] shrink-0 items-center justify-between gap-4 border-b border-[#D4AF67]/15 bg-[#081629] px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-[#F5F1E8]/80 hover:bg-white/5 md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm">
              <span className="hidden font-medium text-[#F5F1E8]/50 sm:inline whitespace-nowrap">
                THE WAY OF SALVATION
              </span>
              <span className="hidden text-[#F5F1E8]/30 sm:inline">/</span>
              <span className="truncate font-semibold text-white">
                {SECTION_LABELS[section]}
              </span>
              {section === 'editor' && activeProject && (
                <>
                  <span className="hidden text-[#F5F1E8]/30 lg:inline">/</span>
                  <span className="hidden max-w-[260px] truncate text-xs text-[#D4AF67] lg:inline">
                    {activeProject.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {section === 'editor' && activeProject ? (
              <button
                type="button"
                onClick={() =>
                  setPresenting({
                    projectId: activeProject.id,
                    startSlideIndex: selectedSlideIndex,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF67] px-4 py-2 text-xs font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                Start Presentation
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPresetThemeForNew(undefined);
                  setSection('new-presentation');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF67] px-4 py-2 text-xs font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                New Presentation
              </button>
            )}
          </div>
        </header>

        {/* Active Workspace Viewport */}
        <div
          className={`min-h-0 flex-1 ${
            section === 'editor' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-[#F5F1E8]/65">
              Loading studio workspace...
            </div>
          ) : (
            <>
              {section === 'dashboard' && (
                <DashboardView
                  projects={projects}
                  activeProjectId={activeProject?.id ?? null}
                  settings={settings}
                  onNavigate={(target) => setSection(target)}
                  onOpenProject={(id) => handleOpenProject(id, 0)}
                  onPresentProject={(id, start = 0) =>
                    setPresenting({ projectId: id, startSlideIndex: start })
                  }
                  onDuplicateProject={handleDuplicateProject}
                  onDeleteProject={handleDeleteProject}
                />
              )}

              {section === 'new-presentation' && (
                <NewPresentationView
                  settings={settings}
                  initialThemeId={presetThemeForNew}
                  onCancel={() => setSection('dashboard')}
                  onCreate={handleCreatePresentation}
                />
              )}

              {section === 'projects' && (
                <ProjectsView
                  projects={projects}
                  settings={settings}
                  onCreateNew={() => {
                    setPresetThemeForNew(undefined);
                    setSection('new-presentation');
                  }}
                  onOpenProject={(id) => handleOpenProject(id, 0)}
                  onPresentProject={(id) =>
                    setPresenting({ projectId: id, startSlideIndex: 0 })
                  }
                  onRenameProject={handleRenameProject}
                  onToggleComplete={handleToggleComplete}
                  onDuplicateProject={handleDuplicateProject}
                  onDeleteProject={handleDeleteProject}
                />
              )}

              {section === 'templates' && (
                <TemplatesView
                  activeProjectTitle={activeProject?.title}
                  onUseTemplate={(themeId) => {
                    setPresetThemeForNew(themeId);
                    setSection('new-presentation');
                  }}
                  onApplyThemeToActive={handleApplyThemeToActive}
                />
              )}

              {section === 'editor' && activeProject && (
                <SlideEditorView
                  project={activeProject}
                  settings={settings}
                  selectedSlideIndex={selectedSlideIndex}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  onSelectSlide={setSelectedSlideIndex}
                  onUpdateProject={handleUpdateProject}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onSaveNow={() => {
                    saveProject(activeProject).catch(() => undefined);
                  }}
                  onPresent={(idx) =>
                    setPresenting({
                      projectId: activeProject.id,
                      startSlideIndex: idx,
                    })
                  }
                  onExportLogged={(info) =>
                    handleLogExport({
                      projectId: activeProject.id,
                      projectTitle: activeProject.title,
                      ...info,
                    })
                  }
                />
              )}

              {section === 'editor' && !activeProject && (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <p className="text-sm text-[#F5F1E8]/70">
                    No presentation open. Create a new presentation to launch
                    the Slide Editor.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSection('new-presentation')}
                    className="mt-4 rounded-lg bg-[#D4AF67] px-5 py-2.5 text-sm font-semibold text-[#081629] hover:bg-[#E2C27D] cursor-pointer"
                  >
                    Create Presentation
                  </button>
                </div>
              )}

              {section === 'ai-studio' && (
                <AIDesignStudioView
                  project={activeProject}
                  settings={settings}
                  onUpdateProject={(updated) => handleUpdateProject(updated, true)}
                  onOpenSlideInEditor={(idx) => {
                    setSelectedSlideIndex(idx);
                    setSection('editor');
                  }}
                  onPresentSlide={(idx) => {
                    if (activeProject) {
                      setPresenting({
                        projectId: activeProject.id,
                        startSlideIndex: idx,
                      });
                    }
                  }}
                  onCreateNew={() => setSection('new-presentation')}
                />
              )}

              {section === 'languages' && (
                <LanguageView
                  project={activeProject}
                  onUpdateProject={(updated) => handleUpdateProject(updated, true)}
                  onOpenSlideInEditor={(idx) => {
                    setSelectedSlideIndex(idx);
                    setSection('editor');
                  }}
                  onCreateNew={() => setSection('new-presentation')}
                />
              )}

              {section === 'export' && (
                <ExportView
                  projects={projects}
                  activeProjectId={activeProject?.id ?? null}
                  exportHistory={exportHistory}
                  settings={settings}
                  onLogExport={handleLogExport}
                  onClearHistory={handleClearExportHistory}
                  onCreateNew={() => setSection('new-presentation')}
                />
              )}

              {section === 'settings' && (
                <SettingsView
                  settings={settings}
                  projects={projects}
                  onUpdateSettings={handleUpdateSettings}
                  onImportBackup={handleImportBackup}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Full-Screen Church Presentation Player */}
      {presentingProject && presenting && (
        <PresentationPlayer
          project={presentingProject}
          settings={settings}
          initialSlideIndex={presenting.startSlideIndex}
          onExit={() => setPresenting(null)}
        />
      )}
    </div>
  );
}
