// ...squelette de test...
import { render } from '@testing-library/react';
import SettingsPage from '../pages/SettingsPage';
describe('SettingsPage', () => {
  it('devrait rendre sans crash', () => {
    render(<SettingsPage />);
  });
});
// ...squelette de test...