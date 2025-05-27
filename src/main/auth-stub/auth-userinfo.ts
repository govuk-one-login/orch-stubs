import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";

import { getHeaderValueFromHeaders } from "./helpers/RequestHeaderHelper";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

  try {
    const accessToken =
      getAccessTokenFromAuthorizationHeader(authorisationHeader);
    const accessTokenStore = await getTokenStore(accessToken);

    if (!isAccessStoreValid(accessTokenStore)) {
      throw new Error("Invalid bearer token");
    }

    // const userInfo = userInfoService.populateUserInfo(accessTokenStore);
  } catch (error) {
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

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Reached the ${event.httpMethod} endpoint`,
    }),
  };
}

const isAccessStoreValid = (accessTokenStore: TokenStore) => {
  if (accessTokenStore.hasBeenUsed) {
    return false;
  }
  if (accessTokenStore.ttl < 100) {
    return false;
  }
  return true;
};

const getAccessTokenFromAuthorizationHeader = (
  authorizationHeader: string
): string => {
  try {
    if (!authorizationHeader) {
      // AccessTokenException
      throw Error("authorizationHeader is empty");
    }
    if (!authorizationHeader.startsWith("bearer")) {
      // AccessTokenException
      throw Error("authorizationHeader is not a bearer access token type");
    }

    const parts = authorizationHeader.split(`\\s`);

    if (parts.length != 2) {
      // ParseException
      throw Error("Invalid HTTP Authorization header value");
    }

    if (!parts[1]) {
      throw Error("token value is empty");
    }

    return parts[1];
  } catch {
    throw Error("Unable to extract (opaque) bearer token");
  }
};

const getTokenStore = async (): Promise<TokenStore> => {
  return await new Promise(() => ({
    token: "",
    subjectId: "",
    claims: ["", ""],
    sectorIdentifier: "",
    isNewAccount: true,
    passwordResetTime: 0,
    hasBeenUsed: false,
    ttl: 64,
  }));
};

export interface TokenStore {
  token: string;
  subjectId: string;
  claims: string[];
  sectorIdentifier: string;
  isNewAccount: boolean;
  passwordResetTime: number;
  hasBeenUsed: boolean;
  ttl: number;
}

// public AccessToken getAccessTokenFromAuthorizationHeader(String authorizationHeader)
//           throws AccessTokenException {
//       try {
//           return AccessToken.parse(authorizationHeader, AccessTokenType.BEARER);
//       } catch (com.nimbusds.oauth2.sdk.ParseException e) {
//           LOG.warn("Unable to extract (opaque) bearer token");
//           throw new AccessTokenException(
//                   "Unable to extract (opaque) bearer token", BearerTokenError.INVALID_TOKEN);
//       }
//   }

// public static AccessToken parse(final String header,
//   final AccessTokenType preferredType)
// throws ParseException {

// if (! AccessTokenType.BEARER.equals(preferredType) && ! AccessTokenType.DPOP.equals(preferredType)) {
// throw new IllegalArgumentException("Unsupported Authorization scheme: " + preferredType);
// }

// if (header != null && header.startsWith(AccessTokenType.BEARER.getValue()) || AccessTokenType.BEARER.equals(preferredType)) {
// return BearerAccessToken.parse(header);
// } else {
// return DPoPAccessToken.parse(header);
// }
// }
