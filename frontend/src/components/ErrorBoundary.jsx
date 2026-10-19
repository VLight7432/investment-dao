import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <main className="page-main">
          <div className="notice notice-error" role="alert">
            <div>
              <strong>La page n’a pas pu être affichée.</strong>
              <span>Actualisez la page ou revenez à l’accueil. Aucun changement n’a été envoyé à la DAO.</span>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
