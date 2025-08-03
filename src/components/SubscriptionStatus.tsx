import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, Settings, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export const SubscriptionStatus: React.FC = () => {
  const { subscriptionInfo, loading, checkSubscription, openCustomerPortal } = useSubscription();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Pro':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Unlimited':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-background/50 to-background/80 border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="font-medium">Plano:</span>
            <Badge 
              variant="outline" 
              className={getTierColor(subscriptionInfo.subscription_tier)}
            >
              {subscriptionInfo.subscription_tier}
            </Badge>
          </div>
          
          {subscriptionInfo.subscription_end && (
            <div className="text-sm text-muted-foreground">
              Renovação: {formatDate(subscriptionInfo.subscription_end)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={checkSubscription}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          {subscriptionInfo.subscribed && (
            <Button
              size="sm"
              variant="outline"
              onClick={openCustomerPortal}
            >
              <Settings className="h-3 w-3 mr-1" />
              Gerenciar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};