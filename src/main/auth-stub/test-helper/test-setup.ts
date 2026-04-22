import * as config from "../helpers/config.ts";
import * as keyHelper from "../helpers/key-helpers.ts";
import { CryptoKey, SignJWT } from "jose";

export const mockEnvVariableSetup = async () => {
  process.env.AUTH_JWKS_URL = "http://localhost/.well-known/auth-jwks.json";
  process.env.ORCH_TO_AUTH_CLIENT_ID = "orchestrationAuth";
  vi.spyOn(config, "getOrchToAuthExpectedAudience").mockReturnValue("testURL");
  vi.spyOn(config, "getOrchToAuthExpectedClientId").mockReturnValue(
    "orchestrationAuth"
  );
  vi.spyOn(keyHelper, "getContentEncryptionKey").mockResolvedValue(
    JSON.parse(
      "[142, 95, 23, 226, 246, 50, 142, 180, 28, 234, 156, 229, 103, 214, 179, 219, 246, 139, 213, 206, 155, 126, 217, 196, 129, 23, 198, 54, 32, 219, 115, 38]"
    )
  );
};

export const createSignedJwt = async (
  claims: Record<string, string>,
  privateKey: CryptoKey
) => {
  return await new SignJWT(claims)
    .setProtectedHeader({
      alg: "ES256",
    })
    .sign(privateKey);
};
