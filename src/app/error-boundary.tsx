import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; label?: string }
interface State { error: Error | null }

/** Route-level boundary: one panel failing must not take down the app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[UrbanFlux:${this.props.label ?? "boundary"}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="demo-watermark rounded-sm p-6 m-4">
          <p className="font-mono2 text-[10px] tracking-[0.2em] text-heat">SIGNAL LOST — {this.props.label ?? "PANEL"}</p>
          <p className="mt-2 font-head text-sm text-bone/80">{this.state.error.message}</p>
          <button
            className="mt-3 font-mono2 text-[11px] tracking-[0.15em] underline underline-offset-4 hover:text-solar"
            onClick={() => this.setState({ error: null })}
          >
            RETRY PANEL
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
