import type { NormalizedOptions } from './shared';

export function createWebIndexHtml(options: NormalizedOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${options.displayName}</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="root"><!--ssr-outlet--></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

export function createStylesCss(): string {
  return `@import 'tailwindcss';

@plugin "daisyui" {
  themes: emerald --default;
}

@source '../../../../../libs/ui/src/**/*.{ts,tsx}';
@source '../../../../../libs/web-platform/src/**/*.{ts,tsx}';
`;
}
