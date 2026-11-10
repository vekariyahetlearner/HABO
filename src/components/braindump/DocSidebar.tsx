'use client';

import React, { useState } from 'react';
import { BrainDoc } from '@/lib/braindump/types';
import {
  Plus,
  Search,
  Trash2,
  Copy,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Sparkles,
} from 'lucide-react';

interface DocSidebarProps {
  docs: BrainDoc[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onCreateDoc: (template?: 'empty' | 'project' | 'reflection') => void;
  onDeleteDoc: (id: string) => void;
  onDuplicateDoc: (id: string) => void;
  onExportMarkdown: () => void;
  onExportAllJson: () => void;
}

export const DocSidebar: React.FC<DocSidebarProps> = ({
  docs,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onDeleteDoc,
  onDuplicateDoc,
  onExportMarkdown,
  onExportAllJson,
}) => {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="shrink-0 flex flex-col items-center py-4 px-1 bg-white dark:bg-[#14141C] border-2 border-black dark:border-stone-800 shadow-[3px_3px_0px_#000]">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-black dark:text-white cursor-pointer"
          title="Expand workspace sidebar"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
        <div className="mt-4 flex flex-col gap-2">
          {docs.slice(0, 5).map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                onSelectDoc(d.id);
                setCollapsed(false);
              }}
              className={`w-8 h-8 flex items-center justify-center text-sm border ${
                d.id === activeDocId
                  ? 'bg-[#22C55E] border-black text-black font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 border-transparent hover:border-black'
              }`}
              title={d.title}
            >
              {d.icon || '🧠'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-full sm:w-64 md:w-72 shrink-0 flex flex-col bg-white dark:bg-[#14141C] border-2 border-black dark:border-stone-800 shadow-[4px_4px_0px_#000] overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3 bg-stone-100 dark:bg-[#1C1C28] border-b-2 border-black dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-[#22C55E]" />
          <span className="font-black text-xs uppercase tracking-wider text-black dark:text-white">
            Pages & BrainDumps
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="p-1 text-stone-500 hover:text-black dark:hover:text-white cursor-pointer"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Action: Create New Page */}
      <div className="p-2.5 border-b border-stone-200 dark:border-stone-800 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onCreateDoc('empty')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#22C55E] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer hover:bg-[#16A34A]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Page</span>
          </button>

          <button
            type="button"
            onClick={() => onCreateDoc('project')}
            className="p-1.5 bg-[#FACC15] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer hover:bg-yellow-400"
            title="Create Project Board template"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search docs..."
            className="w-full text-xs pl-7 pr-2 py-1 bg-stone-50 dark:bg-[#1A1A26] border border-black dark:border-stone-700 outline-none font-medium"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto max-h-[500px] p-2 flex flex-col gap-1">
        {filteredDocs.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-400 font-mono">
            No matching documents
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isActive = doc.id === activeDocId;

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`group flex items-center justify-between p-2 border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#22C55E]/15 dark:bg-[#22C55E]/20 border-black dark:border-[#22C55E] shadow-[2px_2px_0px_#000]'
                    : 'bg-transparent border-transparent hover:bg-stone-100 dark:hover:bg-[#1C1C28]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-base select-none shrink-0">{doc.icon || '🧠'}</span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs truncate ${
                        isActive ? 'font-black text-black dark:text-white' : 'font-bold text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {doc.title || 'Untitled Document'}
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {new Date(doc.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Doc hover actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateDoc(doc.id);
                    }}
                    className="p-1 text-stone-400 hover:text-black dark:hover:text-white cursor-pointer"
                    title="Duplicate document"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {docs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDoc(doc.id);
                      }}
                      className="p-1 text-stone-400 hover:text-red-500 cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Exports */}
      <div className="p-2 bg-stone-50 dark:bg-[#181824] border-t-2 border-black dark:border-stone-800 flex items-center justify-between text-[11px] font-mono">
        <button
          type="button"
          onClick={onExportMarkdown}
          className="flex items-center gap-1 text-stone-600 dark:text-stone-300 hover:text-black dark:hover:text-white font-bold cursor-pointer"
          title="Export current page to Markdown (.md)"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>MD</span>
        </button>

        <button
          type="button"
          onClick={onExportAllJson}
          className="flex items-center gap-1 text-stone-600 dark:text-stone-300 hover:text-black dark:hover:text-white font-bold cursor-pointer"
          title="Backup all BrainDumps as JSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Backup JSON</span>
        </button>
      </div>
    </aside>
  );
};
