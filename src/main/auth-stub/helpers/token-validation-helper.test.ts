import { AuthCodeStore } from "../interfaces/auth-code-store-interface";
import {
  createAuthCodeStore,
  createAuthCodeStoreThatHasBeenUsed,
  createAuthCodeStoreThatHasExpired,
} from "../test-helper/mock-auth-code-data-helper";
import {
  validateAuthCode,
  ensureClientAssertionType,
  validatePlainTextParameters,
  verifyClientAssertion,
} from "./token-validation-helper";
import * as authCodeDynamoDbService from "../services/auth-code-dynamodb-service";
import { generateKeyPairSync, KeyPairKeyObjectResult } from "crypto";
import { SignJWT } from "jose";

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
        .mockResolvedValue(authCodeStore);

      const action = async () => validateAuthCode(AUTH_CODE);

      await expect(action).rejects.toThrow("Invalid Auth Code: already in use");
    });

    it("should error when auth-code has expired", async () => {
      authCodeStore = createAuthCodeStoreThatHasExpired(AUTH_CODE);
      jest
        .spyOn(authCodeDynamoDbService, "getAuthCodeStore")
        .mockResolvedValue(authCodeStore);

      const action = async () => validateAuthCode(AUTH_CODE);

      await expect(action).rejects.toThrow("Invalid Auth Code: already in use");
    });

    it("should not error when given a valid auth-code", async () => {
      authCodeStore = createAuthCodeStore(AUTH_CODE);
      jest
        .spyOn(authCodeDynamoDbService, "getAuthCodeStore")
        .mockResolvedValue(authCodeStore);

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

    it("should not error when the redirect-uri is an empty string", () => {
      tokenRequestBody["redirect_uri"] = "";

      const action = () =>
        validatePlainTextParameters("", clientId, tokenRequestBody);

      expect(action).not.toThrow();
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

  describe("ensure client assertion type", () => {
    it("should error when the client-assertion-type does not exist", () => {
      const action = () => ensureClientAssertionType({});

      expect(action).toThrow("Missing client_assertion_type parameter");
    });

    it("should error when the client-id is not valid", () => {
      const action = () =>
        ensureClientAssertionType({
          client_assertion_type: "incorrect_client_assertion_type",
        });

      expect(action).toThrow(
        "Invalid client_assertion_type parameter, must be urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
      );
    });

    it("should not error when passed a valid body", () => {
      const action = () =>
        ensureClientAssertionType({
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        });

      expect(action).not.toThrow();
    });
  });

  describe("verify client assertion", () => {
    const clientId = "testClientId";
    const payload = { sub: clientId };

    let ecKeyPair: KeyPairKeyObjectResult;
    let signPayload: string;

    beforeEach(async () => {
      ecKeyPair = generateKeyPairSync("ec", { namedCurve: "P-256" });
      signPayload = await new SignJWT(payload)
        .setProtectedHeader({
          alg: "ES256",
        })
        .sign(ecKeyPair.privateKey);
    });

    it("should error when the client-assertion does not exist", async () => {
      const action = async () => verifyClientAssertion({}, ecKeyPair.publicKey);

      await expect(action).rejects.toThrow(
        "Missing client_assertion parameter"
      );
    });

    it("should error when the jwt parts are invalid", async () => {
      const action = async () =>
        verifyClientAssertion(
          { client_assertion: "invalid.jwt" },
          ecKeyPair.publicKey
        );

      await expect(action).rejects.toThrow(
        "Unexpected number of Base64URL parts, must be three"
      );
    });

    it("should error when the client-id does not exist in the request", async () => {
      const action = async () =>
        verifyClientAssertion(
          { client_assertion: signPayload },
          ecKeyPair.publicKey
        );

      await expect(action).rejects.toThrow(
        "Invalid private key JWT authentication: The client identifier doesn't match the client assertion subject"
      );
    });

    it("should error when the client-identifiers do not match", async () => {
      const action = async () =>
        verifyClientAssertion(
          { client_assertion: signPayload, client_id: "incorrectClientId" },
          ecKeyPair.publicKey
        );

      await expect(action).rejects.toThrow(
        "Invalid private key JWT authentication: The client identifier doesn't match the client assertion subject"
      );
    });

    it("should error when the jwt fails verification from an incorrect signature", async () => {
      const incorrectPublicKey = generateKeyPairSync("ec", {
        namedCurve: "P-256",
      }).publicKey;

      const action = async () =>
        verifyClientAssertion(
          { client_assertion: signPayload, client_id: clientId },
          incorrectPublicKey
        );

      await expect(action).rejects.toThrow("JWT verificaiton failed");
    });

    it("should not error when passed a valid body and key", async () => {
      const action = async () =>
        verifyClientAssertion(
          { client_assertion: signPayload, client_id: clientId },
          ecKeyPair.publicKey
        );

      expect(action).not.toThrow();
    });
  });
});
