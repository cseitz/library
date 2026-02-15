import { fn } from '../index';
import { it } from '@effect/vitest';
import { Console, Effect } from 'effect';
import { Error } from '@cseitz/effect-error';

class Err1 extends Error('Err1')() {
}

class SomeClass1 {
  message = 'hello';

  baseFunction = Effect.fn('baseFn', {
    attributes: {
      heya: 'baseFn attribute'
    }
  })(function* () {
    // yield* Console.log('baseFunction', this);
    // yield* Console.trace();
    // yield* new Err1('hello');
    // yield* Effect.die('baseFunction oof')

  });

  someFunction1 = fn('someFunction1', {
    attributes: {
      heya: 'someFunction1 attribute'
    }
  })(this, function* (num?: number) {
    yield* this.baseFunction();
    yield* Console.log('someClass1#someFunction1', this);
    // yield* Console.trace();
    // yield* new Err1('hello');
    // yield* this.baseFunction();
    // yield* Effect.die('oof')
    return { message: this.message, num };
  });

  /** heya */
  someFunction2 = fn(this, function* (num?: number) {
    const result = yield* this.someFunction1(num);
    return { result };
  });

  // woah = {
  //   someFunction3: fn(this, function* (num?: number) {
  //     console.log('someFunction3', this);
  //     const result = yield* this.someFunction2(num);
  //     return { result };
  //   }),
  // }
}

class SomeClass1B extends SomeClass1 {

  override someFunction1 = fn(this, function* (num?: number) {
    return { message: this.message, num, additional: 'ok' };
  });

}

class SomeTag1 extends Effect.Tag('SomeTag1')<SomeTag1, {
  message: string;
}>() {

}

class SomeTag2 extends Effect.Tag('SomeTag2')<SomeTag2, {
  message: string;
}>() {

}

it.effect("test fn 1", () => Effect.gen(function* () {
  const class1 = new SomeClass1();

  const result = yield* class1.someFunction2();
  yield* Console.log('result', result);
}));

it.effect("test fn 2", () => Effect.gen(function* () {
  const class1 = new SomeClass1B();

  const result = yield* class1.someFunction2();
  yield* Console.log('result', result);
}));

// it.effect("test fn 3", () => Effect.gen(function* () {
  
// }));

fn(
  'domain/tenants/service/implementation#getRawTenantByIdOrSlug'
)(this, function* (idOrSlug: string) {
  // const db = yield* Postgres;
  // const tx = yield* Postgres.Transaction;
  return {}
}, (effect, ...args) => {
  const a = effect;
  return a;
})

fn(
  'domain/tenants/service/implementation#getRawTenantByIdOrSlug'
)(this, function* (idOrSlug: string) {
  // const db = yield* Postgres;
  // const tx = yield* Postgres.Transaction;
  return {}
}, (
  (effect, n) => {
    const a = Effect.delay(effect, `${123 / 100} seconds`);
    return a;
  }
))

// SomeTag2['Identifier']

type a = InstanceType<(typeof SomeClass1)>

// const permtest0 = fn.input<{ id: string }>()({ someClass1: SomeClass1 })

// it.effect("test fn input", () => Effect.gen(function* () {

//   const permtest1 = fn.input('name1')<{ id: string }>()({ someTag1: SomeTag1, someTag2: SomeTag2 })(function* (input) {
//     console.log('permtest1', input);
//   })

//   // permtest1({ id: '123' })
//   const a = permtest1({ id: '123' }).pipe(
//     Effect.provideService(SomeTag1, SomeTag1.of({ message: 'tag1' })),
//     Effect.provideService(SomeTag2, SomeTag2.of({ message: 'tag2' }))
//   );
//   yield* a;

//   const b = permtest1({ id: '123', someTag1: SomeTag1.of({ message: 'hello' }) }).pipe(
//     Effect.provideService(SomeTag2, SomeTag2.of({ message: 'tag2' }))
//   );
//   // yield* b;

//   // yield* permtest1({ id: '123', someTag2: SomeTag2.of({ message: 'hello' }) })
//   // yield* permtest1({ id: '123', someTag1: SomeTag1.of({ message: 'hello' }), someTag2: SomeTag2.of({ message: 'hello' }) })

// }));
