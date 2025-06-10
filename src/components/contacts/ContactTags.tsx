import { useContactTags } from '@/hooks/useContactTags';
import { Badge } from '@/components/ui/badge';

interface ContactTagsProps {
  contactId: string;
}

export function ContactTags({ contactId }: ContactTagsProps) {
  const { data: tags = [], isLoading } = useContactTags(contactId);

  if (isLoading) {
    return <span className="text-gray-400">Cargando...</span>;
  }

  if (tags.length === 0) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
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
