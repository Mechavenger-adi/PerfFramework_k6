import { ErrorCaptureConfig } from '../types/ConfigContracts';
import { SnapshotPayload, SnapshotReference } from '../types/EventContracts';

export class SnapshotRuntime {
  private snapshotCount = 0;

  constructor(private readonly config: ErrorCaptureConfig) {}

  shouldCapture(type: string): boolean {
    if (!this.config.captureSnapshotOnFailure) return false;
    if (this.snapshotCount >= this.config.maxSnapshotsPerRun) return false;

    return new Set([
      'http_request_failed',
      'timeout',
      'connection_error',
      'correlation_missing',
      'runtime_exception',
    ]).has(type);
  }

  register(path: string): SnapshotReference {
    this.snapshotCount += 1;
    return {
      captured: true,
      path,
    };
  }

  buildPayload(payload: SnapshotPayload): SnapshotPayload {
    return {
      ...payload,
      request: {
        method: payload.request?.method,
        url: payload.request?.url,
        headers: this.config.includeRequestHeaders ? payload.request?.headers : undefined,
        body: this.config.includeRequestBody ? payload.request?.body : undefined,
      },
      response: {
        status: payload.response?.status,
        headers: this.config.includeResponseHeaders ? payload.response?.headers : undefined,
        body: this.config.includeResponseBody ? payload.response?.body : undefined,
      },
    };
  }
}
