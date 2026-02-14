import { it } from '@effect/vitest';
import { Error } from '../index';
import { Effect } from 'effect';


it.scoped("test 1", () => Effect.gen(function* () {

  class SomeError1 extends Error('SomeError1')<SomeError1, {
    someValue: string;
  }>() {}

  let didCatch = false;
  yield* Effect.gen(function* () {
    return yield* new SomeError1({
      message: 'hello',
      someValue: 'world',
    })
  }).pipe(
    Effect.catchAll(err => {
      didCatch = true;
      return Effect.succeed(err.message);
    })
  );

  expect(didCatch).toBe(true);

}));

