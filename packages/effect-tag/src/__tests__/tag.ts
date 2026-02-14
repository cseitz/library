import { it } from '@effect/vitest';
import { Tag } from '../index';
import { Effect, Layer } from 'effect';

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

class SomeTag4 extends Tag<SomeTag4>()('SomeTag4', {
  accessors: true,
  effect: Effect.fn(function* (multiplier: number) {
    return {
      getSomeValue: function() {
        return 123 * multiplier;
      },
    }
  }),
}) { };

class SomeTag5 extends Tag<SomeTag5, {
  /** hi there */
  getSomeValue: () => number;
}>()('SomeTag5', {
  accessors: true,
  effect: Effect.fn(function* (multiplier: number) {
    return {
      getSomeValue: function() {
        return 123 * multiplier;
      },
    }
  }),
}) { };

class SomeTag6 extends Tag<SomeTag6, {
  /** hi there */
  getSomeValue: () => number;
}>()('SomeTag6', {
  accessors: true,
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

it.scoped("test accessors 1", () => Effect.gen(function* () {
  // const someTag4 = SomeTag4.make(123)
  const someValue = yield* SomeTag4.getSomeValue()
  return someValue
}).pipe(
  Effect.provide(SomeTag4.make.asLayer(123))
))

it.scoped("test accessors 2", () => Effect.gen(function* () {
  // const someTag4 = SomeTag4.make(123)
  const someValue = yield* SomeTag5.getSomeValue()
  return someValue
}).pipe(
  Effect.provide(
    Layer.effect(SomeTag5, Effect.gen(function* () {
      return {
        getSomeValue: function() {
          return 123;
        },
      }
    }))
  )
))

it.scoped("test accessors 3", () => Effect.gen(function* () {
  // const someTag4 = SomeTag4.make(123)
  const someValue = yield* SomeTag6.getSomeValue()
  return someValue
}).pipe(
  Effect.provide(
    Layer.effect(SomeTag6, Effect.gen(function* () {
      return {
        getSomeValue: function() {
          return 123;
        },
      }
    }))
  )
))


// type uuh = Test3['hi']
// Test3.make()

// Effect.gen(function* () {
//   const test3 = yield* Test3;
//   return test3.hi;
// })

