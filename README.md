# Library

## Installing Packages

```bash
pnpm config set @library:registry http://localhost:4873 --location project
```

## Using Libraries

```ts
// ./src/lib/index.ts

export * from '@cseitz/effect-fn';
export * from '@cseitz/effect-tag';
export * from '@cseitz/effect-error';
export * from '@cseitz/effect-layer-builder';
export * from '@cseitz/effect-sequential-layer';
export * from '@cseitz/effect-drizzle';

```

