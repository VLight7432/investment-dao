// ...squelette de test...
import { render } from '@testing-library/react';
import NFTTradingPage from '../pages/NFTTradingPage';
describe('NFTTradingPage', () => {
  it('devrait rendre sans crash', () => {
    render(<NFTTradingPage />);
  });
});
// ...squelette de test...