import { Effect, Layer } from 'effect';
import { forEach, get, isFunction, reduce, set } from 'lodash-es';

// You should be able to copy-paste this file, string replace "LayerBuilder", and build your own custom builder.

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// --- constants ---

export const LayerBuilderKey = 'LayerBuilder' as const;

// --- definition types ---

export type LayerBuilderMethod = (
  | ((...args: any[]) => Layer.Layer.Any)
  // TODO: not yet supported
  // | ((...args: any[]) => Effect.Effect<any, any | never, any | never>)
);

export interface LayerBuilderDefinition {
  _tag: typeof LayerBuilderKey;
  // name: string;
  methods: Record<string, LayerBuilderMethod>;
}

export interface EmptyLayerBuilderDefinition extends LayerBuilderDefinition {
  _tag: typeof LayerBuilderKey;
  // name: string;
  methods: {}
}

export type MaybeLayerBuilderDefinition = (
  | LayerBuilderDefinition
  | {
    [LayerBuilderKey]: LayerBuilderDefinition;
  }
);

export type inferLayerBuilderDefinition<T extends MaybeLayerBuilderDefinition> = (
  // is definition
  T extends LayerBuilderDefinition ? T
  // has definition
  : T extends { [LayerBuilderKey]: infer D } ? D
  // not a definition
  : never
);

export type MergeLayerBuilderDefinitions<A extends LayerBuilderDefinition, B extends LayerBuilderDefinition> = (
  & {
    _tag: typeof LayerBuilderKey;
  }
  & {
    // name: A['name'] | B['name'];
    methods: (
      Omit<A['methods'], keyof B['methods']>
      & B['methods']
    )
  }
);

export type MergeLayerBuilderDefinitionsTuple<
  T extends readonly MaybeLayerBuilderDefinition[],
  Acc extends LayerBuilderDefinition = EmptyLayerBuilderDefinition
> = (
  T extends readonly [infer First, ...infer Rest]
    ? First extends LayerBuilderDefinition
      ? Rest extends readonly LayerBuilderDefinition[]
        ? MergeLayerBuilderDefinitionsTuple<
            Rest,
            MergeLayerBuilderDefinitions<Acc, (
              inferLayerBuilderDefinition<First>
            )>
          >
        : MergeLayerBuilderDefinitions<Acc, (
          inferLayerBuilderDefinition<First>
        )>
      : Acc
    : Acc
);

// --- state types ---

export interface LayerBuilderState {
  definitions: MaybeLayerBuilderDefinition[];
  layer: Layer.Layer.Any;
}

export interface EmptyLayerBuilderState extends LayerBuilderState {
  definitions: [];
  layer: Layer.Layer<never, never, never>;
}

// --- builder types ---

type LayerBuilderMethods<State extends LayerBuilderState, MergedDef extends LayerBuilderDefinition = MergeLayerBuilderDefinitionsTuple<State['definitions']>> = (
  & {
    [P in keyof MergedDef['methods']]: (
      MergedDef['methods'][P] extends (...args: any[]) => Layer.Layer<infer A, infer E, infer R> ? (
        (...args: Parameters<MergedDef['methods'][P]>) => (
          LayerBuilder<
            & {
              definitions: State['definitions'];
              layer: Layer.Layer<
                Layer.Layer.Success<State['layer']> | A,
                Layer.Layer.Error<State['layer']> | E,
                Layer.Layer.Context<State['layer']> | R
              >
            }
          >
        )
      ) : (
        MergedDef['methods'][P] extends (...args: any[]) => Effect.Effect<infer A, infer E, infer R>  ? (
          (...args: Parameters<MergedDef['methods'][P]>) => (
            LayerBuilder<
              & {
                definitions: State['definitions'];
                layer: Layer.Layer<
                  Layer.Layer.Success<State['layer']> | A,
                  Layer.Layer.Error<State['layer']> | E,
                  Layer.Layer.Context<State['layer']> | R
                >
              }
            >
          )
        ) : never
      )
    )
  }
);

