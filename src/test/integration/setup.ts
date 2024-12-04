import * as config from "../../../parameters.json";

for (const [key, value] of Object.entries(config.Parameters)) {
  process.env[key] = value;
}
