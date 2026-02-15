# Library - Effect Drizzle

## Development

```bash
# build
pnpm build
# test
pnpm test
```

## Usage

```ts
import { Drizzle } from '@cseitz/effect-drizzle';
import * as schema from './schema';
import relations from './relations';

class Postgres extends Drizzle.Pg({
  schema,
  relations,
}) {}
```
