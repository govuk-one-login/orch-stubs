import { logger } from "../../logger";
import { CodedError } from "../../helper/result-helper";
import { getAuthCodeStore } from "../services/auth-code-dynamodb-service";

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
