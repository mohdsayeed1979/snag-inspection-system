// In-Application QA/QC Training Center Page with 16 Interactive Modules
'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  CheckCircle2, 
  Building2, 
  Layers, 
  FileCheck, 
  ClipboardCheck, 
  AlertCircle, 
  UserCheck, 
  Camera, 
  FileSpreadsheet, 
  FileText, 
  ArrowRight,
  BookOpen,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface TrainingModule {
  id: number;
  title: string;
  category: 'Setup' | 'Inspection' | 'Contractor & Reinspection' | 'Reporting';
  icon: any;
  purpose: string;
  whenToUse: string;
  buttonToClick: string;
  requiredFields: string;
  example: string;
  expectedResult: string;
}

const MODULES: TrainingModule[] = [
  {
    id: 1,
    title: '1. Create / Manage Company',
    category: 'Setup',
    icon: Building2,
    purpose: 'Establishes multi-tenant organization branding, header logos, and tenant isolation.',
    whenToUse: 'When onboarding a new enterprise client or subsidiary company.',
    buttonToClick: 'Tenant Switcher (Header) ➔ "+ Add New Company / Organization"',
    requiredFields: 'Company Name, Organization Code, Primary Contact Email',
    example: 'Default Organization (ID: c0000000-0000-0000-0000-000000000000)',
    expectedResult: 'Creates isolated database space and branded inspection headers.'
  },
  {
    id: 2,
    title: '2. Create Enterprise Project',
    category: 'Setup',
    icon: Building2,
    purpose: 'Registers project code, client details, contractor firms, and schedule dates.',
    whenToUse: 'At project kickoff before structural site inspections commence.',
    buttonToClick: 'Projects Explorer (`/villas`) ➔ "Launch 5-Min Project Setup Wizard"',
    requiredFields: 'Project Name, Project Code, Project Type, Client, Main Contractor',
    example: 'Izdihar Villa Project (Code: IZD-001, Residential Compound)',
    expectedResult: 'Project record initialized and visible in Project Explorer Hub.'
  },
  {
    id: 3,
    title: '3. Configure Project Hierarchy',
    category: 'Setup',
    icon: Layers,
    purpose: 'Defines custom N-level location tree depth tailored to project architecture.',
    whenToUse: 'During Project Wizard Step 2 or inside Project Details ➔ Hierarchy Builder.',
    buttonToClick: 'Hierarchy Builder ➔ "+ Add Level" or Select Quick Presets',
    requiredFields: 'Level 1 Name, Level 2 Name, Level 3 Name (e.g. Block ➔ Villa ➔ Unit ➔ Room)',
    example: 'Residential Villa Presets: Level 1: Villa, Level 2: Unit, Level 3: Room/Area',
    expectedResult: 'Dynamic hierarchy tree structure saved for automated node generation.'
  },
  {
    id: 4,
    title: '4. Assign Master Inspection Template',
    category: 'Setup',
    icon: FileCheck,
    purpose: 'Links standardized QC audit checkpoints to the project location spaces.',
    whenToUse: 'Before generating site inspection checklists.',
    buttonToClick: 'Project Details (`/villas/[id]`) ➔ Assigned Templates Tab ➔ "Assign Template"',
    requiredFields: 'Master Template selection (1 BHK, 2 BHK, MEP, Civil, Plumbing)',
    example: 'Assigning "Standard Kitchen QC Checklist Suite (v2.1)" to Izdihar Project',
    expectedResult: 'Template checkpoints linked to room categories across the project.'
  },
  {
    id: 5,
    title: '5. Generate Automated Inspection Checklist',
    category: 'Setup',
    icon: Sparkles,
    purpose: 'Procedurally creates room-level inspection checkpoints for every room across all units.',
    whenToUse: 'After assigning master templates to populate room inspection suites.',
    buttonToClick: 'Project Details ➔ Templates Tab ➔ "Generate Inspection Checklists (1-Click)"',
    requiredFields: 'None (Automatic 1-click execution)',
    example: 'Generates 920 Room Checkpoints for 120 Units (30 Villas)',
    expectedResult: 'Every room is populated with PASS/FAIL/NA audit checkpoints ready for inspectors.'
  },
  {
    id: 6,
    title: '6. Start Site QA/QC Inspection',
    category: 'Inspection',
    icon: ClipboardCheck,
    purpose: 'Launches live room inspection space to verify construction quality on site.',
    whenToUse: 'When conducting physical site quality walks in villas or units.',
    buttonToClick: 'Project Explorer Tree ➔ Select Villa 01 ➔ Ground Floor ➔ Unit 01 ➔ Kitchen',
    requiredFields: 'Location Node selection',
    example: 'Opening "Villa 01 ➔ Unit G ➔ Kitchen"',
    expectedResult: 'Renders room audit checkpoints (Sink, Countertop, Cabinets, Exhaust Fan).'
  },
  {
    id: 7,
    title: '7. Mark PASS / FAIL / N/A Inspection Checkpoints',
    category: 'Inspection',
    icon: CheckCircle2,
    purpose: 'Records formal quality verification decision for each room checkpoint item.',
    whenToUse: 'While physically inspecting each checkpoint item in a room.',
    buttonToClick: 'Room Checkpoints Suite ➔ Click "PASS", "FAIL", or "N/A" badge button',
    requiredFields: 'PASS/FAIL/NA selection',
    example: 'Marking "Sink Installation" as PASS and "Water Leakage" as FAIL',
    expectedResult: 'PASS/NA saves status instantly. FAIL opens Auto-Snag Logger.'
  },
  {
    id: 8,
    title: '8. Automatic Snag Creation on Failure',
    category: 'Inspection',
    icon: AlertCircle,
    purpose: 'Automatically instantiates a linked Snag Defect Item whenever a checkpoint fails.',
    whenToUse: 'Triggered automatically when the Engineer clicks "FAIL" on any checkpoint.',
    buttonToClick: 'Fail Checkpoint Modal ➔ "Create Snag & Mark Failed"',
    requiredFields: 'Snag Title, Defect Description, Priority, Due Date, Assigned Contractor',
    example: 'Title: "FAILED: Water Leakage under Kitchen Sink", Priority: High',
    expectedResult: 'Snag item created with unique tracking ID (SNAG-IZD-0001) linked to checkpoint.'
  },
  {
    id: 9,
    title: '9. Assign Sub-Contractor Firm',
    category: 'Contractor & Reinspection',
    icon: UserCheck,
    purpose: 'Delegates snag rectification responsibility to specific trade contractor.',
    whenToUse: 'During automatic snag creation or when editing open defects.',
    buttonToClick: 'Auto-Snag Form / Snag Details Drawer ➔ Assigned Contractor dropdown',
    requiredFields: 'Contractor Firm Name, SLA Completion Due Date',
    example: 'Assigned to: "Saudi Construction Co. (Plumbing Division)"',
    expectedResult: 'Contractor receives notification and sees defect in contractor dashboard.'
  },
  {
    id: 10,
    title: '10. Upload Photo Before (Defect Evidence)',
    category: 'Inspection',
    icon: Camera,
    purpose: 'Captures photographic proof of non-conformance prior to repair.',
    whenToUse: 'When logging a failed checkpoint snag item.',
    buttonToClick: 'Fail Snag Modal ➔ Photo Before URL input / Demo Image button',
    requiredFields: 'Photo Before Image URL / Camera capture',
    example: 'Photo URL: https://images.unsplash.com/photo-1581094288338...',
    expectedResult: 'Before Photo attached to snag record for audit comparison.'
  },
  {
    id: 11,
    title: '11. Contractor Upload Photo After (Rectification)',
    category: 'Contractor & Reinspection',
    icon: Camera,
    purpose: 'Contractor submits proof of repair works completed on site.',
    whenToUse: 'After contractor repairs the defect and requests reinspection.',
    buttonToClick: 'Room Checkpoint Snag Bar ➔ "Contractor Upload Fix"',
    requiredFields: 'Photo After Image URL, Contractor Work Notes',
    example: 'Photo After URL + Note: "Replaced defective silicone seal and pressure tested."',
    expectedResult: 'Status updated to "Rectified - Ready for QA/QC Reinspection".'
  },
  {
    id: 12,
    title: '12. QA/QC Engineer Reinspection',
    category: 'Contractor & Reinspection',
    icon: ClipboardCheck,
    purpose: 'Engineer verifies repair quality by side-by-side comparison of Before & After photos.',
    whenToUse: 'When reviewing rectified defects submitted by contractor.',
    buttonToClick: 'Room Checkpoint Snag Bar ➔ "Approve & Close" or "Reject Fix"',
    requiredFields: 'Reinspection Decision (Approve / Reject)',
    example: 'Engineer verifies new photo evidence and approves repair.',
    expectedResult: 'Approve closes snag & marks checkpoint PASS. Reject returns snag to contractor.'
  },
  {
    id: 13,
    title: '13. Close Snag Item',
    category: 'Contractor & Reinspection',
    icon: CheckCircle2,
    purpose: 'Final sign-off closing defect item after successful reinspection.',
    whenToUse: 'When repair work fully satisfies contract quality standards.',
    buttonToClick: 'Snag Details Drawer ➔ Change Status to "Closed"',
    requiredFields: 'Sign-off approval',
    example: 'SNAG-IZD-0001 marked Closed with timestamp',
    expectedResult: 'Snag closed, completion rate updated, logged in audit timeline.'
  },
  {
    id: 14,
    title: '14. Generate QA/QC Executive Reports',
    category: 'Reporting',
    icon: FileText,
    purpose: 'Produces formal quality audit documentation for clients and consultants.',
    whenToUse: 'For weekly progress meetings, handovers, or contractor SLA reviews.',
    buttonToClick: 'Project Space ➔ "Export Quality Audit Report" button',
    requiredFields: 'Report Format, Orientation, Inclusion Options',
    example: 'Generating Full Snag Inspection Matrix Report',
    expectedResult: 'Formatted report generated with before/after photos and comments.'
  },
  {
    id: 15,
    title: '15. Export PDF Quality Inspection Report',
    category: 'Reporting',
    icon: FileText,
    purpose: 'Exports high-resolution printable PDF inspection certificate.',
    whenToUse: 'For physical signing and formal handover documentation.',
    buttonToClick: 'Export Modal ➔ Select "PDF Report" ➔ "Generate File"',
    requiredFields: 'Paper Size (A4/Letter), Page Orientation (Portrait/Landscape)',
    example: 'A4 Portrait PDF Report with embedded defect photos',
    expectedResult: 'Downloadable PDF document with branded company headers.'
  },
  {
    id: 16,
    title: '16. Export Excel Data Matrix',
    category: 'Reporting',
    icon: FileSpreadsheet,
    purpose: 'Exports raw inspection dataset for commercial analysis and claim claims.',
    whenToUse: 'When analyzing contractor performance or importing into ERP systems.',
    buttonToClick: 'Export Modal ➔ Select "Excel Matrix" ➔ "Generate File"',
    requiredFields: 'Excel format selection',
    example: '.XLSX spreadsheet containing all 5,373 snag records',
    expectedResult: 'Downloadable Excel workbook with structured columns.'
  }
];

