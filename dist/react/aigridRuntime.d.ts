import type { AiGridRuntime } from "./aigridTypes";
export interface LoadAiGridRuntimeOptions {
    /** URL of `aigrid-core.js`, e.g. `${apiBase}/sample/assets/aigrid-core.js`. */
    scriptUrl: string;
    /** URL of `aigrid-core.css`. Added once, before the script. */
    styleUrl?: string;
    /** CSP nonce applied to the injected tags. */
    nonce?: string;
}
/** Returns `window.AiGrid` when the browser runtime has been loaded. */
export declare function getAiGridRuntime(): AiGridRuntime | undefined;
/**
 * Loads the AiGrid browser runtime served by the DataGridAI server (or a CDN).
 * Bundled apps can instead import `aigrid-core.js` and `aigrid-core.css` directly.
 * Concurrent calls share one request; a failed load can be retried.
 */
export declare function loadAiGridRuntime(options: LoadAiGridRuntimeOptions): Promise<AiGridRuntime>;
