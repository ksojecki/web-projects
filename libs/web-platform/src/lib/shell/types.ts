export type PlatformNavigationVisibility = 'always' | 'authenticated' | 'guest';

export interface PlatformNavigationItem {
  label: string;
  to: string;
  visibility?: PlatformNavigationVisibility;
}

export interface PlatformFooterLink {
  external?: boolean;
  label: string;
  to: string;
}

export interface PlatformFooterSection {
  links: PlatformFooterLink[];
  title?: string;
}
