// ...squelette de test...
import { render } from '@testing-library/react';
import WalletContext from '../components/WalletContext';
describe('WalletContext', () => {
  it('devrait rendre le provider sans crash', () => {
    render(<WalletContext.Provider value={{}}><div>Test</div></WalletContext.Provider>);
  });
});
// ...squelette de test...