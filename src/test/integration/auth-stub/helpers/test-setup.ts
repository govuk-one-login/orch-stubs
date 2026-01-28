import * as config from "../../../../main/auth-stub/helpers/config";
import * as keyHelper from "../../../../main/auth-stub/helpers/key-helpers";
import * as jose from "jose";
import { generateKeyPair, KeyLike } from "jose";

export const orchToAuthExpectedClientId = "orchestrationAuth";
export const mockEnvVariableSetup = async () => {
  return mockEnvVariableSetupWithKey(
    (await generateKeyPair("ES256")).publicKey
  );
};
export const mockEnvVariableSetupWithKey = async (authPublicKey: KeyLike) => {
  jest
    .spyOn(config, "getOrchToAuthExpectedAudience")
    .mockReturnValue("testURL");
  jest
    .spyOn(config, "getOrchToAuthExpectedClientId")
    .mockReturnValue(orchToAuthExpectedClientId);
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
  jest.spyOn(keyHelper, "getAuthPublicSigningKey");
  await mockSigningKeyEnv(authPublicKey);
  process.env.AUTH_JWKS_URL = "http://localhost";
};

export const mockSigningKeyEnv = async (publickKey: KeyLike) => {
  jest
    .spyOn(config, "getOrchToAuthSigningPublicKey")
    .mockReturnValue(await jose.exportSPKI(publickKey));
};
