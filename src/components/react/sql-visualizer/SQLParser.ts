import pkg from 'node-sql-parser';
const { Parser } = pkg;
import type { SQLParsedQuery, SQLTable, SQLJoin, SQLFilter, SQLProjection } from './types';

const parser = new Parser();

export class SQLParser {
  static parse(query: string): SQLParsedQuery {
    try {
      const ast = parser.astify(query);
      
      if (!ast || typeof ast !== 'object') {
        throw new Error('Invalid query structure');
      }

      // Handle array of statements or single statement
      const statement = Array.isArray(ast) ? ast[0] : ast;
      
      if (statement.type !== 'select') {
        throw new Error('Only SELECT statements are supported');
      }

      const tables = this.extractTables(statement);
      const joins = this.extractJoins(statement);
      const filters = this.extractFilters(statement);
      const projections = this.extractProjections(statement);

      return {
        tables,
        joins,
        filters,
        projections,
        rawQuery: query
      };
    } catch (error) {
      console.error('SQL Parsing error:', error);
      throw new Error(`Failed to parse SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static extractTables(statement: any): SQLTable[] {
    const tables: SQLTable[] = [];
    let yOffset = 0;

    if (statement.from) {
      statement.from.forEach((fromItem: any, index: number) => {
        if (fromItem.table) {
          const tableName = typeof fromItem.table === 'string' ? fromItem.table : fromItem.table.table;
          const alias = fromItem.as || fromItem.table.as;
          
          tables.push({
            id: `table-${tableName}-${index}`,
            name: tableName,
            alias,
            columns: [], // We'll populate this with common columns or leave empty
            position: { x: index * 300, y: yOffset }
          });
        }
      });
    }

    return tables;
  }

  private static extractJoins(statement: any): SQLJoin[] {
    const joins: SQLJoin[] = [];
    let yOffset = 200;

    if (statement.from) {
      statement.from.forEach((fromItem: any, index: number) => {
        if (fromItem.join && fromItem.join !== 'INNER JOIN') {
          const joinType = this.normalizeJoinType(fromItem.join);
          const leftTable = fromItem.table ? 
            (typeof fromItem.table === 'string' ? fromItem.table : fromItem.table.table) : 'unknown';
          const rightTable = fromItem.table ? 
            (typeof fromItem.table === 'string' ? fromItem.table : fromItem.table.table) : 'unknown';
          
          joins.push({
            id: `join-${index}`,
            type: joinType,
            leftTable,
            rightTable,
            condition: fromItem.on ? this.stringifyCondition(fromItem.on) : '',
            position: { x: index * 300 + 150, y: yOffset }
          });
        }
      });
    }

    return joins;
  }

  private static extractFilters(statement: any): SQLFilter[] {
    const filters: SQLFilter[] = [];
    let yOffset = 400;

    if (statement.where) {
      const whereConditions = this.flattenConditions(statement.where);
      whereConditions.forEach((condition, index) => {
        filters.push({
          id: `filter-${index}`,
          table: 'unknown', // We'd need more sophisticated parsing to determine table
          condition: this.stringifyCondition(condition),
          position: { x: index * 250, y: yOffset }
        });
      });
    }

    return filters;
  }

  private static extractProjections(statement: any): SQLProjection[] {
    const projections: SQLProjection[] = [];
    let yOffset = 50;

    if (statement.columns) {
      statement.columns.forEach((column: any, index: number) => {
        if (column.expr && column.expr.type === 'column_ref') {
          projections.push({
            id: `projection-${index}`,
            column: column.expr.column || '*',
            table: column.expr.table,
            alias: column.as,
            position: { x: index * 200, y: yOffset }
          });
        } else if (column.expr && column.expr.type === 'aggr_func') {
          projections.push({
            id: `projection-${index}`,
            column: column.expr.args ? column.expr.args.expr.column : '*',
            table: column.expr.args ? column.expr.args.expr.table : undefined,
            alias: column.as,
            aggregation: column.expr.name,
            position: { x: index * 200, y: yOffset }
          });
        }
      });
    }

    return projections;
  }

  private static normalizeJoinType(joinType: string): 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS' {
    const type = joinType.toUpperCase();
    if (type.includes('LEFT')) return 'LEFT';
    if (type.includes('RIGHT')) return 'RIGHT';
    if (type.includes('FULL')) return 'FULL';
    if (type.includes('CROSS')) return 'CROSS';
    return 'INNER';
  }

  private static flattenConditions(condition: any): any[] {
    if (!condition) return [];
    
    if (condition.type === 'binary_expr' && (condition.operator === 'AND' || condition.operator === 'OR')) {
      return [
        ...this.flattenConditions(condition.left),
        ...this.flattenConditions(condition.right)
      ];
    }
    
    return [condition];
  }

  private static stringifyCondition(condition: any): string {
    if (!condition) return '';
    
    if (condition.type === 'binary_expr') {
      const left = this.stringifyCondition(condition.left);
      const right = this.stringifyCondition(condition.right);
      return `${left} ${condition.operator} ${right}`;
    }
    
    if (condition.type === 'column_ref') {
      return condition.table ? `${condition.table}.${condition.column}` : condition.column;
    }
    
    if (condition.type === 'string' || condition.type === 'number') {
      return String(condition.value);
    }
    
    return JSON.stringify(condition);
  }
}