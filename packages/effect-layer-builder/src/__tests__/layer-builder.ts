import { expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import { Tag } from '@cseitz/effect-tag';
import { LayerBuilder } from '../index';

class SomeMessage1 extends Tag<SomeMessage1>()('SomeMessage1', {
  effect: Effect.fn(function* (msg: string) {
    return {
      message: msg,
    }
  }),
}) {}


class SomeMultiplier1 extends Tag<SomeMultiplier1>()('SomeMultiplier1', {
  effect: Effect.fn(function* (multiplier: number) {
    return {
      multiplier: multiplier,
    }
  }),
}) {}

class SomeNumber1 extends Tag<SomeNumber1>()('SomeNumber1', {
  effect: Effect.fn(function* (num: number) {
    const { multiplier } = yield* SomeMultiplier1;
    return {
      number: num * multiplier,
      multiplier: multiplier,
    }
  }),
}) {}

class SomeDate1 extends Tag<SomeDate1>()('SomeDate1', {
  effect: Effect.fn(function* (date: Date) {
    return {
      date: date,
    }
  }),
}) {}


it.scoped("test 1", () => Effect.gen(function* () {
      
  const a0_n1 = LayerBuilder({})();
  const a0 = a0_n1.with({
    _tag: LayerBuilder.LayerBuilderKey,
    name: 'a0_base' as const,
    methods: {
      /** generates a message layer */
      huh: SomeMessage1.make.asLayer,
    },
  })

  const a0a = a0.make(
    {
      _tag: LayerBuilder.LayerBuilderKey,
      name: 'a0' as const,
      methods: {
        /** generates a message layer */
        hello: SomeMessage1.make.asLayer,
      },
    },
    {
      _tag: LayerBuilder.LayerBuilderKey,
      name: 'a1' as const,
      methods: {
        /** generates a number layer */
        num: SomeNumber1.make.asLayer,
      },
    }
  )

  const b1t1 = a0_n1.from(a0);
  const b1t2 = a0_n1.from(a0a);

  const expected = {
    someDate1: new Date(),
    someNumber1: 1,
    multiplier: 2,
    someMessage1: 'woah',
  }

  const a0a_1 = a0a
    .hello('hello')
    .num(expected.someNumber1)
    .with({
      _tag: LayerBuilder.LayerBuilderKey,
      name: 'a2' as const,
      methods: {
        /** generates a date layer */
        date: SomeDate1.make.asLayer,
      },
    }, {
      _tag: LayerBuilder.LayerBuilderKey,
      name: 'a3' as const,
      methods: {
        /** generates a date layer */
        date2: SomeDate1.make.asLayer,
      },
    })
    .date(expected.someDate1)
  // a0a_1.definitions;

  const prog1 = Effect.gen(function* () {
    const someDate1 = yield* SomeDate1;
    const someNumber1 = yield* SomeNumber1;
    const someMessage1 = yield* SomeMessage1;
    // console.log('prog1', { someDate1, someNumber1, someMessage1 });
    return {
      someDate1,
      someNumber1,
      someMessage1,
    }
  }).pipe(
    Effect.provide(
      a0a_1
        .hello(expected.someMessage1)
        .Layer
    ),


    // Effect.provide(
    //   Layer.empty.pipe(
    //     Layer.provideMerge(
    //       SomeDate1.make.asLayer(new Date())
    //     ),
    //     Layer.provideMerge(
    //       SomeNumber1.make.asLayer(1)
    //     ),
    //     Layer.provideMerge(
    //       SomeMessage1.make.asLayer('hello')
    //     ),
    //   )
    // ),

    // Layer.mergeAll(
    //   SomeDate1.make.asLayer(new Date()),
    //   SomeNumber1.make.asLayer(1),
    //   SomeMessage1.make.asLayer('hello'),
    // ),
  ).pipe(
    Effect.provide(
      SomeMultiplier1.make.asLayer(expected.multiplier)
    ),
  );

  const result = yield* prog1;
  expect(result.someDate1.date.toISOString())
    .toBe(expected.someDate1.toISOString());
  expect(result.someNumber1.multiplier)
    .toBe(expected.multiplier);
  expect(result.someNumber1.number)
    .toBe(expected.someNumber1 * expected.multiplier);
  expect(result.someMessage1.message)
    .toBe(expected.someMessage1);

  // Effect.runPromise(prog1).then((result) => {
  //   console.log('prog1 result', result);
  // })


  const prog2 = Effect.gen(function* () {
    const someMessage1 = yield* SomeMessage1;
    return {
      someMessage1,
    }
  });

  // Effect.runPromise(
  //   prog2.pipe(
  //     Effect.provide(
  //       SomeMessage1.make.asLayer('message 1')
  //     ),
  //     Effect.provide(
  //       SomeMessage1.make.asLayer('message 2')
  //     ),
  //   )
  // ).then((result) => {
  //   console.log('prog2 result', result);
  // })

}));

it.scoped("test 2", () => Effect.gen(function* () {
  
  const QueryBuilderDateDefinition = LayerBuilder.Definition({
    name: 'a2',
    methods: {
      date: SomeDate1.make.asLayer,
    },
  });

  const QueryBuilderNumberDefinition = LayerBuilder.Definition({
    name: 'a3',
    methods: {
      num: SomeNumber1.make.asLayer,
    },
  });

  const QueryBuilder = LayerBuilder({})(
    QueryBuilderDateDefinition,
    QueryBuilderNumberDefinition,
  );

  const QueryBuilderMultiplierDefinition = QueryBuilder.Definition({
    name: 'a4',
    methods: {
      multiplier: SomeMultiplier1.make.asLayer,
    },
  });

  const QueryBuilder2 = QueryBuilder.with(QueryBuilderMultiplierDefinition);

  const queryLayer1 = QueryBuilder.layer(
    QueryBuilder.make()
      .date(new Date())
      .num(1)
  );

  const queryLayer2 = QueryBuilder2.layer(
    QueryBuilder2.make()
      .date(new Date())
      .num(1)
      .multiplier(2)
  );

}));
