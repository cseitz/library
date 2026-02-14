import { Context, Effect, Schema } from 'effect';
import { get } from 'lodash-es';
import { DrizzleEffectTypes } from './database';

// -- Generic Drizzle Tagged Class ---

export type RemapFieldsPreserveComments<A, B> = Pick<{
  [P in keyof A]: B extends { [K in P]: any } ? B[P] : never;
  // @ts-expect-error
}, keyof B> & Omit<B, keyof A>;

export type DrizzleEffectTaggedClass<
  Self extends unknown,
  Database extends { tables: Record<string, any> },
  Tag extends string,
  Fields extends Schema.Struct.Fields,
  TableName extends keyof Database['tables'],
> = (
  & Schema.TaggedClass<
    Self,
    Tag,
    RemapFieldsPreserveComments<
      Database['tables'][TableName],
      Fields
    >
  >
  & {
    db: Context.Tag<Database, Database>;
    table: Effect.Effect<Database['tables'][TableName]>;
    tableName: TableName;
  }
);

export type DrizzleEffectDefineTaggedClass<
  Database extends DrizzleEffectTypes['Database'] & { tables: Record<string, any> },
> = (
  <Self>() => (
    <
      Tag extends string,
      TableName extends keyof Database['tables'],
      Fields extends Schema.Struct.Fields,
    >(def: {
      tag: Tag;
      table: TableName;
      schema: Fields;
    }) => (
      DrizzleEffectTaggedClass<
        Self, 
        Database, 
        Tag, 
        Fields, 
        TableName
      >
    )
  )
);

export const defineTaggedClassFactory = <
  Database extends unknown,
>(factoryDef: {
  getDatabaseTag: () => Context.Tag<any, Database>;
}): (
  DrizzleEffectDefineTaggedClass<
    // @ts-expect-error - Database is unknown
    Database
  >
) => {
  return () => ((tagDef: any) => {
    return class extends Schema.TaggedClass<any>()(
      tagDef.tag,
      tagDef.schema
    ) {
      static db = factoryDef.getDatabaseTag();
      static tableName = tagDef.table;
      static table = Effect.andThen(
        factoryDef.getDatabaseTag(),
        (db: Database) => get(db, ['tables', tagDef.table]),
      );
    }
  }) as any;
}
