import { Context, Effect, Layer } from 'effect';

export class SequentialLayerMissingRequirementsError<T> extends Error {
  constructor(public readonly missing: T) {
    super(`Missing requirements: ${missing}`);
  }
}

export class SequentialLayer<TLayer extends Layer.Layer<unknown, unknown, unknown> | Layer.Layer<never, never, never>> {
  constructor(public readonly layer: TLayer) {}

  static of<TLayer extends Layer.Layer<unknown, unknown, unknown> | Layer.Layer<never, never, never>>(layer: TLayer) {
    return new SequentialLayer(layer)
  }

  effect<TIdentifier, TValue, TEffect extends Effect.Effect<TValue, any, any>>(tag: Context.Tag<TIdentifier, TValue>, effect: TEffect): Exclude<(
    Exclude<Effect.Effect.Context<TEffect>, Layer.Layer.Success<TLayer>> extends never
      ? (
        SequentialLayer<
          // @ts-expect-error
          Layer.Layer<
            (
              | Layer.Layer.Success<TLayer>
              | TIdentifier
            ),
            (
              | Layer.Layer.Error<TLayer>
              | Effect.Effect.Error<TEffect>
            ),
            Exclude<(
              | Layer.Layer.Context<TLayer>
              | Effect.Effect.Context<TEffect>
            ), (
              | Layer.Layer.Success<TLayer>
              | any
            )>
          >
        >
      )
      : (
        SequentialLayerMissingRequirementsError<Exclude<Exclude<Effect.Effect.Context<TEffect>, Layer.Layer.Success<TLayer>>, any>>
      )
  ), SequentialLayerMissingRequirementsError<never>> {
    const effectWithProvidedLayer = Effect.provide(effect, this.layer);
    const layerEffect = Layer.effect(tag, effectWithProvidedLayer);
    const mergedLayer = Layer.merge(this.layer, layerEffect);
    // @ts-expect-error
    return new SequentialLayer(mergedLayer);
  }
}
