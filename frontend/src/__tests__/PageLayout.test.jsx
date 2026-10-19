// ...squelette de test...
import { render } from '@testing-library/react';
import PageLayout from '../components/PageLayout';
describe('PageLayout', () => {
  it('devrait rendre sans crash', () => {
    render(<PageLayout><div>Test</div></PageLayout>);
  });
});
// ...squelette de test...