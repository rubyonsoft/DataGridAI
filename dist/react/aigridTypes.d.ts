/**
 * Type surface of the AiGrid browser runtime (`aigrid-core.js`, `window.AiGrid`).
 *
 * Source of truth: `src/DataGridAI.Server.QueryApi/wwwroot/sample/assets/aigrid-core.js`
 * and `docs/codex-aigrid-usage-guide-v1.md`. Owner API shapes mirror
 * `adapters/vanilla/aigrid-owner-api.d.ts`. Options the runtime accepts but that
 * are not listed here remain allowed through index signatures.
 */
export type AiGridRowKey = string | number;
export type AiGridRow = Record<string, unknown>;
export type AiGridThemeName = "original" | "enterprise" | "soft-blue";
export type AiGridFilterMode = "and" | "or";
export type AiGridColumnType = "rowno" | "row-check" | "text" | "multitext" | "number" | "date" | "check" | "radio" | "combo-master" | "combo-detail" | "template" | "button";
export type AiGridStyleValue = string | Record<string, string | number | null | undefined> | ((row: AiGridRow | undefined, column: AiGridColumn, rowIndex: number, colIndex: number, section: string) => unknown);
export interface AiGridValidationRule {
    required?: boolean;
    pattern?: string | RegExp;
    min?: number;
    max?: number;
    custom?: (value: unknown, row: AiGridRow, column: AiGridColumn, grid: AiGridInstance) => boolean | string | null | undefined | void;
    messageRequired?: string;
    messagePattern?: string;
    messageCustom?: string;
}
export interface AiGridColumn {
    key: string;
    title?: string;
    type?: AiGridColumnType | (string & {});
    width?: number | string;
    align?: "left" | "center" | "right";
    readOnly?: boolean;
    hidden?: boolean;
    pin?: "left" | "right";
    className?: string;
    style?: AiGridStyleValue;
    headerStyle?: AiGridStyleValue;
    cellStyle?: AiGridStyleValue;
    colCss?: string | ((row: AiGridRow, column: AiGridColumn, rowIndex: number, colIndex: number, section: string) => string);
    validation?: AiGridValidationRule;
    /** Returned value is always rendered as text. */
    format?: (value: unknown, row: AiGridRow, column: AiGridColumn, rowIndex: number, grid: AiGridInstance) => unknown;
    /** Must return a DOM Node or DocumentFragment; HTML strings are rejected (0.1.1+). */
    cellTemplate?: (row: AiGridRow, column: AiGridColumn, rowIndex: number, grid: AiGridInstance) => Node | null | undefined;
    [option: string]: unknown;
}
export interface AiGridFeatures {
    selection?: boolean;
    selectionMode?: "cell" | "row" | "multi" | (string & {});
    sorting?: boolean;
    filtering?: boolean;
    captionMenu?: boolean;
    rowFilter?: boolean;
    paging?: boolean;
    lazyLoading?: boolean;
    editing?: boolean;
    copyPaste?: boolean;
    rowDrag?: boolean;
    columnResize?: boolean;
    gridResize?: boolean;
    contextMenu?: boolean;
    stickyHeader?: boolean;
    stickyFooter?: boolean;
    stickyRows?: boolean;
    virtualScroll?: boolean;
    frozenColumns?: number;
    summary?: boolean;
    grouping?: boolean;
    tree?: boolean;
    undoRedo?: boolean;
    stateManagement?: boolean;
    a11y?: boolean;
    perfMonitoring?: boolean;
    [feature: string]: unknown;
}
export interface AiGridSort {
    key: string;
    dir: "asc" | "desc";
}
export interface AiGridFilter {
    key: string;
    op: string;
    value?: unknown;
}
export interface AiGridQueryState {
    readonly sort: ReadonlyArray<Readonly<AiGridSort>>;
    readonly filters: ReadonlyArray<Readonly<AiGridFilter>>;
    readonly filterMode: AiGridFilterMode;
    readonly pageIndex: number;
    readonly pageSize: number;
}
export interface AiGridQueryRequest {
    query: AiGridQueryState;
    offset: number;
    limit: number;
    generation: number;
    signal: AbortSignal;
}
export interface AiGridQueryResult {
    status: "applied" | "cancelled" | "stale" | "rejected";
    generation?: number;
    reason?: string;
}
export interface AiGridRemoteDataSource {
    url?: string;
    fallbackUrl?: string;
    rowsPath?: string;
    serverMode?: boolean;
    responseType?: "json" | "ndjson";
    continentPath?: string;
    nationPath?: string;
    transport?: (request: AiGridQueryRequest) => Promise<{
        rows: AiGridRow[];
        total?: number;
    }> | {
        rows: AiGridRow[];
        total?: number;
    };
    [option: string]: unknown;
}
export type AiGridApplyResult = {
    applied: true;
    rowCount?: number;
} | {
    applied: false;
    reason: string;
};
export interface AiGridColumnState {
    version: 1;
    columns: Array<{
        key: string;
        width: number;
        hidden: boolean;
        pin: "" | "left" | "right";
    }>;
    sort: AiGridSort[];
    filters: AiGridFilter[];
    filterMode: AiGridFilterMode;
}
export interface AiGridChangeSet {
    inserted: AiGridRow[];
    updated: Array<{
        row: AiGridRow;
        dirtyFields: string[];
    }>;
    deleted: AiGridRow[];
}
export interface AiGridValidationError {
    row: number;
    col: number;
    key: string;
    message: string;
}
export interface AiGridCellPosition {
    row: number;
    col: number;
}
export interface AiGridRange {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export interface AiGridCsvExportOptions {
    filename?: string;
    delimiter?: string;
    lineBreak?: string;
    includeHeader?: boolean;
    includeBom?: boolean;
    quoteAll?: boolean;
}
export interface AiGridTreeResult {
    status: "collapsed" | "expanded" | "unloaded" | "loaded" | "stale" | "cancelled" | "rejected";
    key: AiGridRowKey;
    reason?: string;
}
export interface AiGridRowMoveRequest {
    readonly key: AiGridRowKey;
    readonly beforeKey: AiGridRowKey | null;
    readonly fromIndex: number;
    readonly toIndex: number;
    readonly requestId: number;
    cancel(): void;
}
export interface AiGridRowMoveResult {
    status: "requested" | "moved" | "unchanged" | "rejected";
    reason?: string;
    requestId?: number;
}
export interface AiGridDataChangeEvent {
    type: string;
    rows: AiGridRow[];
}
export interface AiGridSelectionChangeEvent {
    activeCell: AiGridCellPosition;
    ranges: AiGridRange[];
    /** Present when `rowKey` is configured. */
    selectedKeys?: AiGridRowKey[];
    currentKey?: AiGridRowKey | null;
}
export interface AiGridThemeChangeEvent {
    theme: AiGridThemeName;
    previousTheme: AiGridThemeName;
}
export interface AiGridEventMap {
    dataChange: AiGridDataChangeEvent;
    selectionChange: AiGridSelectionChangeEvent;
    queryChange: {
        reason: string;
        query: AiGridQueryState;
        generation: number;
    };
    queryError: {
        generation: number;
        error: unknown;
    };
    render: {
        durationMs: number;
        rows: number;
    };
    themeChange: AiGridThemeChangeEvent;
    treeExpansionChange: {
        expandedKeys: AiGridRowKey[];
    };
    treeLoad: {
        status: "loading" | "loaded" | "error";
        key: AiGridRowKey;
        generation: number;
        error?: unknown;
    };
    rowMoveRequest: AiGridRowMoveRequest;
}
export type AiGridEventName = keyof AiGridEventMap;
export interface AiGridOptions {
    /** CSS selector or element. Element mounts require runtime 0.2.1+. */
    mount: string | HTMLElement;
    columns: AiGridColumn[];
    dataSource?: AiGridRow[] | AiGridRemoteDataSource;
    title?: string;
    toolbarText?: string;
    theme?: AiGridThemeName;
    themeSelector?: boolean;
    features?: AiGridFeatures;
    /** Field holding a unique string/number key; enables the keyed owner APIs. */
    rowKey?: string;
    filterMode?: AiGridFilterMode;
    filterUiMode?: "caption" | "row";
    paging?: {
        pageSize?: number;
    };
    grouping?: {
        fields?: string[];
    };
    tree?: {
        managed?: boolean;
        idField?: string;
        parentField?: string;
        labelField?: string;
        hasChildrenField?: string;
        loadChildren?: (request: {
            key: AiGridRowKey;
            row: Readonly<AiGridRow>;
            signal: AbortSignal;
            generation: number;
        }) => Promise<AiGridRow[]> | AiGridRow[];
    };
    rowReorder?: {
        managed: boolean;
        beforeMove?: (request: AiGridRowMoveRequest) => boolean | void;
    };
    history?: {
        max?: number;
    };
    statePrefix?: string;
    lists?: {
        continentData?: unknown[];
        nationData?: unknown[];
    };
    toolBar?: string[] | {
        left?: string[];
        right?: string[];
    };
    onAfterRender?: (grid: AiGridInstance) => void;
    onThemeChange?: (payload: AiGridThemeChangeEvent, grid: AiGridInstance) => void;
    [option: string]: unknown;
}
export interface AiGridInstance {
    readonly destroyed: boolean;
    lists: {
        continentData: unknown[];
        nationData: unknown[];
    };
    destroy(): void;
    on<K extends AiGridEventName>(eventName: K, handler: (payload: AiGridEventMap[K]) => void): () => void;
    render(): void;
    setStatus(text?: string): void;
    getTheme(): AiGridThemeName;
    setTheme(theme: AiGridThemeName): AiGridThemeName;
    getDataRows(): AiGridRow[];
    getRowByDisplayIndex(displayIndex: number): AiGridRow | null;
    moveFocusEx(row: number, column: number | string): void;
    getFocus(): AiGridCellPosition | null;
    getSelection(): Array<{
        rowIndex: number;
        column: string;
    }>;
    insertRow(index?: number, values?: AiGridRow): number;
    deleteRow(rowIndex: number): boolean;
    undo(): void;
    redo(): void;
    getChanges(options?: {
        includeDeleted?: boolean;
    }): AiGridChangeSet;
    acceptChanges(): void;
    rejectChanges(): void;
    validateAll(): AiGridValidationError[];
    saveChanges(url?: string): Promise<unknown>;
    toggleSort(key: string, multi?: boolean): Promise<AiGridQueryResult | void>;
    setFilters(filters: AiGridFilter[]): Promise<AiGridQueryResult | void>;
    setFilterMode(mode: AiGridFilterMode): Promise<AiGridQueryResult | void>;
    setPage(index: number): Promise<AiGridQueryResult | void>;
    setPageSize(size: number): Promise<AiGridQueryResult | void>;
    groupBy(fields: string[]): void;
    clearGrouping(): void;
    setColumnHidden(key: string, hidden: boolean): void;
    setColumnPin(key: string, pin: "" | "left" | "right"): void;
    exportToCsv(options?: AiGridCsvExportOptions): void;
    /** Requires the SheetJS `XLSX` global. */
    exportToExcel(options?: Record<string, unknown>): void;
    saveState(name: string): boolean;
    loadState(name: string): boolean;
    clearState(name: string): boolean;
    getSelectedKeys(): AiGridRowKey[];
    setSelectedKeys(keys: AiGridRowKey[]): void;
    getColumnState(): AiGridColumnState;
    applyColumnState(state: unknown): AiGridApplyResult;
    replaceRows(rows: AiGridRow[]): AiGridApplyResult;
    updateRows(updates: Array<{
        key: AiGridRowKey;
        values: AiGridRow;
    }>): AiGridApplyResult;
    getExpandedKeys(): AiGridRowKey[];
    setExpandedKeys(keys: AiGridRowKey[]): void;
    setTreeExpanded(key: AiGridRowKey, expanded: boolean): Promise<AiGridTreeResult>;
    cancelTreeLoad(key?: AiGridRowKey): void;
    focusTreeRow(key: AiGridRowKey, column?: string | number): void;
    requestRowMove(key: AiGridRowKey, beforeKey: AiGridRowKey | null): AiGridRowMoveResult;
    getQueryState(): AiGridQueryState;
    cancelQuery(): void;
    reloadQuery(): Promise<AiGridQueryResult>;
}
export interface AiGridRuntime {
    readonly version?: string;
    readonly themes?: ReadonlyArray<{
        value: AiGridThemeName;
        label: string;
    }>;
    createGrid(options: AiGridOptions): Promise<AiGridInstance>;
}
declare global {
    interface Window {
        AiGrid?: AiGridRuntime;
    }
}
