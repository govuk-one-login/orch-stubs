import { logger } from "../../logger.ts";
import { CodedError } from "../../helper/result-helper.ts";
import { getAuthCodeStore } from "../services/auth-code-dynamodb-service.ts";
import { decodeJwt, jwtVerify, KeyObject } from "jose";

export const validateAuthCode = async (authCode: string | undefined) => {
  if (!authCode) {
    logger.error(`Missing Auth Code`);
    throw new CodedError(400, "Missing Auth Code");
  }
  const authCodeStore = await getAuthCodeStore(authCode);
  if (authCodeStore.hasBeenUsed) {
    logger.error("Auth code already used");
    throw new CodedError(400, "Invalid Auth Code: already in use");
  } else if (authCodeStore.ttl < Math.floor(Date.now() / 1000)) {
    logger.error("Auth code expired");
    throw new CodedError(400, "Invalid Auth Code: expired");
  }
};

export const validatePlainTextParameters = (
  redirectUri: string,
  clientId: string,
  body:
    | {
        [k: string]: string;
      }
    | undefined
) => {
  if (body === undefined || Object.keys(body).length === 0) {
    throw new CodedError(400, "Request requires query parameters");
  }

  if (!body["grant_type"]) {
    throw new CodedError(400, "Request is missing grant_type parameter");
  }

  if (body["grant_type"] !== "authorization_code") {
    throw new CodedError(400, "Request has invalid grant_type parameter");
  }

  if (!body["redirect_uri"]) {
    throw new CodedError(400, "Request is missing redirect_uri parameter");
  }

  if (body["redirect_uri"] !== redirectUri) {
    throw new CodedError(
      400,
      "Request redirect_uri is not the permitted redirect_uri"
    );
  }

  if (!body["client_id"]) {
    throw new CodedError(400, "Request is missing client_id parameter");
  }

  if (body["client_id"] !== clientId) {
    throw new CodedError(
      400,
      "Request client_id is not the permitted client_id"
    );
  }
};

export const ensureClientAssertionType = (body: { [k: string]: string }) => {
  const clientAssertionType = body["client_assertion_type"];
  const expectedClientAssertionType =
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

  if (!clientAssertionType) {
    throw new CodedError(400, "Missing client_assertion_type parameter");
  } else if (clientAssertionType !== expectedClientAssertionType) {
    throw new CodedError(
      400,
      `Invalid client_assertion_type parameter, must be ${expectedClientAssertionType}`
    );
  }
};

export const verifyClientAssertion = async (
  body: {
    [k: string]: string;
  },
  signingKey: KeyObject
) => {
  const clientAssertion = body["client_assertion"];
  if (!clientAssertion) {
    throw new CodedError(400, "Missing client_assertion parameter");
  }

  const jwtParts = clientAssertion.split(".");
  if (jwtParts.length !== 3) {
    throw new CodedError(
      400,
      "Unexpected number of Base64URL parts, must be three"
    );
  }

  const jwtClientId = decodeJwt(clientAssertion).sub;
  const tokenRequestClientId = body["client_id"];
  if (!tokenRequestClientId || tokenRequestClientId !== jwtClientId) {
    throw new CodedError(
      400,
      "Invalid private key JWT authentication: The client identifier doesn't match the client assertion subject"
    );
  }

  try {
    await jwtVerify(clientAssertion, signingKey);
  } catch {
    throw new CodedError(400, "JWT verificaiton failed");
  }
};
