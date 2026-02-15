import { YieldWrap } from 'effect/Utils'
import { Effect, fn as baseFn, isEffect } from 'effect/Effect'
import { Effect as _Effect, Context, Tracer } from 'effect'
import { isFunction } from 'effect/Function'
import { MinimumLogLevels } from '@cseitz/effect-logger'

/**
 * Utility to convert a union type to an intersection type.
 */
type UnionToIntersection<U> = (
  (
    U extends any ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never
);

/**
 * Creates all permutations of a function by moving properties
 * from the Context into the Input.
 */
type FunctionPermutations<
  BaseInput,
  Context,
  EffectOutput extends Effect<any, any, any>,
  // Extract existing requirements from the provided Effect
  CurrentR = Effect.Context<EffectOutput>,
  // Map the Context object values to a union for the environment
  ContextR = Context[keyof Context],
  K extends keyof Context = keyof Context
> = (
  UnionToIntersection<
    K extends any
      ? // 1. Recursive branch: Add specific key to input, remove its type from requirements
        | FunctionPermutations<
              BaseInput & Pick<Context, K>,
              Omit<Context, K>,
              EffectOutput,
              Exclude<CurrentR | ContextR, Context[K]>
            >
        // 2. The current permutation at this level of the recursion
        | ((
            input: BaseInput
          ) => Effect<
            Effect.Success<EffectOutput>,
            Effect.Error<EffectOutput>,
            CurrentR | ContextR
          >)
      : never
  > extends infer Result
    ? // Final cleanup: If Context is empty, return the function with the remaining R
      [keyof Context] extends [never]
      ? (input: BaseInput) => Effect<
          Effect.Success<EffectOutput>,
          Effect.Error<EffectOutput>,
          CurrentR
        >
      : Result
    : never
);

type ClassesToInstances<T> = ({
  // [P in keyof T]: T[P] extends (abstract new (...args: any) => any) ? InstanceType<T[P]> : T[P]
  [P in keyof T]: T[P] extends Context.Tag<infer TTag, infer TShape> ? TTag : (
    T[P] extends (abstract new (...args: any) => any) ? InstanceType<T[P]> : T[P]
  )
})

type _MakeFunctionWithContext = (
  (<Input>() => (
    <Context>(context: Context) => (
      & (<Self, A, E = never, R = never>(self: Self, func: (this: Self, input: Input & ClassesToInstances<Context>) => Generator<YieldWrap<Effect<any, E, R>>, A, any>) => (
        FunctionPermutations<Input, ClassesToInstances<Context>, Effect<A, E, R>>
      ))
      & (<A, E = never, R = never>(func: (input: Input & ClassesToInstances<Context>) => Generator<YieldWrap<Effect<any, E, R>>, A, any>) => (
        FunctionPermutations<Input, ClassesToInstances<Context>, Effect<A, E, R>>
      ))
    )
  ))
);

type MakeFunctionWithContext = (
  & _MakeFunctionWithContext
  & ((name: string, options?: Tracer.SpanOptions) => _MakeFunctionWithContext)
);

export namespace fnWithSelf {
  /**
   * @since 3.19.0
   * @category Models
   */
  export type Return<A, E = never, R = never> = Generator<YieldWrap<Effect<any, E, R>>, A, any>
  /**
   * @since 3.11.0
   * @category Models
   */
  export type Gen = baseFn.Gen & {
    <Self, Eff extends YieldWrap<Effect<any, any, any>>, AEff, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>
    ): (...args: Args) => Effect<
      AEff,
      [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
      [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
    >
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A
    ): (...args: Args) => Effect.AsEffect<A>
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B
    ): (...args: Args) => Effect.AsEffect<B>
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C
    ): (...args: Args) => Effect.AsEffect<C>
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D
    ): (...args: Args) => Effect.AsEffect<D>
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E
    ): (...args: Args) => Effect.AsEffect<E>
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E,
      F extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E,
      f: (_: E, ...args: NoInfer<Args>) => F
    ): (...args: Args) => Effect.AsEffect<F>
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E,
      F,
      G extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E,
      f: (_: E, ...args: NoInfer<Args>) => F,
      g: (_: F, ...args: NoInfer<Args>) => G
    ): (...args: Args) => Effect.AsEffect<G>
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E,
      f: (_: E, ...args: NoInfer<Args>) => F,
      g: (_: F, ...args: NoInfer<Args>) => G,
      h: (_: G, ...args: NoInfer<Args>) => H
    ): (...args: Args) => Effect.AsEffect<H>
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      I extends Effect<any, any, any>
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E,
      f: (_: E, ...args: NoInfer<Args>) => F,
      g: (_: F, ...args: NoInfer<Args>) => G,
      h: (_: G, ...args: NoInfer<Args>) => H,
      i: (_: H, ...args: NoInfer<Args>) => I
    ): (...args: Args) => Effect.AsEffect<I>
  }

  /**
   * @since 3.11.0
   * @category Models
   */
  export type NonGen = baseFn.NonGen & {
    <Self, Eff extends Effect<any, any, any>, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, B, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => B,
      b: (_: B, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, B, C, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => B,
      b: (_: B, ...args: NoInfer<Args>) => C,
      c: (_: C, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, B, C, D, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => B,
      b: (_: B, ...args: NoInfer<Args>) => C,
      c: (_: C, ...args: NoInfer<Args>) => D,
      d: (_: D, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, B, C, D, E, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => B,
      b: (_: B, ...args: NoInfer<Args>) => C,
      c: (_: C, ...args: NoInfer<Args>) => D,
      d: (_: D, ...args: NoInfer<Args>) => E,
      e: (_: E, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, B, C, D, E, F, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => B,
      b: (_: B, ...args: NoInfer<Args>) => C,
      c: (_: C, ...args: NoInfer<Args>) => D,
      d: (_: D, ...args: NoInfer<Args>) => E,
      e: (_: E, ...args: NoInfer<Args>) => F,
      f: (_: F, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, B, C, D, E, F, G, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => B,
      b: (_: B, ...args: NoInfer<Args>) => C,
      c: (_: C, ...args: NoInfer<Args>) => D,
      d: (_: D, ...args: NoInfer<Args>) => E,
      e: (_: E, ...args: NoInfer<Args>) => F,
      f: (_: F, ...args: NoInfer<Args>) => G,
      g: (_: G, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, B, C, D, E, F, G, H, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => B,
      b: (_: B, ...args: NoInfer<Args>) => C,
      c: (_: C, ...args: NoInfer<Args>) => D,
      d: (_: D, ...args: NoInfer<Args>) => E,
      e: (_: E, ...args: NoInfer<Args>) => F,
      f: (_: F, ...args: NoInfer<Args>) => G,
      g: (_: G, ...args: NoInfer<Args>) => H,
      h: (_: H, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
    <Self, Eff extends Effect<any, any, any>, A, B, C, D, E, F, G, H, I, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => A,
      a: (_: A, ...args: NoInfer<Args>) => B,
      b: (_: B, ...args: NoInfer<Args>) => C,
      c: (_: C, ...args: NoInfer<Args>) => D,
      d: (_: D, ...args: NoInfer<Args>) => E,
      e: (_: E, ...args: NoInfer<Args>) => F,
      f: (_: F, ...args: NoInfer<Args>) => G,
      g: (_: G, ...args: NoInfer<Args>) => H,
      h: (_: H, ...args: NoInfer<Args>) => I,
      i: (_: H, ...args: NoInfer<Args>) => Eff
    ): (...args: Args) => Effect.AsEffect<Eff>
  }

  /**
   * @since 3.11.0
   * @category Models
   */
  export type Untraced = baseFn.Untraced & {
    <Self, Eff extends YieldWrap<Effect<any, any, any>>, AEff, Args extends Array<any>>(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>
    ): (...args: Args) => Effect<
      AEff,
      [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
      [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
    >
    <Self, Eff extends YieldWrap<Effect<any, any, any>>, AEff, Args extends Array<any>, A>(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A
    ): (...args: Args) => A
    <Self, Eff extends YieldWrap<Effect<any, any, any>>, AEff, Args extends Array<any>, A, B>(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B
    ): (...args: Args) => B
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C
    ): (...args: Args) => C
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D
    ): (...args: Args) => D
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E
    ): (...args: Args) => E
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E,
      F
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E,
      f: (_: E, ...args: NoInfer<Args>) => F
    ): (...args: Args) => F
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E,
      F,
      G
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E,
      f: (_: E, ...args: NoInfer<Args>) => F,
      g: (_: F, ...args: NoInfer<Args>) => G
    ): (...args: Args) => G
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E,
      f: (_: E, ...args: NoInfer<Args>) => F,
      g: (_: F, ...args: NoInfer<Args>) => G,
      h: (_: G, ...args: NoInfer<Args>) => H
    ): (...args: Args) => H
    <
      Self,
      Eff extends YieldWrap<Effect<any, any, any>>,
      AEff,
      Args extends Array<any>,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      I
    >(
      self: Self,
      body: (this: Self, ...args: Args) => Generator<Eff, AEff, never>,
      a: (
        _: Effect<
          AEff,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer E, infer _R>>] ? E : never,
          [Eff] extends [never] ? never : [Eff] extends [YieldWrap<Effect<infer _A, infer _E, infer R>>] ? R : never
        >,
        ...args: NoInfer<Args>
      ) => A,
      b: (_: A, ...args: NoInfer<Args>) => B,
      c: (_: B, ...args: NoInfer<Args>) => C,
      d: (_: C, ...args: NoInfer<Args>) => D,
      e: (_: D, ...args: NoInfer<Args>) => E,
      f: (_: E, ...args: NoInfer<Args>) => F,
      g: (_: F, ...args: NoInfer<Args>) => G,
      h: (_: G, ...args: NoInfer<Args>) => H,
      i: (_: H, ...args: NoInfer<Args>) => I
    ): (...args: Args) => I
  }
}

