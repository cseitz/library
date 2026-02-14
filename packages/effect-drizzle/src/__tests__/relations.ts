import { defineRelations, defineRelationsPart } from 'drizzle-orm';
import * as schema from './schema';

const relationsPart1 = defineRelationsPart(schema, (r) => ({

}));

const relations = defineRelations(schema, (r) => ({

}));

export default {
  ...relations,
  ...relationsPart1,
}

