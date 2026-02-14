import { omit } from 'lodash-es';
import * as LayerBuilderModule from './layer-builder';

export type * from './layer-builder';

export const LayerBuilder = Object.assign(LayerBuilderModule.makeLayerBuilderFactory, {
  ...omit(LayerBuilderModule, [
    'makeLayerBuilderFactory',
    'makeLayerBuilderDefinition',
    'getLayer',
  ]),
  Definition: LayerBuilderModule.makeLayerBuilderDefinition,
  layer: LayerBuilderModule.getLayer,
});