type LayerBuilderProperties<State extends LayerBuilderState> = (
  & {
    Layer: State['layer'],
    definitions: State['definitions'];
    with<AdditionalDefs extends MaybeLayerBuilderDefinition[]>(...definitions: AdditionalDefs): LayerBuilder<{
      definitions: [
        ...State['definitions'],
        ...AdditionalDefs
      ];
      layer: State['layer'];
    }>;
  }
);

type LayerBuilder<State extends LayerBuilderState = EmptyLayerBuilderState> = (
  & Exclude<LayerBuilderMethods<State>, keyof LayerBuilderProperties<State>>
  & LayerBuilderProperties<State>
);

type LayerBuilderFactory<CommonDefs extends MaybeLayerBuilderDefinition[] = []> = ({
  new<TState extends LayerBuilderState>(state: TState): (
    LayerBuilder<TState>
  );

  /**
   * Instantiates a new builder with the given definitions appended
   */
  make<AdditionalDefs extends MaybeLayerBuilderDefinition[]>(...definitions: AdditionalDefs): (
    LayerBuilder<Prettify<{
      definitions: [
        ...CommonDefs,
        ...AdditionalDefs
      ];
    } & Omit<EmptyLayerBuilderState, 'definitions'>>>
  );
  
  /**
   * Returns a new builder factory with the given definitions appended
   */
  with<AdditionalDefs extends MaybeLayerBuilderDefinition[]>(...definitions: AdditionalDefs): (
    LayerBuilderFactory<[
      ...CommonDefs,
      ...AdditionalDefs
    ]>
  );

  from: (
    & (<ExistingBuilder extends LayerBuilder<any>>(builder: ExistingBuilder) => (
      ExistingBuilder
    ))
    & (<ExistingFactory extends LayerBuilderFactory<any>>(factory: ExistingFactory) => (
      ExistingFactory
    ))
  );

  layer: <TLayer extends Layer.Layer<any, any, any>>(layerBuilder: { Layer: TLayer }) => TLayer,

  Definition: <TName extends string, TMethods extends Record<string, LayerBuilderMethod>>(props: { name: TName, methods: TMethods }) => ({
    _tag: typeof LayerBuilderKey;
    name: TName;
    methods: TMethods;
  }),

  // old_make: (
  //   & (
  //     () => LayerBuilder<Prettify<{
  //       definitions: [];
  //     } & Omit<EmptyLayerBuilderState, 'definitions'>>>
  //   )
  //   & (
  //     <
  //       A extends MaybeLayerBuilderDefinition
  //     >(
  //       def0: A
  //     ) => LayerBuilder<Prettify<{
  //       definitions: [...CommonDefs, A];
  //     } & Omit<EmptyLayerBuilderState, 'definitions'>>>
  //   )
  // );

  // old_with: (
  //   & (
  //     () => LayerBuilderFactory<[...CommonDefs]>
  //   )
  //   & (
  //     <
  //       A extends MaybeLayerBuilderDefinition
  //     >(
  //       def0: A
  //     ) => LayerBuilderFactory<[...CommonDefs, A]>
  //   )
  // );

});

// --- implementation ---

const LayerBuilderInternalsSymbol = Symbol(`${LayerBuilderKey}/internals`);

function getLayerBuilderDefinition(maybeDefinition: MaybeLayerBuilderDefinition): LayerBuilderDefinition {
  if (get(maybeDefinition, ['_tag']) === LayerBuilderKey) {
    return maybeDefinition as LayerBuilderDefinition;
  }
  const maybeScopedDefinition = get(maybeDefinition, [LayerBuilderKey]);
  if (maybeScopedDefinition) {
    return maybeScopedDefinition as LayerBuilderDefinition;
  }
  throw new Error(`Invalid layer builder definition: ${JSON.stringify(maybeDefinition)}`);
}

function mergeLayerBuilderDefinitions(maybeDefinitions: MaybeLayerBuilderDefinition[]): LayerBuilderDefinition {
  const definitions = maybeDefinitions.map(getLayerBuilderDefinition);
  return reduce(definitions, (acc, def) => {
    const methods = get(def, ['methods'], {});
    forEach(methods, (method, key) => {
      set(acc, ['methods', key], method);
    });
    return acc;
  }, {
    _tag: LayerBuilderKey,
    name: '',
    methods: {},
  });
}

