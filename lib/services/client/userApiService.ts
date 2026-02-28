import { User, UserCreate, UserUpdate } from "@/schemas/type-export.schema";
import { UserCreateSchema, UserUpdateSchema } from "@/schemas/user.schema";

export const userApiService = {
  fetchUsers: async (): Promise<User[]> => {
    const res = await fetch("/api/users");
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch users" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  fetchUserById: async (id: string): Promise<User> => {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "User not found" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  addUser: async (data: UserCreate): Promise<User> => {
    const validated = UserCreateSchema.parse(data);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to add user" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  updateUser: async (id: string, data: UserUpdate): Promise<User> => {
    const validated = UserUpdateSchema.parse(data);
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to update user" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  deleteUser: async (id: string): Promise<User> => {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to delete user" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  reactivateUser: async (id: string): Promise<User> => {
    const res = await fetch(`/api/users/${id}/reactivate`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to reactivate user" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },
} as const;
