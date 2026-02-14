import {
  DrizzleQueryError,
  TransactionRollbackError
} from 'drizzle-orm';
import { Effect } from 'effect';
// import { Db1 } from '../../example.1';

// export interface DrizzleErrorHandlers<
//   TOnConstraintViolation extends Effect.Effect<any, any | never, any | never> = never,
// > {
//   onConstraintViolation?: (error: DrizzleQueryError) => TOnConstraintViolation,
//   onQueryError?: (error: unknown) => Effect.Effect<any>,
//   onTransactionRollback?: (error: unknown) => Effect.Effect<any>,
// }

export interface DrizzleErrorHandlers {
  onConstraintViolation?: (error: DrizzleQueryError) => any,
  onQueryError?: (error: unknown) => Effect.Effect<any>,
  onTransactionRollback?: (error: unknown) => Effect.Effect<any>,
}

export interface DrizzleErrorToHandlerMap {
  onConstraintViolation: DrizzleQueryError;
  onQueryError: DrizzleQueryError,
  onTransactionRollback: TransactionRollbackError,
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type MapOfEffectsToUnion<T> = NonNullable<{
  [K in keyof T]: NonNullable<T[K]> extends (...args: any) => Effect.Effect<any, any, any> ? ReturnType<NonNullable<T[K]>> : T[K];
}[keyof T]>;

type MapOfFunctionsToFirstArgumentUnion<T> = NonNullable<{
  [K in keyof T]: NonNullable<T[K]> extends (...args: any) => Effect.Effect<any, any, any> ? Parameters<NonNullable<T[K]>>[0] : never;
}[keyof T]>;

// @ts-expect-error
type MapOfEffectsToSuccess<T> = Effect.Effect.Success<MapOfEffectsToUnion<T>>;
// @ts-expect-error
type MapOfEffectsToContext<T> = Effect.Effect.Context<MapOfEffectsToUnion<T>>;
// @ts-expect-error
type MapOfEffectsToError<T> = Effect.Effect.Error<MapOfEffectsToUnion<T>>;


const a1 = Effect.catchAll((err) => {
  if (err instanceof DrizzleQueryError) {
    return Effect.succeed(void 0);
  }
  return Effect.die(err);
})

// const catchDrizzleErrors = <E, A2, E2, R2>(f: (e: E) => Effect.Effect<A2, E2, R2>) => {
//   return <A, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A2 | A, E2, R2 | R> => {
//     return Effect.catchAll((unknownError: unknown) => {
//       return Effect.gen(function* () {

//       });
//     })(self) as any;
//   }
// }

const catchDrizzleErrors = <
  E,
  D extends DrizzleErrorHandlers,
>(def: D) => {
  return <A, R>(self: Effect.Effect<A, E, R>): (
    keyof D extends never ? Effect.Effect<A, E, R> : (
      Effect.Effect<
        A, 
        // @ts-expect-error
        MapOfEffectsToError<D> | Exclude<E, DrizzleErrorToHandlerMap[keyof D]>, 
        R | MapOfEffectsToContext<D>
      >
      & {
        // @ts-expect-error
        knownErrors: DrizzleErrorToHandlerMap[keyof D]
      }
    )
  ) => {
    return Effect.catchAll((unknownError: unknown) => {
      return Effect.gen(function* () {

      });
    })(self) as any;
  }
}



catchDrizzleErrors({

})


// class TestError1 extends createError('TestError1')<{}>() {}

// type ef1e = Effect.Effect.Error<typeof ef1>;
// const ef1 = Effect.gen(function* () {
//   const db = yield* Db1;
//   // db.query.people
//   // const tx = yield* db.tx;
//   // const res1 = yield* db.tx(tx2 => {
//   //   return Effect.gen(function* () {
//   //     const result = yield* tx2.query.people.findMany().pipe(
//   //       catchDrizzleErrors({

//   //       })
//   //     );
//   //     return result;
//   //   });
//   // });
//   const a0 = db.insert(db.tables.people).values({
//     id: 1,
//     name: 'John Doe',
//   }).pipe(
//     catchDrizzleErrors({
//       onConstraintViolation(error) {
//         return Effect.gen(function* () {
//           return yield* new TestError1({ message: 'constraint violation' });
//         });
//         // return Effect.succeed('constraint violation');
//       },
//     })
//   );
//   a0.knownErrors
//   yield* a0;
//   return db;
// })

// // const catchDrizzleErrors: (
// //   <E, A2, E2, R2>(f: (e: E) => Effect.Effect<A2, E2, R2>): <A, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A2 | A, E2, R2 | R>
// // ) = () => {

// // } as any;