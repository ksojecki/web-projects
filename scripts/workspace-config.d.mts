export interface ProductWorkspaceConfig {
  authDbPath: string;
  apiPort: number;
  chromeDebugPort: number;
  frontendBaseUrl: string;
  webPort: number;
}

export const PRODUCT_CONFIG: Record<string, ProductWorkspaceConfig>;

export function getChromeUserDataDir(projectId: string): string;
export function getProductApiPort(projectId: string): number;
export function getProductChromeDebugPort(projectId: string): number;
export function getProductFrontendBaseUrl(projectId: string): string;
export function getProductWebPort(projectId: string): number;
export function loadProductEnv(projectId: string): void;
