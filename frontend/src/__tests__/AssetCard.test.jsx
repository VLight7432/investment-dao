// ...squelette de test...
import { render, screen } from '@testing-library/react';
import AssetCard from '../components/AssetCard';
describe('AssetCard', () => {
  it('devrait rendre sans crash', () => {
    render(<AssetCard asset={{ id: 1, title: 'Test', image: '', price: '1' }} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
// ...squelette de test...