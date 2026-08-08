import vinext from "vinext";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  // Fixado explicitamente (não inferido de package.json#name) para que o
  // worker publicado seja sempre "intua-guia" — o mesmo nome ao qual o
  // Custom Domain intuaguia.com.br está vinculado no painel da Cloudflare.
  // Um nome divergente aqui é a causa mais provável do Error 1016.
  name: "intua-guia",
  main: "./worker/index.ts",
  // compatibility_flags, d1_databases, r2_buckets e ai vêm do wrangler.jsonc
  // na raiz (o plugin faz merge automático) — declará-los aqui de novo
  // duplicava o binding "DB"/"MIDIA" e quebrava `wrangler deploy` com
  // "assigned to multiple bindings".
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
