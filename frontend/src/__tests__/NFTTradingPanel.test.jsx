// ...squelette de test...
import { render } from '@testing-library/react';
import NFTTradingPanel from '../components/NFTTradingPanel';
describe('NFTTradingPanel', () => {
  it('devrait rendre sans crash', () => {
    render(<NFTTradingPanel provider={null} addNotification={() => {}} />);
  });
});
// ...squelette de test...