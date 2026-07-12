-- Postgresは関数作成時に暗黙のPUBLICロールへEXECUTE権限を付与するため、
-- anon/authenticatedへの明示的なrevokeだけでは不十分だった。PUBLICからも剥奪する。
-- トリガーとしての実行は権限チェックの対象外のため、動作に影響しない。
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.refresh_daily_summary() from public;
