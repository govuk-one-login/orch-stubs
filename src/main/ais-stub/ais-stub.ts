import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getStubIntervention } from "./service/ais-stub-dynamo-service.ts";
import { logger } from "../logger.ts";
import {
  defaultIntervention,
  defaultState,
} from "./data/default-intervention-response.ts";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        body: "Method not allowed",
      };
    }
    const pathParameters = event.pathParameters;

    if (!pathParameters) {
      return {
        statusCode: 400,
        body: "No path parameters in request",
      };
    }

    const pairwiseId = pathParameters.internalPairwiseId;

    if (!pairwiseId) {
      return {
        statusCode: 400,
        body: "No internalPairwiseId in path parameters",
      };
    }

    const stubInterventionsData = (
      await getStubIntervention(pairwiseId)
    ).orElseGet(() => {
      logger.info(
        "No stub interventions data for pairwise ID. Returning default."
      );
      return { ...defaultState(), pairwiseId: pairwiseId };
    });

    const { blocked, reproveIdentity, suspended, resetPassword } =
      stubInterventionsData;

    return {
      statusCode: 200,
      body: JSON.stringify({
        intervention: defaultIntervention(),
        state: {
          blocked: blocked ?? false,
          reproveIdentity: reproveIdentity ?? false,
          suspended: suspended ?? false,
          resetPassword: resetPassword ?? false,
        },
      }),
    };
  } catch (err) {
    logger.error(
      "Stub interventions handler threw unexpected error: " +
        (err as Error).message
    );
    return {
      statusCode: 500,
      body: "Unexpected exception thrown in interventions handler",
    };
  }
};
