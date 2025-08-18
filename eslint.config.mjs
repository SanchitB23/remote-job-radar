// Root ESLint flat config for monorepo - properly scoped configs
import apiConfig from "./apps/api/eslint.config.mjs";
import webConfig from "./apps/web/eslint.config.mjs";

// Scope API config to apps/api directory only
const scopedApiConfig = apiConfig.map((config) => ({
  ...config,
  files: config.files ? config.files.map((f) => `apps/api/${f}`) : ["apps/api/**/*.{js,ts}"],
}));

// Scope web config to apps/web directory only
const scopedWebConfig = webConfig.map((config) => ({
  ...config,
  files: config.files
    ? config.files.map((f) => `apps/web/${f}`)
    : ["apps/web/**/*.{js,jsx,ts,tsx}"],
}));

export default [...scopedApiConfig, ...scopedWebConfig];
