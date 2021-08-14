export const getQueryString = (queryParams: Map<string, string>): string => {
  const keys = [...queryParams.keys()].sort();
  return keys.map((key: string) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams.get(key))}`).join('&');
}