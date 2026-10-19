// ...squelette de test...
import { render } from '@testing-library/react';
import NotificationsContext from '../components/NotificationsContext';
describe('NotificationsContext', () => {
  it('devrait rendre le provider sans crash', () => {
    render(<NotificationsContext.Provider value={{}}><div>Test</div></NotificationsContext.Provider>);
  });
});
// ...squelette de test...