// ...squelette de test...
import { render } from '@testing-library/react';
import WalletConnect from '../components/WalletConnect';
describe('WalletConnect', () => {
  it('devrait rendre sans crash', () => {
    render(<WalletConnect />);
  });
});
// ...squelette de test...