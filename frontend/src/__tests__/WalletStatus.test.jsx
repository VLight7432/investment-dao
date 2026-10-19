// ...squelette de test...
import { render } from '@testing-library/react';
import WalletStatus from '../components/WalletStatus';
describe('WalletStatus', () => {
  it('devrait rendre sans crash', () => {
    render(<WalletStatus />);
  });
});
// ...squelette de test...