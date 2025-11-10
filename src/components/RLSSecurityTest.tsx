import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}

interface TestResponse {
  success: boolean;
  summary?: {
    total: number;
    passed: number;
    failed: number;
    allTestsPassed: boolean;
  };
  results?: TestResult[];
  error?: string;
}

export const RLSSecurityTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResponse | null>(null);

  const runSecurityTests = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar autenticado para executar os testes');
        setTesting(false);
        return;
      }

      const response = await supabase.functions.invoke('test-rls-policies', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      setTestResults(response.data);
      
      if (response.data.summary?.allTestsPassed) {
        toast.success('Todos os testes de segurança passaram! ✅');
      } else {
        toast.warning('Alguns testes falharam. Verifique os resultados.');
      }
    } catch (error) {
      console.error('Erro ao executar testes:', error);
      toast.error('Erro ao executar testes de segurança');
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Testes de Segurança RLS</h3>
          </div>
          <Button
            onClick={runSecurityTests}
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Executar Testes
              </>
            )}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Valida que as políticas RLS da tabela user_limits estão funcionando corretamente,
          bloqueando manipulação direta e permitindo apenas acesso via funções autorizadas.
        </p>

        {testResults && (
          <div className="space-y-4 mt-6">
            {testResults.summary && (
              <Card className={`p-4 ${testResults.summary.allTestsPassed ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testResults.summary.allTestsPassed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-medium">
                      {testResults.summary.allTestsPassed ? 'Todos os testes passaram' : 'Alguns testes falharam'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      ✓ {testResults.summary.passed}
                    </Badge>
                    {testResults.summary.failed > 0 && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        ✗ {testResults.summary.failed}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {testResults.results && (
              <div className="space-y-2">
                {testResults.results.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {result.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{result.test}</p>
                          <Badge 
                            variant="outline" 
                            className={result.passed ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}
                          >
                            {result.passed ? 'Passou' : 'Falhou'}
                          </Badge>
                        </div>
                        {result.error && (
                          <p className="text-sm text-muted-foreground">
                            {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {testResults.error && (
              <Card className="p-4 bg-red-500/10 border-red-500/20">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-600">Erro ao executar testes</p>
                    <p className="text-sm text-red-600/80 mt-1">{testResults.error}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
