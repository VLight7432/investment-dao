// ...squelette de test...
import { render } from '@testing-library/react';
import Modal from '../components/Modal';
describe('Modal', () => {
  it('devrait rendre le modal fermé sans crash', () => {
    render(<Modal open={false} onClose={() => {}} />);
  });
});
// ...squelette de test...