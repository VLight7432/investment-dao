// ...squelette de test...
import { render } from '@testing-library/react';
import DeFiActionsPage from '../pages/DeFiActionsPage';
describe('DeFiActionsPage', () => {
  it('devrait rendre sans crash', () => {
    render(<DeFiActionsPage />);
  });
});
// ...squelette de test...