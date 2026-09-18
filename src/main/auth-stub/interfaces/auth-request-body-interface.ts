import { Claims } from "../helpers/claims-config.ts";

export interface AuthRequestBody {
  clientId: string;
  responseType: string;
  passwordResetTime: number;
  sectorIdentifier: string;
  isNewAccount: boolean;
  claims: Claims;
}
