// Interactive Expandable & Collapsible Project Explorer Tree Component
'use client';

import React, { useState } from 'react';
import { ProjectNode } from '@/lib/db';
import { 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  Home, 
  DoorClosed, 
  Wrench, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface ProjectExplorerTreeProps {
  nodes: ProjectNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export const ProjectExplorerTree: React.FC<ProjectExplorerTreeProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    nodes.forEach(n => { allExpanded[n.id] = true; });
    setExpandedNodes(allExpanded);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const getNodeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'villa': case 'building': case 'block': return <Building2 className="w-4 h-4 text-primary" />;
      case 'unit': case 'flat': case 'floor': return <Home className="w-4 h-4 text-accent" />;
      case 'room/area': case 'room': return <DoorClosed className="w-4 h-4 text-muted-foreground" />;
      case 'facility': case 'common facility': default: return <Wrench className="w-4 h-4 text-warning" />;
    }
  };

  // Build root nodes (parent_id === null)
  const rootNodes = nodes.filter(n => n.parent_id === null);

  const renderNode = (node: ProjectNode, level: number = 0) => {
    const children = nodes.filter(n => n.parent_id === node.id);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div 
          onClick={() => onSelectNode(node.id)}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          className={`flex items-center justify-between py-2 pr-3 rounded-xl cursor-pointer text-xs font-semibold transition-all ${
            isSelected 
              ? 'bg-primary text-primary-foreground font-bold shadow-sm' 
              : 'hover:bg-muted/60 text-foreground'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {hasChildren ? (
              <button 
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-0.5 rounded hover:bg-black/10 transition-all"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {getNodeIcon(node.node_type)}
            <span className="truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              isSelected 
                ? 'bg-primary-foreground/20 text-primary-foreground' 
                : 'bg-muted border border-border text-muted-foreground'
            }`}>
              {node.completion_rate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Project Explorer Tree
        </h4>

        <div className="flex items-center gap-1">
          <button 
            onClick={expandAll}
            title="Expand All Levels"
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold transition-all flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" />
            Expand
          </button>
          <button 
            onClick={collapseAll}
            title="Collapse All Levels"
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold transition-all flex items-center gap-1"
          >
            <Minimize2 className="w-3 h-3" />
            Collapse
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
        {rootNodes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No structure nodes found in project.</p>
        ) : (
          rootNodes.map(root => renderNode(root, 0))
        )}
      </div>
    </div>
  );
};
