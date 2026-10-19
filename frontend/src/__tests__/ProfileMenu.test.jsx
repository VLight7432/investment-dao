// ...squelette de test...
import { render } from '@testing-library/react';
import ProfileMenu from '../components/ProfileMenu';
describe('ProfileMenu', () => {
  it('devrait rendre sans crash', () => {
    render(<ProfileMenu />);
  });
});
// ...squelette de test...