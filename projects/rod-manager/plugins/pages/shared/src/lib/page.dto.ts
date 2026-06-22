export interface ContentPageSummary {
  slug: string;
}

export interface ContentPage {
  slug: string;
  contentMd: string;
}

export interface ContentPageListResponseBody {
  pages: ContentPageSummary[];
}

export interface ContentPageResponseBody {
  page: ContentPage;
}
