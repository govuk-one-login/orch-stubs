import { APIGatewayProxyResult } from "aws-lambda";
import { CodedError, createJsonResult } from "../../helper/result-helper";
import { logger } from "../../logger";
import { UserIdentity } from "../interfaces/user-identity-interface";
import {
  getStateWithAuthCode,
  putUserIdentityWithAuthCode,
} from "../service/dynamodb-form-response-service";

export const mapFormToUserIdentity = (
  form: Record<string, string>
): UserIdentity => {
  const userIdentity: Record<string, unknown> = {};
  if (!form.identity_claim || form.identity_claim.trim().length === 0) {
    throw new CodedError(
      400,
      "Invalid Request: Core Identity Claim is required"
    );
  }

  userIdentity["https://vocab.account.gov.uk/v1/coreIdentity"] =
    tryParseOrThrowError(form.identity_claim, "identity_claim");

  const optionalClaims = {
    address_claim: "https://vocab.account.gov.uk/v1/address",
    driving_permit_claim: "https://vocab.account.gov.uk/v1/drivingPermit",
    nino_claim: "https://vocab.account.gov.uk/v1/socialSecurityRecord",
    passport_claim: "https://vocab.account.gov.uk/v1/passport",
    return_code_claim: "https://vocab.account.gov.uk/v1/returnCode",
  };

  Object.entries(optionalClaims).forEach(([field, val]) => {
    if (form[field]) {
      userIdentity[val] = tryParseOrThrowError(form[field], field);
    }
  });

  return {
    sub: form.sub,
    vot: form.vot,
    vtm: form.vtm,
    ...userIdentity,
  } as UserIdentity;
};

const tryParseOrThrowError = (claim: string, ClaimName: string) => {
  try {
    return JSON.parse(claim);
  } catch (error) {
    const errorMessage = `Invalid JSON parsing form claim: ${ClaimName} error: ${(error as Error).message}`;
    logger.error(error);
    throw new CodedError(400, `Invalid Request: ${errorMessage}`);
  }
};

export const handlePost = async (
  body: string | undefined,
  redirectUrl: URL,
  earlyRedirect: (
    parsedBody: Record<string, string>,
    url: URL
  ) => URL | undefined
): Promise<APIGatewayProxyResult> => {
  if (!body) {
    throw new CodedError(400, "Missing request body");
  }
  const parsedBody = Object.fromEntries(new URLSearchParams(body));
  const authCode = parsedBody.authCode;

  try {
    const state = await getStateWithAuthCode(authCode);
    if (state) {
      logger.info("state: " + state);
      redirectUrl.searchParams.append("state", state);
    } else {
      logger.info("State not found or is not a string.");
    }
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  const earlyRedirectUrl = earlyRedirect(parsedBody, redirectUrl);
  if (earlyRedirectUrl)
    return createJsonResult(
      302,
      {
        message: `Redirecting to ${earlyRedirectUrl.toString()}`,
      },
      {
        Location: earlyRedirectUrl.toString(),
      }
    );

  const userIdentity = mapFormToUserIdentity(parsedBody);

  redirectUrl.searchParams.append("code", authCode);

  try {
    await putUserIdentityWithAuthCode(authCode, userIdentity);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  return createJsonResult(
    302,
    {
      message: `Redirecting to ${redirectUrl.toString()}`,
    },
    {
      Location: redirectUrl.toString(),
    }
  );
};
