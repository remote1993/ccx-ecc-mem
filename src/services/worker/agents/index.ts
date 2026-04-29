/**
 * Agent utilities shared by the worker response-processing pipeline.
 */

// Types
export type {
  WorkerRef,
  ObservationSSEPayload,
  SummarySSEPayload,
  SSEEventPayload,
  StorageResult,
  ResponseProcessingContext,
  ParsedResponse,
  SessionAgent,
  BaseAgentConfig,
} from './types.js';

export { FALLBACK_ERROR_PATTERNS } from './types.js';

// Response Processing
export { processAgentResponse } from './ResponseProcessor.js';

// SSE Broadcasting
export { broadcastObservation, broadcastSummary } from './ObservationBroadcaster.js';

// Session Cleanup
export { cleanupProcessedMessages } from './SessionCleanupHelper.js';

// Error Handling
export { shouldFallbackToClaude, isAbortError } from './FallbackErrorHandler.js';
