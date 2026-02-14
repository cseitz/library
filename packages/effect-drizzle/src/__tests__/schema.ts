import { getTableName } from 'drizzle-orm';
import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';

export const table1 = pgTable('table1', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const people = pgTable('people', {
  /** The unique identifier for the person */
  id: serial('id').primaryKey(),
  /** The name of the person */
  name: text('name').notNull(),
  /** The date and time the person was created */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** The date and time the person was last updated */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// console.log(people);

// getTableName
