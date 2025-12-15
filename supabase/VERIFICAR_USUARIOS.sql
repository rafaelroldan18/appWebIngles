-- VERIFICACIÓN DE USUARIOS Y AUTH
-- Ejecuta esto en Supabase SQL Editor para diagnosticar el problema

-- 1. Ver todos los usuarios en la tabla users
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    role,
    account_status,
    auth_user_id
FROM users
ORDER BY registration_date DESC
LIMIT 10;

-- 2. Ver usuarios en auth.users (Supabase Auth)
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar si hay usuarios sin auth_user_id vinculado
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    auth_user_id
FROM users
WHERE auth_user_id IS NULL;

-- 4. Verificar si hay usuarios en auth.users sin registro en users
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    u.user_id,
    u.email as user_email
FROM auth.users au
LEFT JOIN users u ON au.id = u.auth_user_id
WHERE u.user_id IS NULL;

-- 5. Ver el conteo total
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM users WHERE auth_user_id IS NOT NULL) as users_with_auth;
