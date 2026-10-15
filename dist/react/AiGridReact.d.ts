import type { CSSProperties, ReactNode } from "react";
import type { AiGridApplyResult, AiGridColumn, AiGridEventMap, AiGridEventName, AiGridInstance, AiGridOptions, AiGridRemoteDataSource, AiGridRow, AiGridRuntime, AiGridThemeName } from "./aigridTypes";
type AiGridEventHandler<K extends AiGridEventName> = (event: AiGridEventMap[K], grid: AiGridInstance) => void;
export interface AiGridReactEventProps {
    onDataChange?: AiGridEventHandler<"dataChange">;
    onSelectionChange?: AiGridEventHandler<"selectionChange">;
    onQueryChange?: AiGridEventHandler<"queryChange">;
    onQueryError?: AiGridEventHandler<"queryError">;
    onRender?: AiGridEventHandler<"render">;
    onThemeChange?: AiGridEventHandler<"themeChange">;
    onTreeExpansionChange?: AiGridEventHandler<"treeExpansionChange">;
    onTreeLoad?: AiGridEventHandler<"treeLoad">;
    onRowMoveRequest?: AiGridEventHandler<"rowMoveRequest">;
}
/** Creation options other than the ones managed through dedicated props. */
export type AiGridReactOptions = Omit<AiGridOptions, "mount" | "columns" | "dataSource" | "rowKey" | "theme" | "onThemeChange">;
export interface AiGridReactProps extends AiGridReactEventProps {
    /** Column definitions. A value change (functions excluded) recreates the grid. */
    columns: AiGridColumn[];
    /** Local rows. They are copied before reaching the grid; a new array with different row values syncs the grid. */
    rows?: AiGridRow[];
    /** URL or server-mode source, used when `rows` is not provided. */
    dataSource?: AiGridRemoteDataSource;
    /** Unique key field. Enables in-place row sync through `replaceRows` and the keyed owner APIs. */
    rowKey?: string;
    /** Applied with `setTheme()` whenever the prop changes. */
    theme?: AiGridThemeName;
    /** Remaining `AiGrid.createGrid()` options. A value change (functions excluded) recreates the grid. */
    options?: AiGridReactOptions;
    /** Runtime to use instead of `window.AiGrid`. */
    runtime?: AiGridRuntime;
    className?: string;
    style?: CSSProperties;
    onReady?: (grid: AiGridInstance) => void;
    onError?: (error: Error) => void;
    /** Result of applying a new `rows` reference. Unsaved grid changes block the sync. */
    onRowsSync?: (result: AiGridApplyResult, grid: AiGridInstance) => void;
    /**
     * Result of applying changed `columns`, `options`, `rowKey` or remote `dataSource` to a live grid.
     * Unsaved grid changes defer the rebuild (`reason: "dirty"`); it runs once they are accepted or rejected.
     */
    onConfigSync?: (result: AiGridApplyResult, grid: AiGridInstance) => void;
    renderError?: (error: Error) => ReactNode;
}
export declare const AiGridReact: import("react").ForwardRefExoticComponent<AiGridReactProps & import("react").RefAttributes<AiGridInstance>>;
export {};
