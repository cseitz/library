# Library - Effect Tag

## Development

```bash
# build
pnpm build
# test
pnpm test
```

## Usage

```ts
import { Log } from '@library/effect-logger';

const program1 = Effect.gen(function* () {
  yield* Log.info('hello');
});

const program2 = program1.pipe(
  Effect.provide(Log.makeLayer({ levels: [{ tagPattern: 'SomeTag1', level: Log.Level.Info }] })),
);
```
