import { Context, Effect, Layer, pipe } from 'effect';
import { SequentialLayer } from '../index';
import { it } from '@effect/vitest';

class SomeTag1 extends Effect.Tag('SomeTag1')<SomeTag1, {
  someValue: string;
}>() {
  static provide<TLayer extends Layer.Layer<any, any, any> | Layer.Layer<never, never, never>>(layer: TLayer) {
    return Layer.effect(SomeTag1, Effect.gen(function* () {
      return SomeTag1.of({
        someValue: 'hello'
      })
    }))
  }
}

class SomeTag2 extends Effect.Tag('SomeTag2')<SomeTag2, {
  someValue: string;
}>() {
  static provide<TLayer extends Layer.Layer<any, any, any> | Layer.Layer<never, never, never>>(layer: TLayer) {
    return Layer.effect(SomeTag2, Effect.gen(function* () {
      return SomeTag2.of({
        someValue: 'hello'
      })
    }))
  }
}

class SomeTag3 extends Effect.Tag('SomeTag3')<SomeTag3, {
  someValue: string;
}>() {
  static provide<TLayer extends Layer.Layer<any, any, any> | Layer.Layer<never, never, never>>(layer: TLayer) {
    return Layer.effect(SomeTag3, Effect.gen(function* () {
      return SomeTag3.of({
        someValue: 'hello'
      })
    }))
  }
}

it.effect('test 1', () => Effect.gen(function* () {

  const a = pipe(
    Layer.empty,
    SomeTag1.provide,
    SomeTag2.provide,
  )

  Context.pick()
  const ctx1 = Context.mergeAll(
    Context.make(SomeTag1, SomeTag1.of({
      someValue: 'hello'
    })),
    Context.make(SomeTag2, SomeTag2.of({
      someValue: 'hello'
    })),
    // Context.tag(SomeTag2, SomeTag2.of({
    //   someValue: 'hello'
    // })),
  )
  const l1 = Layer.effectContext(
    Effect.gen(function* () {
      return ctx1
    })
  )

  // Context.(SomeTag1, Effect.gen(function* () {
  //   return SomeTag1.of({
  //     someValue: 'hello'
  //   })
  // }))

  // Layer.effect()

  ;(() => {
    const l1 = SequentialLayer.of(Layer.empty)
      .effect(SomeTag1, Effect.gen(function* () {
        // return 2
        return SomeTag1.of({
          someValue: 'hello'
        })
      }))
      .effect(SomeTag2, Effect.gen(function* () {
        const someTag1 = yield* SomeTag1;
        // const someTag2 = yield* SomeTag2;
        // const someTag3 = yield* SomeTag3;
        return SomeTag2.of({
          someValue: 'hello ' + someTag1.someValue
        })
      }))
      .layer
    Effect.runPromise(Effect.provide(Effect.gen(function* () {
      const someTag2 = yield* SomeTag2;
      // console.log('test1', { someTag2: someTag2.someValue });
    }), l1))
  })();


  function createTag<TType>() {
    return function<
      TName extends string,
      TEffectFn extends (...args: any[]) => Effect.Effect<any, any, any>
    >(config: {
      name: TName,
      effect: TEffectFn,
    }) {
      return class extends Effect.Tag(config.name)<
        TType,
        // @ts-expect-error
        Effect.Effect.Success<ReturnType<TEffectFn>> extends never ? any : Effect.Effect.Success<ReturnType<TEffectFn>>
      >() {
        static make = config.effect;
        // static make2(...args: Parameters<TEffectFn>): (
        //   ReturnType<TEffectFn>
        //   // Effect.Effect<
        //   //   TType,
        //   //   Effect.Effect.Error<ReturnType<TEffectFn>>,
        //   //   Effect.Effect.Context<ReturnType<TEffectFn>>
        //   // >
        // ) {
        //   return config.effect(...args);
        // }
      }
    }
  }

  class CustomTag1 extends createTag<CustomTag1>()({
    name: 'CustomTag1',
    // effect: (hi: string) => Effect.gen(function*() {
    //   return {
    //     someValue: 'hello' + hi
    //   }
    // })
    effect: Effect.fn(function* (hi: string) {
      return {
        someValue: 'hello' + hi
      }
    }),
    // dependencies: [SomeTag1],
  }) {}

  Layer.effect(CustomTag1, CustomTag1.make('123'))

  ;(() => {

  });

  // TODO: test overwriting layers
  // TODO: create a global layer that 

}));
