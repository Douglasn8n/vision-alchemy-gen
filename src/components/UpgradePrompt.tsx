import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, Infinity } from 'lucide-react';

interface UpgradePromptProps {
  usageInfo: {
    current_usage: number;
    daily_limit: number;
    remaining: number;
    can_generate: boolean;
  };
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ usageInfo }) => {
  if (usageInfo.can_generate) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-primary/10">
            <Crown className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Limite Diário Atingido!
          </h3>
          <p className="text-muted-foreground mt-2">
            Você já gerou {usageInfo.current_usage} prompts hoje. 
            Upgrade seu plano para continuar criando prompts incríveis!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {/* Free Plan */}
          <Card className="p-4 border-border">
            <div className="text-center space-y-3">
              <Badge variant="secondary">Atual</Badge>
              <h4 className="font-semibold">Grátis</h4>
              <div className="text-2xl font-bold">R$ 0</div>
              <div className="text-sm text-muted-foreground">por mês</div>
              <ul className="text-sm space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  10 prompts/dia
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Configurações básicas
                </li>
              </ul>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="p-4 border-primary relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>
            </div>
            <div className="text-center space-y-3">
              <h4 className="font-semibold">Pro</h4>
              <div className="text-2xl font-bold">R$ 19</div>
              <div className="text-sm text-muted-foreground">por mês</div>
              <ul className="text-sm space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  100 prompts/dia
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Todas as configurações
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="h-3 w-3" />
                  Suporte prioritário
                </li>
              </ul>
              <Button className="w-full">
                Upgrade para Pro
              </Button>
            </div>
          </Card>

          {/* Unlimited Plan */}
          <Card className="p-4 border-border">
            <div className="text-center space-y-3">
              <Badge variant="outline">Premium</Badge>
              <h4 className="font-semibold">Unlimited</h4>
              <div className="text-2xl font-bold">R$ 49</div>
              <div className="text-sm text-muted-foreground">por mês</div>
              <ul className="text-sm space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <Infinity className="h-3 w-3" />
                  Prompts ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Todas as configurações
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="h-3 w-3" />
                  Suporte VIP
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Upgrade para Unlimited
              </Button>
            </div>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground">
          Seus prompts serão renovados amanhã às 00:00
        </div>
      </div>
    </Card>
  );
};