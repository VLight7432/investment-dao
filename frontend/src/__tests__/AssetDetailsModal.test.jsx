// ...squelette de test...
import { render } from '@testing-library/react';
import AssetDetailsModal from '../components/AssetDetailsModal';
describe('AssetDetailsModal', () => {
  it('devrait rendre le modal fermé sans crash', () => {
    render(<AssetDetailsModal open={false} asset={null} onClose={() => {}} />);
  });
});
// ...squelette de test...