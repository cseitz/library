import { defineDrizzlePg } from './dialect/pg';

export * as core from './core';
export type {
  inferEffectTransaction,
  OnlyTableSchemas,
  UnknownEffectDatabase,
} from './core';

export const Pg = defineDrizzlePg;

