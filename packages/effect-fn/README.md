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
import { fn } from '@library/effect-fn';

class SomeClass1 {
  message = 'hello';
  someFunction1 = fn(
    'SomeClass1#someFunction1',
  )(this, function* (num?: number) {
    return { message: this.message, num };
  });
}
```
