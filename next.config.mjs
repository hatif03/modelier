import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
// Resolving the bare package first (its "." export is valid) then deriving the
// sibling file by hand — a direct deep import of "…/dist/transformers.web.js"
// is rejected by Node's exports-map enforcement since that subpath isn't itself
// declared in the package's exports field, even though the file exists on disk.
// An absolute filesystem path as the alias target skips exports resolution
// entirely, which a bare specifier alias target does not.
const transformersWebPath = path.join(
  path.dirname(require.resolve("@huggingface/transformers")),
  "transformers.web.js"
);
// transformers.web.js does `import * as ONNX_WEB from "onnxruntime-web/webgpu"`,
// which the package's "import" export maps to the ESM bundle
// (ort.webgpu.bundle.min.mjs). That file uses `new URL(..., import.meta.url)`
// so webpack 5 copies it to static/media/*.mjs; Next's SWC minifier then
// parses the copy as a script and dies on import.meta / export. The UMD build
// has neither, and transformers already points wasmPaths at the jsDelivr CDN.
const onnxruntimeWebgpuUmdPath = path.join(
  path.dirname(require.resolve("onnxruntime-web")),
  "ort.webgpu.min.js"
);

// Next 14's TerserPlugin is applied as a function and has no `exclude` option;
// it minifies every emitted .mjs unless the asset is already marked minimized.
function markOrtEsmAssetsMinimized(compiler) {
  const { Compilation } = compiler.webpack;
  compiler.hooks.compilation.tap("MarkOrtEsmAssetsMinimized", (compilation) => {
    compilation.hooks.processAssets.tap(
      {
        name: "MarkOrtEsmAssetsMinimized",
        stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE - 1,
      },
      () => {
        for (const name of Object.keys(compilation.assets)) {
          if (!/\.mjs$/i.test(name) || !/ort(\.webgpu)?\.bundle\.min/i.test(name)) continue;
          const asset = compilation.getAsset(name);
          if (!asset || asset.info.minimized) continue;
          compilation.updateAsset(name, asset.source, { ...asset.info, minimized: true });
        }
      }
    );
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // @huggingface/transformers (used client-side for in-browser transcription, see
  // lib/video/transcription.ts) is never actually reached server-side — every call
  // site is behind a dynamic import inside "use client" code — but its package.json
  // only declares "node" and "default" export conditions (no "browser"), so without
  // this it still gets pulled into the server module graph and resolves to the
  // Node-native onnxruntime-node backend, which ships prebuilt .node binaries webpack
  // can't parse as JS.
  experimental: {
    serverComponentsExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
      canvas: "commonjs canvas",
    });
    // config.infrastructureLogging = { debug: /PackFileCache/ };

    config.externals.push({ "onnxruntime-node": "commonjs onnxruntime-node" });

    if (isServer) {
      // Belt-and-suspenders alongside serverComponentsExternalPackages above:
      // next/dynamic(..., { ssr: false })'s loadable-manifest tracing still walks
      // this far into the module graph on the SERVER compiler even though the
      // component never renders server-side, and serverComponentsExternalPackages
      // alone doesn't reliably stop that trace from parsing transformers.node.mjs.
      // Forcing it external here means webpack never opens the file at all.
      config.externals.push({ "@huggingface/transformers": "commonjs @huggingface/transformers" });
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "onnxruntime-node": false,
        // replicad-opencascadejs's Emscripten glue (lib/jewelry/cad/worker.ts) probes
        // for these Node builtins at module-eval time even in a browser/worker target;
        // it never actually uses them there, so stub them out the same way.
        fs: false,
        path: false,
        crypto: false,
        perf_hooks: false,
        worker_threads: false,
      };
      // Force the client compiler onto the browser/WASM build directly — its export
      // conditions have no "browser" entry, so left to webpack's default resolution
      // it's ambiguous whether "node" or "default" wins, and it must always be the
      // "default" (web) build for anything running in an actual browser.
      config.resolve.alias = {
        ...config.resolve.alias,
        "@huggingface/transformers$": transformersWebPath,
        "onnxruntime-web/webgpu$": onnxruntimeWebgpuUmdPath,
        sharp$: false,
      };
    }

    config.plugins.push({ apply: markOrtEsmAssetsMinimized });

    // replicad-opencascadejs's WASM binary (lib/jewelry/cad/worker.ts) is only ever
    // loaded via its own `locateFile` fetch, never a native `import ... from "*.wasm"`
    // WebAssembly-module import — so it needs a resolvable URL (asset/resource), not
    // webpack's asyncWebAssembly experiment (which is for the latter).
    config.module.rules.push({ test: /\.wasm$/, type: "asset/resource" });

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "liveblocks.io",
        port: "",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Cross-origin isolation, scoped to Video Studio only: onnxruntime-web's
  // multi-threaded WASM backend (the fallback when WebGPU isn't available — see
  // lib/video/transcription.ts) needs SharedArrayBuffer, which browsers only expose
  // on a COOP/COEP cross-origin-isolated page. Site-wide would risk breaking the
  // canvas editor's cross-origin Liveblocks connections, so this is scoped narrowly.
  async headers() {
    return [
      {
        source: "/video/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
