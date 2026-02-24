# 🐘 Guia PostgreSQL — XYZ Labs PrintStore

## Containers do Projeto

| Serviço  | Nome do Container          | Imagem              | Porta   |
|----------|---------------------------|---------------------|---------|
| backend  | printstore_backend   | Node.js             | 3001    |
| printstore_frontend | printstore_frontend                  | nginx:alpine        | 3000:80 |
| printstore_db       | printstore_db                        | postgres:16-alpine  | 5432    |

## Credenciais da Base de Dados

```
Base de dados : printstore
Utilizador    : printstore
Password      : derpwuant69
Host (Docker) : db
Porta         : 5432
```

---

## 1. Entrar no PostgreSQL

### Comando direto (mais rápido)
```bash
docker exec -it printstore_db psql -U printstore -d printstore
```

### Entrar primeiro na bash e depois no psql
```bash
docker exec -it printstore_db bash
psql -U printstore -d printstore
```

### Sair do psql
```bash
\q
```

---

## 2. Ver Logs dos Containers

```bash
# Logs do backend em tempo real
docker logs -f printstore_backend

# Logs da base de dados em tempo real
docker logs -f printstore_db

# Últimas 50 linhas do backend
docker logs --tail 50 printstore_backend
```

---

## 3. Comandos psql Úteis

```sql
\l              -- listar todas as bases de dados
\c printstore   -- ligar à base de dados printstore
\dt             -- listar todas as tabelas
\d products     -- ver estrutura da tabela products
\d orders       -- ver estrutura da tabela orders
\d users        -- ver estrutura da tabela users
\d categories   -- ver estrutura da tabela categories
\d subcategories
\d order_items
\d materials
\d colors
\du             -- listar utilizadores/roles
\x              -- modo expanded (mais legível em tabelas largas)
\timing         -- mostrar tempo de execução das queries
\q              -- sair
```

---

## 4. Queries Úteis — Tabelas do Projeto

### 👤 UTILIZADORES

```sql
-- Ver todos
SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC;

-- Só admins
SELECT id, name, email FROM users WHERE role = 'admin';

-- Promover a admin
UPDATE users SET role = 'admin' WHERE email = 'email@exemplo.com';

-- Novos nos últimos 30 dias
SELECT id, name, email, created_at FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Apagar utilizador
DELETE FROM users WHERE id = 99;
```

---

### 📦 PRODUTOS

```sql
-- Ver todos os ativos
SELECT id, name, price, stock, is_active FROM products
WHERE is_active = true ORDER BY created_at DESC;

-- Ver todos incluindo inativos
SELECT id, name, price, stock, is_active FROM products ORDER BY id;

-- Ativar / desativar
UPDATE products SET is_active = true  WHERE id = 1;
UPDATE products SET is_active = false WHERE id = 1;

-- Produtos sem imagens
SELECT id, name FROM products WHERE images IS NULL OR images = '{}';

-- Produtos sem stock
SELECT id, name, price FROM products WHERE stock = false AND is_active = true;

-- Contagem por estado
SELECT is_active, COUNT(*) FROM products GROUP BY is_active;
```

---

### 🛒 ENCOMENDAS

```sql
-- Ver todas (mais recentes primeiro)
SELECT id, customer_name, customer_email, status, total_amount, created_at
FROM orders ORDER BY created_at DESC;

-- Por estado
SELECT id, customer_name, status, total_amount FROM orders
WHERE status = 'pending' ORDER BY created_at DESC;

-- De um cliente específico
SELECT id, status, total_amount, created_at FROM orders
WHERE customer_email = 'email@exemplo.com' ORDER BY created_at DESC;

-- Estatísticas gerais
SELECT
  COUNT(*)                                              AS total,
  COUNT(*) FILTER (WHERE status = 'pending')           AS pendentes,
  COUNT(*) FILTER (WHERE status = 'confirmed')         AS confirmadas,
  COUNT(*) FILTER (WHERE status = 'printing')          AS em_impressao,
  COUNT(*) FILTER (WHERE status = 'shipped')           AS enviadas,
  COUNT(*) FILTER (WHERE status = 'delivered')         AS entregues,
  COUNT(*) FILTER (WHERE status = 'cancelled')         AS canceladas,
  COALESCE(SUM(total_amount), 0)                       AS receita_total
FROM orders;

-- Receita do mês atual
SELECT COALESCE(SUM(total_amount), 0) AS receita_mes
FROM orders
WHERE created_at >= date_trunc('month', NOW())
  AND status != 'cancelled';

-- Itens de uma encomenda específica
SELECT oi.id, oi.product_name, oi.quantity, oi.price,
       oi.material_name, oi.color_name
FROM order_items oi
WHERE oi.order_id = 1;

-- Alterar estado manualmente
UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = 1;
```

---

### 🗂️ CATEGORIAS

```sql
-- Ver todas
SELECT id, name, created_at FROM categories ORDER BY name;

-- Subcategorias com nome da categoria pai
SELECT s.id, c.name AS categoria, s.name AS subcategoria
FROM subcategories s
JOIN categories c ON c.id = s.category_id
ORDER BY c.name, s.name;

-- Adicionar as categorias principais da loja
INSERT INTO categories (name) VALUES ('Automóvel');
INSERT INTO categories (name) VALUES ('Casa & Decoração');
INSERT INTO categories (name) VALUES ('Brinquedos & Jogos');
INSERT INTO categories (name) VALUES ('Ferramentas & Bricolage');
INSERT INTO categories (name) VALUES ('Gaming & Tecnologia');
INSERT INTO categories (name) VALUES ('Acessórios & Moda');
INSERT INTO categories (name) VALUES ('Escritório & Estudo');
INSERT INTO categories (name) VALUES ('Jardim & Exterior');

-- Apagar categoria
DELETE FROM categories WHERE id = 99;
```

---

### 🎨 MATERIAIS E CORES

```sql
-- Materiais disponíveis
SELECT id, name FROM materials ORDER BY name;

-- Cores disponíveis
SELECT id, name FROM colors ORDER BY name;
```

---

## 5. Backups e Restauro

```bash
# Fazer backup
docker exec printstore_db pg_dump -U printstore printstore > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i printstore_db psql -U printstore -d printstore < backup_20260224.sql
```

---

## 6. Comandos Docker Úteis

```bash
# Ver todos os containers (a correr e parados)
docker ps -a

# Ver só os que estão a correr
docker ps

# Iniciar projeto completo
docker compose up -d

# Parar projeto completo
docker compose down

# Reiniciar um container específico
docker restart printstore_db
docker restart printstore_backend

# Reconstruir e iniciar (após mudanças no código)
docker compose up -d --build

# Ver uso de espaço
docker system df

# Entrar no container do backend
docker exec -it printstore_backend sh

# Entrar no container da base de dados
docker exec -it printstore_db bash
```

---

## 7. Resolução de Problemas

### Backend não consegue ligar à BD
```bash
# Verificar se o container db está a correr
docker ps | grep printstore_db

# Ver logs de erro do backend
docker logs --tail 100 printstore_backend
```

### "password authentication failed"
```
Utilizador : printstore
Password   : derpwuant69
Base dados : printstore
```

### Site não carrega (porta 3000)
```bash
# Verificar se o nginx está a correr
docker ps | grep printstore_frontend

# Ver logs do nginx
docker logs printstore_frontend
```
