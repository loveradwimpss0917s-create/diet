-- トリガー専用関数はAPI経由(RPC)で直接呼び出せる必要がないため、
-- anon/authenticatedロールからのEXECUTE権限を剥奪する。
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.refresh_daily_summary() from anon, authenticated;
