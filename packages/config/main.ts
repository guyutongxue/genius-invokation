/** Toggle this when editing beta version. */
export const IS_BETA = false;

export const BETA_VERSION = "v9999.beta";
export const DEFAULT_ASSET_API_ENDPOINT = IS_BETA
  ? `https://beta.assets.gi-tcg.guyutongxue.site/api/v2`
  : `https://assets.gi-tcg.guyutongxue.site/api/v2`;
