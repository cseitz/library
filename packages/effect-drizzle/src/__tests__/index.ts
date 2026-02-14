import { describe, it, expect } from 'vitest';
import { Drizzle } from '../index';
import * as schema from './schema';
import relations from './relations';
import { Effect } from 'effect';

describe('Pg', () => {
  it('should be defined', () => {
    expect(Drizzle.Pg).toBeDefined();
  });
});

class Postgres1 extends Drizzle.Pg<Postgres1>()({
  schema,
  relations,
}) {}

Effect.gen(function* () {
  const db = yield* Postgres1;
});
