# Library - Effect Layer Builder

## Development

```bash
# build
pnpm build
# test
pnpm test
```

## Usage

```ts
import { LayerBuilder } from '@library/effect-layer-builder';
import { Tag } from '@library/effect-tag';
import { Effect, Layer } from 'effect';

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

const queryLayer1: Layer.Layer<SomeDate1 | SomeNumber1, never, SomeMultiplier1> = QueryBuilder.layer(
  QueryBuilder.make()
    .date(new Date())
    .num(1)
);

const queryLayer2: Layer.Layer<SomeDate1 | SomeNumber1 | SomeMultiplier1> = QueryBuilder2.layer(
  QueryBuilder2.make()
    .date(new Date())
    .num(1)
    .multiplier(2)
);

// --- example tags ---

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

```
