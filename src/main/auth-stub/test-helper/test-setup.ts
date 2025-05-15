import * as config from "../helpers/config";
import * as keyHelper from "../helpers/key-helpers";

export const mockEnvVariableSetup = () => {
  jest
    .spyOn(config, "getOrchToAuthExpectedAudience")
    .mockReturnValue("testURL");
  jest
    .spyOn(config, "getOrchToAuthExpectedClientId")
    .mockReturnValue("orchestrationAuth");
  jest
    .spyOn(keyHelper, "getAuthPublicKey")
    .mockReturnValue(
      "-----BEGIN PUBLIC KEY-----MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEn8HvZP5umARULT+kFlJMC+djrruj4jnfQ0dzrAty0YKF4NPR/WV2QrpCRKQyBwbJk7dcGfW1HpafH78+T8bC9Q==-----END PUBLIC KEY-----"
    );
  jest
    .spyOn(keyHelper, "getContentEncryptionKey")
    .mockReturnValue(
      Promise.resolve(
        JSON.parse(
          "[142, 95, 23, 226, 246, 50, 142, 180, 28, 234, 156, 229, 103, 214, 179, 219, 246, 139, 213, 206, 155, 126, 217, 196, 129, 23, 198, 54, 32, 219, 115, 38]"
        )
      )
    );
};
