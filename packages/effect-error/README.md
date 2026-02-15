# Library - Effect Error

## Development

```bash
# build
pnpm build
# test
pnpm test
```

## Usage

```ts
import { Error } from '@cseitz/effect-error';

class SomeError extends Error('SomeError')<SomeError, {
  someValue: string;
}>() {}

yield* new SomeError({
  message: 'hello',
  someValue: 'world',
});

yield* new SomeError.wrap(SomeOtherErrorToBeTheCause, {
  message: 'hello',
  someValue: 'world',
});
```
