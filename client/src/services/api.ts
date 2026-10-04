import axios from "axios";
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: path,
      method,
      data: body,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error))
      throw new ApiError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "We could not reach the server. Please try again.",
        error.response?.status,
      );
    throw error;
  }
}
