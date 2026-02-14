import * as TagModule from './tag';

export type * from './tag';

export const Tag = Object.assign(TagModule.createTag, {
  ...TagModule,
});
