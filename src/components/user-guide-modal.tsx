// Step-by-Step User Guide Modal Component
'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  FolderPlus, 
  Layers, 
  FileCheck, 
  Camera, 
  UserCheck, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    step: 1,
    title: 'Create & Select Organization (Company)',
    page: 'Header Company Switcher / Super Admin Panel',
    icon: Building2,
    clickText: 'Click on top-right Company Switcher dropdown',
    mandatory: 'Company Name, Currency, Default Language',
    whatHappens: 'Sets up multi-tenant data isolation and applies company branding (custom logo and header/footer reports).'
  },
  {
    step: 2,
    title: 'Create New Project',
    page: 'Projects Explorer (/villas)',
    icon: FolderPlus,
    clickText: 'Click "+ Create Project" button',
    mandatory: 'Project Name, Project Code, Project Type (e.g. Villa Compound, Hotel, Mall), Level Structure',
    whatHappens: 'Initializes a new enterprise project container with custom structural level definitions.'
  },
  {
    step: 3,
    title: 'Add Villas / Blocks / Towers',
    page: 'Project Hierarchy Tree / Structure Settings',
    icon: Layers,
    clickText: 'Click "+ Add Level 1 Node" inside Project Details',
    mandatory: 'Node Name (e.g. Villa 01, Tower A)',
    whatHappens: 'Creates top-level location nodes in the project hierarchy tree.'
  },
  {
    step: 4,
    title: 'Add Units / Floors',
    page: 'Project Location Tree',
    icon: Layers,
    clickText: 'Expand Villa 01 and click "+ Add Sub Node"',
    mandatory: 'Unit Name (e.g. Unit G, Unit 1, Floor 2)',
    whatHappens: 'Nests residential units or floor sections under the parent villa or tower.'
  },
  {
    step: 5,
    title: 'Add Rooms & Common Facilities',
    page: 'Project Location Tree',
    icon: Layers,
    clickText: 'Click "+ Add Room / Facility" under Unit G or Root',
    mandatory: 'Room Name (e.g. Kitchen, Hall, Electrical DB, Gym, Pump Room)',
    whatHappens: 'Establishes specific inspection spaces where defects and checklists will be recorded.'
  },
  {
    step: 6,
    title: 'Create Master Inspection Template',
    page: 'Master Inspection Templates (/templates)',
    icon: FileCheck,
    clickText: 'Click "+ Create Template" button',
    mandatory: 'Category Name (e.g. Plumbing, MEP), Audit Item Title',
    whatHappens: 'Adds a standardized QC audit checkpoint to the central library.'
  },
  {
    step: 7,
    title: 'Assign Template to Project',
    page: 'Master Inspection Templates (/templates)',
    icon: FileCheck,
    clickText: 'Click Link / Assign button on template row',
    mandatory: 'Select target project checkboxes',
    whatHappens: 'Makes the audit template available during site inspections for the selected project.'
  },
  {
    step: 8,
    title: 'Open Project Workspace',
    page: 'Projects Explorer (/villas)',
    icon: FolderPlus,
    clickText: 'Click "View Details & Inspection Tree" on Izdihar Project card',
    mandatory: 'Active Project Selection',
    whatHappens: 'Loads the interactive project inspection workspace and document vault.'
  },
  {
    step: 9,
    title: 'Select Villa / Level 1 Node',
    page: 'Project Hierarchy Tree Sidebar',
    icon: Layers,
    clickText: 'Click "Villa 01" in the left-hand navigation tree',
    mandatory: 'None',
    whatHappens: 'Filters defect items and overall completion metrics to Villa 01.'
  },
  {
    step: 10,
    title: 'Select Unit & Room Space',
    page: 'Project Location Tree',
    icon: Layers,
    clickText: 'Expand Villa 01 ➔ Select "Unit G" ➔ Select "Kitchen"',
    mandatory: 'Room Node Selection',
    whatHappens: 'Displays the specific snag logs and checklist responses for the Kitchen in Unit G.'
  },
  {
    step: 11,
    title: 'Create Snag Defect Item',
    page: 'Inspection Space (/villas/[id])',
    icon: AlertTriangle,
    clickText: 'Click "+ Create Snag Item" button',
    mandatory: 'Category, Title, Description, Priority (Low, Medium, High, Critical)',
    whatHappens: 'Logs a new defect record in the database with status "Open".'
  },
  {
    step: 12,
    title: 'Upload Inspection Photos',
    page: 'Snag Detail Drawer',
    icon: Camera,
    clickText: 'Click on Snag Item ➔ Select "Upload Before Photo"',
    mandatory: 'Photo File / Mock Image URL',
    whatHappens: 'Attaches evidence photos (Before / After) to the inspection record.'
  },
  {
    step: 13,
    title: 'Assign Contractor',
    page: 'Snag Detail Drawer',
    icon: UserCheck,
    clickText: 'Select "Assigned Contractor" dropdown (e.g. Saudi Construction Co.)',
    mandatory: 'Contractor Selection',
    whatHappens: 'Dispatches task notification to the contractor for rectification.'
  },
  {
    step: 14,
    title: 'Assign QA/QC Engineer & Target Date',
    page: 'Snag Detail Drawer',
    icon: UserCheck,
    clickText: 'Select Engineer & Target Due Date calendar picker',
    mandatory: 'Target Completion Date',
    whatHappens: 'Sets SLA deadline and assigns inspector for verification.'
  },
  {
    step: 15,
    title: 'Update Status to "In Progress"',
    page: 'Snag Table / Detail Drawer',
    icon: CheckCircle2,
    clickText: 'Click Status Badge ➔ Change from "Open" to "In Progress"',
    mandatory: 'Status Selection',
    whatHappens: 'Tracks contractor site rectification progress.'
  },
  {
    step: 16,
    title: 'Upload After Photo & Close Snag',
    page: 'Snag Detail Drawer',
    icon: CheckCircle2,
    clickText: 'Upload "After Photo" ➔ Click "Close Snag & Verify"',
    mandatory: 'Closed By Inspector Name, Sign-off',
    whatHappens: 'Marks snag as "Closed", updates room completion rate, and reflects in PDF/Excel reports.'
  }
];

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = STEPS[activeStepIndex];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">Complete End-to-End User Guide</h3>
              <p className="text-xs text-muted-foreground">Step-by-step manual for Snag & QC Inspection Management</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 border-b border-border">
            {STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setActiveStepIndex(idx)}
                className={`w-7 h-7 shrink-0 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                  idx === activeStepIndex
                    ? 'bg-primary text-primary-foreground scale-110 shadow-md ring-2 ring-primary/30'
                    : idx < activeStepIndex
                    ? 'bg-success/20 text-success border border-success/30'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {s.step}
              </button>
            ))}
          </div>

          {/* Current Step Card */}
          <div className="bg-muted/30 border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/15 text-primary">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/15">
                  Step {currentStep.step} of 16
                </span>
                <h4 className="text-lg font-black text-foreground mt-1">{currentStep.title}</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Target Page / Screen:</span>
                <span className="font-semibold text-primary">{currentStep.page}</span>
              </div>

              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">What to Click:</span>
                <span className="font-semibold text-foreground">{currentStep.clickText}</span>
              </div>
            </div>

            <div className="p-3 bg-card border border-border rounded-xl text-xs space-y-1">
              <span className="font-bold text-muted-foreground uppercase text-[10px] block">Mandatory Fields / Inputs:</span>
              <p className="font-medium text-foreground">{currentStep.mandatory}</p>
            </div>

            <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl text-xs space-y-1">
              <span className="font-bold text-primary uppercase text-[10px] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> System Execution & Next Step:
              </span>
              <p className="font-medium text-foreground/90 leading-relaxed">{currentStep.whatHappens}</p>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-border bg-muted/40 flex items-center justify-between">
          <button
            disabled={activeStepIndex === 0}
            onClick={() => setActiveStepIndex(prev => prev - 1)}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Step
          </button>

          <span className="text-xs font-bold text-muted-foreground">
            {activeStepIndex + 1} / {STEPS.length}
          </span>

          <button
            disabled={activeStepIndex === STEPS.length - 1}
            onClick={() => setActiveStepIndex(prev => prev + 1)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
