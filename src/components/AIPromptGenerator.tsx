import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Copy, Sparkles, Shuffle, Zap, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

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
  { id: 'midjourney', name: 'Midjourney', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'leonardo', name: 'Leonardo.ai', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  { id: 'veo3', name: 'Veo 3', color: 'bg-gradient-to-r from-green-500 to-teal-500' },
  { id: 'chatgpt', name: 'ChatGPT (DALL-E 3)', color: 'bg-gradient-to-r from-emerald-500 to-blue-500' },
  { id: 'gemini', name: 'Gemini (Imagen 3)', color: 'bg-gradient-to-r from-orange-500 to-red-500' }
];

export const AIPromptGenerator: React.FC<AIPromptGeneratorProps> = () => {
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

  const generatePrompt = () => {
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

  const copyPrompt = async () => {
    if (!generatedPrompt) return;
    
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast.success('Prompt copiado!');
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

  useEffect(() => {
    generatePrompt();
  }, [config]);

  const OptionGrid = ({ 
    options, 
    selected, 
    onSelect, 
    title 
  }: { 
    options: string[]; 
    selected: string; 
    onSelect: (value: string) => void; 
    title: string;
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">{title}</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={selected === option ? "gradient" : "outline"}
            size="sm"
            onClick={() => onSelect(option)}
            className="h-auto py-2 px-3 text-xs"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-primary">
              <Wand2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-ai-purple to-ai-blue bg-clip-text text-transparent">
              Gerador de Prompts IA
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crie prompts otimizados para diferentes plataformas de IA de forma intuitiva e profissional
          </p>
        </div>

        {/* AI Model Selection */}
        <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm">
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Selecione a Plataforma de IA</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {AI_MODELS.map((model) => (
                <Button
                  key={model.id}
                  variant={config.aiModel === model.id ? "ai" : "outline"}
                  onClick={() => setConfig(prev => ({ ...prev, aiModel: model.id as AIModel }))}
                  className="h-16 flex-col gap-1"
                >
                  <div className={`w-4 h-4 rounded-full ${model.color}`} />
                  <span className="text-xs">{model.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm">
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
                    <OptionGrid
                      options={SUBJECTS}
                      selected={config.subject}
                      onSelect={(value) => setConfig(prev => ({ ...prev, subject: value }))}
                      title="Categoria"
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
                  <OptionGrid
                    options={STYLES}
                    selected={config.style}
                    onSelect={(value) => setConfig(prev => ({ ...prev, style: value }))}
                    title="Estilo Artístico"
                  />

                  {/* Composition */}
                  <OptionGrid
                    options={COMPOSITIONS}
                    selected={config.composition}
                    onSelect={(value) => setConfig(prev => ({ ...prev, composition: value }))}
                    title="Composição e Enquadramento"
                  />

                  {/* Mood */}
                  <OptionGrid
                    options={MOODS}
                    selected={config.mood}
                    onSelect={(value) => setConfig(prev => ({ ...prev, mood: value }))}
                    title="Humor/Tom"
                  />

                  {/* Quality */}
                  <OptionGrid
                    options={QUALITIES}
                    selected={config.quality}
                    onSelect={(value) => setConfig(prev => ({ ...prev, quality: value }))}
                    title="Qualidade"
                  />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  {/* Artists */}
                  <OptionGrid
                    options={ARTISTS}
                    selected={config.artist}
                    onSelect={(value) => setConfig(prev => ({ ...prev, artist: value }))}
                    title="Artista de Referência"
                  />

                  {/* Lighting */}
                  <OptionGrid
                    options={LIGHTINGS}
                    selected={config.lighting}
                    onSelect={(value) => setConfig(prev => ({ ...prev, lighting: value }))}
                    title="Iluminação"
                  />

                  {/* Cameras */}
                  <OptionGrid
                    options={CAMERAS}
                    selected={config.camera}
                    onSelect={(value) => setConfig(prev => ({ ...prev, camera: value }))}
                    title="Câmera Profissional"
                  />

                  {/* Aspect Ratio */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Proporção da Imagem</Label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <Button
                          key={ratio}
                          variant={config.aspectRatio === ratio ? "gradient" : "outline"}
                          size="sm"
                          onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                        >
                          {ratio}
                        </Button>
                      ))}
                    </div>
                  </div>

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
            <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-ai-purple" />
                  <Label className="text-lg font-semibold">Prompt Gerado</Label>
                </div>
                
                <div className="space-y-3">
                  <Textarea
                    value={generatedPrompt}
                    readOnly
                    placeholder="Seu prompt aparecerá aqui..."
                    className="min-h-32 resize-none bg-background/50 border-border/50"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={copyPrompt}
                      variant="gradient"
                      size="sm"
                      className="flex-1"
                      disabled={!generatedPrompt}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </Button>
                    <Button
                      onClick={randomizeConfig}
                      variant="ai"
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
                variant="glow"
                className="flex-1"
              >
                <Zap className="h-4 w-4" />
                Gerar Prompt
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
            <Card className="p-4 bg-gradient-card border-border/50 backdrop-blur-sm">
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
      </div>
    </div>
  );
};