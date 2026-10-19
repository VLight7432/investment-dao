// ...squelette de test...
import { render } from '@testing-library/react';
import QuarterlyReportsPanel from '../components/QuarterlyReportsPanel';
describe('QuarterlyReportsPanel', () => {
  it('devrait rendre sans crash', () => {
    render(<QuarterlyReportsPanel provider={null} />);
  });
});
// ...squelette de test...