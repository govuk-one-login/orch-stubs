import { FlattenedJWSInput, JWSHeaderParameters, CryptoKey } from "jose";
import {
  getOrchJwks,
  getPrivateKey,
  getPublicKey,
} from "../../shared-identity/helper/key-helpers.ts";

type JWKSVerifier = (
  protectedHeader?: JWSHeaderParameters,
  token?: FlattenedJWSInput
) => Promise<CryptoKey>;
export const getIpvOrchJwks = (): JWKSVerifier => {
  return getOrchJwks("DUMMY_JWKS", "ORCH_IPV_JWKS_URL");
};

export const getIpvPrivateKey = async (): Promise<CryptoKey> => {
  return getPrivateKey("IPV_AUTHORIZE_PRIVATE_ENCRYPTION_KEY");
};

export const getIpvPublicKey = async (): Promise<CryptoKey> => {
  return getPublicKey("IPV_AUTHORIZE_PUBLIC_ENCRYPTION_KEY");
};
