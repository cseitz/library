import { it } from '@effect/vitest';
import { Console, Effect, Layer } from 'effect';
import { Tag } from '@cseitz/effect-tag';
import { Class } from '../index';
import { fn } from '@cseitz/effect-fn';
import { SequentialLayer } from '@cseitz/effect-sequential-layer';



// --- example from reddit post ---
// https://gist.github.com/kevin-courbet/4bebb17f5f2509667e6c6a20cbe72812

class InvoiceRepository extends Effect.Tag('app/invoice-repository')<
  InvoiceRepository,
  {
    getById(invoiceId: string): Effect.Effect<{ id: string, total: number }, never, never>;
  }
>() {};


interface InvoiceServiceInterface {
  /** gets an invoice by id */
  getInvoice(invoiceId: string): Effect.Effect<{ invoice: { id: string, total: number } }, never, never>;
}

class RedditInvoiceService extends Effect.Tag('app/invoice-service')<
RedditInvoiceService,
  InvoiceServiceInterface
>() {};

it.effect('test reddit invoice service', () => Effect.gen(function* () {

  const RedditInvoiceServiceLive = Layer.effect(
    RedditInvoiceService,
    Effect.gen(function* () {
      const repository = yield* InvoiceRepository;
      return {
        getInvoice: Effect.fn(function* (invoiceId: string) {
          const result = yield* repository.getById(invoiceId);
          return {
            invoice: {
              id: result.id,
              total: result.total,
            }
          };
        }),
      };
    })
  );

}));


// --- end example from reddit post ---

// service class logic: https://github.com/Effect-TS/effect/blob/9f74ba1404ec57282e45670b66037ee583c63be9/packages/effect/src/Effect.ts#L13668
// tag proxy logic: https://github.com/Effect-TS/effect/blob/9f74ba1404ec57282e45670b66037ee583c63be9/packages/effect/src/Effect.ts#L13430

// ---

// define interface for service
interface InvoiceServiceImplementationInterface {
  /** gets an invoice by id */
  getInvoice(invoiceId: string): Effect.Effect<{ invoice: { id: string, total: number }, date: Date }, never, never>;
}

// define service tag w/ accessors
class InvoiceService extends Tag<
  InvoiceService,
  // shape is of the implementation interface
  InvoiceServiceImplementationInterface
>()('app/invoice-service', {
  accessors: true,
}) {};

class SomeBaseClass1 {
  /** hi */
  woah = 'hi';

  constructor(msg: string) {
  }
}

type a0 = ConstructorParameters<typeof SomeBaseClass1>;

const base0 = Class<
InvoiceServiceImplementation
>()
const base1 = base0({
make: Effect.fn(function* (config: {
  slug: string;
}) {
  // retrieve any dependencies needed by the implementation
  const repository = yield* InvoiceRepository;
  // access them later via this.ctx, which is the following return value
  return {
    repository,
    $super: sup => sup('1'),
    // $super: ['123']
    // $super: ['123']
  }
}),
extending: SomeBaseClass1,
});

// define an implementation class that implements the interface
class InvoiceServiceImplementation extends Class<
  InvoiceServiceImplementation
>()({
  make: Effect.fn(function* (config: {
    slug: string;
  }) {
    // retrieve any dependencies needed by the implementation
    const repository = yield* InvoiceRepository;
    // access them later via this.ctx, which is the following return value
    return {
      repository,
      $super: make => make('123'),
      // $super: ['123']
      // $super: ['123']
    }
  }),
  extending: SomeBaseClass1,
}) implements InvoiceServiceImplementationInterface {

  _retrieveInvoice = fn(this, function* (invoiceId: string) {
    this.woah;
    yield* Console.log('InvoiceServiceImplementation#_retrieveInvoice', invoiceId);
    const invoice = yield* this.repository.getById(invoiceId);
    return invoice;
  });

  getInvoice = fn(this, function* (invoiceId: string) {
    const invoice = yield* this._retrieveInvoice(invoiceId);
    return {
      invoice,
      date: new Date(),
    };
  });

}

// create a layer that provides the service
const InvoiceServiceLive = Layer.effect(
  InvoiceService,
  InvoiceServiceImplementation.make({
    slug: 'test',
  })
);

// const InvoiceServiceTest = Layer.effect(
//   InvoiceService,
//   InvoiceServiceTestImplementation.make({
//     slug: 'test',
//   })
// );

const sampleProgram1 = Effect.gen(function* () {
  // utilize the service via accessors
  const invoice1 = yield* InvoiceService.getInvoice('123');
  // utilize the service directly
  const invoiceService = yield* InvoiceService;
  const invoice2 = yield* invoiceService.getInvoice('123');

  yield* Console.log('invoice1', invoice1);
  yield* Console.log('invoice2', invoice2);
}).pipe(
  Effect.provide(InvoiceServiceLive),
);

const sampleProgram1SequentialLayer = SequentialLayer.of(Layer.empty)
  .effect(InvoiceRepository, Effect.gen(function* () {
    return InvoiceRepository.of({
      getById: Effect.fn(function* (invoiceId: string) {
        yield* Console.log('InvoiceRepository#getById', invoiceId);
        return { id: invoiceId, total: 123 };
      }),
    });
  }))
  .effect(InvoiceService, InvoiceServiceImplementation.make({
    slug: 'test',
  }))
  .layer;

// const sampleProgram1Layer = Layer.mergeAll(
//   Layer.empty,
//   Layer.effect(InvoiceRepository, Effect.gen(function* () {
//     return InvoiceRepository.of({
//       getById: Effect.fn(function* (invoiceId: string) {
//         return { id: invoiceId, total: 123 };
//       }),
//     });
//   })),
//   InvoiceServiceLive,
// );

it.effect('test sample program 1', () => sampleProgram1.pipe(
  Effect.provide(sampleProgram1SequentialLayer)
));

