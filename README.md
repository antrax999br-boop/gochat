# Vitta Chatbot Manager & Schumacher Tecnologia

Este repositório contém o sistema completo de gestão de chatbot e painel administrativo.

## Estrutura do Projeto

- **/ (Raiz):** Frontend desenvolvido em React + Vite + Tailwind CSS.
- **/server:** Backend Node.js para integração com a API do WhatsApp (Baileys).

## Como Rodar Localmente

1. **Instalar dependências:**
   Na raiz do projeto (`gochat`), execute:
   ```bash
   npm install
   cd server
   npm install
   ```

2. **Configuração:**
   - O frontend usa **Supabase** para autenticação e banco de dados (já configurado em `lib/supabase.ts`).
   - O backend rodará na porta `3001` para gerenciar a conexão do WhatsApp.

3. **Iniciar o sistema:**
   Na pasta raiz (`vitta-chatbot-manager`), você pode usar o comando que automatiza tudo:
   ```bash
   npm run dev
   ```
   Ou manualmente na pasta `gochat`:
   - Frontend: `npm run dev`
   - Backend: `node server/index.js`

## Hospedagem (Deployment)

### 1. Frontend (O Site)
Pode ser hospedado em plataformas estáticas:
- **Vercel** ou **Netlify**: Conecte este repositório do GitHub. A "Root Directory" deve ser a pasta onde está o `package.json` principal.

### 2. Backend (Servidor WhatsApp)
Como o servidor precisa manter uma conexão ativa e salvar arquivos de sessão, ele **não** pode ser hospedado em locais estáticos.
Recomendações:
- **Render.com** (Web Service)
- **Railway.app**
- **VPS (DigitalOcean / AWS)**
- **Importante:** Você precisará configurar uma variável de ambiente ou volume persistente para a pasta `auth_info_baileys` se quiser que o WhatsApp não desconecte ao reiniciar o servidor.

## Tecnologias Utilizadas
- React 19
- Vite
- Tailwind CSS
- Supabase (Auth & DB)
- Socket.io (Comunicação em tempo real com o WhatsApp)
- Baileys (API de WhatsApp)
