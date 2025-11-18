import { importSPKI, JWTPayload, jwtVerify } from "jose";
import { getAuthPublicKey } from "./key-helpers.ts";
import { Claims, getKnownClaims, requiredClaimsKeys } from "./claims-config.ts";
import { CodedError } from "../../helper/result-helper.ts";

export const validateClaims = async (jwt: string): Promise<Claims> => {
  let claims: JWTPayload;

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

const validateUsingKey = async (jwt: string): Promise<JWTPayload> => {
  const publicKey = getAuthPublicKey();
  const keyObject = await importSPKI(publicKey, "ES256");

  const result = await jwtVerify(jwt, keyObject, {
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
