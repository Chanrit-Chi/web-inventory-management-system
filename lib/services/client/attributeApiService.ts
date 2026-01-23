export const attributeApiService = {
  async fetchAttributes() {
    const res = await fetch("/api/products/attributes");
    if (!res.ok) throw new Error("Failed to fetch attributes");
    return res.json();
  },
};
