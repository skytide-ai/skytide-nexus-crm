import { Badge } from '@/components/ui/badge';
import { WhatsappIcon, MessengerIcon, InstagramIcon } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatPlatform } from '@/types/chat';

// Función para obtener el color de borde según la plataforma
function getPlatformBorderColor(platform: ChatPlatform) {
  switch (platform) {
    case 'whatsapp': return 'border-green-500';
    case 'messenger': return 'border-blue-500';
    case 'instagram': return 'border-pink-500';
    default: return 'border-gray-500';
  }
};

interface PlatformStatus {
  platform: ChatPlatform;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
}

const platforms: PlatformStatus[] = [
  { 
    platform: 'whatsapp', 
    icon: WhatsappIcon, 
    label: 'WhatsApp',
    color: 'text-green-500',
    bgColor: 'bg-green-500'
  },
  { 
    platform: 'messenger', 
    icon: MessengerIcon, 
    label: 'Messenger',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500'
  },
  { 
    platform: 'instagram', 
    icon: InstagramIcon, 
    label: 'Instagram',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500'
  }
];

interface PlatformCount {
  platform: ChatPlatform;
  count: number;
}

export function ChatPlatformStatus() {
  const { organization } = useAuth();

  // Consulta para obtener el conteo de conversaciones por plataforma
  const { data: conversationCounts = [] } = useQuery<PlatformCount[]>({
    queryKey: ['conversation-counts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('chat_identities')
        .select('platform, id')
        .eq('organization_id', organization.id);

      if (error) throw error;
      
      // Agrupar y contar por plataforma
      const counts: Record<string, number> = {};
      data.forEach(item => {
        const platform = item.platform as ChatPlatform;
        counts[platform] = (counts[platform] || 0) + 1;
      });
      
      return Object.entries(counts).map(([platform, count]) => ({
        platform: platform as ChatPlatform,
        count
      }));
    },
    enabled: !!organization?.id
  });

  return (
    <div className="flex items-center">
      <div className="flex items-center gap-3">
        <TooltipProvider>
          {platforms.map(({ platform, icon: Icon, label, color, bgColor }) => {
            const count = conversationCounts.find(c => c.platform === platform)?.count || 0;
            
            return (
              <Tooltip key={platform}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1.5 py-1.5 px-3 border-2 border-gray-300"
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="font-medium">{label}</span>
                      {count > 0 && (
                        <span className={`rounded-full ${bgColor} text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] text-center`}>
                          {count}
                        </span>
                      )}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{count} conversaciones en {label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
