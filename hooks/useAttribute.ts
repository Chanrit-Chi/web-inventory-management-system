import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Attribute,
  AttributeCreate,
  AttributeUpdate,
  AttributeValueCreate,
  AttributeValueUpdate,
} from "@/schemas/attribute.schema";

const fetchAttributes = async (): Promise<Attribute[]> => {
  const response = await fetch("/api/attributes");
  if (!response.ok) {
    throw new Error("Failed to fetch attributes");
  }
  return response.json();
};

export function useAttributes() {
  return useQuery({
    queryKey: ["attributes"],
    queryFn: fetchAttributes,
  });
}

export function useAttributeMutations() {
  const queryClient = useQueryClient();

  const createAttribute = useMutation({
    mutationFn: async (data: AttributeCreate) => {
      const response = await fetch("/api/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create attribute");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });

  const updateAttribute = useMutation({
    mutationFn: async (data: AttributeUpdate) => {
      const response = await fetch(`/api/attributes/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update attribute");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });

  const deleteAttribute = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/attributes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete attribute");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });

  const addValue = useMutation({
    mutationFn: async ({
      attributeId,
      ...data
    }: AttributeValueCreate & { attributeId: number }) => {
      const response = await fetch(`/api/attributes/${attributeId}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add value");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });

  const updateValue = useMutation({
    mutationFn: async (data: AttributeValueUpdate) => {
      const response = await fetch(`/api/attributes/values/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update value");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });

  const deleteValue = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/attributes/values/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete value");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });

  return {
    createAttribute,
    updateAttribute,
    deleteAttribute,
    addValue,
    updateValue,
    deleteValue,
  };
}
