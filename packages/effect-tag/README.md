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
import { Tag } from '@cseitz/effect-tag';

// a simple tag with a make function
class SomeTag extends Tag<SomeTag>()('SomeTag', {
  effect: Effect.fn(function* (message: string) {
    return {
      message,
    }
  }),
}) { }

// use the make function to create an effect
const tag1: Effect.Effect<SomeTag, never, never> = SomeTag.make('hello');
// use the make function to create a layer
const layer1: Layer.Layer<SomeTag, never> = Layer.effect(SomeTag, SomeTag.make('hello'));
// use the make function to create a layer
const layer2: Layer.Layer<SomeTag, never> = SomeTag.make.asLayer('hello');

// a tag with accessors
class SomeService extends Tag<SomeService>()('SomeService', {
  accessors: true,
  effect: Effect.fn(function* (message: string) {
    return {
      getMessage: function() {
        return 'hello';
      },
    }
  }),
}) { }

// use the global accessors
const program1 = Effect.gen(function* () {
  const message = yield* SomeService.getMessage();
});

// a simple tag without a make function (shape generic is required because it cannot be inferred)
class SomeTag2 extends Tag<SomeTag2, { message: string }>()('SomeTag2') { }

const layer3 = Layer.succeed(SomeTag2, SomeTag2.of({ message: 'hello' }));
```
