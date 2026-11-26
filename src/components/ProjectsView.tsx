import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Edit3,
  FolderOpen,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { PresentationProject, StudioSettings } from '../types/presentation';
import { LANGUAGE_META, getThemeById } from '../data/themes';
import { SlideCanvas } from './SlideCanvas';

interface ProjectsViewProps {
  projects: PresentationProject[];
  settings: StudioSettings;
  onCreateNew: () => void;
  onOpenProject: (projectId: string) => void;
  onPresentProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onToggleComplete: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  settings,
  onCreateNew,
  onOpenProject,
  onPresentProject,
  onRenameProject,
  onToggleComplete,
  onDuplicateProject,
  onDeleteProject,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft'>('all');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = projects.filter((p) => {
    const matchesQuery =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' ? p.completed : !p.completed);
    return matchesQuery && matchesStatus;
  });

  const projectToDelete = projects.find((p) => p.id === confirmDeleteId) ?? null;

  const commitRename = (projectId: string) => {
    const cleaned = renameDraft.trim();
    if (cleaned) {
      onRenameProject(projectId, cleaned);
    }
    setRenamingId(null);
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D4AF67]/20 pb-5">
        <div>
          <h1
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: '"Cinzel", Georgia, serif' }}
          >
            My Projects
          </h1>
          <p className="mt-1 text-sm text-[#F5F1E8]/65">
            All presentations are automatically saved in local browser storage.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF67] px-4 py-2.5 text-sm font-semibold text-[#081629] transition-colors hover:bg-[#E2C27D] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Presentation
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#F5F1E8]/45" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or church name..."
            className="w-full rounded-lg border border-[#D4AF67]/25 bg-[#10243C] py-2 pr-4 pl-10 text-sm text-white placeholder-[#F5F1E8]/40 focus:border-[#D4AF67] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#D4AF67]/20 bg-[#10243C] p-1">
          {(['all', 'completed', 'draft'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#D4AF67] text-[#081629]'
                  : 'text-[#F5F1E8]/70 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'completed' ? 'Completed' : 'In Progress'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D4AF67]/25 bg-[#10243C]/40 px-6 py-16 text-center">
          <FolderOpen className="h-10 w-10 text-[#D4AF67]/70" />
          <h3 className="mt-4 text-base font-semibold text-white">
            No matching presentations
          </h3>
          <p className="mt-1 text-sm text-[#F5F1E8]/60">
            Adjust your filter or create a new 10-slide presentation.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D4AF67] px-4 py-2 text-sm font-semibold text-[#081629] hover:bg-[#E2C27D] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const slide01 = project.slides[0];
            const theme = getThemeById(project.themeId);
            const isRenaming = renamingId === project.id;

            return (
              <article
                key={project.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[#D4AF67]/20 bg-[#10243C]/80 transition-colors hover:border-[#D4AF67]/50"
              >
                <div
                  onClick={() => onOpenProject(project.id)}
                  className="cursor-pointer border-b border-[#D4AF67]/15"
                >
                  {slide01 && (
                    <SlideCanvas
                      slide={slide01}
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

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(project.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="w-full rounded border border-[#D4AF67] bg-[#081629] px-2.5 py-1 text-sm text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => commitRename(project.id)}
                          className="rounded bg-[#D4AF67] px-2.5 py-1 text-xs font-semibold text-[#081629] cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-base font-semibold text-white">
                        {project.title}
                      </h3>
                    )}

                    <p className="mt-1 text-xs text-[#F5F1E8]/60">
                      {project.author} ·{' '}
                      <span className="tabular-nums">
                        {project.slides.length} slides
                      </span>{' '}
                      · {project.format} · {theme.name}
                    </p>

                    <p className="mt-2 text-xs text-[#F5F1E8]/55">
                      {project.languageMode === 'all'
                        ? 'தமிழ் · English · සිංහල'
                        : LANGUAGE_META[project.languageMode].nativeName}{' '}
                      · Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenProject(project.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF67] px-3 py-1.5 text-xs font-semibold text-[#081629] hover:bg-[#E2C27D] cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onPresentProject(project.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:border-[#D4AF67]/50 cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 text-[#D4AF67]" />
                        Present
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={
                          project.completed
                            ? 'Mark as In Progress'
                            : 'Mark as Completed'
                        }
                        onClick={() => onToggleComplete(project.id)}
                        className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                          project.completed
                            ? 'text-[#D4AF67] hover:bg-[#D4AF67]/15'
                            : 'text-[#F5F1E8]/50 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Rename project"
                        onClick={() => {
                          setRenamingId(project.id);
                          setRenameDraft(project.title);
                        }}
                        className="rounded-lg p-1.5 text-[#F5F1E8]/60 hover:bg-white/5 hover:text-white cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Duplicate project"
                        onClick={() => onDuplicateProject(project.id)}
                        className="rounded-lg p-1.5 text-[#F5F1E8]/60 hover:bg-white/5 hover:text-white cursor-pointer"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete project"
                        onClick={() => setConfirmDeleteId(project.id)}
                        className="rounded-lg p-1.5 text-[#F5F1E8]/60 hover:bg-red-500/15 hover:text-red-300 cursor-pointer"
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

      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#D4AF67]/30 bg-[#10243C] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Delete Presentation?
            </h3>
            <p className="mt-2 text-sm text-[#F5F1E8]/75">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-white">
                {projectToDelete.title}
              </span>
              ? This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
