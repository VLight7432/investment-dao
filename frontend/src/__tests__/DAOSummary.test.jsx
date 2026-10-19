// ...squelette de test...
import { render } from '@testing-library/react';
import DAOSummary from '../components/DAOSummary';
describe('DAOSummary', () => {
  it('devrait rendre sans crash', () => {
    render(<DAOSummary />);
  });
});
// ...squelette de test...