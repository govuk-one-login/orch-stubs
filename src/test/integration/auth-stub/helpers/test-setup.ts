import { KeyObject } from "crypto";
import * as config from "../../../../main/auth-stub/helpers/config";
import * as keyHelper from "../../../../main/auth-stub/helpers/key-helpers";

export const orchToAuthExpectedClientId = "orchestrationAuth";

export const mockEnvVariableSetup = () => {
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
};

export const mockSigningKeyEnv = (publickKey: KeyObject) => {
  jest
    .spyOn(config, "getOrchToAuthSigningPublicKey")
    .mockReturnValue(
      publickKey.export({ type: "spki", format: "pem" }).toString()
    );
};
