-- Migration: Adicionar políticas RLS de segurança para user_limits
-- Objetivo: Bloquear manipulação direta de limites de uso por usuários

-- Política para bloquear INSERT direto por usuários
-- Apenas funções SECURITY DEFINER podem inserir
CREATE POLICY "user_limits_insert_blocked"
ON public.user_limits
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Política para bloquear UPDATE direto por usuários
-- Apenas funções SECURITY DEFINER podem atualizar
CREATE POLICY "user_limits_update_blocked"
ON public.user_limits
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Política para bloquear DELETE por usuários
-- Histórico de uso não deve ser deletado
CREATE POLICY "user_limits_delete_blocked"
ON public.user_limits
FOR DELETE
TO authenticated
USING (false);

-- Comentários para documentação
COMMENT ON POLICY "user_limits_insert_blocked" ON public.user_limits IS 
'Bloqueia INSERT direto. Apenas funções SECURITY DEFINER (check_user_limit, increment_user_usage) podem inserir registros.';

COMMENT ON POLICY "user_limits_update_blocked" ON public.user_limits IS 
'Bloqueia UPDATE direto. Apenas função increment_user_usage() pode atualizar contadores.';

COMMENT ON POLICY "user_limits_delete_blocked" ON public.user_limits IS 
'Bloqueia DELETE por usuários. Registros históricos devem ser preservados.';