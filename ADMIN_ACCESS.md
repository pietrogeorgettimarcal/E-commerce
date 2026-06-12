# 🔐 Acesso à Área de Admin

## Para Administradores

### Como acessar a tela de admin:

1. **Abra o navegador**
2. **Vá para a URL do admin:**
   ```
   http://localhost:5173/#/admin
   ```
   ou se estiver em produção:
   ```
   https://seu-dominio.com/#/admin
   ```

3. **Uma tela de login aparecerá**
   - Digite o código secreto: `bijuteria2024`
   - Clique em "Confirmar"

4. ✅ **Você está dentro do painel de admin!**

---

## 📝 O que você pode fazer:

### Aba de Produtos:
- ➕ Adicionar novos produtos
- ✏️ Editar produtos existentes
- 🗑️ Deletar produtos
- 👁️ Controlar visibilidade no catálogo

**Campos disponíveis para cada produto:**
- Nome
- Descrição
- Preço
- Categoria
- Tamanhos/Medidas
- Fotos (upload ou URL)
- Estoque
- **Peso** ⭐
- **Tipo de Produto** ⭐
- **Formato** ⭐
- **Material Utilizado** ⭐

### Aba de Pedidos:
- 📋 Ver todos os pedidos
- 📊 Atualizar status do pedido
- 👥 Ver informações do cliente

---

## 🛡️ Segurança

- **Tela pública**: Sem nenhum acesso administrativo
- **Tela de admin**: Protegida por código secreto
- **Nenhum botão visível**: Usuários públicos não veem opções de admin
- **Dados em tempo real**: Produtos atualizados imediatamente na loja

---

## 🔑 Código Secreto

**Padrão:** `bijuteria2024`

⚠️ **Importante:** Altere este código em produção para sua própria senha!

---

## ⚡ Dicas

- A página de admin é completamente separada da loja
- Não há botões ou links visíveis para o público
- Use a URL `#/admin` para acessar
- Se digitar o código errado, pode tentar novamente
