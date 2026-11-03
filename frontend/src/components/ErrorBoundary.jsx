import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error) {
    console.error("Erreur d’affichage de la DApp", error);
  }
  reset = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <main className="page-main">
          <div className="notice notice-error" role="alert">
            <div>
              <strong>La page n’a pas pu être affichée.</strong>
              <span>Réessayez ou actualisez la page. Aucun changement n’a été envoyé à la DAO.</span>
            </div>
            <button type="button" className="button button-secondary" onClick={this.reset}>Réessayer</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
