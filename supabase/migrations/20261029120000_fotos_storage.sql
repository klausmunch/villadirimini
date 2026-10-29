-- Fotos enviadas pelo painel passam a ir para o Supabase Storage (arquivos de verdade)
-- em vez de texto base64 dentro de site_fotos.url.

-- 1) Bucket público "fotos": qualquer visitante lê; só administradores enviam/apagam.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admin envia fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and private.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admin altera fotos" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and private.has_role(auth.uid(), 'admin'::public.app_role))
  with check (bucket_id = 'fotos' and private.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admin apaga fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and private.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) As fotos já existentes foram salvas como arquivos no repositório
--    (src/assets/fotos, lista em src/lib/fotos-padrao.ts). A linha passa a apontar
--    para lá, e a busca deixa de baixar ~3 MB de texto.
update public.site_fotos
set url = 'static:' || id
where url like 'data:%'
  and id in (
    '45857b50-aad2-49f4-8cb1-4193a82f4086', '0c04d779-540c-4f80-a654-c6e723524127',
    '58b83ce0-06d1-440c-b6e0-e0099df33fdb', 'a47807ba-a9df-48b4-bbee-223722de2bf5',
    'dfc0a056-e7b8-4153-a767-efc2334c8139', '585c5311-ef63-4ad5-a6e9-c9e8113eef5f',
    '4b687c10-b72d-4769-9730-eb8046764f7e', 'be37553b-5c02-4b84-ad85-62d2e88a6580',
    'c01e71b1-9d7f-4224-8374-2090239cdba8', 'aef2e12a-19cb-4997-82d4-8224d3eba236',
    '627b8830-625c-426e-97cc-1460ed527723'
  );

-- 3) O site não usa formulário de pré-reserva (as reservas vão para o motor do H System).
drop table if exists public.pre_reservas;