/**
 * The `Effect.fn` function allows you to create traced functions that return an
 * effect. It provides two key features:
 *
 * - **Stack traces with location details** if an error occurs.
 * - **Automatic span creation** for tracing when a span name is provided.
 *
 * If a span name is passed as the first argument, the function's execution is
 * tracked using that name. If no name is provided, stack tracing still works,
 * but spans are not created.
 *
 * A function can be defined using either:
 *
 * - A generator function, allowing the use of `yield*` for effect composition.
 * - A regular function that returns an `Effect`.
 *
 * **Example** (Creating a Traced Function with a Span Name)
 *
 * ```ts
 * import { Effect } from "effect"
 *
 * const myfunc = Effect.fn("myspan")(function* <N extends number>(n: N) {
 *   yield* Effect.annotateCurrentSpan("n", n) // Attach metadata to the span
 *   console.log(`got: ${n}`)
 *   yield* Effect.fail(new Error("Boom!")) // Simulate failure
 * })
 *
 * Effect.runFork(myfunc(100).pipe(Effect.catchAllCause(Effect.logError)))
 * // Output:
 * // got: 100
 * // timestamp=... level=ERROR fiber=#0 cause="Error: Boom!
 * //     at <anonymous> (/.../index.ts:6:22) <= Raise location
 * //     at myspan (/.../index.ts:3:23)  <= Definition location
 * //     at myspan (/.../index.ts:9:16)" <= Call location
 * ```
 *
 * `Effect.fn` automatically creates spans. The spans capture information about
 * the function execution, including metadata and error details.
 *
 * **Example** (Exporting Spans to the Console)
 *
 * ```ts skip-type-checking
 * import { Effect } from "effect"
 * import { NodeSdk } from "@effect/opentelemetry"
 * import {
 *   ConsoleSpanExporter,
 *   BatchSpanProcessor
 * } from "@opentelemetry/sdk-trace-base"
 *
 * const myfunc = Effect.fn("myspan")(function* <N extends number>(n: N) {
 *   yield* Effect.annotateCurrentSpan("n", n)
 *   console.log(`got: ${n}`)
 *   yield* Effect.fail(new Error("Boom!"))
 * })
 *
 * const program = myfunc(100)
 *
 * const NodeSdkLive = NodeSdk.layer(() => ({
 *   resource: { serviceName: "example" },
 *   // Export span data to the console
 *   spanProcessor: new BatchSpanProcessor(new ConsoleSpanExporter())
 * }))
 *
 * Effect.runFork(program.pipe(Effect.provide(NodeSdkLive)))
 * // Output:
 * // got: 100
 * // {
 * //   resource: {
 * //     attributes: {
 * //       'service.name': 'example',
 * //       'telemetry.sdk.language': 'nodejs',
 * //       'telemetry.sdk.name': '@effect/opentelemetry',
 * //       'telemetry.sdk.version': '1.30.1'
 * //     }
 * //   },
 * //   instrumentationScope: { name: 'example', version: undefined, schemaUrl: undefined },
 * //   traceId: '22801570119e57a6e2aacda3dec9665b',
 * //   parentId: undefined,
 * //   traceState: undefined,
 * //   name: 'myspan',
 * //   id: '7af530c1e01bc0cb',
 * //   kind: 0,
 * //   timestamp: 1741182277518402.2,
 * //   duration: 4300.416,
 * //   attributes: {
 * //     n: 100,
 * //     'code.stacktrace': 'at <anonymous> (/.../index.ts:8:23)\n' +
 * //       'at <anonymous> (/.../index.ts:14:17)'
 * //   },
 * //   status: { code: 2, message: 'Boom!' },
 * //   events: [
 * //     {
 * //       name: 'exception',
 * //       attributes: {
 * //         'exception.type': 'Error',
 * //         'exception.message': 'Boom!',
 * //         'exception.stacktrace': 'Error: Boom!\n' +
 * //           '    at <anonymous> (/.../index.ts:11:22)\n' +
 * //           '    at myspan (/.../index.ts:8:23)\n' +
 * //           '    at myspan (/.../index.ts:14:17)'
 * //       },
 * //       time: [ 1741182277, 522702583 ],
 * //       droppedAttributesCount: 0
 * //     }
 * //   ],
 * //   links: []
 * // }
 * ```
 *
 * `Effect.fn` also acts as a pipe function, allowing you to create a pipeline
 * after the function definition using the effect returned by the generator
 * function as the starting value of the pipeline.
 *
 * **Example** (Creating a Traced Function with a Delay)
 *
 * ```ts
 * import { Effect } from "effect"
 *
 * const myfunc = Effect.fn(
 *   function* (n: number) {
 *     console.log(`got: ${n}`)
 *     yield* Effect.fail(new Error("Boom!"))
 *   },
 *   // You can access both the created effect and the original arguments
 *   (effect, n) => Effect.delay(effect, `${n / 100} seconds`)
 * )
 *
 * Effect.runFork(myfunc(100).pipe(Effect.catchAllCause(Effect.logError)))
 * // Output:
 * // got: 100
 * // timestamp=... level=ERROR fiber=#0 cause="Error: Boom! (<= after 1 second)
 * ```
 *
 * @see {@link fnUntraced} for a version of this function that doesn't add a span.
 *
 * @since 3.11.0
 * @category Tracing
 */
