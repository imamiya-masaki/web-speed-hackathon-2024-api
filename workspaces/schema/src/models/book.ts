/* eslint-disable sort/object-properties */

import { randomUUID } from 'node:crypto';

import { sqliteTable, text, customType} from 'drizzle-orm/sqlite-core';

export const citext = customType<{
  config: { length?: number };
  data: string;
  default: true;
  notNull: true;
}>({
  dataType(config) {
    return `text${config?.length ? `(${config.length})` : ""} COLLATE UNICODE`;
  },
});

export const book = sqliteTable('book', {
  // primary key
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),

  // columns
  description: text('description').notNull(),
  // unicode-collation-algorithm2と同様の挙動にするため
  name: citext('name').notNull(),
  nameRuby: citext('name_ruby').notNull(),

  // relations
  imageId: text('image_id').notNull(),
  authorId: text('author_id').notNull(),
  releaseId: text('release_id').notNull(),

  // metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
