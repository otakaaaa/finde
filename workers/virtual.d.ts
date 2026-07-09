/// <reference types="vite/client" />

declare module 'virtual:react-router/server-build' {
  import type { ServerBuild } from 'react-router'

  export const mode: ServerBuild['mode']
  export const assets: ServerBuild['assets']
  export const basename: ServerBuild['basename']
  export const entry: ServerBuild['entry']
  export const routes: ServerBuild['routes']
  export const future: ServerBuild['future']
  export const publicPath: ServerBuild['publicPath']
  export const assetsBuildDirectory: ServerBuild['assetsBuildDirectory']
  export const isSpaMode: ServerBuild['isSpaMode']
  export const prerender: ServerBuild['prerender']
  export const ssr: ServerBuild['ssr']
  export const routeDiscovery: ServerBuild['routeDiscovery']
}
