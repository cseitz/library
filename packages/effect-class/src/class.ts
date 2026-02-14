import { Effect, Layer } from 'effect';

type EmptyClass = {
  new(): {};
}

type UnknownClass = {
  new(...args: any[]): unknown;
};

type inferMakeExtending<Make extends {
  extending?: UnknownClass;
}> = (
  Make['extending'] extends ({
    new(...args: any[]): infer R;
  }) ? R : never
);

type inferMakeEffect<Make extends {
  make: (...args: any[]) => Effect.Effect<any, any | never, any | never>;
}> = ReturnType<Make['make']>;

export type EffectClass<Tag, Make extends {
  make: (...args: any[]) => Effect.Effect<any, any | never, any | never>;
  extending?: UnknownClass;
}> = {
  new(_: Effect.Effect.Success<inferMakeEffect<Make>>): (
    & Effect.Effect.Success<inferMakeEffect<Make>>
    & inferMakeExtending<Make>
    & {

    }
  );

  make: (
    & ((...args: Parameters<Make['make']>) => Effect.Effect<
      Tag,
      Effect.Effect.Error<inferMakeEffect<Make>>,
      Effect.Effect.Context<inferMakeEffect<Make>>
    >)
    & ({
      asContext:  ((...args: Parameters<Make['make']>) => Effect.Effect<
        Effect.Effect.Success<inferMakeEffect<Make>>,
        Effect.Effect.Error<inferMakeEffect<Make>>,
        Effect.Effect.Context<inferMakeEffect<Make>>
      >),
      asLayer: ((...args: Parameters<Make['make']>) => Layer.Layer<
        Tag,
        Effect.Effect.Error<inferMakeEffect<Make>>,
        Effect.Effect.Context<inferMakeEffect<Make>>
      >),
    })
  );
}

/**
 * @example
 * 
 * // define interface
 * interface InvoiceServiceInterface {=
 *   getInvoice(invoiceId: string): Effect.Effect<
 *     { id: string, total: number },
 *     never,
 *     never
 *   >;
 * }
 * 
 * // define service tag
 * class InvoiceService extends Lib.Effect.Tag<
 *   InvoiceService,
 *   InvoiceServiceInterface
 * >()('app/invoice-service', {
 *   accessors: true,
 * }) {}
 * 
 * // define implementation class with effect constructor and implements the interface
 * class InvoiceServiceImplementation extends Lib.Effect.Class<
 *   InvoiceService
 * >()({
 *   make: Lib.Effect.fn(function* (config: { slug: string }) {
 *     // yield any dependencies needed by the implementation
 *     const repository = yield* InvoiceRepository;
 *     // access them later via `this`
 *     return {
 *       repository,
 *     }
 *   }),
 * }) implements InvoiceServiceInterface {
 * 
 *   getInvoice = Lib.Effect.fn(
 *     'InvoiceService#getInvoice',
 *   )(this, function* (invoiceId: string) {
 *     const invoice = yield* this.repository.getById(invoiceId);
 *     return { id: invoice.id, total: invoice.total };
 *   });
 * 
 * }
 * 
 * // create a layer
 * const InvoiceServiceLive = Layer.effect(
 *   InvoiceService,
 *   InvoiceServiceImplementation.make({
 *     slug: 'test',
 *   })
 * );
 * 
 */
export const createEffectClass = function<TTag>() {
  return function<
    TAdditionalConfig extends {

    },
    TMakeFn extends (...args: any[]) => Effect.Effect<(
      & Record<string, any>
      & (
        ConstructorParameters<TExtending> extends never
          ? {}
          : {
            $super: (make: (...args: ConstructorParameters<TExtending>) => void) => void;
          }
      )
      
    ), any | never, any | never>,
    TExtending extends UnknownClass | never = never,
  >(def: (
    & TAdditionalConfig
    & (
      | {
        make: TMakeFn;
      }
      | {
        make: TMakeFn;
        extending: TExtending;
      }
    )
  )) {
    type TMake = (
      & { make: TMakeFn }
      & { extending: TExtending }
      & TAdditionalConfig
    );

    const baseClass: any = (def as any)?.extending || class {};
  
    const effectClass = class extends baseClass {
      constructor(ctx: any) {
        const catchArgs = (cb: any) => {
          let args: any[] = [];
          cb((..._args: any[]) => {
            args = _args;
          });
          return args;
        }
        super(
          ...(ctx.$super ? catchArgs(ctx.$super) : [])
        )
        Object.assign(this, ctx);
      }

      static make = (() => {
        const self = this;
        return Object.assign(
          function(this: any, ...args: Parameters<TMakeFn>) {
            return Effect.andThen(def.make(...args), makeResult => new this(makeResult));
          },
          {
            asContext: (...args: Parameters<TMakeFn>) => {
              return def.make(...args);
            },
            asLayer: (...args: Parameters<TMakeFn>) => {
              return Layer.effect(self as any, def.make(...args));
            }
          }
        );
      })();

    };

    return effectClass as any as EffectClass<TTag, TMake>;
  }
};
