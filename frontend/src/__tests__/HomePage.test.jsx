// ...squelette de test...
import { render } from '@testing-library/react';
import HomePage from '../pages/HomePage';
describe('HomePage', () => {
  it('devrait rendre sans crash', () => {
    render(<HomePage />);
  });
});
// ...squelette de test...