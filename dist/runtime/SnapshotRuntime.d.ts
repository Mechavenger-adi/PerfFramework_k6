import { ErrorCaptureConfig } from '../types/ConfigContracts';
import { SnapshotPayload, SnapshotReference } from '../types/EventContracts';
export declare class SnapshotRuntime {
    private readonly config;
    private snapshotCount;
    constructor(config: ErrorCaptureConfig);
    shouldCapture(type: string): boolean;
    register(path: string): SnapshotReference;
    buildPayload(payload: SnapshotPayload): SnapshotPayload;
}
//# sourceMappingURL=SnapshotRuntime.d.ts.map