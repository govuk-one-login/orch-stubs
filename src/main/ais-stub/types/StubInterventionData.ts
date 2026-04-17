import { InterventionState } from "./AccountInterventionResponse.ts";

export type StubInterventionData = {
  pairwiseId: string;
} & InterventionState;
