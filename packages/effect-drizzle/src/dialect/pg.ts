import { fn } from '@library/effect-fn';
import { Tag } from '@library/effect-tag';
import { PgClient } from '@effect/sql-pg';
import {
  type AnyRelations,
  type EmptyRelations,
} from 'drizzle-orm';
import {
  drizzle as drizzleEffectPg,
  type EffectDrizzleConfig,
  type EffectPgDatabase,
} from 'drizzle-orm/effect-postgres';
import { Context, Effect, Option, Scope } from 'effect';
import { forEach, isFunction, set } from 'lodash-es';
import {
  defineTaggedClassFactory,
  DrizzleEffectCommonImplementation,
  DrizzleEffectCommonImplementationContext,
  DrizzleEffectTypes,
  inferEffectTransaction,
  OnlyTableSchemas,
  UnknownEffectDatabase,
} from '../core';
import { isClass } from '../core/utils';

// --- Postgres ---

export interface DrizzleEffectPgTypes<
  TSelf extends unknown = unknown,
  TSchema extends Record<string, unknown> = Record<string, never>,
  TRelations extends AnyRelations = EmptyRelations,

  // args
  T0 extends unknown = TSelf,
  T1 extends UnknownEffectDatabase = EffectPgDatabase<TSchema, TRelations>,
  T2 extends Record<string, unknown> = EffectDrizzleConfig<TSchema, TRelations>,
  T3 extends unknown = PgClient.PgClient,
  T4 extends unknown = PgClient.PgClientConfig,
> {
  BaseTypes: DrizzleEffectTypes<T0, T1, T2, T3, T4>;
  T: DrizzleEffectTypes<T0, T1, T2, T3, T4>['T'] & {
    Schema: TSchema;
    Relations: TRelations;
  };

  Config: DrizzleEffectTypes<T0, T1, T2, T3, T4>['Config'];
  // Database: DrizzleEffectTypes<T0, T1, T2, T3, T4>['Database'];
  // DatabaseStatics: DrizzleEffectTypes<T0, T1, T2, T3, T4>['DatabaseStatics'];
  // DatabaseImplementation: DrizzleEffectTypes<T0, T1, T2, T3, T4>['DatabaseImplementation'] & {
  //   /**
  //    * Drizzle database factory
  //    */
  //   drizzle: (typeof drizzleEffectPg);
  // };
}

export interface DrizzleEffectPgImplementationContext extends DrizzleEffectCommonImplementationContext {

}

class DrizzleEffectPgImplementation<Types extends DrizzleEffectPgTypes<any, any, any, any, any>> extends DrizzleEffectCommonImplementation<Types['BaseTypes']> implements DrizzleEffectPgImplementationContext {

  public schema: Types['T']['Schema'];
  public relations: Types['T']['Relations'];

  constructor(ctx: DrizzleEffectPgImplementationContext & {
    schema: Types['T']['Schema'];
    relations: Types['T']['Relations'];
  }) {
    super(ctx);
    this.schema = ctx.schema;
    this.relations = ctx.relations;
  }

  drizzle = drizzleEffectPg;

  override make(config: Types['Config']) {
    const base = super.make(config);
    const schema = ((config as any)?.schema ?? this.schema) as typeof this.schema;
    const relations = ((config as any)?.relations ?? this.relations) as typeof this.relations;
    return {
      ...base,
      schema,
      relations,
      exports: {
        ...base.exports,
        tables: schema as OnlyTableSchemas<Types['T']['Schema']>,
      }
    };
  }

  override statics() {
    return {
      ...super.statics(),
      Client: PgClient,
    };
  }

  getClientFromConfigOrContext = fn(
    'drizzle/effect/dialect/pg/getClientFromConfigOrContext',
  )(this, function* (config: { config: (PgClient.PgClient | PgClient.PgClientConfig) }) {
    const maybeClientFromConfig = (config as any)?.client as (PgClient.PgClient | PgClient.PgClientConfig);
    if (maybeClientFromConfig) {
      const maybeTag = (maybeClientFromConfig as any)?._tag;
      if (maybeTag === PgClient.PgClient.key) {
        return maybeClientFromConfig as PgClient.PgClient;
      } else {
        return yield* (
          PgClient.make(maybeClientFromConfig as PgClient.PgClientConfig) as any as (
            Effect.Effect<PgClient.PgClient, any, Scope.Scope /*| Reactivity */>
          )
        );
      }
    }
  
    const maybeClient = yield* Effect.serviceOption(PgClient.PgClient);
    if (Option.isSome(maybeClient)) {
      return maybeClient.value;
    }
    
    return yield* Effect.die(new Error('No client provided'));
  });

}

