import { Button } from "@/components/ui/button";

interface CategoryTabsProps {
  categories: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={selectedId === cat.id ? "default" : "outline"}
          onClick={() => onSelect(cat.id)}
          className="whitespace-nowrap rounded-full px-6"
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
