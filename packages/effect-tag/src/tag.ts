import { Cause, Context, Effect, Layer } from 'effect';
import { LazyArg } from 'effect/Function';
import { isFunction } from 'lodash-es';


const makeTagProxy = (TagClass: Context.Tag<any, any> & Record<PropertyKey, any>) => {
  const cache = new Map()
  return new Proxy(TagClass, {
    get(target: any, prop: any, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver)
      }
      if (cache.has(prop)) {
        return cache.get(prop)
      }
      const fn = (...args: Array<any>) =>
        Effect.andThen(target, (s: any) => {
          if (typeof s[prop] === "function") {
            cache.set(prop, (...args: Array<any>) => Effect.andThen(target, (s: any) => s[prop](...args)))
            return s[prop](...args)
          }
          cache.set(prop, Effect.andThen(target, (s: any) => s[prop]))
          return s[prop]
        })
      const cn = Effect.andThen(target, (s: any) => s[prop])
      // @effect-diagnostics-next-line floatingEffect:off
      Object.assign(fn, cn)
      const apply = fn.apply
      const bind = fn.bind
      const call = fn.call
      const proto = Object.setPrototypeOf({}, Object.getPrototypeOf(cn))
      proto.apply = apply
      proto.bind = bind
      proto.call = call
      Object.setPrototypeOf(fn, proto)
      cache.set(prop, fn)
      return fn
    }
  })
}

export type inferMakerShape<Make> = (
  Make extends { readonly effect: Effect.Effect<infer _A, infer _E, infer _R> } ? _A
  : Make extends { readonly scoped: Effect.Effect<infer _A, infer _E, infer _R> } ? _A
  : Make extends { readonly effect: (...args: infer _Args) => Effect.Effect<infer _A, infer _E, infer _R> } ? _A
  : Make extends { readonly scoped: (...args: infer _Args) => Effect.Effect<infer _A, infer _E, infer _R> } ? _A
  : Make extends { readonly sync: LazyArg<infer A> } ? A
  : Make extends { readonly succeed: infer A } ? A
  : never
);

type _inferMakeFn<MakeFn> = MakeFn & (
  MakeFn extends (...args: any[]) => any
  ? (
    MakeFn extends (...args: infer Args) => Effect.Effect<infer A, infer E, infer R>
    ? {
      asLayer: (...args: Args) => Layer.Layer<A, E, R>
    }
    : {}
  )
  : {}
)

export type inferMakerFn<Make, Self> = (
  Make extends { readonly effect: Effect.Effect<infer _A, infer _E, infer _R> } ? _inferMakeFn<(() => Effect.Effect<Self, _E, _R>)>
  : Make extends { readonly scoped: Effect.Effect<infer _A, infer _E, infer _R> } ? _inferMakeFn<(() => Effect.Effect<Self, _E, _R>)>
  : Make extends { readonly effect: (...args: infer _Args) => Effect.Effect<infer _A, infer _E, infer _R> } ? _inferMakeFn<((...args: _Args) => Effect.Effect<Self, _E, _R>)>
  : Make extends { readonly scoped: (...args: infer _Args) => Effect.Effect<infer _A, infer _E, infer _R> } ? _inferMakeFn<((...args: _Args) => Effect.Effect<Self, _E, _R>)>
  : Make extends { readonly sync: LazyArg<infer A> } ? _inferMakeFn<(() => Effect.Effect<Self, never, never>)>
  : Make extends { readonly succeed: infer A } ? _inferMakeFn<(() => Effect.Effect<Self, never, never>)>
  : never
);

type BaseTag<
  Self,
  Key extends string,
  Shape,
  Config extends {
    exports?: Record<string, any>;
  } = {}
> = (
  & {
    new(_: Shape): Omit<Shape, '_tag'> & {
      readonly _tag: Key;
    }
  }
  & Context.Tag<Self, Shape>
  & { key: Key }
  & (Config extends { exports: Record<string, any> } ? {
    exports: Config['exports'];
  } : {})
);

type AdditionalMakeConfig = {
  accessors?: boolean;
}

export type ShapeMaker<Shape> = (
  | ({ effect: Effect.Effect<Shape, any, any> | Effect.Effect<Shape, never, never> } & AdditionalMakeConfig)
  | ({ effect: (...args: any[]) => Effect.Effect<Shape, any, any> | Effect.Effect<Shape, never, never> } & AdditionalMakeConfig)
  | ({ scoped: Effect.Effect<Shape, any, any> | Effect.Effect<Shape, never, never> } & AdditionalMakeConfig)
  | ({ scoped: (...args: any[]) => Effect.Effect<Shape, any, any> | Effect.Effect<Shape, never, never> } & AdditionalMakeConfig)
  | ({ sync: LazyArg<Shape> } & AdditionalMakeConfig)
  | ({ succeed: Shape } & AdditionalMakeConfig)
);

export type MakeAccessors<Make> = Make extends { readonly accessors: true } ? true : false;

export type Tag<
  Self,
  Key extends string,
  Make extends ShapeMaker<any> | undefined,
  Shape = inferMakerShape<Make>,
  Statics = {},
  Exports extends Record<string, any> = {},
> = (
  & BaseTag<Self, Key, Shape, { exports: Exports }>
  
  & Statics
  & {
    readonly _tag: Key;
  }
  & (NonNullable<Make> extends never ? {} : (
    & (MakeAccessors<Make> extends true ? Effect.Tag.Proxy<Self, Shape> : {})
    & {
      make: inferMakerFn<Make, Self>;
    }
  ))
)

export type MakeTag<
  Self,
  MaybeShape = never,
  AdditionalStatics = {},
