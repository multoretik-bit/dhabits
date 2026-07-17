import { build } from "esbuild";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

await build({
  absWorkingDir: projectRoot,
  entryPoints: [path.join(projectRoot, "server", "index.ts")],
  bundle: true,
  platform: "node",
  packages: "external",
  format: "esm",
  outdir: path.join(projectRoot, "dist-server"),
});
