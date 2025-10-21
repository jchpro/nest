import { sleep } from './sleep';

describe('sleep', () => {

  it('should sleep for the specified amount of time', async () => {
    // Given
    const now = Date.now();

    // When
    await sleep(100);
    const after = Date.now();

    // Then
    expect(after - now).toBeGreaterThanOrEqual(100);
  });

});
