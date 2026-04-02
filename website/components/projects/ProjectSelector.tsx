"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

interface Project {
  id: string;
  name: string;
  is_default: boolean;
}

export default function ProjectSelector({ token, onChange }: {
  token: string;
  onChange: (projectId: string | null) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("selected_project_id");
    return null;
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/projects/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.projects) return;
        setProjects(data.projects);
        // Auto-select default if nothing selected
        if (!selected && data.projects.length > 0) {
          const def = data.projects.find((p: Project) => p.is_default);
          if (def) {
            setSelected(def.id);
            localStorage.setItem("selected_project_id", def.id);
            onChange(def.id);
          }
        } else if (selected) {
          onChange(selected);
        }
      })
      .catch(() => {});
  }, [token]);

  const handleSelect = (id: string | null) => {
    setSelected(id);
    setOpen(false);
    if (id) {
      localStorage.setItem("selected_project_id", id);
    } else {
      localStorage.removeItem("selected_project_id");
    }
    onChange(id);
  };

  if (projects.length === 0) return null;

  const current = projects.find(p => p.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all hover:bg-text/5"
        style={{ color: current ? "var(--color-accent)" : "var(--color-text-40)" }}
      >
        <span className="text-sm">{current ? "📁" : "📂"}</span>
        <span className="max-w-[100px] truncate">{current?.name || "Без проекта"}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-bg border border-text/10 rounded-xl shadow-xl z-50 min-w-[180px] py-1.5 overflow-hidden">
            <button
              onClick={() => handleSelect(null)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-text/5 transition-colors ${!selected ? "text-accent font-semibold" : "text-text/50"}`}
            >
              📂 Без проекта
            </button>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-text/5 transition-colors flex items-center gap-1.5 ${selected === p.id ? "text-accent font-semibold" : "text-text/70"}`}
              >
                <span>📁</span>
                <span className="truncate">{p.name}</span>
                {p.is_default && <span className="text-[9px] text-teal bg-teal/10 px-1.5 py-0.5 rounded ml-auto shrink-0">default</span>}
              </button>
            ))}
            <div className="border-t border-text/5 mt-1 pt-1">
              <a href="/dashboard/projects" className="block px-3 py-2 text-xs text-accent hover:bg-accent/5 transition-colors">
                + Управление проектами
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
