import express from "express";
import { handler as aisStub } from "./ais-stub/ais-stub.ts";
import { handler as authAuthorize } from "./auth-stub/auth-authorize.ts";
import { handler as authToken } from "./auth-stub/auth-token.ts";
import { handler as authUserinfo } from "./auth-stub/auth-userinfo.ts";
import { handler as ipvAuthorize } from "./ipv-stub/ipv-authorize.ts";
import { handler as ipvJwks } from "./ipv-stub/ipv-jwks.ts";
import { handler as ipvToken } from "./ipv-stub/ipv-token.ts";
import { handler as ipvUserIdentity } from "./ipv-stub/ipv-user-identity.ts";
import { handler as spotHandler } from "./spot-stub/spot.ts";
import { apiGatewayRoute } from "./helper/api-gateway-mapper.ts";
import { warmUp as aisInterventionWarmUp } from "./ais-stub/service/ais-stub-dynamo-service.ts";
import { warmUp as authCodeWarmUp } from "./auth-stub/services/auth-code-dynamodb-service.ts";
import { warmUp as accessTokenWarmUp } from "./auth-stub/services/access-token-dynamodb-service.ts";
import { warmUp as userProfileWarmUp } from "./auth-stub/services/user-profile-dynamodb-service.ts";
import { warmUp as userIdentityWarmUp } from "./ipv-stub/service/dynamodb-form-response-service.ts";
import { startPoll } from "./helper/sqs-listener.ts";

const initialise = async (): Promise<void> => {
  const PORT = process.env.PORT || 4401;

  const app = express();

  app.use(express.text({ type: "*/*" }));

  // Auth stub
  app.all("/auth-stub/authorize", apiGatewayRoute(authAuthorize));
  app.all("/auth-stub/token", apiGatewayRoute(authToken));
  app.all("/auth-stub/userinfo", apiGatewayRoute(authUserinfo));
  app.all("/auth-stub/error", (req, res) =>
    res.send("Something went wrong! Look at the Orchestration logs")
  );
  app.all("/auth-stub/signed-out", (req, res) =>
    res.send("You have signed out")
  );

  // IPV stub
  app.all("/ipv-stub/authorize", apiGatewayRoute(ipvAuthorize));
  app.all("/ipv-stub/token", apiGatewayRoute(ipvToken));
  app.all("/ipv-stub/.well-known/jwks.json", apiGatewayRoute(ipvJwks));
  app.all("/ipv-stub/user-identity", apiGatewayRoute(ipvUserIdentity));

  // AIS stub
  app.all("/ais-stub/{*path}", apiGatewayRoute(aisStub));

  // SPOT stub
  // TODO: look up from name, or use queue URL?
  const stopSpot = await startPoll(process.env.SOURCE_QUEUE_URL!, spotHandler);

  app.use((req, res) => {
    res.status(404).send("Not found");
  });

  await authCodeWarmUp();
  await accessTokenWarmUp();
  await userProfileWarmUp();
  await userIdentityWarmUp();
  await aisInterventionWarmUp();

  const server = app.listen(PORT, () => console.log(`listening on ${PORT}`));

  server.on("close", stopSpot);

  process.on("SIGTERM", server.close);
  process.on("SIGINT", server.close);
};

initialise().catch((err) => console.error(err));
