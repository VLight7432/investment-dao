// ...squelette de test...
import { render } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';
describe('ErrorBoundary', () => {
  it('devrait rendre sans crash', () => {
    render(<ErrorBoundary><div>Test</div></ErrorBoundary>);
  });
});
// ...squelette de test...