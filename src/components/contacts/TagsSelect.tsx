import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useContactTags } from '@/hooks/useContactTags';
import { useUpdateContactTags } from '@/hooks/useUpdateContactTags';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TagsSelectProps {
  contactId: string;
}

export function TagsSelect({ contactId }: TagsSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { tags: allTags = [] } = useTags();
  const { data: contactTags = [] } = useContactTags(contactId);
  const updateContactTags = useUpdateContactTags();

  // Inicializar los tags seleccionados cuando se cargan los tags del contacto
  useEffect(() => {
    if (contactTags) {
      setSelectedTagIds(contactTags.map(tag => tag.id));
    }
  }, [contactTags]);

  const handleTagToggle = async (tagId: string) => {
    const newSelectedTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    setSelectedTagIds(newSelectedTagIds);
    
    try {
      await updateContactTags.mutateAsync({
        contactId,
        tagIds: newSelectedTagIds
      });
    } catch (error) {
      // El error ya es manejado por el hook
      console.error('Error toggling tag:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedTagIds.length === 0 ? (
            "Seleccionar tags..."
          ) : (
            <div className="flex flex-wrap gap-1">
              {allTags
                .filter(tag => selectedTagIds.includes(tag.id))
                .map(tag => (
                  <Badge
                    key={tag.id}
                    style={{
                      backgroundColor: tag.color,
                      color: isLightColor(tag.color) ? '#000' : '#fff'
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar tag..." />
          <CommandEmpty>No se encontraron tags.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              {allTags.map((tag) => (
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
