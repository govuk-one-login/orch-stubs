import * as jose from "jose";
import { getKnownClaims, requiredClaimsKeys } from "./config";
import { JwtClaimsValueError, JwtValidationError } from "./errors";
import { getAuthPublicKey } from "./key-helpers";

const publicKey = getAuthPublicKey();

export const validateClaims = async (jwt: string): Promise<void> => {
  let claims: jose.JWTPayload;

  try {
    claims = await validateUsingKey(jwt);
  } catch (error) {
    throw new JwtValidationError(
      error instanceof Error ? error.message : "Unknown error."
    );
  }

  if (claims["claim"] !== undefined) {
    validateClaimObject(claims["claim"] as string);
  }

  validateCustomClaims(claims);
};

const validateUsingKey = async (jwt: string): Promise<jose.JWTPayload> => {
  const keyObject = await jose.importSPKI(publicKey, "ES256");

  const result = await jose.jwtVerify(jwt, keyObject, {
    requiredClaims: requiredClaimsKeys,
    clockTolerance: 30,
  });

  return result.payload;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateCustomClaims = (claims: any): void => {
  const requiredClaims = getKnownClaims();

  Object.keys(requiredClaims).forEach((claim) => {
    if (requiredClaims[claim] !== claims[claim]) {
      throw new JwtClaimsValueError(`${claim} has incorrect value`);
    }
  });
};

const validateClaimObject = (claim: string): string => {
  try {
    JSON.parse(claim);
    return claim;
  } catch {
    throw new JwtValidationError("claim object is not a valid json object");
  }
};
