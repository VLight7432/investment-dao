// ...squelette de test...
import { render } from '@testing-library/react';
import Breadcrumbs from '../components/Breadcrumbs';
describe('Breadcrumbs', () => {
  it('devrait rendre sans crash', () => {
    render(<Breadcrumbs />);
  });
});
// ...squelette de test...