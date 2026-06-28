export interface LoginPromptConfig {
  queryParam: string;
  queryValue: string;
}

export function buildLoginPromptHref(
  homeRoute: string,
  loginPrompt: LoginPromptConfig,
): string {
  const searchParams = new URLSearchParams({
    [loginPrompt.queryParam]: loginPrompt.queryValue,
  });

  return `${homeRoute}?${searchParams.toString()}`;
}

export function isLoginPromptRequested(
  searchParams: URLSearchParams,
  loginPrompt: LoginPromptConfig,
): boolean {
  return searchParams.get(loginPrompt.queryParam) === loginPrompt.queryValue;
}

export function clearLoginPrompt(
  searchParams: URLSearchParams,
  loginPrompt: LoginPromptConfig,
): URLSearchParams {
  const nextSearchParams = new URLSearchParams(searchParams);
  nextSearchParams.delete(loginPrompt.queryParam);
  return nextSearchParams;
}
