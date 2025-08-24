import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import type { DocumentNode } from "graphql";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Loads and merges all .graphql files in the schema directory
export function getTypeDefs(): DocumentNode {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const loadedTypeDefs = loadFilesSync(__dirname + "/**/*.graphql");
  return mergeTypeDefs(loadedTypeDefs);
}
