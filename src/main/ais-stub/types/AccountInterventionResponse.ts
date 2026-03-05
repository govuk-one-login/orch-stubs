export type AccountInterventionResponse = {
  state: InterventionState;
  intervention: AccountIntervention;
};

export type AccountIntervention = {
  updatedAt: number;
  appliedAt: number;
  sentAt: number;
  description: string;
  reprovedIdentityAt: number;
  resetPasswordAt: number;
};

export type InterventionState = {
  blocked: boolean | null;
  resetPassword: boolean | null;
  suspended: boolean | null;
  reproveIdentity: boolean | null;
};
