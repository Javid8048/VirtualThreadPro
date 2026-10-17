import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FolderOpen,
  Save,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Edit2,
  Check,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ProjectManager } from '../utils/projectManager';

export function ProjectsModal({
  isOpen,
  onClose,
  onLoadProject,
  onSaveCurrentProject,
  currentGarmentType = 'regular_tee',
  currentGarmentColor = '#ffffff'
}) {
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const jsonInputRef = useRef(null);

  const reloadProjects = () => {
    setProjects(ProjectManager.getProjects());
  };

  useEffect(() => {
    if (isOpen) {
      reloadProjects();
      setEditingId(null);
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartRename = (project) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = (id) => {
    if (editingName.trim()) {
      ProjectManager.renameProject(id, editingName.trim());
      reloadProjects();
    }
    setEditingId(null);
  };

  const handleDuplicate = (id) => {
    ProjectManager.duplicateProject(id);
    reloadProjects();
  };

  const handleDelete = (id) => {
    ProjectManager.deleteProject(id);
    setDeleteConfirmId(null);
    reloadProjects();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const existing = ProjectManager.getProjects();
        if (Array.isArray(parsed)) {
          // Merge array of projects
          const merged = [...parsed, ...existing];
          ProjectManager.saveProjects(merged);
        } else if (parsed && parsed.id && parsed.layers) {
          // Single project
          const merged = [parsed, ...existing.filter((p) => p.id !== parsed.id)];
          ProjectManager.saveProjects(merged);
        }
        reloadProjects();
      } catch (err) {
        console.error('Failed to parse project JSON:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-3xl max-h-[88vh] bg-white dark:bg-studio-900 border border-gray-200 dark:border-studio-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/70">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-2xl bg-brand-500/15 text-brand-500 flex items-center justify-center font-bold">
              <FolderOpen className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Saved Projects</h2>
              <p className="text-xs text-gray-500 dark:text-studio-400">
                Manage, restore, duplicate, and export your studio designs locally
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200/80 dark:hover:bg-studio-800 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-studio-800 bg-white dark:bg-studio-900 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onSaveCurrentProject) {
                  onSaveCurrentProject();
                  reloadProjects();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Save className="size-3.5" />
              <span>Save Current Design</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-studio-700 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300 font-semibold flex items-center gap-1.5 transition-colors"
              title="Import projects from JSON file"
            >
              <Upload className="size-3.5" />
              <span>Import JSON</span>
            </button>
            <button
              onClick={() => ProjectManager.exportProjectJSON()}
              disabled={projects.length === 0}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-studio-700 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300 font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Download all saved projects as JSON"
            >
              <Download className="size-3.5" />
              <span>Export All</span>
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {projects.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-3xl bg-gray-100 dark:bg-studio-800 flex items-center justify-center text-gray-400 mb-3">
                <FolderOpen className="size-8" />
              </div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-studio-200">No Saved Projects Yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mt-1 mb-4">
                Click "Save Current Design" above to store your garments, artwork layers, positions, and finishes locally.
              </p>
              <button
                onClick={() => {
                  if (onSaveCurrentProject) {
                    onSaveCurrentProject();
                    reloadProjects();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Save className="size-3.5" />
                <span>Save Current Studio State</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((proj) => {
                const isEditing = editingId === proj.id;
                const isConfirmingDelete = deleteConfirmId === proj.id;
                const dateStr = new Date(proj.updatedAt || proj.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-2xl border border-gray-200 dark:border-studio-750 bg-gray-50/50 dark:bg-studio-850/50 hover:border-brand-500/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: Thumbnail + Info */}
                      <div className="flex items-start gap-3">
                        <div className="size-14 rounded-xl bg-gray-200 dark:bg-studio-800 border border-gray-300 dark:border-studio-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                          {proj.thumbnail ? (
                            <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="size-8 rounded-full border border-gray-400/40 shadow-xs"
                              style={{ backgroundColor: proj.garmentColor || '#ffffff' }}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(proj.id);
                                }}
                                className="w-full px-2 py-0.5 text-xs font-bold bg-white dark:bg-studio-800 border border-brand-500 rounded-lg outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(proj.id)}
                                className="p-1 rounded-md bg-brand-500 text-white"
                              >
                                <Check className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold truncate text-gray-900 dark:text-white" title={proj.name}>
                                {proj.name}
                              </h4>
                              <button
                                onClick={() => handleStartRename(proj)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-brand-500 transition-opacity"
                                title="Rename project"
                              >
                                <Edit2 className="size-3" />
                              </button>
                            </div>
                          )}

                          {/* Badges */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-500 border border-brand-500/30 uppercase">
                              {(proj.garmentType || 'garment').replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-studio-400 flex items-center gap-0.5">
                              <Layers className="size-2.5" />
                              <span>{(proj.layers || []).length} decals</span>
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="size-2.5" />
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-gray-200/60 dark:border-studio-750 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicate(proj.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-studio-750 transition-colors"
                          title="Duplicate project"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          onClick={() => ProjectManager.exportProjectJSON(proj.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-studio-750 transition-colors"
                          title="Export single project as JSON"
                        >
                          <Download className="size-3.5" />
                        </button>
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-lg border border-red-200 dark:border-red-800">
                            <span className="text-[10px] font-bold text-red-600">Delete?</span>
                            <button
                              onClick={() => handleDelete(proj.id)}
                              className="text-[10px] font-bold text-red-600 hover:underline"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-[10px] text-gray-500 hover:underline ml-1"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(proj.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (onLoadProject) {
                            onLoadProject(proj);
                            onClose();
                          }
                        }}
                        className="px-3 py-1 rounded-xl bg-black dark:bg-brand-500 text-white font-bold text-[11px] hover:bg-brand-600 shadow-xs flex items-center gap-1 transition-all active:scale-95"
                      >
                        <span>Open Design</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-gray-50/70 dark:bg-studio-850/70 border-t border-gray-100 dark:border-studio-800 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Designs are safely stored in your browser's private local storage.</span>
          <span className="font-semibold text-gray-500">{projects.length} Saved</span>
        </div>

      </div>
    </div>
  );
}
