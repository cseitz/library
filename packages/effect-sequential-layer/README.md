# Library - Effect Sequential Layer

## Development

```bash
# build
pnpm build
# test
pnpm test
```

## Usage

```ts
import { SequentialLayer } from '@library/effect-sequential-layer';

const sequentialLayer = SequentialLayer.of(Layer.empty)
  .effect(SomeTag, SomeTag1.make())
  .effect(SomeTag, SomeTag2.make())
  .layer;
```
