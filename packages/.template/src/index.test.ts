import { test, expect } from 'vitest';
import { message } from '..';

test('message', () => {
  expect(message).toBe('Hello, world!');
});
