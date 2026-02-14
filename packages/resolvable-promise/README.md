
# Library - Resolvable Promise

```bash
pnpm add @library/resolvable-promise
```

## Development

```bash
# build
pnpm build
# test
pnpm test
```

## Usage

```ts
import { createResolvablePromise, ResolvablePromise } from '@library/resolvable-promise';

const promise: ResolvablePromise<string> = createResolvablePromise<string>();

promise.resolve('resolved');

const result = await promise;

console.log(result);
```
