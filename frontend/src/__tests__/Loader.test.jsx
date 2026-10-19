// ...squelette de test...
import { render } from '@testing-library/react';
import Loader from '../components/Loader';
describe('Loader', () => {
  it('devrait rendre sans crash', () => {
    render(<Loader />);
  });
});
// ...squelette de test...