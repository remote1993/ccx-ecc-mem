declare module 'bun:sqlite' {
  export interface StatementResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface Statement<T = any> {
    all(...params: unknown[]): T[];
    get(...params: unknown[]): T | undefined;
    run(...params: unknown[]): StatementResult;
    values(...params: unknown[]): unknown[][];
  }

  export interface DatabaseOptions {
    readonly?: boolean;
    create?: boolean;
    readwrite?: boolean;
  }

  export class Database {
    filename: string;

    constructor(filename?: string, options?: DatabaseOptions);

    prepare<T = any>(query: string): Statement<T>;
    query<T = any>(query: string): Statement<T>;
    run(query: string, ...params: unknown[]): StatementResult;
    close(): void;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
  }
}
