/**
 * Project Management Engine for VirtualThread
 * Local-first project persistence using LocalStorage with JSON export/import
 * and cloud-ready data schema.
 */

const STORAGE_KEY = 'vt_saved_projects_v1';
const ACTIVE_PROJECT_KEY = 'vt_active_project_id';

export class ProjectManager {
  static getProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load projects from storage:', e);
      return [];
    }
  }

  static saveProjects(projects) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to persist projects to storage:', e);
    }
  }

  static getActiveProjectId() {
    return localStorage.getItem(ACTIVE_PROJECT_KEY) || null;
  }

  static setActiveProjectId(id) {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  }

  static getProject(id) {
    const list = this.getProjects();
    return list.find((p) => p.id === id) || null;
  }

  /**
   * Save current studio state into a project
   */
  static saveProject({
    id = null,
    name = 'Untitled Design',
    garmentType = 'regular_tee',
    garmentColor = '#ffffff',
    fabricFinish = 'cotton',
    backdropMode = 'dark',
    layers = [],
    thumbnail = null
  }) {
    const list = this.getProjects();
    const now = Date.now();
    const projectId = id || 'proj_' + now + '_' + Math.random().toString(36).substring(2, 7);

    // Sanitize layers to ensure serializable data
    const serializableLayers = layers.map((l) => ({
      id: l.id,
      type: l.type,
      side: l.side || 'front',
      x: l.x,
      y: l.y,
      scale: l.scale ?? 1.0,
      rotation: l.rotation ?? 0,
      opacity: l.opacity ?? 1.0,
      printType: l.printType || 'screen',
      text: l.text,
      textColor: l.textColor,
      fontSize: l.fontSize,
      fontFamily: l.fontFamily,
      dataUrl: l.dataUrl || (l.image instanceof HTMLImageElement ? l.image.src : null),
      presetSvg: l.presetSvg || null,
      shapeType: l.shapeType || null,
      fillColor: l.fillColor || null,
      strokeColor: l.strokeColor || null,
      strokeWidth: l.strokeWidth ?? 0
    }));

    const existingIdx = list.findIndex((p) => p.id === projectId);
    const projectRecord = {
      id: projectId,
      name: name || 'Untitled Design',
      updatedAt: now,
      createdAt: existingIdx >= 0 ? list[existingIdx].createdAt : now,
      thumbnail: thumbnail || (existingIdx >= 0 ? list[existingIdx].thumbnail : null),
      garmentType,
      garmentColor,
      fabricFinish,
      backdropMode,
      layers: serializableLayers
    };

    if (existingIdx >= 0) {
      list[existingIdx] = projectRecord;
    } else {
      list.unshift(projectRecord);
    }

    this.saveProjects(list);
    this.setActiveProjectId(projectId);
    return projectRecord;
  }

  /**
   * Duplicate an existing project
   */
  static duplicateProject(id) {
    const original = this.getProject(id);
    if (!original) return null;

    const copy = {
      ...original,
      id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const list = this.getProjects();
    list.unshift(copy);
    this.saveProjects(list);
    return copy;
  }

  /**
   * Rename an existing project
   */
  static renameProject(id, newName) {
    const list = this.getProjects();
    const item = list.find((p) => p.id === id);
    if (item) {
      item.name = newName.trim() || item.name;
      item.updatedAt = Date.now();
      this.saveProjects(list);
      return item;
    }
    return null;
  }

  /**
   * Delete project by ID
   */
  static deleteProject(id) {
    let list = this.getProjects();
    list = list.filter((p) => p.id !== id);
    this.saveProjects(list);
    if (this.getActiveProjectId() === id) {
      this.setActiveProjectId(list[0]?.id || null);
    }
    return list;
  }

  /**
   * Export all projects or single project as downloadable JSON
   */
  static exportProjectJSON(id = null) {
    const data = id ? this.getProject(id) : this.getProjects();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = id ? `virtualthread-project-${id}.json` : `virtualthread-all-projects-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