function defineDrizzlePg<Self extends unknown = unknown>() {
  return <
    TSchema extends Record<string, unknown>,
    TRelations extends AnyRelations = EmptyRelations
  >(def: {
    schema: TSchema;
    relations: TRelations;
    tag?: string;
    /**
     * Custom internals implementation for the database.
     * - You should provide an extended `DrizzleEffectPgImplementation` class, or a partial implementation in the form of an object.
     */
    implementation?: (
      | (typeof DrizzleEffectPgImplementation)
      // | Partial<DrizzleEffectPgImplementation<DrizzleEffectPgTypes<Self, TSchema, TRelations>>>
      // | Partial<DrizzleEffectPgTypes<Self, TSchema, TRelations>['DatabaseImplementation']>
    );
  }) => {
    type Types = DrizzleEffectPgTypes<Self, TSchema, TRelations>;
    type Implementation = DrizzleEffectPgImplementation<Types>;
    type IDatabase = ReturnType<Implementation['make']>['exports'] & Types['T']['EffectDatabase'];
    type IDatabaseStatics = ReturnType<Implementation['statics']> & {
      
    };

    const Tags: {
      Database: any;
      CurrentTransaction: any;
    } = {} as any;

    const getTag = <T extends keyof typeof Tags>(key: T) => (() => Tags[key] as (typeof Tags)[T]);

    function buildImplementationPre() {
      // infer database tag key
      const databaseTagKey = def.tag ?? 'drizzle/database/Pg';

      // define tagged class factory
      const defineTaggedClass = defineTaggedClassFactory<
        Self
      >({
        getDatabaseTag: getTag('Database'),
      });

      // define current transaction tag
      class CurrentTransaction extends Tag<
        CurrentTransaction,
        inferEffectTransaction<IDatabase>
      >()(databaseTagKey + '/CurrentTransaction', {}) {}
      Tags.CurrentTransaction = CurrentTransaction;
      
      return {
        databaseTagKey,
        defineTaggedClass,
        CurrentTransaction,
      };
    };

    function buildImplementation(preImplementation: ReturnType<typeof buildImplementationPre>) {

      // infer provided implementation kind
      const implementationInputMode = def.implementation ? (
        isClass(def.implementation) ? 'class' : 'partial'
      ) : null;

      // infer implementation class
      const implementationClass: typeof DrizzleEffectPgImplementation = implementationInputMode === 'class'
        ? (def.implementation as any)
        : DrizzleEffectPgImplementation;

      // infer implementation overrides
      const implementationOverrides = implementationInputMode === 'partial'
        ? def.implementation
        : {};

      // construct implementation class
      const implementation: Implementation = new implementationClass({
        ...def,
        getDatabaseTag: getTag('Database'),
        getCurrentTransactionTag: getTag('CurrentTransaction'),
      }) as any;

      // assign implementation overrides
      forEach(implementationOverrides, (value: any, key: string) => {
        if (isFunction(value)) {
          set(implementation, key, value.bind(implementation));
        } else {
          set(implementation, key, value);
        }
      });

      return Object.assign(implementation, preImplementation);

    };

    // const {
    //   databaseTagKey,
    //   defineTaggedClass,
    //   CurrentTransaction,
    // } = buildImplementationPre();
    // Tags.CurrentTransaction = CurrentTransaction;

    // const {
    //   implementation,
    // } = buildImplementation(buildImplementationPre());

    function buildImplementationPost(implementation: ReturnType<typeof buildImplementation>) {
      /** 
       * Returns the current transaction (if any), or can start a new transaction if called.
       * 
       * @example const tx = yield* db.tx;
       * @example 
       * const people = yield* db.tx(tx => Effect.gen(function* () {
       *   const result = yield* tx.query.people.findMany();
       *   return result;
       * }));
       */
      const tx = Object.assign(
        // function call
        implementation.makeTransaction,
        // yield* call
        implementation.getCurrentTransactionOrDatabase,
      ) as unknown as IDatabase['tx'];

      return Object.assign(implementation, {
        tx,
      });
    };

    const implementation = (
      buildImplementationPost(
        buildImplementation(
          buildImplementationPre()
        )
      )
    );

    // create database tag
    const BaseDatabaseClassTag = Tag<
      Self,
      IDatabase,
      IDatabaseStatics
    >()(
      implementation.databaseTagKey,
      {
        accessors: true,
        effect: Effect.fn(function* (config: Types['Config']) {
          const {
            schema,
            relations,
            exports
          } = implementation.make(config);

          // get client from config or context
          const client = yield* implementation.getClientFromConfigOrContext(config as any);

          // create drizzle database
          const db = implementation.drizzle(client, {
            schema,
            relations,
            ...config,
          });

          return Object.assign(db, {
            ...exports,
          });
        }),
      }
    );

    // const statics = implementation.statics();

    // @ts-expect-error - Implementation will likely not be perfect
    const ImplementedStaticsDatabaseClassTag = class extends BaseDatabaseClassTag implements ReturnType<Implementation['statics']> {
      static override Client = PgClient; //statics.Client;
      static TaggedClass = implementation.defineTaggedClass;
      static CurrentTransaction = implementation.CurrentTransaction;
    }

    let Database = BaseDatabaseClassTag;
    Database = ImplementedStaticsDatabaseClassTag as any;
    Tags.Database = Database;

    return Database;

  }
};

defineDrizzlePg.Implementation = DrizzleEffectPgImplementation;

export {
  defineDrizzlePg
};

