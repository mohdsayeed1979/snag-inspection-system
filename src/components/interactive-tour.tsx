// Interactive Guided Tour Component
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Play, 
  HelpCircle,
  Building2,
  ClipboardCheck,
  GraduationCap
} from 'lucide-react';

interface TourStep {
  step: number;
  title: string;
  target: string;
  description: string;
  actionHint: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    title: 'Welcome to QA/QC Inspection Platform!',
    target: 'Header',
    description: 'This is an enterprise platform where snags are automatically generated only when a formal inspection checkpoint FAILS.',
    actionHint: 'Click Next to explore key features.'
  },
  {
    step: 2,
    title: '5-Minute Project Setup Wizard',
    target: 'Wizard Button',
    description: 'Use the 6-Step Wizard to set up projects, define custom hierarchy (Villa ➔ Floor ➔ Unit ➔ Room), and generate room checklists in 1 click.',
    actionHint: 'Click "Launch 5-Min Project Setup Wizard" in Projects Explorer.'
  },
  {
    step: 3,
    title: 'Interactive Project Location Tree',
    target: 'Project Tree',
    description: 'Browse hierarchical depth (30 Villas ➔ 120 Units ➔ 920 Rooms) and view completion percentages for every level.',
    actionHint: 'Click any node to open specific room inspection suites.'
  },
  {
    step: 4,
    title: 'Room PASS / FAIL / N/A Checkpoints',
    target: 'Checkpoints Suite',
    description: 'Inspectors mark PASS, FAIL, or N/A on every room checkpoint. Clicking FAIL opens the Auto-Snag Logger.',
    actionHint: 'Marking FAIL creates a linked Snag Item automatically.'
  },
  {
    step: 5,
    title: 'Contractor Fix & Reinspection',
    target: 'Contractor Repair',
    description: 'Sub-contractors upload After Photo evidence, and Engineers reinspect to Approve (Close Snag) or Reject fix.',
    actionHint: 'Inspect side-by-side Before/After photos.'
  },
  {
    step: 6,
    title: 'In-App Training Center',
    target: 'Training Center',
    description: 'Access 16 interactive step-by-step training modules with exact buttons, required fields, and examples.',
    actionHint: 'Click "Training Center" in navigation sidebar anytime.'
  }
];

interface InteractiveTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ forceOpen = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }

    const hasSeen = localStorage.getItem('snaglist_tour_completed');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('snaglist_tour_completed', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const active = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border-2 border-primary rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-primary tracking-wider">
            <Sparkles className="w-4 h-4 text-warning" />
            Interactive Platform Tour ({active.step} of {TOUR_STEPS.length})
          </div>

          <button onClick={handleComplete} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-foreground">{active.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{active.description}</p>
        </div>

        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs font-semibold text-primary">
          <span className="font-extrabold block uppercase text-[9px]">Target Focus:</span>
          {active.actionHint}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            disabled={currentStep === 0}
            onClick={handlePrev}
            className="px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-30"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${idx === currentStep ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center gap-1 shadow"
          >
            {currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
