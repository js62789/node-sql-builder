describe('SqlQuery', function () {

  var SqlQuery = require('../SqlQuery'),
    query;

  beforeEach(function () {
    query = new SqlQuery();
  });

  afterEach(function () {
    query.reset();
  });

  it('should create a select statement', function () {
    query.select().from('user').where({id: 1});
    expect(query.build()).toBe('SELECT * FROM `user` WHERE `id` = 1;');

    query.reset().select(['id', 'first_name']).from('user').where({id: 1});
    expect(query.build()).toBe('SELECT `id`, `first_name` FROM `user` WHERE `id` = 1;');
  });

  it('should support subqueries', function () {
    var subQuery = new SqlQuery().select().from('user').orderBy('id');
    query.select().from(subQuery, 'tbl').orderBy({ table_alias: 'tbl', field: 'id'});
    expect(query.build()).toBe('SELECT * FROM (SELECT * FROM `user` ORDER BY `id`) AS tbl ORDER BY tbl.`id`;');
  });

  it('should order by', function () {
    query.select().from('user').orderBy('id', 'asc');
    expect(query.build()).toBe('SELECT * FROM `user` ORDER BY `id` ASC;');

    query.reset().select().from('user').orderBy({ field: 'id', table: 'user' }, 'asc');
    expect(query.build()).toBe('SELECT * FROM `user` ORDER BY `user`.`id` ASC;');
  });

  it('should group by', function () {
    query.select().from('user').groupBy('first_name');
    expect(query.build()).toBe('SELECT * FROM `user` GROUP BY `first_name`;');

    query.reset().select().from('user', 'u').groupBy({field: 'first_name', alias: 'u'});
    expect(query.build()).toBe('SELECT * FROM `user` AS u GROUP BY u.`first_name`;');
  });

  it('should support in', function () {
    query.select().from('user').where({ id: [0,1,2] });
    expect(query.build()).toBe('SELECT * FROM `user` WHERE `id` IN (0, 1, 2);');
  });

  it('should create an update statement', function () {
    query.update('user').set({first_name: 'cat'}).where({id: 1});
    expect(query.build()).toBe("UPDATE `user` SET `first_name` = 'cat' WHERE `id` = 1;");
  });

  it('should create an insert statement', function () {
    query.insert({id: 1, first_name: 'cat'}).into('user');
    expect(query.build()).toBe("INSERT INTO `user` (`id`, `first_name`) VALUES (1, 'cat');");
  });

  it('should create an insert ignore statement', function () {
    query.insert({id: 1, first_name: 'cat'}).ignore().into('user');
    expect(query.build()).toBe("INSERT IGNORE INTO `user` (`id`, `first_name`) VALUES (1, 'cat');");
  });

  it('should create a delete statement', function () {
    query.destroy().from('user').where({id: 1});
    expect(query.build()).toBe('DELETE FROM `user` WHERE `id` = 1;');
  });

  it('should use table aliases', function () {
    query.select().from('user', 'u');
    expect(query.build()).toBe('SELECT * FROM `user` AS u;');

    query.reset().select().from({ table: 'user', alias: 'u' });
    expect(query.build()).toBe('SELECT * FROM `user` AS u;');

    query.reset().select({ field: 'id', table_alias: 'u'}).from('user', 'u');
    expect(query.build()).toBe('SELECT u.`id` FROM `user` AS u;');
  });

  it('should create a join', function () {
    query.select().from('user').join('blog', null, { table: 'user', field: 'id' }, { table: 'blog', field: 'author_id' });
    expect(query.build()).toBe('SELECT * FROM `user` JOIN `blog` ON `user`.`id` = `blog`.`author_id`;');

    query.reset().select([{field: 'id', table: 'user'}, {field: 'id', table: 'blog'}]).from('user').join('blog', null, { table: 'user', field: 'id' }, { table: 'blog', field: 'author_id' });
    expect(query.build()).toBe('SELECT `user`.`id`, `blog`.`id` FROM `user` JOIN `blog` ON `user`.`id` = `blog`.`author_id`;');
  });

  it('should truncate', function () {
    query.truncate('user');
    expect(query.build()).toBe('TRUNCATE TABLE `user`;');
  });

  it('should support aggregate functions', function () {
    query.select({ count: 'id', alias: 'count_id' }).from('user');
    expect(query.build()).toBe('SELECT COUNT(`id`) AS count_id FROM `user`;');

    query.reset().select({ sum: 'age', alias: 'years' }).from('user');
    expect(query.build()).toBe('SELECT SUM(`age`) AS years FROM `user`;');
  });

  it('should format a field', function () {
    expect(query.formatField('*')).toBe('*');
    expect(query.formatField('user_id')).toBe('`user_id`');
  });

  it('should format a value', function () {
    expect(query.formatValue(5)).toBe(5);
    expect(query.formatValue('cat')).toBe("'cat'");
  });

});
