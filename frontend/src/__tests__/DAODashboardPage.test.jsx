// ...squelette de test...
import { render } from '@testing-library/react';
import DAODashboardPage from '../pages/DAODashboardPage';
describe('DAODashboardPage', () => {
  it('devrait rendre sans crash', () => {
    render(<DAODashboardPage />);
  });
});
// ...squelette de test...