import React from "react";

interface Props {
  errorMessage?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.errorMessage ?? "Something went wrong"}</>;
    }

    return this.props.children;
  }
}
