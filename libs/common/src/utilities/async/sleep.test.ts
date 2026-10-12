import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sleep } from './sleep.js';

describe('sleep', () => {

  // Fake timers instead of comparing `Date.now()` readings, which is flaky: `setTimeout` can fire a millisecond early.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should sleep for the specified amount of time', async () => {
    // Given
    let resolved = false;
    const promise = sleep(100).then(() => {
      resolved = true;
    });

    // When
    await vi.advanceTimersByTimeAsync(99);

    // Then
    expect(resolved).toBe(false);

    // When
    await vi.advanceTimersByTimeAsync(1);
    await promise;

    // Then
    expect(resolved).toBe(true);
  });

});
