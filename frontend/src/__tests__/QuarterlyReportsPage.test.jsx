// ...squelette de test...
import { render } from '@testing-library/react';
import QuarterlyReportsPage from '../pages/QuarterlyReportsPage';
describe('QuarterlyReportsPage', () => {
  it('devrait rendre sans crash', () => {
    render(<QuarterlyReportsPage />);
  });
});
// ...squelette de test...