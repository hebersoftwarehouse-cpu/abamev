# ABAMEV

Site institucional da Academia Baiana de Medicina Veterinária. React 19, TypeScript, React Router e Vite, com páginas geradas no build e hospedagem inteiramente estática.

## Executar

Requer Node.js 24 e npm.

```sh
npm ci
npm run dev
```

Para conferir a entrega estática, incluindo endereços antigos e respostas 404:

```sh
npm run build
npm run preview
```

O endereço padrão da prévia é http://127.0.0.1:4173.

## Acrescentar uma publicação

Edite `content/publications.json` e acrescente um objeto com o mesmo formato dos existentes. O corpo usa Markdown; tabelas seguem o formato GitHub. Exemplo mínimo completo em `docs/publication-example.json`. Copie imagens para `public/media/` e documentos para `public/documents/`.

Use um `id` estável e exclusivo, um `slug` sem acentos e um `path` como `/publicacoes/meu-artigo`. A data deve refletir a publicação real, com fuso explícito. Para conteúdo novo, preencha `author` com o autor real. Não invente datas para materiais históricos.

Após salvar, `npm run build` atualiza automaticamente a rota, as listagens, o índice de busca, o sitemap e a imagem de compartilhamento. Não é necessário modificar componentes ou cadastrar rotas. `npm run dev` deve ser reiniciado após alterar JSON, pois a coleção é lida no início do servidor. Para atualizar a busca na prévia de desenvolvimento, execute o build novamente.

As coleções são `publications.json`, `pages.json`, `academics.json` e `boards.json`. Dados de acadêmicos incluem `chair`, `occupant`, `patron` e `vacancyInSource`; diretorias incluem `boardNumber` e `positions`. Textos integrais continuam no campo `body`.

## Destaques e redes

`content/site.json` concentra nome, domínio, canal do YouTube e IDs dos destaques da página inicial. Os IDs devem apontar para registros existentes. `instagram: null` mantém o link oculto; substitua pelo endereço do perfil oficial quando existir. Não há integração automática de feed.

## Hospedagem

Vercel: importe o repositório, use Node.js 24, comando `npm run build` e saída `build/client`. A configuração `vercel.json` é gerada pelo build com redirecionamentos permanentes. Netlify: o arquivo `netlify.toml` já declara comando, diretório e cabeçalhos; `_redirects` é gerado na saída. Não configure um fallback global para a home: páginas ausentes devem responder 404.

O domínio canônico padrão é `https://www.abamev.org.br`. Defina `VITE_SITE_URL` para alterá-lo. Defina `VITE_NOINDEX=true` em qualquer prévia compartilhada. Ambientes de preview da Vercel e Netlify também são detectados automaticamente. A publicação depende da conta de hospedagem e do domínio que receberão o projeto; nenhum recurso de nuvem é criado pelo build.

## Acervo e migração

O XML original é preservado na raiz e não faz parte da saída publicada. `docs/migration-report.json` documenta cada um dos 122 registros, categorias, imagens e anexos. `archive/originals/` preserva arquivos de imagem originais; `public/media/` contém versões para exibição.

**Não execute a migração para publicar conteúdo novo.** `npm run migrate` reconstrói as coleções a partir do XML e sobrescreve alterações editoriais feitas nelas. `npm run recover` tenta recuperar mídias externas e PDFs públicos e atualiza o relatório. Se uma nova migração for necessária, preserve antes as edições atuais em controle de versão e execute também a recuperação antes do build.

Rascunhos, testes e a política antiga de cookies foram excluídos da publicação. Um vídeo duplicado foi consolidado e ambos os endereços foram mantidos. As cadeiras sem biografia continuam no diretório como registros históricos. As normas e biografias não foram atualizadas editorialmente para a situação presente.

## Imagens e créditos

Fotografias originais vêm do XML. O recorte editorial de Hans Merkt foi preparado com GPT Imagens a partir do retrato do registro 46; a fotografia original permanece na biografia. A frase do destaque foi transcrita da composição existente na página arquivada de março de 2025, sem atribuir autoria não documentada.

O [brasão avulso da ABAMEV](https://www.crmvba.org.br/wp-content/uploads/2022/03/Abamev.png) é usado diretamente no cabeçalho, no menu móvel e no rodapé. O favicon e o ícone de tela inicial são versões reduzidas desse mesmo arquivo.

O segundo slide reúne as marcas da [SBMV](https://sbmv.org.br/wp-content/uploads/2025/03/Sem-titulo-3.svg), EMEVZ–UFBA (imagem de referência), [ABRAMVET](https://www.abramvet.org.br/assets/images/brasao.webp), [CRMV-BA](https://www.crmvba.org.br/wp-content/uploads/2025/05/Logo-CRMV-BA.png) e ABAMEV. SBMV e CRMV-BA usam os símbolos das assinaturas originais, com o nome ao lado das demais identificações do slide.

A capa de **60 anos de cooperação Brasil–Alemanha** vem da página inicial do site antigo. O retrato de **Milton Thiago de Mello** é da Revista Cães e Gatos, conforme o crédito da [publicação da SNA](https://sna.agr.br/nota-de-pesar-pelo-falecimento-do-professor-milton-thiago-de-mello/). Os dois cards apontam para os mesmos documentos no Drive do site anterior. Os textos e destinos são editáveis em `content/site.json`.

O site não usa fotos fictícias como registro histórico, não carrega players de vídeo antes da interação e não inclui analytics.

## Verificação

```sh
npm run typecheck
npm run build
npm test
```

Os testes verificam reconciliação do XML, preservação dos documentos normativos, cadeiras, diretorias, arquivos, redirecionamentos, HTML pré-renderizado, metadados, busca e sitemap. O servidor de prévia permite testar respostas HTTP reais de páginas, redirecionamentos e 404. Detalhes da revisão visual e pendências estão em `docs/verification.md`.
