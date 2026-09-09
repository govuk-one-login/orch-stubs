import path from "node:path";

import Application from "koa";
import nunjucks, { ConfigureOptions } from "nunjucks";
import { existsSync } from "node:fs";

const viewsDir = existsSync("/opt/views")
  ? "/opt/views"
  : path.join(process.cwd(), "views");

const VIEWS = [viewsDir, path.resolve("node_modules/govuk-frontend/dist/")];

declare module "koa" {
  interface DefaultContext {
    render: (view: string, context?: object) => Promise<string>;
  }
}

export const nunjucksMiddleware: (
  nunjucksOptions: ConfigureOptions
) => Application.Middleware = (nunjucksOptions) => {
  const nunjucksEnv = nunjucks.configure(VIEWS, nunjucksOptions);
  return async (ctx, next) => {
    ctx.render = async (view, context) => {
      const data = Object.assign({}, ctx.state, context);
      return new Promise((resolve, reject) => {
        nunjucksEnv.render(view, data, (err, content) => {
          if (err) {
            reject(err);
          } else {
            ctx.type = "text/html";
            ctx.body = content;
            resolve(content as string);
          }
        });
      });
    };
    await next();
  };
};
