// Dynamic Project Hierarchy Level Builder Component
'use client';

import React from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Building2, 
  Home, 
  Sparkles,
  Check
} from 'lucide-react';

interface HierarchyBuilderProps {
  levels: string[];
  onChange: (levels: string[]) => void;
}

const PRESETS = [
  {
    name: 'Residential Villa Compound',
    levels: ['Block', 'Villa', 'Unit', 'Room/Area']
  },
  {
    name: 'Apartment Building',
    levels: ['Tower', 'Floor', 'Apartment', 'Room']
  },
  {
    name: 'Hotel Project',
    levels: ['Building', 'Floor', 'Suite', 'Room']
  },
  {
    name: 'Hospital Project',
    levels: ['Building', 'Floor', 'Department', 'Room']
  },
  {
    name: 'Shopping Mall',
    levels: ['Block', 'Floor', 'Shop']
  },
  {
    name: 'Industrial Plant / Warehouse',
    levels: ['Zone', 'Aisle', 'Rack']
  }
];

export const HierarchyBuilder: React.FC<HierarchyBuilderProps> = ({ levels, onChange }) => {
  const handleAddLevel = () => {
    onChange([...levels, `Level ${levels.length + 1}`]);
  };

  const handleUpdateLevel = (index: number, val: string) => {
    const updated = [...levels];
    updated[index] = val;
    onChange(updated);
  };

  const handleRemoveLevel = (index: number) => {
    if (levels.length <= 1) return;
    onChange(levels.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...levels];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === levels.length - 1) return;
    const updated = [...levels];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-4 bg-muted/20 border border-border p-4 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            Dynamic Hierarchy Level Builder
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">Define structural depth and custom node names for this project type.</p>
        </div>

        <button
          type="button"
          onClick={handleAddLevel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-all border border-primary/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Level
        </button>
      </div>

      {/* 1. Preset Quick Selectors */}
      <div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-warning" /> Quick Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isMatch = preset.levels.join(', ') === levels.join(', ');
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(preset.levels)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
                  isMatch
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-foreground hover:bg-muted'
                }`}
              >
                {isMatch && <Check className="w-3 h-3" />}
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Level Adder List */}
      <div className="space-y-2 pt-2">
        {levels.map((lvl, index) => (
          <div key={index} className="flex items-center gap-2 bg-card border border-border p-2 rounded-xl shadow-sm">
            <span className="w-6 h-6 rounded-lg bg-muted text-muted-foreground text-[10px] font-black flex items-center justify-center shrink-0">
              L{index + 1}
            </span>

            <input
              type="text"
              required
              value={lvl}
              onChange={(e) => handleUpdateLevel(index, e.target.value)}
              placeholder={`Level ${index + 1} Name (e.g. Villa, Floor, Room)`}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => handleMoveUp(index)}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={index === levels.length - 1}
                onClick={() => handleMoveDown(index)}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={levels.length <= 1}
                onClick={() => handleRemoveLevel(index)}
                className="p-1 text-danger hover:text-danger/80 disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Chain */}
      <div className="p-2.5 bg-card border border-border rounded-xl text-xs flex items-center gap-2">
        <span className="font-bold text-muted-foreground text-[10px] uppercase">Hierarchy Chain:</span>
        <span className="font-extrabold text-primary">{levels.join(' ➔ ')}</span>
      </div>
    </div>
  );
};
