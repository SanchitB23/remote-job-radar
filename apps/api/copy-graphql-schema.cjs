// Copy GraphQL schema files to dist for production builds
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src", "graphql", "schema");
const DIST = path.join(__dirname, "dist", "graphql", "schema");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(SRC, DIST);
console.log("GraphQL schema files copied to dist.");
