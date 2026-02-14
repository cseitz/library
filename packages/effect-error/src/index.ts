import * as ErrorModule from './error';

export type * from './error';

export const Error = Object.assign(ErrorModule.createError, {
  ...ErrorModule,
});
