import {
  Component,
  useMemo,
  type ErrorInfo,
  type ReactNode,
} from "react";

interface WebGLGuardProps {
  readonly children: ReactNode;
}

interface WebGLErrorBoundaryProps {
  readonly children: ReactNode;
}

interface WebGLErrorBoundaryState {
  readonly failed: boolean;
}

function WebGLFallback() {
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        minHeight: "420px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "620px",
          textAlign: "center",
          padding: "28px",
          border: "1px solid currentColor",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          3D visualization unavailable
        </h2>

        <p>
          This browser could not create the WebGL graphics context
          required for the 3D scene.
        </p>

        <p style={{ marginBottom: 0 }}>
          Use a WebGL-capable browser with hardware acceleration
          enabled, then reload the page.
        </p>
      </div>
    </div>
  );
}

class WebGLErrorBoundary extends Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  public state: WebGLErrorBoundaryState = {
    failed: false,
  };

  public static getDerivedStateFromError():
    WebGLErrorBoundaryState {
    return {
      failed: true,
    };
  }

  public componentDidCatch(
    error: Error,
    info: ErrorInfo,
  ): void {
    console.error(
      "3D visualization failed to initialize.",
      error,
      info,
    );
  }

  public render() {
    if (this.state.failed) {
      return <WebGLFallback />;
    }

    return this.props.children;
  }
}

function browserSupportsWebGL(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    const canvas =
      document.createElement("canvas");

    return Boolean(
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

export function WebGLGuard({
  children,
}: WebGLGuardProps) {
  const supported =
    useMemo(
      browserSupportsWebGL,
      [],
    );

  if (!supported) {
    return <WebGLFallback />;
  }

  return (
    <WebGLErrorBoundary>
      {children}
    </WebGLErrorBoundary>
  );
}
