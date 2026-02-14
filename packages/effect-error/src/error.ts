import { Cause, Context, Data } from 'effect'


type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export interface ComputedErrorShape<Name> {
  /** A unique code identifying the error */
  code: Name,
}

export interface CommonErrorShape {
  /** A human readable message describing the error */
  message?: string,
  /** The error that triggered this error */
  cause?: unknown,
}

type ErrorClassInstance<Name, Shape, ConstantShape> = (
  & Cause.YieldableError
  & {
    readonly _tag: Name;
  }
  & Readonly<Shape>
  & Readonly<ConstantShape>
  & Readonly<Exclude<ComputedErrorShape<Name>, keyof Shape>>
  & Readonly<Exclude<CommonErrorShape, keyof Shape>>
)

type ErrorClass<Self, Name extends string, Shape extends Record<string, any>, ConstantShape extends Record<string, any>> = (
  & {
    new(data: Prettify<Exclude<Shape, keyof ConstantShape> & CommonErrorShape>): ErrorClassInstance<Name, Shape, ConstantShape>;
    readonly _tag: Name;
    readonly code: Name;
    wrap(cause: unknown, data?: Shape & Omit<CommonErrorShape, 'cause'>): ErrorClassInstance<Name, Shape, ConstantShape>;
    prepare<TProvidedShape extends Partial<Shape & Omit<CommonErrorShape, 'cause'>>>(data: TProvidedShape): ErrorClass<Self, Name, Shape, ConstantShape>;
  }
  & Context.Tag<Self, ErrorClassInstance<Name, Shape, ConstantShape>>
);

/**
 * @example
 * 
 * class SomeError1 extends createError('SomeError1')<SomeError1, {
 *   someValue: string;
 * }>() { }
 * 
 * yield* new SomeError1({
 *   message: 'hello',
 *   someValue: 'world',
 * })
 * 
 */
export function createError<
  Name extends string,
  const ConstantShape extends Record<string, any>,
>(
  code: Name,
  // @ts-expect-error
  constantShape: ConstantShape = {}
) {
  const name = code;
  return function<Self, Shape extends Record<string, any> = {}>(): (
    & ErrorClass<Self, Name, Shape, ConstantShape>
  ) {
    const errorClass = class extends Data.TaggedError(name) {
      static readonly _tag = name;
      static readonly code = name;

      constructor(input: any) {
        super({
          code: constantShape['tag'],
          ...constantShape,
          ...input,
        });
      }

      static wrap(cause: unknown, data: Shape & { message?: string }) {
        return new errorClass({
          message: String(cause),
          ...((this as any)?.partialData ?? {}),
          ...data,
          cause,
        } as any);
      }

      static prepare<TProvidedShape extends Partial<Shape & { message?: string }>>(partialData: TProvidedShape) {

        const allPartialData = {
          ...((this as any)?.partialData ?? {}),
          ...partialData,
        }

        return Object.setPrototypeOf(Object.assign(function(args?: any) {
          return new errorClass({
            ...allPartialData,
            ...(args ?? {}),
          });
        }, {
          partialData: allPartialData,
        }), errorClass);
      }

    } as any;

    return errorClass;
  }
}

export function wrapError<T extends object>(error: T): (
  T extends { wrap: (...args: any[]) => any }
    ? ReturnType<T['wrap']>
    : (
      T extends { new(...args: any[]): any }
        ? InstanceType<T>
        : never
    )
) {
  if ('wrap' in error) {
    return ((...args: any[]) => (error as any).wrap(...args)) as any;
  }
  return new (error as any)();
}
