import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Sparkles, Shuffle, Zap, Wand2, User, LogOut, History } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { AuthPage } from '@/components/AuthPage';
import { PromptHistory } from '@/components/PromptHistory';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import openaiLogo from '@/assets/logos/openai-logo.png';
import midjourneyLogo from '@/assets/logos/midjourney-logo.png';
import leonardoLogo from '@/assets/logos/leonardo-logo.png';
import veo3Logo from '@/assets/logos/veo3-logo.png';
import geminiLogo from '@/assets/logos/gemini-logo.png';

interface AIPromptGeneratorProps {}

type AIModel = 'midjourney' | 'leonardo' | 'veo3' | 'chatgpt' | 'gemini';

interface PromptConfig {
  aiModel: AIModel;
  subject: string;
  customDetails: string;
  style: string;
  artist: string;
  composition: string;
  aspectRatio: string;
  mood: string;
  quality: string;
  lighting: string;
  camera: string;
  creativity: number;
  negativePrompt: string;
  isAdvancedMode: boolean;
}

const SUBJECTS = [
  'Pessoa', 'Animal', 'Paisagem', 'Objeto', 'Arquitetura', 'Veículo',
  'Fantasia', 'Sci-fi', 'Natureza', 'Retrato', 'Cena urbana', 'Espaço'
];

const STYLES = [
  'Fotorrealista', 'Pintura a óleo', 'Aquarela', 'Arte digital', 'Anime', 'Cartoon',
  '3D render', 'Pixel art', 'Impressionista', 'Surrealista', 'Cyberpunk', 'Steampunk',
  'Art nouveau', 'Pop art', 'Minimalista'
];

const ARTISTS = [
  'Monet', 'Van Gogh', 'Picasso', 'Da Vinci', 'Dali', 'Banksy',
  'Hokusai', 'Klimt', 'Basquiat', 'Pollock', 'Warhol', 'Caravaggio'
];

const COMPOSITIONS = [
  'Close-up', 'Plano médio', 'Plano geral', 'Vista aérea', 'Ângulo baixo', 'Ângulo alto',
  'Regra dos terços', 'Simetria', 'Perspectiva isométrica', 'Profundidade de campo rasa',
  'Grande angular', 'Macro'
];

const ASPECT_RATIOS = [
  '1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '2:3'
];

const MOODS = [
  'Alegre', 'Melancólico', 'Dramático', 'Sereno', 'Misterioso', 'Energético',
  'Romântico', 'Sombrio', 'Vibrante', 'Nostálgico', 'Épico', 'Íntimo'
];

const QUALITIES = [
  'Ultra detalhado', 'Alta qualidade', 'Cinematic', 'Professional', '8K resolution',
  'HDR', 'Hyperrealistic', 'Artstation trending', 'Award winning', 'Masterpiece'
];

const LIGHTINGS = [
  'Natural', 'Golden hour', 'Blue hour', 'Dramatic', 'Soft', 'Hard',
  'Neon', 'Candle light', 'Studio lighting', 'Volumetric'
];

const CAMERAS = [
  'Canon EOS R5', 'Sony A7R IV', 'Nikon D850', 'Fuji GFX 100S',
  'Hasselblad X2D', 'Leica Q2', 'Phase One XF', 'RED Komodo'
];

