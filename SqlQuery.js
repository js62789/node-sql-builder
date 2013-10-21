function SqlQuery () {
  this.parts = {};
}

module.exports = SqlQuery;

SqlQuery.prototype = {

  select: function (fields) {
    this.parts.select = this.parts.select || [];
    if (fields instanceof Array) {
      while (fields.length) {
        this.select(fields.shift());
      }
    } else if (typeof fields === 'string') {
      this.parts.select.push({field: fields});
    } else if (typeof fields === 'object') {
      this.parts.select.push(fields);
    } else if (!fields) {
      this.select('*');
    }
    return this;
  },

  _getSelect: function () {
    var selectSql = 'SELECT ',
      select = this.parts.select,
      num_fields = select.length,
      last_index = num_fields - 1,
      self = this;

    select.forEach(function(select, i){
      var count = select.count,
        sum = select.sum,
        alias = select.alias,
        table_alias = select.table_alias,
        table = select.table,
        field = count || sum || select.field,
        fieldSql = '';
      
      if (table_alias) {
        fieldSql += table_alias + '.';
      } else if (table) {
        fieldSql += self.formatField(table) + '.';
      }
      fieldSql += self.formatField(field);

      if (count) {
        selectSql += 'COUNT(' + fieldSql + ')';
      } else if (sum) {
        selectSql += 'SUM(' + fieldSql + ')';
      } else {
        selectSql += fieldSql;
      }

      if (alias) {
        selectSql += ' AS ' + alias;
      }

      if (i !== last_index) {
        selectSql += ', ';
      }
    });

    return selectSql;
  },

  from: function (table, alias) {
    this.parts.from = this.parts.from || [];
    if (table instanceof Array) {
      while (table.length) {
        this.from(table.shift());
      }
    } else if (table instanceof SqlQuery) {
      this.parts.from.push({ table: table, alias: alias });
    } else if (typeof table === 'object') {
      this.parts.from.push(table);
    } else {
      this.from({ table: table, alias: alias });
    }
    return this;
  },

  _getFrom: function () {
    var from = this.parts.from,
      num_froms = from.length,
      last_index = num_froms - 1,
      fromSql = ' FROM ' ,
      self = this;

    if (!from) return '';

    from.forEach(function(f, i) {
      var table = f.table,
        alias = f.alias;

      if (table instanceof SqlQuery) {
        fromSql += '(' + table.build(true) + ')';
      } else {
        fromSql += self.formatField(table);
      }
      if (alias) fromSql += ' AS ' + alias;
      if (i !== last_index) {
        fromSql += ', ';
      }
    });

    return fromSql;
  },

  where: function (key, val) {
    this.parts.where = this.parts.where || [];
    if (typeof key === 'object') {
      for (var field in key) {
        this.where(field, key[field]);
      }
    } else {
      this.parts.where.push({field: key, value: val});
    }
    return this;
  },

  _getWhere: function () {
    var whereSql = ' WHERE ',
      where = this.parts.where;

    if (!where) return '';
    
    var num_where = where.length,
      last_index = num_where - 1,
      self = this;

    where.forEach(function(condition, i){
      var field = condition.field,
        value = condition.value;
      if (value instanceof Array) {
        value = value.map(function(v){
          return self.formatValue(v);
        });
        whereSql += self.formatField(field) + ' IN (' + value.join(', ') + ')';
      } else {
        whereSql += self.formatField(field) + ' = ' + self.formatValue(condition.value);
      }
      if (i !== last_index) {
        whereSql += ' AND';
      }
    });

    return whereSql;
  },

  limit: function (limit) {
    this.parts.limit = limit;
    return this;
  },

  offset: function (offset) {
    this.parts.offset = offset;
    return this;
  },

  _getLimit: function () {
    var limit = this.parts.limit,
      offset = this.parts.offset,
      limitSql = ' LIMIT ';

    if (!limit) return '';

    limitSql += limit;

    if (offset) limitSql += offset;

    return limitSql;
  },

  orderBy: function (field, order) {
    this.parts.orderBy = this.parts.orderBy || [];
    if (typeof field === 'object') {
      this.parts.orderBy.push({orderBy: field, order: order})
    } else {
      this.orderBy({field: field}, order);
    }
    return this;
  },

  _getOrderBy: function () {
    var orderBySql = ' ORDER BY ',
      orderBy = this.parts.orderBy;

    if (!orderBy) return '';

    var num_orders = orderBy.length,
      last_index = num_orders - 1,
      self = this;

    orderBy.forEach(function(o, i){
      var field = o.orderBy,
        order = o.order;

      if (field.table_alias) {
        orderBySql += field.table_alias + '.';
      } else if (field.table) {
        orderBySql += self.formatField(field.table) + '.';
      }
      orderBySql += self.formatField(field.field);
      if (order) orderBySql += ' ' + order.toUpperCase();

      if (i !== last_index) {
        orderBySql += ', ';
      }
    });

    return orderBySql;
  },

  update: function (table) {
    this.parts.update = table;
    return this;
  },

  _getUpdate: function () {
    return 'UPDATE ' + this.formatField(this.parts.update);
  },

  set: function (key, val) {
    this.parts.set = this.parts.set || [];
    if (typeof key === 'object') {
      for (var field in key) {
        this.set(field, key[field]);
      }
    } else {
      this.parts.set.push({field: key, value: val});
    }
    return this;
  },

  _getSet: function () {
    var setSql = ' SET',
      set = this.parts.set;

    if (!set) return '';
    
    var num_set = set.length,
      last_index = num_set - 1,
      self = this;

    set.forEach(function(condition, i){
      setSql += ' ' + self.formatField(condition.field) + ' = ' + self.formatValue(condition.value);
      if (i !== last_index) {
        whereSql += ' ,';
      }
    });

    return setSql;
  },

  insert: function (key, val) {
    this.parts.inserts = this.parts.inserts || [];
    if (typeof key === 'object') {
      for (var field in key) {
        this.insert(field, key[field]);
      }
    } else {
      this.parts.inserts.push({field: key, value: val});
    }
    return this;
  },

  into: function (table) {
    this.parts.into = table;
    return this;
  },

  _getInsert: function () {
    var table = this.parts.into,
      inserts = this.parts.inserts,
      num_inserts = inserts.length,
      last_index = num_inserts - 1,
      insertSql = 'INSERT INTO ',
      keys = [],
      values = [],
      self = this;

    insertSql += this.formatField(table);

    inserts.forEach(function(insert){
      keys.push(insert.field);
      values.push(insert.value);
    });

    insertSql += ' (';

    keys.forEach(function(field, i){
      insertSql += self.formatField(field);
      if (i !== last_index) {
        insertSql += ', ';
      }
    });

    insertSql += ') VALUES (';

    values.forEach(function(value, i){
      insertSql += self.formatValue(value);
      if (i !== last_index) {
        insertSql += ', ';
      }
    });

    insertSql += ')';
  
    return insertSql;
  },

  destroy: function () {
    this.parts.destroy = true;
    return this;
  },

  _getDestroy: function () {
    return 'DELETE';
  },

  join: function (table, alias, ona, onb) {
    this.parts.joins = this.parts.joins || [];
    this.parts.joins.push({ table: table, alias: alias, ona: ona, onb: onb });
    return this;
  },

  _getJoin: function () {
    var joins = this.parts.joins,
      joinSql = ' JOIN ',
      self = this;

    if (!joins) return '';

    joins.forEach(function(join, i){
      var join_on_a = join.ona,
        join_on_b = join.onb;

      joinSql += self.formatField(join.table);
      if (join.alias) joinSql += ' AS ' + alias;
      joinSql += ' ON ';
      joinSql += join_on_a.table ? self.formatField(join_on_a.table) : join_on_a.alias;
      joinSql += '.' + self.formatField(join_on_a.field);
      joinSql += ' = ';
      joinSql += join_on_b.table ? self.formatField(join_on_b.table) : join_on_b.alias;
      joinSql += '.' + self.formatField(join_on_b.field);
    });

    return joinSql;
  },

  groupBy: function (field) {
    if (typeof field === 'object') {
      this.parts.groupBy = field;
    } else if (typeof field === 'string') {
      this.parts.groupBy = { field: field };
    }
    return this;
  },

  _getGroupBy: function () {
    var groupBy = this.parts.groupBy,
      groupBySql = ' GROUP BY ';

    if (!groupBy) return '';

    if (groupBy.table) {
      groupBySql += this.formatField(groupBy.table) + '.';
    } else if (groupBy.alias) {
      groupBySql += groupBy.alias + '.';
    }

    groupBySql += this.formatField(groupBy.field);

    return groupBySql;
  },

  truncate: function (table) {
    this.parts.truncate = table;
    return this;
  },

  _getTruncate: function () {
    return 'TRUNCATE TABLE ' + this.formatField(this.parts.truncate);
  },

  build: function (subquery) {
    var sql = '';

    if (this.parts.select) {
      sql = this._getSelect() + this._getFrom() + this._getJoin() + this._getWhere() + this._getOrderBy() + this._getLimit();
    } else if (this.parts.update) {
      sql = this._getUpdate() + this._getSet() + this._getWhere();
    } else if (this.parts.inserts) {
      sql = this._getInsert();
    } else if (this.parts.destroy) {
      sql = this._getDestroy() + this._getFrom() + this._getWhere();
    } else if (this.parts.truncate) {
      sql = this._getTruncate();
    }

    if (!subquery) sql += ';';

    return sql;
  },

  reset: function () {
    this.parts = {};
    return this;
  },

  formatField: function (field) {
    if (field === '*') return field;
    return "`" + field + "`";
  },

  formatValue: function (value) {
    if (typeof value === 'number') return value;
    return "'" + value + "'";
  }

};