// eslint-disable @typescript-eslint/no-explicit-any
import Provider from "oidc-provider";
import serverlessExpress from "@codegenie/serverless-express";
import { DynamoAdapter } from "./dynamo-adapter";
import { parseUrlEncodedBody } from "./util";
import { nunjucksMiddleware } from "./nunjucks";
import cors from "@koa/cors";
import { Callback, Context } from "aws-lambda";

const accounts = [
  {
    sub: "alice-001",
    name: "Alice Smith",
    email: "alice@example.com",
    tokenClaims: { role: "admin", department: "engineering" },
    userinfoClaims: { phone: "+1-555-0101", address: "123 Main St" },
  },
  {
    sub: "bob-001",
    name: "Bob Jones",
    email: "bob@example.com",
    userinfoClaims: { phone: "+1-555-0102", address: "456 Oak Ave" },
  },
  {
    sub: "charlie-001",
    name: "Charlie Brown",
    email: "charlie@example.com",
    tokenClaims: { role: "editor", department: "design" },
  },
];
const scopes = ["openid", "email", "phone"];

const oidc = new Provider(process.env.ISSUER_URL!, {
  adapter: DynamoAdapter,
  clients: [
    {
      client_id: "rpat",
      redirect_uris: [
        `https://manage.development.sign-in.service.gov.uk/callback`,
      ],
      require_signed_request_object: true,
      post_logout_redirect_uris: [
        `https://manage.development.sign-in.service.gov.uk/signed-out`,
      ],
      backchannel_logout_uri: `https://manage.development.sign-in.service.gov.uk/backchannel-logout`,
      jwks_uri: `https://manage.development.sign-in.service.gov.uk/.well-known/jwks.json`,
      request_object_signing_alg: "ES256", // TODO - better alg?,
      id_token_signed_response_alg: "ES256", // TODO - better alg?
      grant_types: ["authorization_code", "refresh_token"],
      token_endpoint_auth_method: "private_key_jwt",
    },
  ],
  features: {
    devInteractions: { enabled: false },
  },

  pkce: {
    methods: ["S256"],
    required: () => true,
  },

  async loadExistingGrant(ctx) {
    const { oidc } = ctx;
    const grantId =
      oidc.result?.consent?.grantId ??
      oidc.session!.grantIdFor(oidc.client!.clientId);

    if (grantId) {
      return ctx.oidc.provider.Grant.find(grantId);
    }

    const grant = new ctx.oidc.provider.Grant({
      accountId: oidc.session!.accountId,
      clientId: oidc.client!.clientId,
    });

    scopes.forEach((s) => {
      grant.addOIDCScope(s);
    });
    await grant.save();
    return grant;
  },
});
// Trust proxy headers passed from API Gateway
oidc.proxy = true;

oidc.app.use(async (ctx, next) => {
  console.log("[DEBUG] Incoming Request Path:", ctx.path);
  console.log("[DEBUG] Incoming Request Host:", ctx.host);
  await next();
});

oidc.use(cors());
oidc.use(nunjucksMiddleware);
oidc.use(async (ctx, next) => {
  const { path, method } = ctx;

  // GET /interaction/:uid — show account picker
  const getMatch = path.match(/^\/interaction\/([^/]+)$/);
  if (getMatch && method === "GET") {
    const details = await oidc.interactionDetails(ctx.req, ctx.res);
    const { prompt, session } = details;

    // Already authenticated — skip the picker
    if (prompt.name === "consent" || (session && session.accountId)) {
      const accountId = session?.accountId ?? "";
      await oidc.interactionFinished(ctx.req, ctx.res, {
        login: { accountId },
      });
      ctx.respond = false;
      return;
    }

    const accountOptions = [
      {
        value: "",
        text: "N/A",
        selected: true,
      },
      ...accounts.map((account) => ({
        value: account.sub,
        text: account.email,
      })),
    ];

    await ctx.render("auth.njk", {
      interactionUid: details.uid,
      accountOptions,
    });

    return;
  }

  // POST /interaction/:uid/login — complete the login
  const loginMatch = path.match(/^\/interaction\/([^/]+)\/login$/);
  if (loginMatch && method === "POST") {
    const body = await parseUrlEncodedBody(ctx.req);
    const accountId = body.get("account");

    if (!accountId) {
      ctx.status = 400;
      ctx.body = "Missing accountId";
      return;
    }

    await oidc.interactionFinished(ctx.req, ctx.res, {
      login: { accountId },
    });
    ctx.respond = false;
    return;
  }

  // POST /interaction/:uid/error — complete with an error
  const errorMatch = path.match(/^\/interaction\/([^/]+)\/error$/);
  if (errorMatch && method === "POST") {
    const body = await parseUrlEncodedBody(ctx.req);

    // TODO: handle errors issued at token exchange or userinfo
    if (body.get("errorWhere") !== "authorize") {
      throw new Error("Cannot return errors on token exchange or userinfo yet");
    }

    await oidc.interactionFinished(ctx.req, ctx.res, {
      error: body.get("error"),
      error_description: body.get("error_description"),
    });
    ctx.respond = false;
    return;
  }

  await next();
});

let serverlessExpressInstance: (
  event: unknown,
  context: Context,
  callback: Callback<unknown>
) => Promise<unknown>;

async function setup(event: unknown, context: Context) {
  //@ts-expect-error hack pls leave me alone eslint
  serverlessExpressInstance = serverlessExpress({
    app: oidc.callback(),
  });
  return serverlessExpressInstance(event, context as Context, () => {});
}

export async function handler(event: unknown, context: Context) {
  if (serverlessExpressInstance)
    return serverlessExpressInstance(event, context, () => {});
  return setup(event, context);
}
