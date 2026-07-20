// React Error Boundary for Project Setup Wizard Component
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ProjectWizardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[QA/QC Wizard Error Boundary Captured]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-danger/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-danger">
              <div className="p-2.5 bg-danger/10 rounded-2xl">
                <ShieldAlert className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Project Wizard Runtime Issue Intercepted</h3>
                <p className="text-xs text-muted-foreground">The wizard encountered an isolated render exception.</p>
              </div>
            </div>

            <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-2 text-xs">
              <span className="font-extrabold text-danger block uppercase text-[10px]">Technical Details:</span>
              <p className="font-mono text-foreground break-words">{this.state.error?.message || 'Unknown runtime error'}</p>

              {this.state.errorInfo?.componentStack && (
                <details className="mt-2 text-[10px] text-muted-foreground">
                  <summary className="cursor-pointer font-bold hover:text-foreground">Component Stack Trace</summary>
                  <pre className="mt-1 p-2 bg-background border border-border rounded-xl overflow-x-auto font-mono text-[9px] max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-card border border-border text-foreground font-bold text-xs rounded-xl hover:bg-muted transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Projects
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Wizard Initialization
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