export default function TrainingCenterPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModule, setActiveModule] = useState<TrainingModule | null>(MODULES[0]);

  const filteredModules = MODULES.filter(m => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            In-Application Learning Center
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">QA/QC Training & Standard Operating Guide</h1>
          <p className="text-sm text-muted-foreground">Interactive step-by-step guidance for site inspectors, engineers, and sub-contractors.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
            16 Interactive Modules
          </span>
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="p-4 bg-card border border-border rounded-2xl flex flex-col md:flex-row items-center gap-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search training modules by topic, action, or button..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['all', 'Setup', 'Inspection', 'Contractor & Reinspection', 'Reporting'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background border border-border text-foreground hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Training View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Modules List */}
        <div className="lg:col-span-1 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
          {filteredModules.map(mod => {
            const Icon = mod.icon;
            const isSelected = activeModule?.id === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => setActiveModule(mod)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md'
                    : 'bg-card border-border hover:border-primary/40'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase text-primary tracking-widest">{mod.category}</span>
                  <h4 className="text-xs font-extrabold text-foreground truncate mt-0.5">{mod.title}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{mod.purpose}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Module Instruction Card */}
        <div className="lg:col-span-2">
          {activeModule ? (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-md space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  {React.createElement(activeModule.icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest px-2 py-0.5 rounded bg-primary/10">
                    Module {activeModule.id} of 16 • {activeModule.category}
                  </span>
                  <h2 className="text-lg font-extrabold text-foreground mt-1">{activeModule.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-1">
                  <span className="font-extrabold text-primary uppercase text-[10px] block">🎯 Purpose</span>
                  <p className="text-foreground leading-relaxed font-semibold">{activeModule.purpose}</p>
                </div>

                <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-1">
                  <span className="font-extrabold text-primary uppercase text-[10px] block">🕒 When to Use</span>
                  <p className="text-foreground leading-relaxed font-semibold">{activeModule.whenToUse}</p>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-1 md:col-span-2">
                  <span className="font-extrabold text-primary uppercase text-[10px] block">🖱️ Which Button to Click</span>
                  <p className="text-foreground font-black text-sm">{activeModule.buttonToClick}</p>
                </div>

                <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-1">
                  <span className="font-extrabold text-muted-foreground uppercase text-[10px] block">📝 Mandatory / Required Fields</span>
                  <p className="text-foreground font-medium">{activeModule.requiredFields}</p>
                </div>

                <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-1">
                  <span className="font-extrabold text-muted-foreground uppercase text-[10px] block">💡 Real Example</span>
                  <p className="text-foreground font-medium">{activeModule.example}</p>
                </div>

                <div className="p-4 bg-success/10 border border-success/25 rounded-2xl space-y-1 md:col-span-2">
                  <span className="font-extrabold text-success uppercase text-[10px] block">✅ Expected System Result</span>
                  <p className="text-foreground font-extrabold">{activeModule.expectedResult}</p>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground">
              Select a training module on the left to view instructions.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
