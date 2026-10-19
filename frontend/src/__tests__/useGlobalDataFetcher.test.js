import { renderHook } from '@testing-library/react';
import { useGlobalDataFetcher } from '../hooks/useGlobalDataFetcher';
describe('useGlobalDataFetcher', () => {
  it('devrait s\'exécuter sans erreur', () => {
    const { result } = renderHook(() => useGlobalDataFetcher(async () => ({ status: "ok" })));
    expect(result.current).toBeDefined();
  });
});