import { TagBadge } from "~/components/tags/TagBadge";
import { Button } from "~/components/ui/Button";
import { type RouterOutputs } from "~/utils/api";

type Tag = RouterOutputs["tag"]["list"][number];

type TagPickerProps = {
  tags: Tag[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function TagPicker({ tags, value, onChange }: TagPickerProps) {
  const toggleTag = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
      return;
    }

    onChange([...value, tagId]);
  };

  if (tags.length === 0) {
    return <p className="text-sm text-slate-500">No tags have been created for this project.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = value.includes(tag.id);

        return (
          <Button
            key={tag.id}
            type="button"
            variant={selected ? "secondary" : "outline"}
            size="sm"
            onClick={() => toggleTag(tag.id)}
            className="h-auto min-h-8 px-2 py-1"
          >
            <TagBadge name={tag.name} color={tag.color} />
          </Button>
        );
      })}
    </div>
  );
}
