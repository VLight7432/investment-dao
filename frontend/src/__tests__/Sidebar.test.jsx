// ...squelette de test...
import { render } from '@testing-library/react';
import Sidebar from '../components/Sidebar';
describe('Sidebar', () => {
  it('devrait rendre sans crash', () => {
    render(<Sidebar />);
  });
});
// ...squelette de test...