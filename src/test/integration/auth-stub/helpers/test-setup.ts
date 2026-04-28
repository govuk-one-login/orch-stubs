import * as config from "../../../../main/auth-stub/helpers/config.ts";
import * as keyHelper from "../../../../main/auth-stub/helpers/key-helpers.ts";

export const orchToAuthExpectedClientId = "orchestrationAuth";

export const mockEnvVariableSetup = () => {
  vi.spyOn(config, "getOrchToAuthExpectedAudience").mockReturnValue("testURL");
  vi.spyOn(config, "getOrchToAuthExpectedClientId").mockReturnValue(
    orchToAuthExpectedClientId
  );
  vi.spyOn(keyHelper, "getContentEncryptionKey").mockResolvedValue(
    JSON.parse(
      "[142, 95, 23, 226, 246, 50, 142, 180, 28, 234, 156, 229, 103, 214, 179, 219, 246, 139, 213, 206, 155, 126, 217, 196, 129, 23, 198, 54, 32, 219, 115, 38]"
    )
  );
  process.env.AUTH_JWKS_URL = "http://localhost";
};
