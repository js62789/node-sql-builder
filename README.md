node-sql-builder
================

A nodejs module for building sql queries

`var SqlQuery = require('SqlQuery');`

## SqlQuery
### Methods
- `reset` Reset the sql statement back to an empty string
- `build` Build and return the sql statement string
- `select(fields)`
- `from(table, alias)`
- `where(key, val)`
- `order by(field, order)`
- `join(table, alias, foreignKey, foreignKey)`
- `limit(limit)`
- `offset(offset)`
- `update(table)`
- `set(key, val)`
- `insert(key, val)`
- `into(table)`
- `destroy`
- `groupBy(field)`

## Examples
### SELECT
```
var sql = new SqlQuery()
    .select(['id', 'first_name'])
    .from('user')
    .where({id: 1})
    .orderBy('id', 'asc')
    .build();
// SELECT * FROM `user` WHERE `id` = 1 ORDER BY `id` ASC;
```
### INSERT
```
var sql = new SqlQuery()
    .insert({id: 1, first_name: 'cat'})
    .into('user');
// INSERT INTO `user` (`id`, `first_name`) VALUES (1, 'cat');
```
### UPDATE
```
var sql = new SqlQuery()
    .update('user')
    .set({first_name: 'cat'})
    .where({id: 1});
// UPDATE `user` SET `first_name` = 'cat' WHERE `id` = 1;
```
### DELETE
```
var sql = new SqlQuery()
    .destroy()
    .from('user')
    .where({id: 1});
// DELETE FROM `user` WHERE `id` = 1;
```
### JOIN
```
var sql = new SqlQuery()
    .select()
    .from('user')
    .join('blog', null, { table: 'user', field: 'id' }, { table: 'blog', field: 'author_id' });
// SELECT * FROM `user` JOIN `blog` ON `user`.`id` = `blog`.`author_id`;
```
### TRUNCATE
```
var sql = new SqlQuery()
    .truncate('user');
// TRUNCATE TABLE `user`;
```
### ALIASES
```
var sql = new SqlQuery()
    .select({ field: 'id', table_alias: 'u'})
    .from('user', 'u');
// SELECT u.`id` FROM `user` AS u;
```
### AGGREGATES
```
var sql = new SqlQuery()
    .select({ count: 'id', alias: 'count_id' })
    .from('user');
// SELECT COUNT(`id`) AS count_id FROM `user`;
```
### IN
```
var sql = new SqlQuery()
    .select()
    .from('user')
    .where({ id: [0,1,2] });
// SELECT * FROM `user` WHERE `id` IN (0, 1, 2);
```
