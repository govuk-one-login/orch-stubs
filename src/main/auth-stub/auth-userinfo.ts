import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { CodedError, handleErrors } from "../helper/result-helper";
import {
  getAccessTokenFromAuthorizationHeader,
  getHeaderValueFromHeaders,
} from "./helpers/request-header-helper";
import { AccessTokenStore } from "./interfaces/access-token-store-interface";
import {
  getAccessTokenStore,
  updateHasBeenUsedAccessTokenStore,
} from "./services/access-token-dynamodb-service";
import { UserInfoClaims } from "./interfaces/user-info-claim-interface";
import { getUserProfileBySubjectId } from "./services/user-profile-dynamodb-service";
import { logger } from "../logger";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "GET":
        return await get(event);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({
            message: "Method not allowed",
          }),
        };
    }
  });
};

async function get(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const authorisationHeader = getHeaderValueFromHeaders(
    event.headers,
    "Authorization"
  );

  if (!authorisationHeader) {
    return {
      statusCode: 401,
      body: "",
      multiValueHeaders: { "WWW-Authenticate": ["Bearer"] },
    };
  }

  let accessToken;
  let accessTokenStore;

  try {
    accessToken = getAccessTokenFromAuthorizationHeader(authorisationHeader);
    accessTokenStore = await getAccessTokenStore(accessToken);

    if (!isAccessStoreValid(accessTokenStore)) {
      throw new Error("Invalid bearer token");
    }
  } catch (error) {
    logger.error(`Error received: ${(error as Error).message}`);
    return {
      statusCode: 401,
      body: "",
      multiValueHeaders: {
        "WWW-Authenticate": [
          `Bearer error="invalid_token", error_description="${error}"`,
        ],
      },
    };
  }

  let userInfoClaims: UserInfoClaims;

  try {
    await updateHasBeenUsedAccessTokenStore(accessToken, true);
    userInfoClaims = await populateUserInfo(accessTokenStore);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(userInfoClaims),
  };
}

const isAccessStoreValid = (accessTokenStore: AccessTokenStore) => {
  if (accessTokenStore.hasBeenUsed) {
    return false;
  }
  if (accessTokenStore.ttl * 1000 < Date.now()) {
    return false;
  }
  return true;
};

const populateUserInfo = async (
  accessTokenStore: AccessTokenStore
): Promise<UserInfoClaims> => {
  const userProfile = await getUserProfileBySubjectId(
    accessTokenStore.subjectId
  );

  return {
    sub: "",
    rp_pairwise_id: "",
    new_account: accessTokenStore.isNewAccount,
    password_reset_time: accessTokenStore.passwordResetTime,
    legacy_subject_id: userProfile.legacySubjectId,
    public_subject_id: userProfile.publicSubjectId,
    local_account_id: userProfile.subjectId,
    email: userProfile.email,
    email_verified: userProfile.emailVerified,
    phone_number: userProfile.phoneNumber,
    phone_number_verified: userProfile.phoneNumberVerified,
    salt: "",
    verified_mfa_method_type: "",
    uplift_required: "",
    achieved_credential_strength: "",
  };
};
