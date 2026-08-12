import queryString from "query-string";

export const serializeQuery = (params: Record<string, unknown>) =>
  queryString.stringify(params, { skipNull: true, skipEmptyString: true });
