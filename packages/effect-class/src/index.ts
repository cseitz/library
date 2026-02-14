import * as ClassModule from './class';

export type * from './class';

export const Class = Object.assign(ClassModule.createEffectClass, {
  ...ClassModule,
});
