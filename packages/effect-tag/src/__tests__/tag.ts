import { it } from '@effect/vitest';
import { Tag } from '../..';
import { Effect } from 'effect';

class SomeTag1 extends Tag<SomeTag1>()('SomeTag1', {
  effect: Effect.fn(function* () {
    return {
      someValue: 'hello'
    }
  }),
}) { };

class SomeTag2 extends Tag<SomeTag2, {
  someValue: number;
}>()('SomeTag2', {
  effect: Effect.fn(function* (multiplier: number) {
    return {
      someValue: 123 * multiplier
    }
  }),
}) { };

class SomeTag3 extends Tag<SomeTag3, {
  someValue: number;
}>()('SomeTag3', {
}) { };

it.scoped("test 1", () => Effect.gen(function* () {

  const someTag1 = SomeTag1.make()
  const someTag2 = SomeTag2.make(123)
  // const someTag3 = SomeTag3.make()




  const a = Effect.Tag('')<
    Test1,
    { hi: string }
  >();
  class Test1 extends a { }

  class Test2 extends Effect.Service<Test2>()('b', {
    effect: Effect.fn(function* () {
      return {
        hi: 'hello',
      }
    }),
  }) { }

  class Test3 extends Tag<Test3>()('Test3', {
    effect: Effect.fn(function* (hi?: number) {
      return {
        hi: 'hello',
      }
    }),
  }) { }

}));


// type uuh = Test3['hi']
// Test3.make()

// Effect.gen(function* () {
//   const test3 = yield* Test3;
//   return test3.hi;
// })

