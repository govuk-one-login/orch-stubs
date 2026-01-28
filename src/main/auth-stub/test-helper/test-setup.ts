import * as config from "../helpers/config";
import * as keyHelper from "../helpers/key-helpers";
import { exportSPKI, generateKeyPair, KeyLike } from "jose";
import * as jose from "jose";

export const mockEnvVariableSetup = async () => {
  return mockEnvVariableSetupWithKey(
    (await generateKeyPair("ES256")).publicKey
  );
};
export const mockEnvVariableSetupWithKey = async (authPublicKey: KeyLike) => {
  process.env.AUTH_JWKS_URL = "http://localhost/.well-known/auth-jwks.json";
  process.env.ORCH_TO_AUTH_CLIENT_ID = "orchestrationAuth";
  jest
    .spyOn(config, "getOrchToAuthSigningPublicKey")
    .mockReturnValue(await exportSPKI(authPublicKey));
  jest
    .spyOn(config, "getOrchToAuthExpectedAudience")
    .mockReturnValue("testURL");
  jest
    .spyOn(config, "getOrchToAuthExpectedClientId")
    .mockReturnValue("orchestrationAuth");
  jest
    .spyOn(keyHelper, "getAuthPublicSigningKey")
    .mockReturnValue(
      "-----BEGIN PUBLIC KEY-----MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEn8HvZP5umARULT+kFlJMC+djrruj4jnfQ0dzrAty0YKF4NPR/WV2QrpCRKQyBwbJk7dcGfW1HpafH78+T8bC9Q==-----END PUBLIC KEY-----"
    );
  jest
    .spyOn(keyHelper, "getContentEncryptionKey")
    .mockResolvedValue(
      JSON.parse(
        "[142, 95, 23, 226, 246, 50, 142, 180, 28, 234, 156, 229, 103, 214, 179, 219, 246, 139, 213, 206, 155, 126, 217, 196, 129, 23, 198, 54, 32, 219, 115, 38]"
      )
    );
  jest
    .spyOn(jose, "createRemoteJWKSet")
    .mockReturnValue((() => Promise.resolve(authPublicKey)) as ReturnType<
      typeof jose.createRemoteJWKSet
    >);
};

export const createSignedJwt = async (
  claims: Record<string, string>,
  privateKey: KeyLike
) => {
  return await new jose.SignJWT(claims)
    .setProtectedHeader({
      alg: "ES256",
    })
    .sign(privateKey);
};
