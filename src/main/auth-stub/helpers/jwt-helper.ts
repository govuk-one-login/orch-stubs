import * as jose from "jose";
import { getAuthPublicSigningKey } from "./key-helpers";
import { Claims, getKnownClaims, requiredClaimsKeys } from "./claims-config";
import { CodedError } from "../../helper/result-helper";

export const validateClaims = async (jwt: string): Promise<Claims> => {
  let claims: jose.JWTPayload;

  try {
    claims = await validateUsingKey(jwt);
  } catch (error) {
    throw new CodedError(
      400,
      error instanceof Error ? error.message : "Unknown error."
    );
  }

  if (claims["claim"] !== undefined) {
    validateClaimObject(claims["claim"] as string);
  }

  return validateCustomClaims(claims);
};

const validateUsingKey = async (jwt: string): Promise<jose.JWTPayload> => {
  const publicKey = getAuthPublicSigningKey();
  const keyObject = await jose.importSPKI(publicKey, "ES256");

  const result = await jose.jwtVerify(jwt, keyObject, {
    requiredClaims: requiredClaimsKeys,
    clockTolerance: 30,
  });

  return result.payload;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateCustomClaims = (claims: any): Claims => {
  const requiredClaims = getKnownClaims();

  Object.keys(requiredClaims).forEach((claim) => {
    if (requiredClaims[claim] !== claims[claim]) {
      throw new CodedError(
        400,
        `${claim} has incorrect value ${requiredClaims[claim]}`
      );
    }
  });
  return claims;
};

const validateClaimObject = (claim: string): string => {
  try {
    JSON.parse(claim);
    return claim;
  } catch {
    throw new CodedError(400, "claim object is not a valid json object");
  }
};