> = (
  NonNullable<MaybeShape> extends never
    ? (
      <
        Key extends string,
        Make extends ShapeMaker<any>,
        Exports extends Record<string, any> = {},
      >(
        key: Key,
        config: Make & { exports?: Exports }
      ) => (
        & Tag<Self, Key, Make, inferMakerShape<Make>, AdditionalStatics, Exports>
        // & BaseTag<Self, Key, inferMakerShape<Make>, { exports: Exports }>
        // & (MakeAccessors<Make> extends true ? Effect.Tag.Proxy<Self, inferMakerShape<Make>> : {})
        // & AdditionalStatics
        // & {
        //   readonly _tag: Key;
        //   make: inferMakerFn<Make, Self>;
        // }
      )
    )
    : (
      & (
        <
          Key extends string,
        >(
          key: Key,
        ) => (
          & Tag<Self, Key, undefined, MaybeShape, AdditionalStatics>
          // & BaseTag<Self, Key, MaybeShape, {}>
          // & AdditionalStatics
          // & {
          //   readonly _tag: Key;
          // }
        )
      )
      & (
        <
          Key extends string,
          Config extends AdditionalMakeConfig,
          Exports extends Record<string, any> = {},
        >(
          key: Key,
          config: { exports?: Exports } & Config
        ) => (
          & Tag<Self, Key, never, MaybeShape, AdditionalStatics, Exports>
          // & BaseTag<Self, Key, MaybeShape, { exports: Exports }>
          // & (MakeAccessors<Config> extends true ? Effect.Tag.Proxy<Self, MaybeShape> : {})
          // & AdditionalStatics
          // & {
          //   readonly _tag: Key;
          // }
        )
      )
      & (
        <
          Key extends string,
          Make extends ShapeMaker<MaybeShape>,
          Exports extends Record<string, any> = {},
        >(
          key: Key,
          config: Make & { exports?: Exports }
        ) => (
          & Tag<Self, Key, Make, inferMakerShape<Make>, AdditionalStatics, Exports>
          // & BaseTag<Self, Key, inferMakerShape<Make>, { exports: Exports }>
          // & (MakeAccessors<Make> extends true ? Effect.Tag.Proxy<Self, inferMakerShape<Make>> : {})
          // & AdditionalStatics
          // & {
          //   readonly _tag: Key;
          //   make: inferMakerFn<Make, Self>;
          // }
        )
      )
    )
);

/**
 * @example
 * 
 * // 1. tag with make function
 * class SomeTag1 extends createTag<SomeTag1>()('SomeTag1', {
 *   effect: Effect.fn(function* () {
 *     return {
 *       someValue: 'hello'
 *     }
 *   }),
 * }) {}
 * 
 * const layer1 = Layer.effect(SomeTag1, SomeTag1.make())
 *
 * // 2. tag with specific shape + make function
 * class SomeTag2 extends createTag<SomeTag2, {
 *   someValue: number;
 * }>()('SomeTag2', {
 *   effect: Effect.fn(function* (multiplier: number) {
 *     return {
 *       someValue: 123
 *     }
 *   }),
 * }) {}
 * 
 * const layer2 = Layer.effect(SomeTag2, SomeTag2.make(123))
 * 
 * // 3. tag with specific shape but is lacking implementation
 * class SomeTag3 extends createTag<SomeTag3, {
 *   someValue: number;
 * }>()('SomeTag3') {}
 * 
 * const layer = Layer.effect(SomeTag3, Effect.gen(function* () {
 *   return SomeTag3.of({
 *     someValue: 123
 *   })
 * }))
 */
export function createTag<
  Self,
  MaybeShape = never,
  AdditionalStatics = {},
>(): (
  MakeTag<Self, MaybeShape, AdditionalStatics>
) {
  return (function(key: string, config?: any) {
    const makeObj = config;
    const makeFn = makeObj ? (0
      || (
        makeObj.effect && Object.assign((
          isFunction(makeObj.effect) ? makeObj.effect : function() { return makeObj.effect }
        ), {
          asLayer: function(...args: Parameters<typeof makeFn>) {
            // return Layer.succeed(this as any, { hi: 'there' })
            return Layer.effect(this as any, makeFn(...args));
          }
        })
      )
      || (
        makeObj.scoped && Object.assign((
          isFunction(makeObj.scoped) ? makeObj.scoped : function() { return makeObj.scoped }
        ), {
          asLayer: function(...args: Parameters<typeof makeFn>) {
            return Layer.effect(this as any, makeFn(...args));
          }
        })
      )
      || (
        makeObj.sync && Object.assign((
          isFunction(makeObj.sync) ? makeObj.sync : function() { return makeObj.sync }
        ), {
          asLayer: function(...args: Parameters<typeof makeFn>) {
            return Layer.succeed(this as any, makeFn(...args));
          }
        })
      )
      || (
        makeObj.succeed && Object.assign((
          isFunction(makeObj.succeed) ? makeObj.succeed : function() { return makeObj.succeed }
        ), {
          asLayer: function(...args: Parameters<typeof makeFn>) {
            return Layer.succeed(this as any, makeFn(...args));
          }
        })
      )
    ) : undefined;
    const tagClass = class extends Effect.Tag(key)() {
      static readonly _tag = key;
      static make = (() => {
        const self = this;
        const fn = makeFn;
        if (fn) {
          if ('asLayer' in fn) {
            fn.asLayer = fn.asLayer.bind(self);
          }
        }
        return fn;
      })();
      static exports = config?.exports;
    }
    if (config?.accessors) {
      return makeTagProxy(tagClass as any);
    }
    return tagClass;
  }) as any;
}
