// ...squelette de test...
import { render, screen } from '@testing-library/react';
import AssetGrid from '../components/AssetGrid';
describe('AssetGrid', () => {
  it('devrait rendre une liste d’assets', () => {
    const assets = [
      { id: 1, title: 'Asset 1', image: '', price: '1' },
      { id: 2, title: 'Asset 2', image: '', price: '2' }
    ];
    render(<AssetGrid assets={assets} />);
    expect(screen.getByText('Asset 1')).toBeInTheDocument();
    expect(screen.getByText('Asset 2')).toBeInTheDocument();
  });
});
// ...squelette de test...