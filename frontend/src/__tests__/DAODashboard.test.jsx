// ...squelette de test...
import { render } from '@testing-library/react';
import DAODashboard from '../components/DAODashboard';
describe('DAODashboard', () => {
  it('devrait rendre sans crash', () => {
    render(<DAODashboard />);
  });
});
// ...squelette de test...