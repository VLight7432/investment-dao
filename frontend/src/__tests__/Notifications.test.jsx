// ...squelette de test...
import { render } from '@testing-library/react';
import Notifications from '../components/Notifications';
describe('Notifications', () => {
  it('devrait rendre sans crash', () => {
    render(<Notifications />);
  });
});
// ...squelette de test...