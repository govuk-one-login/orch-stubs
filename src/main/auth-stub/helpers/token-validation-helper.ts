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
