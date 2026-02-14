import { test, expect } from 'vitest';
import { createResolvablePromise } from '..';

test('createResolvablePromise', () => {
  const promise = createResolvablePromise();
  expect(promise).toBeDefined();
});

test('createResolvablePromise resolves', async () => {
  const promise = createResolvablePromise<string>();
  promise.resolve('resolved');
  const result = await promise;
  expect(result).toBe('resolved');
});

test('createResolvablePromise rejects', async () => {
  const promise = createResolvablePromise();
  promise.reject(new Error('rejected'));
  await expect(promise).rejects.toThrow('rejected');
});
