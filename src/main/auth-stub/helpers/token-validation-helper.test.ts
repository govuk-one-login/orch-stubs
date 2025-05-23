import { AuthCodeStore } from "../interfaces/auth-code-store-interface";
import {
  createAuthCodeStore,
  createAuthCodeStoreThatHasBeenUsed,
  createAuthCodeStoreThatHasExpired,
} from "../test-helper/mock-auth-code-data-helper";
import {
  validateAuthCode,
  validatePlainTextParameters,
} from "./token-validation-helper";
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

  describe("validate plain text parameters", () => {
    const redirectUri = "testUri";
    const clientId = "testClientId";

    let tokenRequestBody: { [k: string]: string };

    beforeEach(() => {
      tokenRequestBody = {
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        client_id: clientId,
      };
    });

    it("should error when the request-parameters does not exist", () => {
      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, undefined);

      expect(action).toThrow("Request requires query parameters");
    });

    it("should error when the request-parameters are empty", () => {
      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, {});

      expect(action).toThrow("Request requires query parameters");
    });

    it("should error when the grant-type does not exist", () => {
      delete tokenRequestBody["grant_type"];

      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, tokenRequestBody);

      expect(action).toThrow("Request is missing grant_type parameter");
    });

    it("should error when the grant-type is not valid", () => {
      tokenRequestBody["grant_type"] = "incorrect_grant_type";

      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, tokenRequestBody);

      expect(action).toThrow("Request has invalid grant_type parameter");
    });

    it("should error when the redirect-uri does not exist", () => {
      delete tokenRequestBody["redirect_uri"];

      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, tokenRequestBody);

      expect(action).toThrow("Request is missing redirect_uri parameter");
    });

    it("should error when the redirect-uri is not valid", () => {
      tokenRequestBody["redirect_uri"] = "incorrect_redirect_uri";

      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, tokenRequestBody);

      expect(action).toThrow(
        "Request redirect_uri is not the permitted redirect_uri"
      );
    });

    it("should error when the client-id is does not exist", () => {
      delete tokenRequestBody["client_id"];

      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, tokenRequestBody);

      expect(action).toThrow("Request is missing client_id parameter");
    });

    it("should error when the client-id is not valid", () => {
      tokenRequestBody["client_id"] = "incorrect_client_id";

      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, tokenRequestBody);

      expect(action).toThrow(
        "Request client_id is not the permitted client_id"
      );
    });

    it("should not error when passed valid text-parameters", () => {
      const action = () =>
        validatePlainTextParameters(redirectUri, clientId, tokenRequestBody);

      expect(action).not.toThrow();
    });
  });
});
