export interface AccountInterventionResponse {
  state: InterventionState;
  intervention: AccountIntervention;
}

export interface AccountIntervention {
  updatedAt: number;
  appliedAt: number;
  sentAt: number;
  description: string;
  reprovedIdentityAt: number;
  resetPasswordAt: number;
}

export interface InterventionState {
  blocked: boolean | null;
  resetPassword: boolean | null;
  suspended: boolean | null;
  reproveIdentity: boolean | null;
}
