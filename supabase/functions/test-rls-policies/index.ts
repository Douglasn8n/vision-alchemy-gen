import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Cliente com service role para setup
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Cliente autenticado como usuário para testes
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Obter o user_id do token
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const results: TestResult[] = [];

    // Test 1: SELECT próprios dados (deve passar)
    try {
      const { data, error } = await userClient
        .from('user_limits')
        .select('*')
        .eq('user_id', user.id);

      results.push({
        test: 'SELECT próprios dados',
        passed: !error,
        error: error?.message,
      });
    } catch (e) {
      results.push({
        test: 'SELECT próprios dados',
        passed: false,
        error: e.message,
      });
    }

    // Test 2: INSERT direto (deve falhar)
    try {
      const { error } = await userClient
        .from('user_limits')
        .insert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          usage_count: 999,
        });

      // Se não houver erro, o teste falhou (deveria bloquear)
      results.push({
        test: 'INSERT direto (deve ser bloqueado)',
        passed: !!error && error.code === 'PGRST301',
        error: error ? `Bloqueado corretamente: ${error.message}` : 'FALHOU: INSERT foi permitido',
      });
    } catch (e) {
      results.push({
        test: 'INSERT direto (deve ser bloqueado)',
        passed: true,
        error: `Bloqueado corretamente: ${e.message}`,
      });
    }

    // Criar um registro de teste usando service role para os próximos testes
    const testDate = '2025-01-01';
    await serviceClient
      .from('user_limits')
      .delete()
      .eq('user_id', user.id)
      .eq('date', testDate);

    const { data: testRecord } = await serviceClient
      .from('user_limits')
      .insert({
        user_id: user.id,
        date: testDate,
        usage_count: 5,
      })
      .select()
      .single();

    // Test 3: UPDATE direto (deve falhar)
    try {
      const { error } = await userClient
        .from('user_limits')
        .update({ usage_count: 999 })
        .eq('user_id', user.id)
        .eq('date', testDate);

      results.push({
        test: 'UPDATE direto (deve ser bloqueado)',
        passed: !!error && error.code === 'PGRST301',
        error: error ? `Bloqueado corretamente: ${error.message}` : 'FALHOU: UPDATE foi permitido',
      });
    } catch (e) {
      results.push({
        test: 'UPDATE direto (deve ser bloqueado)',
        passed: true,
        error: `Bloqueado corretamente: ${e.message}`,
      });
    }

    // Test 4: DELETE direto (deve falhar)
    try {
      const { error } = await userClient
        .from('user_limits')
        .delete()
        .eq('user_id', user.id)
        .eq('date', testDate);

      results.push({
        test: 'DELETE direto (deve ser bloqueado)',
        passed: !!error && error.code === 'PGRST301',
        error: error ? `Bloqueado corretamente: ${error.message}` : 'FALHOU: DELETE foi permitido',
      });
    } catch (e) {
      results.push({
        test: 'DELETE direto (deve ser bloqueado)',
        passed: true,
        error: `Bloqueado corretamente: ${e.message}`,
      });
    }

    // Test 5: Verificar que funções SECURITY DEFINER funcionam
    try {
      const { data: limitInfo, error } = await userClient.rpc('check_user_limit', {
        p_user_id: user.id,
      });

      results.push({
        test: 'SECURITY DEFINER function check_user_limit',
        passed: !error && !!limitInfo,
        error: error?.message,
      });
    } catch (e) {
      results.push({
        test: 'SECURITY DEFINER function check_user_limit',
        passed: false,
        error: e.message,
      });
    }

    // Test 6: Incrementar uso via função (deve funcionar)
    try {
      const { data: newCount, error } = await userClient.rpc('increment_user_usage', {
        p_user_id: user.id,
      });

      results.push({
        test: 'SECURITY DEFINER function increment_user_usage',
        passed: !error && typeof newCount === 'number',
        error: error?.message,
      });
    } catch (e) {
      results.push({
        test: 'SECURITY DEFINER function increment_user_usage',
        passed: false,
        error: e.message,
      });
    }

    // Limpar registro de teste
    await serviceClient
      .from('user_limits')
      .delete()
      .eq('user_id', user.id)
      .eq('date', testDate);

    const allPassed = results.every(r => r.passed);
    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      allTestsPassed: allPassed,
    };

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro nos testes:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
