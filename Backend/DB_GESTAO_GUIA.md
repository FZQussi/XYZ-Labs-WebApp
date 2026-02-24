# 🗄️ Guia de Gestão da Base de Dados — XYZ Labs PrintStore

> **Como entrar:** `docker exec -it printstore_db psql -U printstore -d printstore`
> **Como sair:** `\q`

---

## 📋 Índice

1. [👥 Utilizadores](#-utilizadores)
2. [🛒 Encomendas](#-encomendas)
3. [📦 Produtos](#-produtos)
4. [🗂️ Categorias Principais](#️-categorias-principais-primary_categories)
5. [🏷️ Subcategorias](#️-subcategorias-categories)
6. [🔗 Produtos ↔ Categorias](#-produtos--categorias-product_categories)
7. [📁 Ficheiros](#-ficheiros-files)
8. [🔐 Histórico de Logins](#-histórico-de-logins-login_history)
9. [🔑 Tokens de Reset de Password](#-tokens-de-reset-password)
10. [📊 Queries de Diagnóstico](#-queries-de-diagnóstico)

---

## 👥 UTILIZADORES

### 🔍 Consultar

```sql
-- Ver todos os utilizadores
SELECT id, name, email, role, login_count, created_at
FROM users
ORDER BY created_at DESC;

-- Ver só admins
SELECT id, name, email FROM users WHERE role = 'admin';

-- Ver só utilizadores normais
SELECT id, name, email, login_count FROM users WHERE role = 'user';

-- Pesquisar por email (parcial)
SELECT id, name, email, role FROM users
WHERE email ILIKE '%@gmail.com';

-- Ver detalhes completos de um utilizador por ID
SELECT * FROM users WHERE id = 1;

-- Ver último login de cada utilizador
SELECT id, name, email, last_login_at, last_login_city, last_login_country
FROM users
WHERE last_login_at IS NOT NULL
ORDER BY last_login_at DESC;

-- Utilizadores que nunca fizeram login
SELECT id, name, email, created_at FROM users
WHERE last_login_at IS NULL;

-- Utilizadores criados nos últimos 30 dias
SELECT id, name, email, created_at FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Utilizadores com mais logins
SELECT id, name, email, login_count FROM users
ORDER BY login_count DESC LIMIT 10;
```

---

### ✏️ Editar

```sql
-- Promover utilizador a admin
UPDATE users SET role = 'admin' WHERE id = 1;

-- Revogar admin (voltar a user)
UPDATE users SET role = 'user' WHERE id = 1;

-- Alterar nome
UPDATE users SET name = 'Novo Nome' WHERE id = 1;

-- Alterar email
UPDATE users SET email = 'novo@email.com' WHERE id = 1;

-- Atualizar morada completa
UPDATE users
SET address_street  = 'Rua das Flores, 10',
    address_postal  = '4000-123',
    address_city    = 'Porto',
    address_country = 'PT'
WHERE id = 1;
```

---

### ❌ Apagar

```sql
-- Apagar utilizador por ID
-- ATENÇÃO: apaga também o login_history e password_reset_tokens (CASCADE)
-- As encomendas ficam (SET NULL no user_id)
DELETE FROM users WHERE id = 99;

-- Apagar utilizadores sem encomendas e sem login
DELETE FROM users
WHERE id NOT IN (SELECT DISTINCT user_id FROM orders WHERE user_id IS NOT NULL)
  AND last_login_at IS NULL
  AND created_at < NOW() - INTERVAL '1 year';
```

---

## 🛒 ENCOMENDAS

### 🔍 Consultar

```sql
-- Ver todas as encomendas (mais recentes primeiro)
SELECT id, customer_name, customer_email, status, total_amount, created_at
FROM orders
ORDER BY created_at DESC;

-- Ver com paginação (página 1, 20 por página)
SELECT id, customer_name, customer_email, status, total_amount, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- Filtrar por estado
SELECT id, customer_name, status, total_amount, created_at FROM orders
WHERE status = 'pending'     -- pending | confirmed | printing | shipped | delivered | cancelled
ORDER BY created_at DESC;

-- Encomendas de um utilizador específico (por ID)
SELECT id, status, total_amount, tracking_code, created_at FROM orders
WHERE user_id = 1
ORDER BY created_at DESC;

-- Encomendas de um cliente por email (cobre guests)
SELECT id, status, total_amount, created_at FROM orders
WHERE LOWER(customer_email) = LOWER('cliente@email.com')
ORDER BY created_at DESC;

-- Ver encomenda completa com itens
SELECT
  o.id, o.customer_name, o.customer_email, o.status,
  o.total_amount, o.tracking_code, o.tracking_carrier,
  oi.product_name, oi.quantity, oi.price, oi.material_name, oi.color_name
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = 1;

-- Encomendas com tracking em falta (enviadas mas sem código)
SELECT id, customer_name, customer_email, status FROM orders
WHERE status = 'shipped' AND (tracking_code IS NULL OR tracking_code = '');

-- Encomendas deste mês
SELECT id, customer_name, status, total_amount, created_at FROM orders
WHERE created_at >= date_trunc('month', NOW())
ORDER BY created_at DESC;

-- Estatísticas gerais
SELECT
  COUNT(*)                                            AS total_encomendas,
  COUNT(*) FILTER (WHERE status = 'pending')         AS pendentes,
  COUNT(*) FILTER (WHERE status = 'confirmed')       AS confirmadas,
  COUNT(*) FILTER (WHERE status = 'printing')        AS em_impressao,
  COUNT(*) FILTER (WHERE status = 'shipped')         AS enviadas,
  COUNT(*) FILTER (WHERE status = 'delivered')       AS entregues,
  COUNT(*) FILTER (WHERE status = 'cancelled')       AS canceladas,
  COALESCE(SUM(total_amount), 0)                     AS receita_total,
  COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) AS receita_valida
FROM orders;

-- Receita por mês (últimos 6 meses)
SELECT
  to_char(date_trunc('month', created_at), 'YYYY-MM') AS mes,
  COUNT(*)                                             AS encomendas,
  COALESCE(SUM(total_amount), 0)                       AS receita
FROM orders
WHERE status != 'cancelled'
  AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY date_trunc('month', created_at)
ORDER BY mes DESC;
```

---

### ✏️ Editar

```sql
-- Alterar estado de uma encomenda
-- Estados válidos: pending | confirmed | printing | shipped | delivered | cancelled
UPDATE orders
SET status = 'confirmed', updated_at = NOW()
WHERE id = 1;

-- Adicionar tracking
UPDATE orders
SET tracking_code    = 'PT123456789PT',
    tracking_carrier = 'CTT',
    status           = 'shipped',
    updated_at       = NOW()
WHERE id = 1;

-- Remover tracking
UPDATE orders
SET tracking_code = NULL, tracking_carrier = NULL, updated_at = NOW()
WHERE id = 1;

-- Alterar morada de entrega
UPDATE orders
SET address_street  = 'Rua Nova, 5',
    address_postal  = '4100-000',
    address_city    = 'Porto',
    address_country = 'PT',
    updated_at      = NOW()
WHERE id = 1;

-- Cancelar encomenda
UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = 1;
```

---

### ❌ Apagar

```sql
-- Apagar encomenda (apaga também os order_items por CASCADE)
DELETE FROM orders WHERE id = 99;

-- Apagar encomendas canceladas com mais de 1 ano
DELETE FROM orders
WHERE status = 'cancelled'
  AND created_at < NOW() - INTERVAL '1 year';
```

---

## 📦 PRODUTOS

### 🔍 Consultar

```sql
-- Ver todos os produtos ativos
SELECT id, name, price, stock, is_active, primary_category_id, slug
FROM products
WHERE is_active = true
ORDER BY name;

-- Ver todos (incluindo inativos)
SELECT id, name, price, stock, is_active FROM products ORDER BY id;

-- Ver produto completo por ID
SELECT * FROM products WHERE id = 1;

-- Produtos sem stock
SELECT id, name, price FROM products
WHERE stock = false AND is_active = true;

-- Produtos sem imagens
SELECT id, name FROM products
WHERE images IS NULL OR images = '{}';

-- Produtos sem categoria
SELECT id, name FROM products
WHERE primary_category_id IS NULL AND is_active = true;

-- Ver produto com categoria e subcategorias
SELECT
  p.id, p.name, p.price, p.stock, p.is_active,
  pc_main.name AS categoria_principal,
  c.name       AS subcategoria
FROM products p
LEFT JOIN primary_categories pc_main ON pc_main.id = p.primary_category_id
LEFT JOIN product_categories pc ON pc.product_id = p.id
LEFT JOIN categories c ON c.id = pc.category_id
ORDER BY p.id;

-- Contagem por estado
SELECT
  COUNT(*) FILTER (WHERE is_active = true)  AS ativos,
  COUNT(*) FILTER (WHERE is_active = false) AS inativos,
  COUNT(*) FILTER (WHERE stock = true)      AS com_stock,
  COUNT(*) FILTER (WHERE stock = false)     AS sem_stock
FROM products;
```

---

### ✏️ Editar

```sql
-- Ativar produto
UPDATE products SET is_active = true,  updated_at = NOW() WHERE id = 1;

-- Desativar produto
UPDATE products SET is_active = false, updated_at = NOW() WHERE id = 1;

-- Marcar em stock
UPDATE products SET stock = true,  updated_at = NOW() WHERE id = 1;

-- Marcar sem stock
UPDATE products SET stock = false, updated_at = NOW() WHERE id = 1;

-- Alterar preço
UPDATE products SET price = 29.99, updated_at = NOW() WHERE id = 1;

-- Alterar nome e descrição
UPDATE products
SET name        = 'Novo Nome do Produto',
    description = 'Nova descrição do produto.',
    updated_at  = NOW()
WHERE id = 1;

-- Alterar categoria principal
UPDATE products SET primary_category_id = 2, updated_at = NOW() WHERE id = 1;

-- Remover categoria principal
UPDATE products SET primary_category_id = NULL, updated_at = NOW() WHERE id = 1;
```

---

### ❌ Apagar

```sql
-- Apagar produto por ID
-- ATENÇÃO: apaga order_items e product_categories associados (CASCADE)
DELETE FROM products WHERE id = 99;

-- Desativar todos os produtos de uma categoria (em vez de apagar)
UPDATE products
SET is_active = false, updated_at = NOW()
WHERE primary_category_id = 3;
```

---

## 🗂️ CATEGORIAS PRINCIPAIS (`primary_categories`)

> São as categorias de topo da loja: Automóvel, Casa & Decoração, etc.

### 🔍 Consultar

```sql
-- Ver todas
SELECT id, name, slug, is_active, display_order FROM primary_categories
ORDER BY display_order, name;

-- Ver só ativas
SELECT id, name, slug, display_order FROM primary_categories
WHERE is_active = true
ORDER BY display_order;

-- Quantos produtos tem cada categoria
SELECT
  pc.id, pc.name,
  COUNT(p.id) AS total_produtos,
  COUNT(p.id) FILTER (WHERE p.is_active = true) AS produtos_ativos
FROM primary_categories pc
LEFT JOIN products p ON p.primary_category_id = pc.id
GROUP BY pc.id, pc.name
ORDER BY pc.display_order;
```

---

### ➕ Adicionar

```sql
-- Adicionar categoria principal
INSERT INTO primary_categories (name, slug, description, icon, display_order, is_active)
VALUES ('Automóvel',          'automovel',           'Peças e acessórios para automóvel', '🚗', 1,  true);

INSERT INTO primary_categories (name, slug, description, icon, display_order, is_active)
VALUES ('Casa & Decoração',   'casa-decoracao',      'Decoração e organização para casa',  '🏠', 2,  true);

INSERT INTO primary_categories (name, slug, description, icon, display_order, is_active)
VALUES ('Brinquedos & Jogos', 'brinquedos-jogos',    'Figuras, jogos e colecionáveis',     '🧸', 3,  true);

INSERT INTO primary_categories (name, slug, description, icon, display_order, is_active)
VALUES ('Ferramentas',        'ferramentas',         'Suportes, adaptadores e peças',      '🛠️', 4,  true);

INSERT INTO primary_categories (name, slug, description, icon, display_order, is_active)
VALUES ('Gaming & Tecnologia','gaming-tecnologia',   'Suportes e acessórios tech',         '🎮', 5,  true);

INSERT INTO primary_categories (name, slug, description, icon, display_order, is_active)
VALUES ('Acessórios & Moda',  'acessorios-moda',     'Pulseiras, broches e porta-chaves',  '💍', 6,  true);

INSERT INTO primary_categories (name, slug, description, icon, display_order, is_active)
VALUES ('Escritório & Estudo','escritorio-estudo',   'Organizadores e acessórios de mesa', '📚', 7,  true);

INSERT INTO primary_categories (name, slug, description, icon, display_order, is_active)
VALUES ('Jardim & Exterior',  'jardim-exterior',     'Vasos e decoração de exterior',      '🌿', 8,  true);
```

---

### ✏️ Editar

```sql
-- Alterar nome
UPDATE primary_categories SET name = 'Automóvel & Moto', updated_at = NOW() WHERE id = 1;

-- Alterar ícone
UPDATE primary_categories SET icon = '🚗', updated_at = NOW() WHERE id = 1;

-- Alterar ordem de exibição
UPDATE primary_categories SET display_order = 3, updated_at = NOW() WHERE id = 1;

-- Desativar categoria (não aparece na loja)
UPDATE primary_categories SET is_active = false, updated_at = NOW() WHERE id = 1;

-- Ativar categoria
UPDATE primary_categories SET is_active = true, updated_at = NOW() WHERE id = 1;
```

---

### ❌ Apagar

```sql
-- Apagar categoria (produtos ficam sem categoria — SET NULL)
DELETE FROM primary_categories WHERE id = 99;
```

---

## 🏷️ SUBCATEGORIAS (`categories`)

> São subcategorias associadas a produtos (ex: "Suportes de Telemóvel" dentro de "Automóvel").

### 🔍 Consultar

```sql
-- Ver todas com o número de produtos
SELECT
  c.id, c.name, c.slug, c.level, c.category_role, c.is_active,
  COUNT(pc.product_id) AS total_produtos
FROM categories c
LEFT JOIN product_categories pc ON pc.category_id = c.id
GROUP BY c.id
ORDER BY c.level, c.name;

-- Ver subcategorias de uma categoria pai
SELECT id, name, slug FROM categories
WHERE parent_id = 1
ORDER BY display_order, name;

-- Ver só as ativas
SELECT id, name, slug, display_order FROM categories
WHERE is_active = true
ORDER BY display_order, name;
```

---

### ➕ Adicionar

```sql
-- Adicionar subcategoria simples
INSERT INTO categories (name, slug, level, is_active, category_role)
VALUES ('Suportes de Telemóvel', 'suportes-telemovel', 1, true, 'secondary');

-- Adicionar subcategoria com categoria pai (parent_id)
INSERT INTO categories (name, slug, parent_id, level, display_order, is_active, category_role)
VALUES ('Suportes GPS', 'suportes-gps', 1, 2, 1, true, 'secondary');
-- (parent_id = 1 refere-se a outra categoria em categories, NÃO em primary_categories)
```

---

### ✏️ Editar

```sql
-- Alterar nome
UPDATE categories SET name = 'Novo Nome', updated_at = NOW() WHERE id = 1;

-- Desativar subcategoria
UPDATE categories SET is_active = false, updated_at = NOW() WHERE id = 1;

-- Ativar subcategoria
UPDATE categories SET is_active = true,  updated_at = NOW() WHERE id = 1;

-- Alterar ordem de exibição
UPDATE categories SET display_order = 5, updated_at = NOW() WHERE id = 1;
```

---

### ❌ Apagar

```sql
-- Apagar subcategoria (remove também as ligações em product_categories — CASCADE)
DELETE FROM categories WHERE id = 99;
```

---

## 🔗 PRODUTOS ↔ CATEGORIAS (`product_categories`)

> Liga produtos a subcategorias. Um produto pode ter várias subcategorias.

### 🔍 Consultar

```sql
-- Ver todas as categorias de um produto
SELECT c.name AS subcategoria, pc.is_primary, pc.display_order
FROM product_categories pc
JOIN categories c ON c.id = pc.category_id
WHERE pc.product_id = 1;

-- Ver todos os produtos de uma subcategoria
SELECT p.id, p.name, p.price, p.is_active
FROM product_categories pc
JOIN products p ON p.id = pc.product_id
WHERE pc.category_id = 5
ORDER BY p.name;
```

---

### ➕ Adicionar / ❌ Remover

```sql
-- Associar produto a subcategoria
INSERT INTO product_categories (product_id, category_id, is_primary, display_order)
VALUES (1, 5, false, 0);

-- Associar como subcategoria primária
INSERT INTO product_categories (product_id, category_id, is_primary, display_order)
VALUES (1, 5, true, 0);

-- Remover associação produto ↔ subcategoria
DELETE FROM product_categories
WHERE product_id = 1 AND category_id = 5;

-- Remover todas as subcategorias de um produto
DELETE FROM product_categories WHERE product_id = 1;
```

---

## 📁 FICHEIROS (`files`)

### 🔍 Consultar

```sql
-- Ver todos os ficheiros
SELECT id, product_id, filename, file_type, uploaded_at
FROM files
ORDER BY uploaded_at DESC;

-- Ficheiros de um produto específico
SELECT id, filename, file_type, file_path, uploaded_at
FROM files WHERE product_id = 1;

-- Ficheiros 3D (modelos)
SELECT id, product_id, filename, file_path FROM files
WHERE file_type IN ('stl', 'obj', '3mf');

-- Ficheiros órfãos (produto foi apagado)
SELECT id, filename, file_type, uploaded_at FROM files
WHERE product_id IS NULL;
```

---

### ❌ Apagar

```sql
-- Apagar ficheiro por ID
DELETE FROM files WHERE id = 99;

-- Apagar todos os ficheiros de um produto
DELETE FROM files WHERE product_id = 1;

-- Apagar ficheiros órfãos
DELETE FROM files WHERE product_id IS NULL;
```

---

## 🔐 HISTÓRICO DE LOGINS (`login_history`)

### 🔍 Consultar

```sql
-- Ver últimos logins (todos os utilizadores)
SELECT
  lh.id, u.name, u.email,
  lh.ip, lh.city, lh.country, lh.logged_at
FROM login_history lh
JOIN users u ON u.id = lh.user_id
ORDER BY lh.logged_at DESC
LIMIT 50;

-- Histórico de um utilizador específico
SELECT ip, city, country, logged_at FROM login_history
WHERE user_id = 1
ORDER BY logged_at DESC;

-- Logins dos últimos 7 dias
SELECT
  u.name, u.email, lh.ip, lh.city, lh.country, lh.logged_at
FROM login_history lh
JOIN users u ON u.id = lh.user_id
WHERE lh.logged_at > NOW() - INTERVAL '7 days'
ORDER BY lh.logged_at DESC;

-- IPs repetidos (possível atividade suspeita)
SELECT ip, COUNT(*) AS total, MAX(logged_at) AS ultimo_login
FROM login_history
GROUP BY ip
HAVING COUNT(*) > 10
ORDER BY total DESC;
```

---

### ❌ Apagar

```sql
-- Limpar histórico antigo (mais de 1 ano)
DELETE FROM login_history WHERE logged_at < NOW() - INTERVAL '1 year';

-- Limpar histórico de um utilizador
DELETE FROM login_history WHERE user_id = 1;
```

---

## 🔑 TOKENS DE RESET DE PASSWORD

### 🔍 Consultar

```sql
-- Ver tokens ativos (não expirados)
SELECT prt.id, u.name, u.email, prt.expires, prt.created_at
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.expires > NOW()
ORDER BY prt.created_at DESC;

-- Ver tokens expirados
SELECT prt.id, u.email, prt.expires FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.expires < NOW();
```

---

### ❌ Apagar

```sql
-- Limpar tokens expirados
DELETE FROM password_reset_tokens WHERE expires < NOW();

-- Revogar todos os tokens de um utilizador (obriga novo pedido)
DELETE FROM password_reset_tokens WHERE user_id = 1;
```

---

## 📊 QUERIES DE DIAGNÓSTICO

```sql
-- Resumo geral da base de dados
SELECT
  (SELECT COUNT(*) FROM users)                                  AS utilizadores,
  (SELECT COUNT(*) FROM users WHERE role = 'admin')            AS admins,
  (SELECT COUNT(*) FROM products WHERE is_active = true)       AS produtos_ativos,
  (SELECT COUNT(*) FROM orders)                                 AS encomendas_total,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending')       AS encomendas_pendentes,
  (SELECT COALESCE(SUM(total_amount),0) FROM orders
   WHERE status != 'cancelled')                                 AS receita_total,
  (SELECT COUNT(*) FROM primary_categories WHERE is_active = true) AS categorias_ativas;

-- Top 10 clientes por valor gasto
SELECT
  customer_name, customer_email,
  COUNT(*)                     AS encomendas,
  SUM(total_amount)            AS total_gasto
FROM orders
WHERE status NOT IN ('cancelled')
GROUP BY customer_name, customer_email
ORDER BY total_gasto DESC
LIMIT 10;

-- Produtos mais encomendados
SELECT
  oi.product_name,
  COUNT(DISTINCT oi.order_id) AS encomendas,
  SUM(oi.quantity)            AS unidades_vendidas
FROM order_items oi
GROUP BY oi.product_name
ORDER BY unidades_vendidas DESC
LIMIT 10;

-- Verificar integridade: encomendas sem itens
SELECT o.id, o.customer_name, o.created_at FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
);

-- Verificar produtos sem categoria
SELECT id, name FROM products
WHERE primary_category_id IS NULL AND is_active = true;
```

---

> 💡 **Dica:** Usa `\x` antes de qualquer query para ver os resultados em modo vertical (mais legível para linhas com muitas colunas). Usa `\x` novamente para desativar.