export function makeLayerBuilderFactory<
  FactoryConfig extends {

  }
>(factoryConfig: FactoryConfig) {
  return function<
    FactoryCommonDefs extends MaybeLayerBuilderDefinition[]
  >(...initialCommonDefinitions: FactoryCommonDefs): (
    LayerBuilderFactory<[...FactoryCommonDefs]>
  ) {

    function Builder(state: LayerBuilderState, factory: any = {}) {
      // @ts-expect-error
      const self = this as any;
      self.__state = state;
      self.Layer = state.layer;
      const mergedDefinition = mergeLayerBuilderDefinitions([
        ...get(factory, ['definitions'], []),
        ...state.definitions,
      ]);
      forEach(mergedDefinition.methods, (method, key) => {
        Object.defineProperty(self, key, {
          get() {
            return self.__wrapMethod(method);
          },
        })
        // set(self, [key], self.__wrapMethod(method));
      });

    }

    Builder.prototype.__wrapMethod = function(method: LayerBuilderMethod) {
      if (isFunction(method)) {
        return (...args: any[]) => {
          const currentLayer = this.__state.layer;
          const result = method(...args) as any;
          let resultLayer = result;
          if (!Layer.isLayer(resultLayer)) {
            if (Effect.isEffect(result)) {
              // resultLayer = Layer.unwrapEffect(result);
              // TODO: support effect to layer conversion
            }
          }
          if (!Layer.isLayer(resultLayer)) {
            throw new Error(`Invalid layer data: ${JSON.stringify(resultLayer)}`);
          }
          if (!Layer.isLayer(currentLayer)) {
            throw new Error(`Invalid current layer: ${JSON.stringify(currentLayer)}`);
          }
          const newLayer = Layer.provideMerge(
            result,
            currentLayer,
          );
          // const newLayer = 
          // @ts-expect-error
          return new Builder({
            ...this.__state,
            layer: newLayer,
          })
        }
      }
      return (...args: any[]) => {
        throw new Error(`Invalid method call`);
      }
    }

    Builder.prototype.with = function(...definitions: MaybeLayerBuilderDefinition[]) {
      // @ts-expect-error
      return new Builder({
        ...this.__state,
        definitions: [
          ...this.__state.definitions,
          ...definitions,
        ],
      })
    }

    function Factory(commonDefinitions: MaybeLayerBuilderDefinition[], additionalData: any = {}) {
      // @ts-expect-error
      const self = this;
      self.definitions = commonDefinitions;
    }

    Factory.prototype.__builderFactory = true;

    Factory.prototype.from = function(builderOrFactory: any) {
      if ('__builderFactory' in builderOrFactory) {
        // @ts-expect-error
        return new Factory(this.definitions, this);
      }
      // @ts-expect-error
      return new Builder({
        definitions: this.definitions,
        layer: Layer.empty,
      });
    }

    Factory.prototype.with = function(...definitions: MaybeLayerBuilderDefinition[]) {
      // @ts-expect-error
      return new Factory([...this.definitions, ...definitions], this);
    }

    Factory.prototype.make = function(...definitions: MaybeLayerBuilderDefinition[]) {
      // @ts-expect-error
      return new Builder({
        definitions: [...this.definitions, ...definitions],
        layer: Layer.empty,
      });
    }

    Factory.prototype.layer = getLayer;

    Factory.prototype.Definition = makeLayerBuilderDefinition;

    // @ts-expect-error
    return new Factory([...initialCommonDefinitions]) as any;

  }
}

export function makeLayerBuilderDefinition<
  TName extends string,
  TMethods extends Record<string, LayerBuilderMethod>
>(props: { name: TName, methods: TMethods }) {
  return {
    _tag: LayerBuilderKey,
    name: props.name,
    methods: props.methods,
  };
}

export function getLayer<TLayer extends Layer.Layer<any, any, any>>(layerBuilder: { Layer: TLayer }) {
  return layerBuilder.Layer;
}
