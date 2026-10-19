// ...squelette de test...
import { render } from '@testing-library/react';
import FiltersPanel from '../components/FiltersPanel';
describe('FiltersPanel', () => {
  it('devrait rendre sans crash', () => {
    render(<FiltersPanel filters={{ category: "", status: "", search: "" }} setFilters={() => {}} />);
  });
});
// ...squelette de test...