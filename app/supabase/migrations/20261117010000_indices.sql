-- Índices para las claves foráneas compuestas (aviso de rendimiento de Supabase). Con muchos cierres y fiados,
-- borrar o corregir un cierre/cliente no recorre toda la tabla.
create index if not exists close_expenses_cierre on public.close_expenses (close_id, business_id);
create index if not exists close_sales_cierre on public.close_sales (close_id, business_id);
create index if not exists close_sales_producto on public.close_sales (product_id, business_id);
create index if not exists credit_movements_cliente on public.credit_movements (customer_id, business_id);
create index if not exists price_changes_producto on public.price_changes (product_id, business_id);
create index if not exists product_sale_days_producto on public.product_sale_days (product_id, business_id);
