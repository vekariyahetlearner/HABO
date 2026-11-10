'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NotebookFolder, NotebookNote, BrainDoc } from '@/lib/braindump/types';
import { BrainDumpStorage, createId } from '@/lib/braindump/storage';
import { BrainDumpEditor } from './BrainDumpEditor';
import { sounds } from '@/lib/audio';
import {
  Folder,
  FolderPlus,
  FilePlus,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Home,
  LayoutGrid,
  List,
  Search,
  Trash2,
  Copy,
  Edit2,
  FolderInput,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'updated' | 'type';

export const NotebookExplorer: React.FC = () => {
  const [folders, setFolders] = useState<NotebookFolder[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // File Manager Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Selected item in file manager (single click)
  const [selectedItem, setSelectedItem] = useState<{
    type: 'folder' | 'note';
    id: string;
  } | null>(null);

  // Note opened in editor view (double click on file)
  const [openedNoteId, setOpenedNoteId] = useState<string | null>(null);

  // View Settings
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Renaming
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingItem, setRenamingItem] = useState<{
    type: 'folder' | 'note';
    id: string;
    currentName: string;
  } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    const timer = setTimeout(() => {
      const loadedFolders = BrainDumpStorage.loadFolders();
      const loadedNotes = BrainDumpStorage.loadNotebookNotes();
      setFolders(loadedFolders);
      setNotes(loadedNotes);
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Currently opened note
  const openedNote = useMemo(() => {
    if (!openedNoteId) return null;
    return notes.find((n) => n.id === openedNoteId) || null;
  }, [openedNoteId, notes]);

  // Current folder object
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return folders.find((f) => f.id === currentFolderId) || null;
  }, [currentFolderId, folders]);

  // Folder Breadcrumbs: Home (~) -> Subfolder -> Sub-subfolder
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: '~ (home)' }];
    if (!currentFolderId) return crumbs;

    const chain: { id: string; name: string }[] = [];
    let curr: string | null = currentFolderId;
    const visited = new Set<string>();

    while (curr && !visited.has(curr)) {
      visited.add(curr);
      const f = folders.find((item) => item.id === curr);
      if (f) {
        chain.unshift({ id: f.id, name: f.name });
        curr = f.parentId;
      } else {
        break;
      }
    }

    return [...crumbs, ...chain];
  }, [currentFolderId, folders]);

  // Items inside CURRENT directory
  const currentSubfolders = useMemo(() => {
    let list = folders.filter((f) => f.parentId === currentFolderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [folders, currentFolderId, searchQuery]);

  const currentNotes = useMemo(() => {
    let list = notes.filter((n) => n.folderId === currentFolderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.blocks.some((b) => b.content.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'updated') {
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return list;
  }, [notes, currentFolderId, searchQuery, sortBy]);

  // ==========================================
  // NAVIGATION ACTIONS (LINUX FILE MANAGER)
  // ==========================================

  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      sounds.playClick();
      // Push to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(folderId);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentFolderId(folderId);
      setSelectedItem(null);
    },
    [history, historyIndex]
  );

  const goBack = () => {
    if (historyIndex > 0) {
      sounds.playClick();
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setCurrentFolderId(history[prevIdx]);
      setSelectedItem(null);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      sounds.playClick();
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setCurrentFolderId(history[nextIdx]);
      setSelectedItem(null);
    }
  };

  const goUp = useCallback(() => {
    if (currentFolder) {
      sounds.playClick();
      navigateToFolder(currentFolder.parentId);
    }
  }, [currentFolder, navigateToFolder]);

  const goHome = () => {
    sounds.playClick();
    navigateToFolder(null);
  };

  // ==========================================
  // DOUBLE-CLICK / SELECTION HANDLERS
  // ==========================================

  // Double-click folder = Open folder directory
  const handleFolderDoubleClick = useCallback(
    (folder: NotebookFolder) => {
      navigateToFolder(folder.id);
    },
    [navigateToFolder]
  );

  // Double-click note = Open note in editor
  const handleNoteDoubleClick = useCallback((note: NotebookNote) => {
    sounds.playClick();
    setOpenedNoteId(note.id);
    BrainDumpStorage.setActiveNoteId(note.id);
  }, []);

  // Enter key opens currently selected item
  const handleOpenSelected = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItem.type === 'folder') {
      const f = folders.find((item) => item.id === selectedItem.id);
      if (f) handleFolderDoubleClick(f);
    } else {
      const n = notes.find((item) => item.id === selectedItem.id);
      if (n) handleNoteDoubleClick(n);
    }
  }, [selectedItem, folders, notes, handleFolderDoubleClick, handleNoteDoubleClick]);

  // Close editor and return to file manager
  const handleCloseEditor = () => {
    sounds.playClick();
    setOpenedNoteId(null);
  };

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  // Create new folder in current directory
  const handleCreateFolder = () => {
    sounds.playClick();
    setNewFolderName('');
    setShowNewFolderModal(true);
  };

  const submitNewFolder = () => {
    if (!newFolderName.trim()) return;
    sounds.playClick();
    const created = BrainDumpStorage.createFolder(newFolderName.trim(), currentFolderId);
    const updated = BrainDumpStorage.loadFolders();
    setFolders(updated);
    setShowNewFolderModal(false);
    setNewFolderName('');
    setSelectedItem({ type: 'folder', id: created.id });
  };

  // Create new note in current directory
  const handleCreateNote = () => {
    sounds.playClick();
    const newNote: NotebookNote = {
      id: createId('note'),
      folderId: currentFolderId,
      title: 'Untitled Note',
      icon: '📝',
      accentColor: '#22C55E',
      tags: [],
      blocks: [
        { id: createId('blk'), type: 'heading1', content: 'Untitled Note' },
        { id: createId('blk'), type: 'paragraph', content: 'Type "/" for commands or start typing your notes...' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    BrainDumpStorage.saveNotebookNotes(updated);
    // Automatically open the new note into the editor
    setOpenedNoteId(newNote.id);
    BrainDumpStorage.setActiveNoteId(newNote.id);
  };

  // Rename item
  const startRename = (type: 'folder' | 'note', id: string, currentName: string) => {
    sounds.playClick();
    setRenamingItem({ type, id, currentName });
    setRenameInput(currentName);
  };

  const submitRename = () => {
    if (!renamingItem || !renameInput.trim()) return;
    sounds.playClick();

    if (renamingItem.type === 'folder') {
      const updated = folders.map((f) =>
        f.id === renamingItem.id ? { ...f, name: renameInput.trim() } : f
      );
      setFolders(updated);
      BrainDumpStorage.saveFolders(updated);
    } else {
      const target = notes.find((n) => n.id === renamingItem.id);
      if (target) {
        const updatedNote = { ...target, title: renameInput.trim() };
        handleNoteChange(updatedNote);
      }
    }
    setRenamingItem(null);
  };

  // Delete folder
  const handleDeleteFolder = (folderId: string) => {
    sounds.playClick();
    const remainingFolders = BrainDumpStorage.deleteFolder(folderId);
    const updatedNotes = BrainDumpStorage.loadNotebookNotes();
    setFolders(remainingFolders);
    setNotes(updatedNotes);
    if (selectedItem?.id === folderId) setSelectedItem(null);
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    sounds.playClick();
    const remaining = BrainDumpStorage.deleteNotebookNote(noteId);
    setNotes(remaining);
    if (selectedItem?.id === noteId) setSelectedItem(null);
    if (openedNoteId === noteId) setOpenedNoteId(null);
  };

  // Duplicate note
  const handleDuplicateNote = (noteId: string) => {
    sounds.playClick();
    const orig = notes.find((n) => n.id === noteId);
    if (!orig) return;

    const dup: NotebookNote = {
      ...orig,
      id: createId('note'),
      title: `${orig.title} (Copy)`,
      blocks: orig.blocks.map((b) => ({ ...b, id: createId('blk') })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [dup, ...notes];
    setNotes(updated);
    BrainDumpStorage.saveNotebookNotes(updated);
    setSelectedItem({ type: 'note', id: dup.id });
  };

  // Move note to another folder
  const handleMoveNote = (noteId: string, destFolderId: string | null) => {
    sounds.playClick();
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const updated = { ...target, folderId: destFolderId };
    handleNoteChange(updated);
    setMovingNoteId(null);
  };

  // Note change from editor
  const handleNoteChange = (updatedDoc: BrainDoc) => {
    const existing = notes.find((n) => n.id === updatedDoc.id);
    const updatedNote: NotebookNote = {
      ...updatedDoc,
      folderId: existing?.folderId ?? null,
      tags: existing?.tags ?? [],
    };
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setNotes(updated);
    BrainDumpStorage.saveNotebookNote(updatedNote);
  };

  // Keyboard navigation inside file manager
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (openedNoteId) {
        // Esc closes editor back to file manager
        if (e.key === 'Escape') {
          handleCloseEditor();
        }
        return;
      }

      if (e.key === 'Enter' && selectedItem) {
        handleOpenSelected();
      } else if (e.key === 'Backspace' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (currentFolderId) {
          goUp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openedNoteId, selectedItem, currentFolderId, goUp, handleOpenSelected]);

  if (!isLoaded) {
    return (
      <div className="p-12 text-center font-mono text-stone-400">
        📁 Launching Linux File Manager...
      </div>
    );
  }

  // ==========================================
  // VIEW 1: NOTE EDITOR VIEW (WHEN A FILE IS OPENED)
  // ==========================================
  if (openedNote) {
    return (
      <div className="flex-1 flex flex-col gap-4 w-full">
        {/* Linux Editor Header with Back to File Manager Button */}
        <div className="neo-card bg-[#181822] text-white p-3 sm:p-4 border-[2.5px] border-black shadow-[4px_4px_0px_#000] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCloseEditor}
              className="px-3 py-1.5 bg-[#22C55E] text-black border-2 border-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-emerald-400 active:translate-y-0.5 transition-all"
              title="Return to File Manager folder (Press Esc)"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span>Back to Files (Esc)</span>
            </button>

            {/* Breadcrumb Path in Editor */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-stone-300">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.name + idx}>
                  <button
                    type="button"
                    onClick={() => {
                      navigateToFolder(crumb.id);
                      setOpenedNoteId(null);
                    }}
                    className="hover:text-[#22C55E] hover:underline cursor-pointer"
                  >
                    {crumb.name}
                  </button>
                  {idx < breadcrumbs.length - 1 && <span className="text-stone-500">/</span>}
                </React.Fragment>
              ))}
              <span className="text-stone-500">/</span>
              <span className="text-[#FACC15] truncate max-w-[200px]">{openedNote.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 bg-black/40 border border-stone-700 text-[10px] text-stone-300 font-bold">
              100% Stored Locally
            </span>
            <button
              type="button"
              onClick={() => handleDuplicateNote(openedNote.id)}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 cursor-pointer shadow-[1px_1px_0px_#000]"
              title="Duplicate Note"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteNote(openedNote.id)}
              className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 cursor-pointer shadow-[1px_1px_0px_#000]"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* The HeatMaps block editor */}
        <BrainDumpEditor doc={openedNote} onDocChange={handleNoteChange} />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LINUX FILE MANAGER (FOLDER WORKSPACE)
  // ==========================================
  return (
    <div className="flex-1 flex flex-col md:flex-row gap-5 items-start w-full">
      {/* Linux Quick Access / Places Sidebar */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col bg-white dark:bg-[#14141C] border-[2.5px] border-black dark:border-stone-800 shadow-[4px_4px_0px_#000] overflow-hidden">
        {/* Window Chrome Title */}
        <div className="p-2.5 bg-[#FAF8F5] dark:bg-[#1C1C28] border-b-2 border-black dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185] border border-black inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] border border-black inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] border border-black inline-block" />
            <span className="font-mono text-[11px] font-black uppercase tracking-tight text-black dark:text-white ml-1">
              Places
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-500">heatmaps://fs</span>
        </div>

        {/* Places List */}
        <div className="p-2 flex flex-col gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={goHome}
            className={cn(
              'w-full text-left px-2.5 py-1.5 flex items-center gap-2 border-2 transition-all cursor-pointer shadow-[1px_1px_0px_#000]',
              currentFolderId === null
                ? 'bg-[#22C55E] text-black border-black font-black -translate-y-0.5'
                : 'bg-white dark:bg-[#1E1E2A] text-stone-700 dark:text-stone-300 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>Home (Root ~)</span>
          </button>

          <div className="px-2 pt-2 text-[10px] font-mono font-bold uppercase text-stone-500 dark:text-stone-400">
            Root Notebooks
          </div>

          {folders
            .filter((f) => f.parentId === null)
            .map((rf) => {
              const isCurrent = currentFolderId === rf.id;
              return (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => navigateToFolder(rf.id)}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 flex items-center justify-between border-2 transition-all cursor-pointer shadow-[1px_1px_0px_#000] truncate',
                    isCurrent
                      ? 'bg-[#FACC15] text-black border-black font-black -translate-y-0.5'
                      : 'bg-white dark:bg-[#1E1E2A] text-stone-700 dark:text-stone-300 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="truncate">{rf.name}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-70">
                    {notes.filter((n) => n.folderId === rf.id).length}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Sidebar Footer Info */}
        <div className="mt-auto p-2.5 bg-stone-100 dark:bg-[#181824] border-t-2 border-black dark:border-stone-800 text-[10px] font-mono text-stone-500 flex flex-col gap-1">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 stroke-[2.5]" /> Local Device FS
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">100% Offline</span>
          </div>
          <div className="text-[9px] text-stone-400">
            {folders.length} folders · {notes.length} notes
          </div>
        </div>
      </aside>

      {/* Main File Manager Window Canvas */}
      <div className="flex-1 flex flex-col gap-3 w-full min-w-0">
        {/* Linux Window Frame Header & Path Toolbar */}
        <div className="neo-card bg-[#FFFFFF] dark:bg-[#14141C] border-[2.5px] border-black dark:border-stone-800 shadow-[5px_5px_0px_#000] p-3 sm:p-4 flex flex-col gap-3">
          {/* Top Address & Navigation Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* History & Directory Controls (Back, Forward, Up, Home) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goBack}
                disabled={historyIndex <= 0}
                className="p-1.5 bg-white dark:bg-[#1E1E2A] text-black dark:text-white border-2 border-black dark:border-stone-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-[1px_1px_0px_#000] cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Go Back (History)"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={goForward}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 bg-white dark:bg-[#1E1E2A] text-black dark:text-white border-2 border-black dark:border-stone-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-[1px_1px_0px_#000] cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Go Forward (History)"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={goUp}
                disabled={currentFolderId === null}
                className="p-1.5 bg-white dark:bg-[#1E1E2A] text-black dark:text-white border-2 border-black dark:border-stone-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-[1px_1px_0px_#000] cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Go Up to Parent Directory (cd ..)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={goHome}
                className="p-1.5 bg-white dark:bg-[#1E1E2A] text-black dark:text-white border-2 border-black dark:border-stone-700 shadow-[1px_1px_0px_#000] cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Go to Root Directory (~)"
              >
                <Home className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Breadcrumb Path Bar */}
            <div className="flex-1 min-w-[200px] flex items-center gap-1 bg-stone-50 dark:bg-[#1A1A26] border-2 border-black dark:border-stone-700 px-3 py-1.5 text-xs font-mono font-bold overflow-x-auto shadow-[1px_1px_0px_#000]">
              <span className="text-stone-400 select-none">$</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.name + idx}>
                  <button
                    type="button"
                    onClick={() => navigateToFolder(crumb.id)}
                    className={cn(
                      'px-1.5 py-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors cursor-pointer',
                      idx === breadcrumbs.length - 1
                        ? 'text-black dark:text-[#22C55E] font-black underline'
                        : 'text-stone-600 dark:text-stone-300'
                    )}
                  >
                    {crumb.name}
                  </button>
                  {idx < breadcrumbs.length - 1 && <span className="text-stone-400">/</span>}
                </React.Fragment>
              ))}
            </div>

            {/* View Mode Toggle & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter directory..."
                  className="w-32 sm:w-40 text-xs pl-7 pr-2 py-1 bg-white dark:bg-[#1E1E2A] border-2 border-black dark:border-stone-700 shadow-[1px_1px_0px_#000] outline-none font-medium text-black dark:text-white"
                />
              </div>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="bg-white dark:bg-[#1E1E2A] text-black dark:text-white text-xs font-mono font-bold border-2 border-black dark:border-stone-700 px-2 py-1 shadow-[1px_1px_0px_#000] outline-none cursor-pointer"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="updated">Sort: Recent</option>
              </select>

              <div className="flex items-center border-2 border-black dark:border-stone-700 shadow-[1px_1px_0px_#000]">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 cursor-pointer transition-colors',
                    viewMode === 'grid'
                      ? 'bg-black text-[#22C55E]'
                      : 'bg-white dark:bg-[#1E1E2A] text-stone-500'
                  )}
                  title="Grid / Icons View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 cursor-pointer transition-colors border-l border-black dark:border-stone-700',
                    viewMode === 'list'
                      ? 'bg-black text-[#22C55E]'
                      : 'bg-white dark:bg-[#1E1E2A] text-stone-500'
                  )}
                  title="List / Details View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Toolbar: New Folder, New Note, Selected Actions */}
          <div className="flex items-center justify-between border-t-2 border-black dark:border-stone-800 pt-2 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-3 py-1.5 bg-[#FACC15] text-black border-2 border-black font-black flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-amber-400 active:translate-y-0.5"
              >
                <FolderPlus className="w-4 h-4 stroke-[2.5]" />
                <span>New Folder</span>
              </button>

              <button
                type="button"
                onClick={handleCreateNote}
                className="px-3 py-1.5 bg-[#22C55E] text-black border-2 border-black font-black flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-emerald-400 active:translate-y-0.5"
              >
                <FilePlus className="w-4 h-4 stroke-[2.5]" />
                <span>New Note</span>
              </button>

              <span className="text-[11px] font-mono text-stone-500 hidden sm:inline ml-2">
                💡 Double-click folder to open • Double-click note to edit
              </span>
            </div>

            {/* Context Actions for Selected Item */}
            {selectedItem && (
              <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-[#1E1E2A] p-1 border border-black dark:border-stone-700 shadow-[1px_1px_0px_#000]">
                <button
                  type="button"
                  onClick={handleOpenSelected}
                  className="px-2 py-0.5 bg-black text-[#22C55E] text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Open
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem.type === 'folder') {
                      const f = folders.find((i) => i.id === selectedItem.id);
                      if (f) startRename('folder', f.id, f.name);
                    } else {
                      const n = notes.find((i) => i.id === selectedItem.id);
                      if (n) startRename('note', n.id, n.title);
                    }
                  }}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                  title="Rename"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {selectedItem.type === 'note' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDuplicateNote(selectedItem.id)}
                      className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                      title="Duplicate Note"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMovingNoteId(movingNoteId ? null : selectedItem.id)}
                        className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                        title="Move to Folder"
                      >
                        <FolderInput className="w-3.5 h-3.5" />
                      </button>

                      {movingNoteId === selectedItem.id && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-[#1C1C28] border-2 border-black shadow-[3px_3px_0px_#000] p-1.5 z-20 flex flex-col gap-1 text-[11px] font-bold">
                          <div className="text-[10px] font-mono text-stone-500 uppercase px-1">Move to:</div>
                          <button
                            type="button"
                            onClick={() => handleMoveNote(selectedItem.id, null)}
                            className="text-left px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
                          >
                            ~ Home (Root)
                          </button>
                          {folders.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handleMoveNote(selectedItem.id, f.id)}
                              className="text-left px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-700 truncate cursor-pointer"
                            >
                              📁 {f.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem.type === 'folder') {
                      handleDeleteFolder(selectedItem.id);
                    } else {
                      handleDeleteNote(selectedItem.id);
                    }
                  }}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Directory Contents Pane (Grid vs List) */}
        <div
          onClick={(e) => {
            // Deselect when clicking canvas background
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
          className="neo-card bg-[#FFFFFF] dark:bg-[#14141C] border-[2.5px] border-black dark:border-stone-800 shadow-[5px_5px_0px_#000] p-4 sm:p-6 min-h-[480px] flex flex-col"
        >
          {currentSubfolders.length === 0 && currentNotes.length === 0 ? (
            /* Empty Directory Screen */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16 select-none">
              <div className="w-16 h-16 bg-[#FAF8F5] dark:bg-[#181824] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
                <Folder className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-base font-black uppercase tracking-tight text-black dark:text-white">
                This directory is empty
              </h3>
              <p className="text-xs text-stone-500 max-w-sm">
                Create a subfolder to organize topics, or create a note document to begin writing thoughts.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="px-3.5 py-1.5 bg-[#FACC15] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer hover:bg-amber-400"
                >
                  + New Folder
                </button>
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="px-3.5 py-1.5 bg-[#22C55E] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] cursor-pointer hover:bg-emerald-400"
                >
                  + New Note
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* ================= GRID VIEW ================= */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {/* 1. Folders in Current Directory */}
              {currentSubfolders.map((folder) => {
                const isSelected = selectedItem?.type === 'folder' && selectedItem.id === folder.id;
                const itemsCount =
                  folders.filter((f) => f.parentId === folder.id).length +
                  notes.filter((n) => n.folderId === folder.id).length;

                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedItem({ type: 'folder', id: folder.id })}
                    onDoubleClick={() => handleFolderDoubleClick(folder)}
                    className={cn(
                      'p-3.5 border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-2 relative group select-none shadow-[2px_2px_0px_#000]',
                      isSelected
                        ? 'bg-[#FACC15]/20 border-black dark:border-[#FACC15] ring-2 ring-black dark:ring-[#FACC15] -translate-y-1 shadow-[4px_4px_0px_#000]'
                        : 'bg-stone-50 dark:bg-[#1A1A26] border-black dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-[#202030] hover:-translate-y-0.5'
                    )}
                    title={`Folder: ${folder.name} (Double-click to open)`}
                  >
                    {/* Big Folder Graphic */}
                    <div className="w-14 h-12 flex items-center justify-center relative">
                      <Folder
                        className="w-12 h-12 text-amber-500 fill-amber-400 stroke-black drop-shadow-[2px_2px_0px_#000]"
                        strokeWidth={1.5}
                      />
                      <span className="absolute bottom-0 right-0 text-[10px] font-mono font-black bg-black text-white px-1 border border-black leading-none">
                        {itemsCount}
                      </span>
                    </div>

                    {/* Folder Name */}
                    <span className="text-xs font-black text-black dark:text-stone-100 line-clamp-2 break-words leading-tight">
                      {folder.name}
                    </span>

                    <span className="text-[9px] font-mono font-bold text-stone-500 uppercase mt-auto">
                      Folder
                    </span>

                    {/* Hover Double-click Tooltip */}
                    <div className="absolute inset-x-1 bottom-1 bg-black text-[#22C55E] text-[9px] font-mono font-bold py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
                      Double-click to open
                    </div>
                  </div>
                );
              })}

              {/* 2. Notes in Current Directory */}
              {currentNotes.map((note) => {
                const isSelected = selectedItem?.type === 'note' && selectedItem.id === note.id;
                const wordCount = note.blocks.reduce(
                  (acc, b) => acc + (b.content ? b.content.split(/\s+/).filter(Boolean).length : 0),
                  0
                );

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedItem({ type: 'note', id: note.id })}
                    onDoubleClick={() => handleNoteDoubleClick(note)}
                    className={cn(
                      'p-3.5 border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-2 relative group select-none shadow-[2px_2px_0px_#000]',
                      isSelected
                        ? 'bg-[#22C55E]/20 border-black dark:border-[#22C55E] ring-2 ring-black dark:ring-[#22C55E] -translate-y-1 shadow-[4px_4px_0px_#000]'
                        : 'bg-white dark:bg-[#1E1E2A] border-black dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-[#232332] hover:-translate-y-0.5'
                    )}
                    title={`Document: ${note.title} (Double-click to edit)`}
                  >
                    {/* Big Document Graphic */}
                    <div className="w-14 h-12 flex items-center justify-center relative">
                      <div className="w-10 h-12 bg-white dark:bg-stone-800 border-2 border-black flex flex-col justify-between p-1 shadow-[2px_2px_0px_#000]">
                        <span className="text-sm select-none leading-none">{note.icon || '📝'}</span>
                        <div className="flex flex-col gap-0.5 w-full">
                          <span className="h-0.5 w-full bg-stone-300 dark:bg-stone-600 block" />
                          <span className="h-0.5 w-3/4 bg-stone-300 dark:bg-stone-600 block" />
                        </div>
                      </div>
                    </div>

                    {/* Note Title */}
                    <span className="text-xs font-black text-black dark:text-stone-100 line-clamp-2 break-words leading-tight">
                      {note.title || 'Untitled Note'}
                    </span>

                    {/* Note Meta */}
                    <span className="text-[9px] font-mono text-stone-500 mt-auto">
                      {wordCount}w · {note.blocks.length}b
                    </span>

                    {/* Hover Double-click Tooltip */}
                    <div className="absolute inset-x-1 bottom-1 bg-black text-[#22C55E] text-[9px] font-mono font-bold py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
                      Double-click to edit
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= LIST VIEW ================= */
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b-2 border-black dark:border-stone-700 text-stone-500 font-bold uppercase text-[10px]">
                    <th className="pb-2 pl-2">Name</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Size / Items</th>
                    <th className="pb-2">Last Modified</th>
                    <th className="pb-2 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Folders in List */}
                  {currentSubfolders.map((folder) => {
                    const isSelected = selectedItem?.type === 'folder' && selectedItem.id === folder.id;
                    const itemsCount =
                      folders.filter((f) => f.parentId === folder.id).length +
                      notes.filter((n) => n.folderId === folder.id).length;

                    return (
                      <tr
                        key={folder.id}
                        onClick={() => setSelectedItem({ type: 'folder', id: folder.id })}
                        onDoubleClick={() => handleFolderDoubleClick(folder)}
                        className={cn(
                          'border-b border-stone-200 dark:border-stone-800 transition-colors cursor-pointer select-none',
                          isSelected
                            ? 'bg-[#FACC15]/20 font-black'
                            : 'hover:bg-stone-50 dark:hover:bg-[#1A1A26]'
                        )}
                      >
                        <td className="py-2.5 pl-2 font-black flex items-center gap-2">
                          <Folder className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                          <span className="truncate">{folder.name}</span>
                        </td>
                        <td className="py-2.5 text-stone-500 font-bold uppercase text-[10px]">
                          Folder
                        </td>
                        <td className="py-2.5 text-stone-600 dark:text-stone-400">
                          {itemsCount} items
                        </td>
                        <td className="py-2.5 text-stone-400 text-[10px]">
                          {new Date(folder.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleFolderDoubleClick(folder)}
                            className="px-2 py-0.5 bg-black text-[#22C55E] text-[10px] font-black uppercase"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Notes in List */}
                  {currentNotes.map((note) => {
                    const isSelected = selectedItem?.type === 'note' && selectedItem.id === note.id;
                    const wordCount = note.blocks.reduce(
                      (acc, b) => acc + (b.content ? b.content.split(/\s+/).filter(Boolean).length : 0),
                      0
                    );

                    return (
                      <tr
                        key={note.id}
                        onClick={() => setSelectedItem({ type: 'note', id: note.id })}
                        onDoubleClick={() => handleNoteDoubleClick(note)}
                        className={cn(
                          'border-b border-stone-200 dark:border-stone-800 transition-colors cursor-pointer select-none',
                          isSelected
                            ? 'bg-[#22C55E]/20 font-black'
                            : 'hover:bg-stone-50 dark:hover:bg-[#1A1A26]'
                        )}
                      >
                        <td className="py-2.5 pl-2 font-black flex items-center gap-2">
                          <span className="text-sm select-none">{note.icon || '📝'}</span>
                          <span className="truncate">{note.title || 'Untitled Note'}</span>
                        </td>
                        <td className="py-2.5 text-stone-500 font-bold uppercase text-[10px]">
                          Markdown Doc
                        </td>
                        <td className="py-2.5 text-stone-600 dark:text-stone-400">
                          {wordCount} words · {note.blocks.length} blocks
                        </td>
                        <td className="py-2.5 text-stone-400 text-[10px]">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleNoteDoubleClick(note)}
                            className="px-2 py-0.5 bg-black text-[#22C55E] text-[10px] font-black uppercase"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Linux Status Bar at Bottom */}
          <div className="mt-auto pt-3 border-t-2 border-black dark:border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-500">
            <span>
              {currentSubfolders.length} folders, {currentNotes.length} notes in current directory
            </span>

            {selectedItem ? (
              <span className="text-black dark:text-white font-bold">
                Selected: {selectedItem.type === 'folder' ? '📁 Folder' : '📝 Document'}
              </span>
            ) : (
              <span>Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Folder */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#181824] border-3 border-black p-5 shadow-[6px_6px_0px_#000] flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <FolderPlus className="w-5 h-5 text-amber-500" />
              <h4 className="font-black text-sm uppercase">Create New Folder</h4>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono font-bold uppercase text-stone-500">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewFolder();
                  if (e.key === 'Escape') setShowNewFolderModal(false);
                }}
                autoFocus
                placeholder="e.g. Distributed Systems"
                className="w-full text-xs font-bold border-2 border-black px-2.5 py-1.5 outline-none bg-stone-50 dark:bg-stone-800 text-black dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1 text-xs font-bold border-2 border-black bg-stone-200 hover:bg-stone-300 text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNewFolder}
                className="px-3 py-1 text-xs font-black border-2 border-black bg-[#22C55E] hover:bg-emerald-400 text-black shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rename Item */}
      {renamingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#181824] border-3 border-black p-5 shadow-[6px_6px_0px_#000] flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <Edit2 className="w-5 h-5 text-[#22C55E]" />
              <h4 className="font-black text-sm uppercase">Rename {renamingItem.type}</h4>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono font-bold uppercase text-stone-500">
                New Name
              </label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename();
                  if (e.key === 'Escape') setRenamingItem(null);
                }}
                autoFocus
                className="w-full text-xs font-bold border-2 border-black px-2.5 py-1.5 outline-none bg-stone-50 dark:bg-stone-800 text-black dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                className="px-3 py-1 text-xs font-bold border-2 border-black bg-stone-200 hover:bg-stone-300 text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRename}
                className="px-3 py-1 text-xs font-black border-2 border-black bg-[#22C55E] hover:bg-emerald-400 text-black shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
