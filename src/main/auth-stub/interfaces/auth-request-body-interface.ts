import { Claims } from "../helpers/claims-config.ts";

export interface AuthRequestBody {
  clientId: string;
  responseType: string;
  email: string;
  passwordResetTime: number;
  sectorIdentifier: string;
  isNewAccount: string;
  claims: Claims;
}
