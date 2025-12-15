import { Card } from "@/components/ui/card";

interface WallPostProps {
  content: string;
  tags: string[];
}

export function WallPost({ content, tags }: WallPostProps) {
  return (
    <Card className="p-5 hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-cream-warm">
      <p className="text-base leading-relaxed mb-4">{content}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-mono bg-background border-[2px] border-foreground px-2 py-0.5"
          >
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
}
