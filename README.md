# Library

## Installing Packages

```bash
pnpm config set @library:registry http://localhost:4873 --location project
```

## Using Libraries

```ts
// ./src/lib/index.ts

export * from '@library/effect-fn';
export * from '@library/effect-tag';
export * from '@library/effect-error';
export * from '@library/effect-layer-builder';
export * from '@library/effect-sequential-layer';
export * from '@library/effect-drizzle';

```

