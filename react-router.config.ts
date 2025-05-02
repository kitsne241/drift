import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
} satisfies Config;

// 最新の React Router はデフォルトで SSR をサポートしている（どころか、有効にしている）
// Vue は Vue + Nuxt で SSR をサポートしているが、React なら React Router だけで SSR が可能
// ただし、Next.js は他にもいろいろ機能があるのでお役御免になるわけではない
