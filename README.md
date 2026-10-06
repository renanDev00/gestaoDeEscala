# 🤖 Gestão de Escala

Aplicação web para organizar escalas de equipes. Reúne em um só lugar o cadastro de funcionários, turnos, setores e atividades, além de relatórios e configurações para apoiar a rotina de planejamento.

## 🎯 O Problema que Resolve

Montar e manter escalas manualmente exige consultar informações espalhadas e aumenta o risco de conflitos, esquecimentos e distribuição desigual de pessoas. O sistema centraliza esses dados para facilitar a organização dos horários e a consulta da cobertura por setor.

## 🚀 Tecnologias Usadas

- React 19 e JavaScript
- Vite 8
- Supabase: autenticação e integração com o banco de dados
- SheetJS (`xlsx`): importação de arquivos de fluxo `.xlsx` e `.xls`
- Lucide React: ícones da interface

## 📸 Screenshots / Demo

A aplicação tem uma interface visual com áreas de funcionários, turnos, atividades, setores, relatórios e configurações. Ainda não há screenshots versionadas neste repositório; execute o projeto localmente para conhecer a interface.

## 🛠️ Como Rodar

1. Instale o [Node.js](https://nodejs.org/) e clone o repositório.
2. Na pasta do projeto, instale as dependências:

   ```bash
   npm install
   ```

3. Crie um projeto no Supabase e configure as variáveis de ambiente em um arquivo `.env` na raiz:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
   ```

4. Configure o banco de dados do Supabase aplicando as migrações disponíveis em `supabase/migrations/`.
5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra no navegador o endereço local informado pelo Vite.

Para validar o código e gerar a versão de produção, use `npm run lint` e `npm run build`.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
