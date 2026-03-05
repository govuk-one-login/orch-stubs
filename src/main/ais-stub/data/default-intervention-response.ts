import {
  AccountIntervention,
  AccountInterventionResponse,
  InterventionState,
} from "../types/AccountInterventionResponse";

export const defaultInterventionResponse = (): AccountInterventionResponse => ({
  state: defaultState(),
  intervention: defaultIntervention(),
});

export const defaultIntervention = (): AccountIntervention => ({
  updatedAt: 1696969322935,
  appliedAt: 1696869005821,
  sentAt: 1696869003456,
  description: "AIS_USER_PASSWORD_RESET_AND_IDENTITY_VERIFIED",
  reprovedIdentityAt: 1696969322935,
  resetPasswordAt: 1696875903456,
});

export const defaultState = (): InterventionState => ({
  blocked: false,
  reproveIdentity: false,
  resetPassword: false,
  suspended: false,
});
