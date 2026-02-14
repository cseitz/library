import { fn } from '@library/effect-fn';
import { Effect, Option } from 'effect';
import { get, has, noop } from 'lodash-es';

// Example: https://gist.github.com/mikearnaldi/4a27fa89ec197e0b393ec6592ed4ec53

// --- Types ---

export type OnlyTableSchemas<T> = (
  Pick<T, {
    [P in keyof T]: T[P] extends { $inferInsert: any } ? P : never;
  }[keyof T]>
);

export type UnknownEffectDatabase = (
  & {
    transaction: (transaction: any) => Effect.Effect<any, any | never, any | never>;
  }
  // & Record<string, unknown>
);

export type inferEffectTransaction<TEffectDatabase extends UnknownEffectDatabase> = (
  Parameters<(
    Parameters<TEffectDatabase['transaction']>[0]
  )>[0]
)

// --- Generic Drizzle ---

export interface DrizzleEffectTypes<
  TSelf extends unknown = unknown,
  TEffectDatabase extends UnknownEffectDatabase = UnknownEffectDatabase,
  TConfig extends Record<string, unknown> = Record<string, unknown>,
  TClient extends unknown = unknown,
  TClientConfig extends unknown = unknown,
> {
  T: {
    Self: TSelf;
    EffectDatabase: TEffectDatabase;
    Config: TConfig;
    Client: TClient;
    ClientConfig: TClientConfig;
  };

  Config: (
    & Omit<(
      TConfig
    ), (
      | 'schema'
      | 'relations'
    )>
    & {
      client?: TClient | TClientConfig;
    }
  )

  Database: (
    & TEffectDatabase
    // & {
    //   /**
    //    * All tables in the database schema
    //    */
    //   tables: OnlyTableSchemas<TConfig['schema']>;
    //   /**
    //    * Get current transaction OR make one if called with a function
    //    */
    //   tx: (
    //     & TEffectDatabase['transaction']
    //     & Effect.Effect<
    //       | TEffectDatabase
    //       | inferEffectTransaction<TEffectDatabase>
    //     >
    //   )
    // }
  );

  // DatabaseStatics: {
  //   Client: TClient,
  //   // @ts-expect-error - TSelf is unknown
  //   TaggedClass: DrizzleEffectDefineTaggedClass<TSelf>;
  //   CurrentTransaction: Context.Tag<inferEffectTransaction<TEffectDatabase>, inferEffectTransaction<TEffectDatabase>>;
  // };

  // DatabaseImplementation: {
  //   /**
  //    * 1. If a PgClient is provided directly in the config, use it
  //    * 2. If the configuration to make a PgClient is provided, make it
  //    * 3. Fallback to retrieving the PgClient from the context
  //    * 4. If no client is found, die
  //    */
  //   getClientFromConfigOrContext: (
  //     (config: { client?: TClient | TClientConfig }) => (
  //       Effect.Effect<TClient, any, any>
  //     )
  //   );

  //   /**
  //    * Gets the current transaction from context, or the database if no transaction is active
  //    */
  //   getCurrentTransactionOrDatabase: (
  //     Effect.Effect<(
  //       | TEffectDatabase
  //       | inferEffectTransaction<TEffectDatabase>
  //     ), never, TSelf>
  //   );

  //   /**
  //    * Makes a transaction and provides it via Effect context
  //    */
  //   makeTransaction: (
  //     TEffectDatabase['transaction']
  //   );

  //   /**
  //    * Injects a custom `transaction` method which utilizes `makeTransaction`
  //    */
  //   overrideMakeTransaction: <T>(target: T) => T;

  //   /**
  //    * Retrieves the original overridden `transaction` method from the target
  //    */
  //   getMakeRawTransaction: (target: any) => TEffectDatabase['transaction'];

  // };

}

export interface DrizzleEffectCommonImplementationContext {
  getDatabaseTag: () => any;
  getCurrentTransactionTag: () => any;
}

export class DrizzleEffectCommonImplementation<Types extends DrizzleEffectTypes> implements DrizzleEffectCommonImplementationContext {

  public getDatabaseTag: () => any = noop;
  public getCurrentTransactionTag: () => any = noop;

  constructor(ctx: DrizzleEffectCommonImplementationContext) {
    Object.assign(this, ctx);
  }

  make(config: Types['Config']) {
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
      this.makeTransaction,
      // yield* call
      this.getCurrentTransactionOrDatabase,
    ) as unknown as (
      & Types['T']['EffectDatabase']['transaction']
      & Effect.Effect<
        | Types['T']['EffectDatabase']
        | inferEffectTransaction<Types['T']['EffectDatabase']>
      >
    );

    return {
      exports: {
        tx,
      },
    };
  }

  statics() {
    return {
      CurrentTansaction: this.getCurrentTransactionTag(),
    }
  }

  /**
   * Gets the current transaction from context, or the database if no transaction is active
   */
  getCurrentTransactionOrDatabase: (
    Effect.Effect<(
      | Types['T']['EffectDatabase']
      | inferEffectTransaction<Types['T']['EffectDatabase']>
    ), never, Types['T']['Self']>
  ) = Effect.gen(this, function* () {
    const db = yield* this.getDatabaseTag();
    const maybeTransaction = yield* Effect.serviceOption(this.getCurrentTransactionTag());
    if (Option.isSome(maybeTransaction)) {
      return maybeTransaction.value;
    }
    return db;
  }) as any;

  /**
   * Makes a transaction and provides it via Effect context
   */
  makeTransaction: (
    Types['T']['EffectDatabase']['transaction']
  ) = fn(
    'drizzle/effect/database/common/makeTransaction',
  )(this, function* (
    transaction: (tx: any) => Effect.Effect<any, any, any>,
  ) {
    const db = yield* this.getDatabaseTag();
    let target = db;
    const maybeTransaction = yield* Effect.serviceOption(this.getCurrentTransactionTag());
    if (Option.isSome(maybeTransaction)) {
      target = maybeTransaction.value;
    }
    const makeRawTransaction = yield* this.getMakeRawTransaction(target);
    return yield* makeRawTransaction((tx: any) => {
      tx = this.overrideMakeTransaction(tx);
      const maybeEffect = transaction(tx);
      if (Effect.isEffect(maybeEffect)) {
        return maybeEffect.pipe(
          Effect.provideService(this.getCurrentTransactionTag(), tx),
        )
      }
      return maybeEffect;
    });
  });

  /**
   * Retrieves the original overridden `transaction` method from the target
   */
  getMakeRawTransaction: (
    (target: any) => any
  ) = fn(
    'drizzle/effect/database/common/getMakeRawTransaction',
  )(this, function* (target: any) {
    const makeRawTransaction = (false
      || get(target, ['transaction', '__makeTransaction'])
      || get(target, ['transaction'])
    );
    if (!makeRawTransaction) {
      return yield* Effect.die(new Error('No transaction function found'));
    }
    return makeRawTransaction;
  })

  /**
   * Injects a custom `transaction` method which utilizes `makeTransaction`
   */
  overrideMakeTransaction: (
    <T>(target: T) => T
  ) = fn(
    'drizzle/effect/database/common/overrideMakeTransaction',
  )(this, function* (target: any) {
    const symbol = '__makeTransaction';
    if (has(target, ['transaction', symbol])) {
      return target;
    }
    const originalMakeTransaction = (target as any).transaction;
    (target as any).transaction = Object.assign(
      // @ts-expect-error
      (...args: any[]) => this.makeTransaction(...args),
      {
        [symbol]: originalMakeTransaction,
      }
    )
    return target;
  }) as any;

}
