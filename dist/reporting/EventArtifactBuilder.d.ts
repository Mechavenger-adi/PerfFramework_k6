import { ErrorBehavior } from '../types/ConfigContracts';
import { ErrorEvent, WarningEvent } from '../types/EventContracts';
interface SummaryCheck {
    name?: string;
    passes?: number;
    fails?: number;
}
interface SummaryGroup {
    name?: string;
    path?: string;
    groups?: Record<string, SummaryGroup> | SummaryGroup[];
    checks?: Record<string, SummaryCheck> | SummaryCheck[];
}
interface SummaryMetric {
    thresholds?: Record<string, boolean | {
        ok?: boolean;
    }>;
}
interface BuildEventArtifactsOptions {
    runId: string;
    planName: string;
    environment: string;
    journeyName: string;
    errorBehavior: ErrorBehavior;
    runStatus: number;
    summaryData: {
        metrics?: Record<string, SummaryMetric>;
        root_group?: SummaryGroup;
    };
}
export declare class EventArtifactBuilder {
    static build(options: BuildEventArtifactsOptions): {
        errors: ErrorEvent[];
        warnings: WarningEvent[];
    };
    private static collectCheckFailureEvents;
    private static collectThresholdWarningEvents;
    private static buildAgentContext;
    /** k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. */
    private static isThresholdBreached;
    /** Normalize k6 summary groups (object-map or array) to array. */
    private static toGroupArray;
    /** Normalize k6 summary checks (object-map or array) to array. */
    private static toCheckArray;
}
export {};
//# sourceMappingURL=EventArtifactBuilder.d.ts.map