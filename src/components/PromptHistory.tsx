import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Prompt {
  id: string;
  platform: string;
  subject: string;
  subject_details?: string;
  style: string;
  artist?: string;
  composition: string;
  aspect_ratio?: string;
  mood?: string;
  lighting?: string;
  camera?: string;
  quality: string;
  creativity_level?: number;
  negative_prompt?: string;
  generated_prompt: string;
  created_at: string;
}

export const PromptHistory = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPrompts(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar histórico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrompts(prompts.filter(p => p.id !== id));
      toast.success('Prompt excluído com sucesso');
    } catch (error: any) {
      toast.error('Erro ao excluir prompt: ' + error.message);
    }
  };

  const copyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Prompt copiado!');
    } catch (error) {
      toast.error('Erro ao copiar prompt');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum prompt salvo ainda. Comece criando seu primeiro prompt!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <Card key={prompt.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {prompt.subject} - {prompt.style}
                </CardTitle>
                <CardDescription>
                  {new Date(prompt.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{prompt.platform}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyPrompt(prompt.generated_prompt)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deletePrompt(prompt.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prompt.subject_details && (
                <p className="text-sm text-muted-foreground">
                  <strong>Detalhes:</strong> {prompt.subject_details}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Composição: {prompt.composition}</Badge>
                <Badge variant="outline">Qualidade: {prompt.quality}</Badge>
                {prompt.mood && <Badge variant="outline">Humor: {prompt.mood}</Badge>}
                {prompt.artist && <Badge variant="outline">Artista: {prompt.artist}</Badge>}
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-mono">{prompt.generated_prompt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};