const AI_MODELS = [
  { id: 'midjourney', name: 'Midjourney', color: 'bg-gradient-to-r from-purple-500 to-pink-500', logo: midjourneyLogo },
  { id: 'leonardo', name: 'Leonardo.ai', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', logo: leonardoLogo },
  { id: 'veo3', name: 'Veo 3', color: 'bg-gradient-to-r from-green-500 to-teal-500', logo: veo3Logo },
  { id: 'chatgpt', name: 'ChatGPT (DALL-E 3)', color: 'bg-gradient-to-r from-emerald-500 to-blue-500', logo: openaiLogo },
  { id: 'gemini', name: 'Gemini (Imagen 3)', color: 'bg-gradient-to-r from-orange-500 to-red-500', logo: geminiLogo }
];

export const AIPromptGenerator: React.FC<AIPromptGeneratorProps> = () => {
  // ALL hooks must be called before any conditional logic
  const { user, loading, signOut } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
  const [config, setConfig] = useState<PromptConfig>({
    aiModel: 'midjourney',
    subject: '',
    customDetails: '',
    style: '',
    artist: '',
    composition: '',
    aspectRatio: '1:1',
    mood: '',
    quality: '',
    lighting: '',
    camera: '',
    creativity: 50,
    negativePrompt: '',
    isAdvancedMode: false,
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{
    current_usage: number;
    daily_limit: number;
    remaining: number;
    can_generate: boolean;
    subscription_tier?: string;
  } | null>(null);

  // Remove automatic prompt generation - only generate on button click
  // useEffect removed to prevent auto-generation

  // Check user's daily usage limit
  const checkUsageLimit = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('check_user_limit', {
        p_user_id: user.id
      });

      if (error) throw error;
      setUsageInfo(data as {
        current_usage: number;
        daily_limit: number;
        remaining: number;
        can_generate: boolean;
      });
    } catch (error) {
      console.error('Error checking usage limit:', error);
    }
  }, [user?.id]);

  // Check usage on mount and user change
  useEffect(() => {
    if (user) {
      checkUsageLimit();
    }
  }, [user, checkUsageLimit]);

  // Now we can safely have conditional returns after all hooks are called
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Define generatePrompt function that will be called manually
  const generatePrompt = async () => {
    if (!user?.id) return;

    // Check if user can generate more prompts
    if (usageInfo && !usageInfo.can_generate) {
      toast.error(`Limite diário atingido! Você já gerou ${usageInfo.current_usage} prompts hoje. Upgrade seu plano para gerar mais.`);
      return;
    }

    setIsGenerating(true);

    try {
      let prompt = '';
      
      // Base prompt
      if (config.subject) {
        prompt += config.subject.toLowerCase();
      }
      
      if (config.customDetails) {
        prompt += prompt ? `, ${config.customDetails}` : config.customDetails;
      }
      
      // Style and artist
      if (config.style) {
        prompt += `, ${config.style.toLowerCase()} style`;
      }
      
      if (config.artist && config.isAdvancedMode) {
        prompt += `, by ${config.artist}`;
      }
      
      // Mood and composition
      if (config.mood) {
        prompt += `, ${config.mood.toLowerCase()} mood`;
      }
      
      if (config.composition) {
        prompt += `, ${config.composition.toLowerCase()}`;
      }
      
      // Quality and lighting
      if (config.quality) {
        prompt += `, ${config.quality.toLowerCase()}`;
      }
      
      if (config.lighting && config.isAdvancedMode) {
        prompt += `, ${config.lighting.toLowerCase()} lighting`;
      }
      
      if (config.camera && config.isAdvancedMode) {
        prompt += `, shot with ${config.camera}`;
      }
      
      // AI-specific parameters
      switch (config.aiModel) {
        case 'midjourney':
          if (config.aspectRatio) prompt += ` --ar ${config.aspectRatio}`;
          prompt += ` --v 6.0 --style raw`;
          if (config.creativity > 70) prompt += ` --stylize 1000`;
          if (config.quality) prompt += ` --q 2`;
          break;
          
        case 'leonardo':
          prompt += ` [Alchemy, High Quality]`;
          if (config.creativity > 60) prompt += ` [Guidance Scale: ${Math.round(config.creativity / 10)}]`;
          break;
          
        case 'veo3':
          prompt += ` [Video: 5s duration, smooth motion]`;
          if (config.creativity > 50) prompt += ` [Creative mode]`;
          break;
          
        case 'chatgpt':
          prompt = `Create an image of: ${prompt}`;
          if (config.quality) prompt += `, with ${config.quality.toLowerCase()} quality`;
          break;
          
        case 'gemini':
          prompt = `Generate: ${prompt}`;
          if (config.creativity > 60) prompt += `, enhanced creativity mode`;
          break;
      }
      
      // Negative prompt
      if (config.negativePrompt && config.isAdvancedMode) {
        prompt += ` --no ${config.negativePrompt}`;
      }
      
      setGeneratedPrompt(prompt.trim());

      // Increment usage and save prompt
      const { data: usage, error: usageError } = await supabase.rpc('increment_user_usage', {
        p_user_id: user.id
      });

      if (usageError) throw usageError;

      // Save prompt to history
      const { error: saveError } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          platform: config.aiModel,
          subject: config.subject,
          subject_details: config.customDetails,
          style: config.style,
          artist: config.artist,
          composition: config.composition,
          aspect_ratio: config.aspectRatio,
          mood: config.mood,
          lighting: config.lighting,
          camera: config.camera,
          quality: config.quality,
          creativity_level: config.creativity,
          negative_prompt: config.negativePrompt,
          generated_prompt: prompt.trim(),
        });

      if (saveError) throw saveError;

      // Update usage info
      await checkUsageLimit();

      toast.success(`Prompt gerado! Você já usou ${usage} de ${usageInfo?.daily_limit || 10} prompts hoje.`);
    } catch (error: any) {
      toast.error('Erro ao gerar prompt: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const randomizeConfig = () => {
    setConfig(prev => ({
      ...prev,
      subject: SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
      style: STYLES[Math.floor(Math.random() * STYLES.length)],
      artist: ARTISTS[Math.floor(Math.random() * ARTISTS.length)],
      composition: COMPOSITIONS[Math.floor(Math.random() * COMPOSITIONS.length)],
      mood: MOODS[Math.floor(Math.random() * MOODS.length)],
      quality: QUALITIES[Math.floor(Math.random() * QUALITIES.length)],
      lighting: LIGHTINGS[Math.floor(Math.random() * LIGHTINGS.length)],
      camera: CAMERAS[Math.floor(Math.random() * CAMERAS.length)],
      creativity: Math.floor(Math.random() * 100),
    }));
  };

  const savePrompt = async () => {
    if (!generatedPrompt || !user) return;

    try {
      const { error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          platform: config.aiModel,
          subject: config.subject,
          subject_details: config.customDetails,
          style: config.style,
          artist: config.artist,
          composition: config.composition,
          aspect_ratio: config.aspectRatio,
          mood: config.mood,
          lighting: config.lighting,
          camera: config.camera,
          quality: config.quality,
          creativity_level: config.creativity,
          negative_prompt: config.negativePrompt,
          generated_prompt: generatedPrompt,
        });

      if (error) throw error;

      toast.success('Prompt salvo no histórico!');
    } catch (error: any) {
      toast.error('Erro ao salvar prompt: ' + error.message);
    }
  };

  const copyPrompt = async () => {
    if (!generatedPrompt) return;
    
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast.success('Prompt copiado!');
      
      // Auto-save prompt when copying
      if (user) {
        setTimeout(() => savePrompt(), 100);
      }
    } catch (err) {
      toast.error('Erro ao copiar prompt');
    }
  };

  const clearAll = () => {
    setConfig({
      aiModel: 'midjourney',
      subject: '',
      customDetails: '',
      style: '',
      artist: '',
      composition: '',
      aspectRatio: '1:1',
      mood: '',
      quality: '',
      lighting: '',
      camera: '',
      creativity: 50,
      negativePrompt: '',
      isAdvancedMode: false,
    });
    setGeneratedPrompt('');
  };

  const OptionDropdown = ({ 
    options, 
    selected, 
    onSelect, 
    title,
    placeholder = "Selecione uma opção..."
  }: { 
    options: string[]; 
    selected: string; 
    onSelect: (value: string) => void; 
    title: string;
    placeholder?: string;
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">{title}</Label>
      <Select value={selected} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-primary">
              <Wand2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-purple to-ai-blue bg-clip-text text-transparent">
                Gerador de Prompts IA
              </h1>
              <p className="text-muted-foreground">
                Crie prompts otimizados para diferentes plataformas de IA
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
              <Button
                variant={activeTab === 'generator' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('generator')}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Gerador
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('history')}
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Usage indicator */}
              {usageInfo && (
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Prompts hoje:</span>
                  <Badge variant={usageInfo.can_generate ? "secondary" : "destructive"}>
                    {usageInfo.current_usage}/{usageInfo.daily_limit}
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <SubscriptionStatus />

        {/* Main Content */}
        {activeTab === 'generator' ? (
          <>
            {/* AI Model Selection */}
            <Card className="p-6 bg-card border-border backdrop-blur-sm">
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Selecione a Plataforma de IA</Label>
                <div className="flex justify-center gap-4 flex-wrap">
                  {AI_MODELS.map((model) => (
                    <Button
                      key={model.id}
                      variant={config.aiModel === model.id ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, aiModel: model.id as AIModel }))}
                      className="h-16 w-16 p-2 rounded-xl relative group hover:scale-105 transition-all duration-200"
                      title={model.name}
                    >
                      <img 
                        src={model.logo} 
                        alt={model.name}
                        className="w-10 h-10 object-contain rounded-lg"
                      />
                      {config.aiModel === model.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                      )}
                    </Button>
                  ))}
                </div>
                <div className="text-center">
                  <Label className="text-sm text-muted-foreground">
                    {AI_MODELS.find(m => m.id === config.aiModel)?.name}
                  </Label>
                </div>
              </div>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Configuration Panel */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 bg-card border-border backdrop-blur-sm">
                  <Tabs defaultValue="basic" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="basic">Configuração Básica</TabsTrigger>
                        <TabsTrigger value="advanced">Modo Avançado</TabsTrigger>
                      </TabsList>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.isAdvancedMode}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isAdvancedMode: checked }))}
                        />
                        <Label className="text-sm">Modo Avançado</Label>
                      </div>
                    </div>

                    <TabsContent value="basic" className="space-y-6">
                      {/* Subject */}
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Assunto Principal</Label>
                        <OptionDropdown
                          options={SUBJECTS}
                          selected={config.subject}
                          onSelect={(value) => setConfig(prev => ({ ...prev, subject: value }))}
                          title="Categoria"
                          placeholder="Selecione uma categoria..."
                        />
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Detalhes Customizados</Label>
                          <Textarea
                            placeholder="Descreva detalhes específicos do seu assunto..."
                            value={config.customDetails}
                            onChange={(e) => setConfig(prev => ({ ...prev, customDetails: e.target.value }))}
                            className="resize-none"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Style */}
                      <OptionDropdown
                        options={STYLES}
                        selected={config.style}
                        onSelect={(value) => setConfig(prev => ({ ...prev, style: value }))}
                        title="Estilo Artístico"
                        placeholder="Selecione um estilo..."
                      />

                      {/* Composition */}
                      <OptionDropdown
                        options={COMPOSITIONS}
                        selected={config.composition}
                        onSelect={(value) => setConfig(prev => ({ ...prev, composition: value }))}
                        title="Composição e Enquadramento"
                        placeholder="Selecione uma composição..."
                      />

                      {/* Mood */}
                      <OptionDropdown
                        options={MOODS}
                        selected={config.mood}
                        onSelect={(value) => setConfig(prev => ({ ...prev, mood: value }))}
                        title="Humor/Tom"
                        placeholder="Selecione um humor..."
                      />

                      {/* Quality */}
                      <OptionDropdown
                        options={QUALITIES}
                        selected={config.quality}
                        onSelect={(value) => setConfig(prev => ({ ...prev, quality: value }))}
                        title="Qualidade"
                        placeholder="Selecione a qualidade..."
                      />
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-6">
                      {/* Artists */}
                      <OptionDropdown
                        options={ARTISTS}
                        selected={config.artist}
                        onSelect={(value) => setConfig(prev => ({ ...prev, artist: value }))}
                        title="Artista de Referência"
                        placeholder="Selecione um artista..."
                      />

                      {/* Lighting */}
                      <OptionDropdown
                        options={LIGHTINGS}
                        selected={config.lighting}
                        onSelect={(value) => setConfig(prev => ({ ...prev, lighting: value }))}
                        title="Iluminação"
                        placeholder="Selecione a iluminação..."
                      />

                      {/* Cameras */}
                      <OptionDropdown
                        options={CAMERAS}
                        selected={config.camera}
                        onSelect={(value) => setConfig(prev => ({ ...prev, camera: value }))}
                        title="Câmera Profissional"
                        placeholder="Selecione uma câmera..."
                      />

                      {/* Aspect Ratio */}
                      <OptionDropdown
                        options={ASPECT_RATIOS}
                        selected={config.aspectRatio}
                        onSelect={(value) => setConfig(prev => ({ ...prev, aspectRatio: value }))}
                        title="Proporção da Imagem"
                        placeholder="Selecione a proporção..."
                      />

                      {/* Creativity Slider */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium text-muted-foreground">Nível de Criatividade</Label>
                          <Badge variant="outline">{config.creativity}%</Badge>
                        </div>
                        <Slider
                          value={[config.creativity]}
                          onValueChange={(values) => setConfig(prev => ({ ...prev, creativity: values[0] }))}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Negative Prompt */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Prompt Negativo</Label>
                        <Input
                          placeholder="Elementos a evitar (ex: blurry, distorted, low quality)"
                          value={config.negativePrompt}
                          onChange={(e) => setConfig(prev => ({ ...prev, negativePrompt: e.target.value }))}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>

              {/* Result Panel */}
              <div className="space-y-6">
                <Card className="p-6 bg-card border-border backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <Label className="text-lg font-semibold">Prompt Gerado</Label>
                    </div>
                    
                    <div className="space-y-3">
                      <Textarea
                        value={generatedPrompt}
                        readOnly
                        placeholder="Seu prompt aparecerá aqui..."
                        className="min-h-32 resize-none"
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={copyPrompt}
                          variant="default"
                          size="sm"
                          className="flex-1"
                          disabled={!generatedPrompt}
                        >
                          <Copy className="h-4 w-4" />
                          Copiar
                        </Button>
                        <Button
                          onClick={randomizeConfig}
                          variant="outline"
                          size="sm"
                        >
                          <Shuffle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={generatePrompt}
                    className="flex-1"
                    disabled={isGenerating || (usageInfo && !usageInfo.can_generate)}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Gerar Prompt
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={clearAll}
                    variant="outline"
                    size="sm"
                  >
                    Limpar
                  </Button>
                </div>

                {/* Platform Info */}
                <Card className="p-4 bg-card border-border backdrop-blur-sm">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Plataforma Selecionada</Label>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${AI_MODELS.find(m => m.id === config.aiModel)?.color}`} />
                      <span className="text-sm text-muted-foreground">
                        {AI_MODELS.find(m => m.id === config.aiModel)?.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prompt otimizado para {AI_MODELS.find(m => m.id === config.aiModel)?.name}
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Upgrade Prompt when limit reached */}
            {usageInfo && !usageInfo.can_generate && (
              <UpgradePrompt usageInfo={usageInfo} />
            )}
          </>
        ) : (
          <PromptHistory />
        )}
      </div>
    </div>
  );
};