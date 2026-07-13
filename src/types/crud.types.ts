export type PrimaryKeyType = 'number' | 'string';

export interface CrudResourceConfig {
    name: string;
    table: string;
    routePath: string;
    primaryKey: string;
    primaryKeyType: PrimaryKeyType;
    select?: string;
    defaultOrder?: string;
    defaultOrderAscending?: boolean;
    allowedCreateFields: readonly string[];
    allowedUpdateFields: readonly string[];
    requiredCreateFields?: readonly string[];
    filterFields?: readonly string[];
    sortFields?: readonly string[];
    updatedAtColumn?: string;
}

export interface CrudListOptions {
    filters: Record<string, string>;
    limit?: number;
    offset?: number;
    sort?: string;
    ascending?: boolean;
}

export type CrudRecord = Record<string, unknown>;
