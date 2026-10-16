-- ThisOrThat (ToT) – Şema doğrulama testleri
-- schema.sql çalıştırıldıktan sonra SQL Editor'de çalıştır.
-- Başarılıysa sonuç: "Tüm testler geçti ✅". Hata olursa hangi testin düştüğü mesajda yazar.
-- Testler kendi oluşturduğu verileri sonunda siler.

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  v_poll uuid;
  v_poll_b uuid;
  v_opt1 uuid;
  v_opt2 uuid;
  v_opt_b uuid;
  v_n int;
  v_failed boolean;
begin
  -- Hazırlık: iki test kullanıcısı (trigger profil açmalı)
  insert into auth.users (id, email, raw_user_meta_data) values
    (a, 'tot_test_a@example.com', '{"username":"Test_A"}'),
    (b, 'tot_test_b@example.com', '{"username":"test_b"}');

  select count(*) into v_n from public.profiles where id in (a, b);
  assert v_n = 2, 'T1: trigger profil oluşturmadı';

  -- T2: kullanıcı adı büyük/küçük harf duyarsız benzersiz
  v_failed := false;
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (gen_random_uuid(), 'tot_test_c@example.com', '{"username":"TEST_A"}');
  exception when others then v_failed := true;
  end;
  assert v_failed, 'T2: aynı kullanıcı adı (farklı harf) kabul edildi';

  -- T3: geçersiz kullanıcı adı reddedilir
  v_failed := false;
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (gen_random_uuid(), 'tot_test_d@example.com', '{"username":"a b"}');
  exception when others then v_failed := true;
  end;
  assert v_failed, 'T3: geçersiz kullanıcı adı kabul edildi';

  -- ---------- A olarak giriş ----------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  -- T4: create_poll 2 seçenekle çalışır
  v_poll := public.create_poll('Sinema mı restoran mı?',
    '[{"text":"Sinema","image_url":null},{"text":"Restoran","image_url":null}]');
  select count(*) into v_n from public.options where poll_id = v_poll;
  assert v_n = 2, 'T4: seçenekler oluşmadı';
  select id into v_opt1 from public.options where poll_id = v_poll and position = 1;
  select id into v_opt2 from public.options where poll_id = v_poll and position = 2;

  -- T5: 1 seçenek reddedilir
  v_failed := false;
  begin
    perform public.create_poll('Tek seçenek?', '[{"text":"X"}]');
  exception when others then v_failed := true;
  end;
  assert v_failed, 'T5: 1 seçenekli anket kabul edildi';

  -- T6: 6 seçenek reddedilir
  v_failed := false;
  begin
    perform public.create_poll('Altı seçenek?',
      '[{"text":"1"},{"text":"2"},{"text":"3"},{"text":"4"},{"text":"5"},{"text":"6"}]');
  exception when others then v_failed := true;
  end;
  assert v_failed, 'T6: 6 seçenekli anket kabul edildi';

  -- T7: sahibi kendi anketine oy verebilir
  insert into public.votes (poll_id, option_id, user_id) values (v_poll, v_opt1, a);

  -- T8: ikinci oy reddedilir (oy değiştirilemez)
  v_failed := false;
  begin
    insert into public.votes (poll_id, option_id, user_id) values (v_poll, v_opt2, a);
  exception when unique_violation then v_failed := true;
  end;
  assert v_failed, 'T8: ikinci oy kabul edildi';

  -- T9: başkası adına oy verilemez (RLS)
  v_failed := false;
  begin
    insert into public.votes (poll_id, option_id, user_id) values (v_poll, v_opt2, b);
  exception when others then v_failed := true;
  end;
  assert v_failed, 'T9: başkası adına oy kabul edildi';

  -- ---------- B olarak giriş ----------
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);

  v_poll_b := public.create_poll('Çay mı kahve mi?', '[{"text":"Çay"},{"text":"Kahve"}]');
  select id into v_opt_b from public.options where poll_id = v_poll_b and position = 1;

  -- T10: başka ankete ait seçenekle oy verilemez
  v_failed := false;
  begin
    insert into public.votes (poll_id, option_id, user_id) values (v_poll, v_opt_b, b);
  exception when others then v_failed := true;
  end;
  assert v_failed, 'T10: yanlış ankete ait seçenekle oy kabul edildi';

  -- T11: B oy verir ve sadece KENDİ oyunu görür
  insert into public.votes (poll_id, option_id, user_id) values (v_poll, v_opt2, b);
  select count(*) into v_n from public.votes where poll_id = v_poll;
  assert v_n = 1, 'T11: kullanıcı başkalarının oylarını görebiliyor';

  -- T12: view toplamları doğru (A:1 Sinema, B:1 Restoran)
  select coalesce(sum(vote_count), 0) into v_n from public.option_vote_counts where poll_id = v_poll;
  assert v_n = 2, 'T12: option_vote_counts toplamı yanlış';

  -- T13: B, A'nın anketini silemez
  delete from public.polls where id = v_poll;
  get diagnostics v_n = row_count;
  assert v_n = 0, 'T13: başkasının anketi silindi';

  -- T14: B, A'nın anketine seçenek ekleyemez
  v_failed := false;
  begin
    insert into public.options (poll_id, text, position) values (v_poll, 'Hack', 3);
  exception when others then v_failed := true;
  end;
  assert v_failed, 'T14: başkasının anketine seçenek eklendi';

  -- ---------- Giriş yapmamış (anon) ----------
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);

  -- T15: anon feed'i ve oy toplamlarını görebilir
  select count(*) into v_n from public.polls where id = v_poll;
  assert v_n = 1, 'T15: anon anketleri göremiyor';
  select count(*) into v_n from public.option_vote_counts where poll_id = v_poll;
  assert v_n = 2, 'T15: anon oy toplamlarını göremiyor';

  -- T16: anon anket oluşturamaz
  v_failed := false;
  begin
    perform public.create_poll('Anon anket?', '[{"text":"A"},{"text":"B"}]');
  exception when others then v_failed := true;
  end;
  assert v_failed, 'T16: anon anket oluşturabildi';

  -- ---------- A olarak tekrar giriş: kendi anketini siler ----------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  delete from public.polls where id = v_poll;
  get diagnostics v_n = row_count;
  assert v_n = 1, 'T17: sahibi kendi anketini silemedi';
  select count(*) into v_n from public.options where poll_id = v_poll;
  assert v_n = 0, 'T17: seçenekler cascade ile silinmedi';

  -- ---------- Temizlik ----------
  reset role;
  delete from auth.users where id in (a, b);
end $$;

select 'Tüm testler geçti ✅' as sonuc;