// @ts-expect-error
export const fn:
  & fnWithSelf.Gen
  & fnWithSelf.NonGen
  // & { input: MakeFunctionWithContext }
  & ((
    name: string,
    options?: Tracer.SpanOptions
  ) => fnWithSelf.Gen & fnWithSelf.NonGen) = Object.assign(function(nameOrBodyOrSelf: Function | string, ...pipeables: Array<any>) {
    if (typeof nameOrBodyOrSelf !== "string") {
      let self: any;
      let body: Function;
      if (isFunction(nameOrBodyOrSelf)) {
        self = {};
        body = nameOrBodyOrSelf;
      } else {
        self = nameOrBodyOrSelf;
        body = pipeables.shift();
      }
      return baseFn.apply(self, [
        // @ts-expect-error
        body,
        ...pipeables
      ]);
    }
    const name = nameOrBodyOrSelf;
    const options = pipeables[0]
    return (bodyOrSelf: Function | any, ...pipeables: Array<any>) => {
      let self: any;
      let body: Function;
      if (isFunction(bodyOrSelf)) {
        self = {};
        body = bodyOrSelf;
      } else {
        self = bodyOrSelf;
        body = pipeables.shift();
      }
      return baseFn.apply(self, [name, options]).apply(self, [
        // @ts-expect-error
        body,
        (e: any, ...args: any[]) => {
          if (isEffect(e)) {
            return _Effect.andThen(MinimumLogLevels.withMinimumLogLevel(name), (withMinimumLogLevel) => {
              return e.pipe(withMinimumLogLevel)
            })
          }
          return e;
        },
        ...pipeables
      ]);
    }
  }, {
    // input: function(...args0: any[]) {
    //   const [spanName, spanOptions] = args0;
    //   const makeFn = function() {
    //     return function(inputContext: any) {
    //       const wrapBody = function(self: any | undefined, body: Function) {
    //         // TODO: pull from context
    //         return function*(input: any) {
    //           for (const key in inputContext) {
    //             if (!(key in input)) {
    //               input[key] = yield* inputContext[key];
    //             }
    //           }
    //           return yield* body.apply(self, [input]);
    //         }
    //       }
    //       return function(...args1: any[]) {
    //         if (isFunction(args1[0])) {
    //           const [body, ...pipeables] = args1;
    //           if (spanName) {
    //             return fn(spanName, spanOptions)(wrapBody(undefined, body), ...pipeables);
    //           } else {
    //             return fn(wrapBody(undefined, body) as any, ...pipeables);
    //           }
    //         } else {
    //           const [self, body, ...pipeables] = args1;
    //           if (spanName) {
    //             return fn(spanName, spanOptions)(wrapBody(self, body), ...pipeables);
    //           } else {
    //             return fn(wrapBody(self, body) as any, ...pipeables);
    //           }
    //         }
    //       }
    //     }
    //   }
    //   if (args0.length > 0) {
    //     return makeFn;
    //   }
    //   return makeFn();
    // }
  });

