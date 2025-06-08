import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { WhatsappIcon, MessengerIcon, InstagramIcon } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface PlatformStatus {
  platform: 'whatsapp' | 'messenger' | 'instagram';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const platforms: PlatformStatus[] = [
  { platform: 'whatsapp', icon: WhatsappIcon, label: 'WhatsApp' },
  { platform: 'messenger', icon: MessengerIcon, label: 'Messenger' },
  { platform: 'instagram', icon: InstagramIcon, label: 'Instagram' }
];

export function ChatPlatformStatus() {
  const { organization } = useAuth();

  const { data: activeWebhooks } = useQuery({
    queryKey: ['webhooks', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data: webhooks, error } = await supabase
        .from('organization_webhooks')
        .select('platform')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      if (error) throw error;
      return webhooks.map(w => w.platform);
    },
    enabled: !!organization?.id
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {platforms.map(({ platform, icon: Icon, label }) => {
          const isActive = activeWebhooks?.includes(platform);

          return (
            <div key={platform} className="flex items-center gap-2">
              <Icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {label}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
