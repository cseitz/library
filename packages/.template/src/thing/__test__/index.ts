import { test, expect } from 'vitest';
import { makeThing } from '../../thing';

test('makeThing', () => {
  expect(makeThing()).toBe({
    id: expect.any(String),
    name: expect.any(String),
    description: expect.any(String),
  });
});
