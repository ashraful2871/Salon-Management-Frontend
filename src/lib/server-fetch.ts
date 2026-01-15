import { getCookie } from "@/services/auth/cookiesHandler";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const serverFetchHelper = async (
  endPoint: string,
  options: RequestInit
): Promise<Response> => {
  const { headers, ...restOptions } = options;
  const accessToken = await getCookie("accessToken");
  console.log(accessToken);
  const response = await fetch(`${BACKEND_API_URL}${endPoint}`, {
    headers: {
      Cookie: accessToken ? `accessToken=${accessToken}` : "",
      ...headers,
    },
    ...restOptions,
    credentials: "include",
  });
  return response;
};

export const serverFetch = {
  get: async (endPoint: string, options: RequestInit = {}): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "GET" }),

  post: async (
    endPoint: string,
    options: RequestInit = {}
  ): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "POST" }),

  put: async (endPoint: string, options: RequestInit = {}): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "PUT" }),
  patch: async (
    endPoint: string,
    options: RequestInit = {}
  ): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "PATCH" }),
  delete: async (
    endPoint: string,
    options: RequestInit = {}
  ): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "DELETE" }),
};
