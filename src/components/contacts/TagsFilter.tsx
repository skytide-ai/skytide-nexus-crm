import { useState } from 'react';
import { Check, ChevronsUpDown, Tags as TagsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { useTags } from '@/hooks/useTags';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TagsFilterProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagsFilter({ selectedTagIds, onTagsChange }: TagsFilterProps) {
  const [open, setOpen] = useState(false);
  const { tags = [] } = useTags();

  const handleTagToggle = (tagId: string) => {
    const newSelectedTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    onTagsChange(newSelectedTagIds);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-[200px]"
        >
          <div className="flex items-center gap-2">
            <TagsIcon className="h-4 w-4" />
            <span className="truncate">
              {selectedTagIds.length === 0
                ? "Filtrar por tags"
                : `${selectedTagIds.length} tag${selectedTagIds.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar tag..." />
          <CommandEmpty>No se encontraron tags.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => handleTagToggle(tag.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Badge
                    style={{
                      backgroundColor: tag.color,
                      color: isLightColor(tag.color) ? '#000' : '#fff'
                    }}
                  >
                    {tag.name}
                  </Badge>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Función auxiliar para determinar si un color es claro u oscuro
function isLightColor(color: string) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}
