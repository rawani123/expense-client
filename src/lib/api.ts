import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const getExpenses = (params?: object) => api.get("/expenses", { params });
export const createExpense = (data: object) => api.post("/expenses", data);
export const updateExpense = (id: string, data: object) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id: string) => api.delete(`/expenses/${id}`);
export const getSummary = () => api.get("/expenses/summary");

export const login = (data: object) => api.post("/auth/login", data);
export const register = (data: object) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");
export const updateBudget = (monthlyBudget: number) => api.patch("/auth/budget", { monthlyBudget });

export const getCategories = () => api.get("/categories");
export const createCategory = (data: object) => api.post("/categories", data);