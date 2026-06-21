/** Placeholder for WebPlatform integration for the pages plugin. */
export interface PagesUiPlugin {
  id: string;
}

/** Creates the pages UI plugin descriptor for WebPlatform integration. */
export function pagesUiPlugin(): PagesUiPlugin {
  return {
    id: 'pages',
  };
}
