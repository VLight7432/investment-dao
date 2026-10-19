// ...squelette de test...
import { render } from '@testing-library/react';
import DAOActions from '../components/DAOActions';
describe('DAOActions', () => {
  it('devrait rendre sans crash', () => {
    render(<DAOActions provider={null} addNotification={() => {}} />);
  });
});
// ...squelette de test...