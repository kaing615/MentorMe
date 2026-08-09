import assert from "node:assert/strict";

export type ContractRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  token?: string;
  body?: unknown;
};

type NormalizedResponse = { status: number; body: unknown };

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !["_id", "id", "createdAt", "updatedAt", "ticketNumber"].includes(
              key,
            ),
        )
        .map(([key, item]) => [key, normalize(item)]),
    );
  }
  if (typeof value === "string") {
    return value.replace(/TICKET-[A-Z0-9-]+/g, "TICKET-NORMALIZED");
  }
  return value;
};

const call = async (
  baseUrl: string,
  input: ContractRequest,
): Promise<NormalizedResponse> => {
  const headers = new Headers();
  if (input.body !== undefined) headers.set("Content-Type", "application/json");
  if (input.token) headers.set("Authorization", `Bearer ${input.token}`);
  const init: RequestInit = { method: input.method, headers };
  if (input.body !== undefined) init.body = JSON.stringify(input.body);
  const response = await fetch(`${baseUrl}${input.path}`, init);
  return { status: response.status, body: normalize(await response.json()) };
};

export const compareResponses = async (
  legacyBaseUrl: string,
  nestBaseUrl: string,
  input: ContractRequest,
): Promise<void> => {
  const [legacy, nest] = await Promise.all([
    call(legacyBaseUrl, input),
    call(nestBaseUrl, input),
  ]);
  assert.deepEqual(nest, legacy);
};
