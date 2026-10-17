import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 border-2 border-rose-200 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-lg font-black text-slate-900 mb-2">
              એપ્લિકેશન લોડ કરવામાં સમસ્યા આવી
            </h1>

            <p className="text-xs text-slate-600 font-medium mb-6 leading-relaxed">
              બ્રાઉઝર કેશ અથવા ડેટા ફોર્મેટમાં ફેરફારને કારણે પેજ લોડ થઈ શક્યું નથી. નીચે આપેલા બટન પર ક્લિક કરીને એપ ફરીથી ચાલુ કરી શકો છો:
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ફરી પ્રયાસ કરો (Reload)</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>કેશ સાફ કરી નવેસરથી ખોલો (Clear Cache & Reset)</span>
              </button>
            </div>

            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-[10px] text-slate-400 cursor-pointer text-center">
                  ટેકનિકલ વિગત જુઓ
                </summary>
                <pre className="mt-2 text-[10px] bg-slate-50 p-2 rounded text-slate-700 overflow-x-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
