'use client';

import React, { useState } from 'react';
import { DatabaseData, DatabaseRow, DatabaseColumn } from '@/lib/braindump/types';
import { createId } from '@/lib/braindump/storage';
import { Plus, Trash2, Clock, AlertTriangle, Tag, Calendar } from 'lucide-react';

interface DatabaseBlockProps {
  data: DatabaseData;
  onChange: (newData: DatabaseData) => void;
}

export const DatabaseBlock: React.FC<DatabaseBlockProps> = ({ data, onChange }) => {
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DatabaseColumn['type']>('text');

  const updateTitle = (newTitle: string) => {
    onChange({ ...data, title: newTitle });
  };

  const updateCell = (rowId: string, colId: string, value: string) => {
    const updatedRows = data.rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: {
            ...row.cells,
            [colId]: value,
          },
        };
      }
      return row;
    });
    onChange({ ...data, rows: updatedRows });
  };

  const addRow = () => {
    const newRow: DatabaseRow = {
      id: createId('row'),
      cells: {},
    };
    // Pre-populate with reasonable defaults
    for (const col of data.columns) {
      if (col.type === 'status') newRow.cells[col.id] = 'Todo';
      else if (col.type === 'priority') newRow.cells[col.id] = 'Medium';
      else if (col.type === 'date') newRow.cells[col.id] = new Date().toISOString().split('T')[0];
      else newRow.cells[col.id] = '';
    }
    onChange({ ...data, rows: [...data.rows, newRow] });
  };

  const deleteRow = (rowId: string) => {
    onChange({ ...data, rows: data.rows.filter((r) => r.id !== rowId) });
  };

  const addColumn = () => {
    if (!newColName.trim()) return;
    const colId = createId('col');
    const newCol: DatabaseColumn = {
      id: colId,
      name: newColName.trim(),
      type: newColType,
    };
    onChange({
      ...data,
      columns: [...data.columns, newCol],
    });
    setNewColName('');
    setShowAddCol(false);
  };

  const deleteColumn = (colId: string) => {
    if (data.columns.length <= 1) return; // Keep at least one column
    onChange({
      ...data,
      columns: data.columns.filter((c) => c.id !== colId),
    });
  };

  // Stats calculation
  const totalRows = data.rows.length;
  const statusCol = data.columns.find((c) => c.type === 'status');
  const doneRows = statusCol
    ? data.rows.filter((r) => r.cells[statusCol.id]?.toLowerCase() === 'done').length
    : 0;
  const donePercent = totalRows > 0 ? Math.round((doneRows / totalRows) * 100) : 0;

  const STATUS_OPTIONS = [
    { label: 'Todo', color: 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200' },
    { label: 'In Progress', color: 'bg-[#FACC15] text-black font-bold' },
    { label: 'Done', color: 'bg-[#22C55E] text-black font-bold' },
    { label: 'Stuck', color: 'bg-[#FB7185] text-black font-bold' },
  ];

  const PRIORITY_OPTIONS = [
    { label: 'Low', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' },
    { label: 'Medium', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' },
    { label: 'High', color: 'bg-orange-200 dark:bg-orange-900/50 text-orange-950 dark:text-orange-200 font-bold' },
    { label: 'Critical', color: 'bg-red-500 text-white font-black' },
  ];

  return (
    <div className="my-3 border-2 border-black dark:border-stone-700 bg-white dark:bg-[#161620] shadow-[4px_4px_0px_#000] overflow-hidden">
      {/* Table Header Bar */}
      <div className="px-4 py-2.5 bg-stone-100 dark:bg-[#1F1F2C] border-b-2 border-black dark:border-stone-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-base">🗃️</span>
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="font-black text-sm sm:text-base text-black dark:text-white bg-transparent border-none outline-none focus:ring-1 focus:ring-black px-1"
            placeholder="Database title..."
          />
        </div>

        <div className="flex items-center gap-2">
          {totalRows > 0 && statusCol && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-[#161620] border border-black text-xs font-mono font-bold">
              <span>{doneRows}/{totalRows} Done</span>
              <div className="w-16 h-2 bg-stone-200 dark:bg-stone-700 border border-black overflow-hidden">
                <div
                  className="h-full bg-[#22C55E] transition-all duration-300"
                  style={{ width: `${donePercent}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#22C55E] text-black border border-black text-xs font-black shadow-[1.5px_1.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer hover:bg-[#16A34A]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Row</span>
          </button>
        </div>
      </div>

      {/* Responsive Table Scroll Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-50 dark:bg-[#1C1C28] border-b-2 border-black dark:border-stone-700 font-mono text-[11px] uppercase tracking-wider text-stone-600 dark:text-stone-300">
              <th className="py-2 px-3 w-10 text-center border-r border-black/20 dark:border-stone-700">#</th>
              {data.columns.map((col) => (
                <th key={col.id} className="py-2 px-3 border-r border-black/20 dark:border-stone-700 font-black">
                  <div className="flex items-center justify-between gap-1 group">
                    <span className="flex items-center gap-1">
                      {col.type === 'status' && <Clock className="w-3 h-3 text-[#FACC15]" />}
                      {col.type === 'priority' && <AlertTriangle className="w-3 h-3 text-[#FB7185]" />}
                      {col.type === 'tag' && <Tag className="w-3 h-3 text-sky-400" />}
                      {col.type === 'date' && <Calendar className="w-3 h-3 text-emerald-400" />}
                      {col.name}
                    </span>
                    {data.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteColumn(col.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 cursor-pointer ml-1"
                        title="Delete column"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="py-2 px-2 w-12 text-center">
                <button
                  type="button"
                  onClick={() => setShowAddCol(true)}
                  className="text-stone-500 hover:text-black dark:hover:text-white font-bold cursor-pointer"
                  title="Add new column"
                >
                  <Plus className="w-3.5 h-3.5 mx-auto" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50/60 dark:hover:bg-[#1B1B26] transition-colors group"
              >
                <td className="py-2 px-2 text-center text-stone-400 font-mono text-[10px] border-r border-black/10 dark:border-stone-800">
                  {index + 1}
                </td>

                {data.columns.map((col) => {
                  const val = row.cells[col.id] || '';

                  return (
                    <td
                      key={col.id}
                      className="py-1.5 px-3 border-r border-black/10 dark:border-stone-800 align-middle"
                    >
                      {col.type === 'status' ? (
                        <select
                          value={val || 'Todo'}
                          onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                          className={`text-xs px-2 py-0.5 border border-black font-bold cursor-pointer transition-colors outline-none ${
                            STATUS_OPTIONS.find((s) => s.label === val)?.color || 'bg-stone-100 dark:bg-stone-800'
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.label} value={opt.label} className="bg-white dark:bg-stone-900 text-black dark:text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : col.type === 'priority' ? (
                        <select
                          value={val || 'Medium'}
                          onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                          className={`text-xs px-2 py-0.5 border border-black font-semibold cursor-pointer transition-colors outline-none ${
                            PRIORITY_OPTIONS.find((p) => p.label === val)?.color || 'bg-stone-100 dark:bg-stone-800'
                          }`}
                        >
                          {PRIORITY_OPTIONS.map((opt) => (
                            <option key={opt.label} value={opt.label} className="bg-white dark:bg-stone-900 text-black dark:text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : col.type === 'date' ? (
                        <input
                          type="date"
                          value={val}
                          onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                          className="text-xs bg-transparent border border-transparent hover:border-black dark:hover:border-stone-600 focus:border-black px-1 py-0.5 outline-none font-mono"
                        />
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                          placeholder="Empty..."
                          className="w-full text-xs bg-transparent border border-transparent hover:border-black/30 dark:hover:border-stone-700 focus:border-black dark:focus:border-stone-400 focus:bg-white dark:focus:bg-[#1E1E2C] px-1.5 py-0.5 outline-none text-black dark:text-stone-100"
                        />
                      )}
                    </td>
                  );
                })}

                <td className="py-1 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => deleteRow(row.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-all cursor-pointer"
                    title="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Column Popup Modal/Inline Bar */}
      {showAddCol && (
        <div className="p-3 bg-amber-50 dark:bg-[#20202F] border-t-2 border-black dark:border-stone-700 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase text-black dark:text-white">New Column:</span>
          <input
            type="text"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="Column Name (e.g. Estimate, Notes)"
            className="text-xs px-2 py-1 border-2 border-black dark:border-stone-600 bg-white dark:bg-[#161620] outline-none"
            autoFocus
          />
          <select
            value={newColType}
            onChange={(e) => setNewColType(e.target.value as DatabaseColumn['type'])}
            className="text-xs px-2 py-1 border-2 border-black dark:border-stone-600 bg-white dark:bg-[#161620] font-bold outline-none cursor-pointer"
          >
            <option value="text">Text</option>
            <option value="status">Status (Select)</option>
            <option value="priority">Priority</option>
            <option value="tag">Tag</option>
            <option value="date">Date</option>
          </select>
          <button
            type="button"
            onClick={addColumn}
            className="px-2.5 py-1 bg-[#22C55E] text-black border-2 border-black text-xs font-bold shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowAddCol(false)}
            className="px-2 py-1 bg-stone-200 dark:bg-stone-700 text-black dark:text-white border-2 border-black text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="px-3 py-2 bg-stone-50 dark:bg-[#181824] border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-500">
        <span>{totalRows} records</span>
        <button
          type="button"
          onClick={addRow}
          className="text-black dark:text-stone-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add item
        </button>
      </div>
    </div>
  );
};
