import { AuthCodeStore } from "../interfaces/auth-code-store-interface";
import {
  createAuthCodeStore,
  createAuthCodeStoreThatHasBeenUsed,
  createAuthCodeStoreThatHasExpired,
} from "../test-helper/mock-auth-code-data-helper";
import { validateAuthCode } from "./token-validation-helper";
import * as authCodeDynamoDbService from "../services/auth-code-dynamodb-service";

describe("Token Validation Helper", () => {
  describe("validate auth-code", () => {
    const AUTH_CODE = "testAuthCode";

    let authCodeStore: AuthCodeStore;

    it("should error when auth-code does not exist", async () => {
      const action = async () => validateAuthCode(undefined);

      await expect(action).rejects.toThrow("Missing Auth Code");
    });

    it("should error when auth-code has been used", async () => {
      authCodeStore = createAuthCodeStoreThatHasBeenUsed(AUTH_CODE);
      jest
        .spyOn(authCodeDynamoDbService, "getAuthCodeStore")
        .mockReturnValue(Promise.resolve(authCodeStore));

      const action = async () => validateAuthCode(AUTH_CODE);

      await expect(action).rejects.toThrow("Invalid Auth Code: already in use");
    });

    it("should error when auth-code has expired", async () => {
      authCodeStore = createAuthCodeStoreThatHasExpired(AUTH_CODE);
      jest
        .spyOn(authCodeDynamoDbService, "getAuthCodeStore")
        .mockReturnValue(Promise.resolve(authCodeStore));

      const action = async () => validateAuthCode(AUTH_CODE);

      await expect(action).rejects.toThrow("Invalid Auth Code: already in use");
    });

    it("should not error when given a valid auth-code", async () => {
      authCodeStore = createAuthCodeStore(AUTH_CODE);
      jest
        .spyOn(authCodeDynamoDbService, "getAuthCodeStore")
        .mockReturnValue(Promise.resolve(authCodeStore));

      const action = async () => validateAuthCode(AUTH_CODE);

      expect(action).not.toThrow();
    });
  });
});
