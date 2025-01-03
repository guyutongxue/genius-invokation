/** Toggle this when editing beta version. */
export const IS_BETA = false;

export const BETA_VERSION = "v9999.beta";

export const DEFAULT_ASSET_API_ENDPOINT = IS_BETA
  ? `https://beta.assets.gi-tcg.guyutongxue.site/api/v2`
  : `https://assets.gi-tcg.guyutongxue.site/api/v2`;

export const WEB_CLIENT_BASE_PATH = import.meta.env.WEB_CLIENT_BASE_PATH || "/";
export const SERVER_HOST = import.meta.env.DEV
  ? "http://localhost:3000"
  : import.meta.env.SERVER_HOST
  ? `https://${import.meta.env.SERVER_HOST}`
  : "";
