# Verificação da entrega

Revisão realizada em 10 de novembro de 2026.

## Acervo

- 122 registros de origem reconciliados: 106 migrados, 9 cadeiras preservadas sem biografia, 6 excluídos e 1 consolidado.
- Dois regulamentos adicionais recuperados das descrições das categorias. Total: 117 conteúdos publicados.
- 40 cadeiras e 10 diretorias preservadas. A ocupação das cadeiras e os cargos são apresentados como informação histórica.
- Todos os parágrafos e legendas textuais dos registros migrados foram comparados com o HTML pré-renderizado; o teste verifica sua preservação, incluindo tabelas.
- 78 imagens embutidas únicas extraídas e preservadas. A origem contém 86 ocorrências embutidas, com duplicações.
- 14 PDFs públicos recuperados e servidos localmente. O PDF “História da Veterinária do Exército Brasileiro” exige acesso na origem e não foi recuperado.
- Nove imagens externas não foram recuperadas: seis fotografias da solenidade de jubileu de 2017 e três arquivos em endereços expirados do armazenamento Microsoft. Foram tentados os endereços originais e, para as fotos do site, o Wayback. O relatório JSON preserva as URLs e as tentativas. As páginas indicam a ausência dos arquivos e não exibem imagens quebradas.

## Aplicação e build

- React 19, TypeScript, Vite e React Router; sem servidor de aplicação na hospedagem.
- 136 rotas pré-renderizadas, incluindo páginas de busca, privacidade, categorias históricas vazias e página de erro. O sitemap inclui 132 URLs indexáveis.
- 142 redirecionamentos para endereços anteriores.
- Todas as páginas possuem conteúdo principal no HTML, um h1, um título, uma descrição e um canonical, além de imagem de compartilhamento local.
- Verificados arquivos locais, links internos e âncoras dos capítulos e artigos.
- O teste de inclusão temporária de uma publicação gerou página, metadados, entrada na listagem, busca e sitemap sem mudar as rotas. A fixture foi removida e o build restaurado.
- Prévia de hospedagem verificada com `CONTEXT=deploy-preview`: metatag `noindex, follow` e `Disallow: /` em robots. O build final foi restaurado para produção.
- `npm run typecheck`, `npm run build` e a suíte de 13 testes passaram. Dependências auditadas sem vulnerabilidades conhecidas na revisão.

## Navegador

- Página inicial, busca, diretório de cadeiras, biografia, estatuto e diretoria com tabelas revisados no Chrome.
- Layouts de 320, 390 e 768 pixels e a janela desktop verificados, sem rolagem horizontal da página nas telas examinadas. As tabelas possuem sua própria região de rolagem.
- Menu móvel abre e fecha ao navegar. Há ação de Escape, foco visível, salto para o conteúdo e foco no conteúdo após navegação.
- Filtro por nome (“Frederico”) e cadeira (“10”) verificado. A cadeira 10 exibe Nelson Baeta Alvim como patrono, conforme o texto da fonte, em vez da legenda de imagem ausente.
- Busca integral por “Hans Merkt” retornou referências em diferentes conteúdos. Busca por termos ignora acentos.
- Botão de copiar link verificado. O estatuto oferece 36 links diretos de artigos e sete capítulos.
- Player de vídeo: nenhum iframe antes do clique; um iframe de `youtube-nocookie.com` após a ativação.
- Prévia estática: home respondeu 200, `/node/41` redirecionou com 301 à cadeira 1 e URL inexistente respondeu 404.
- A regra de impressão está implementada; não houve ensaio físico de impressão. Indexação por buscadores e prévias reais nas redes só podem ser verificadas depois da publicação no domínio final.

## Publicação

O projeto contém configurações para Vercel e Netlify. Não foi publicado em conta externa ou conectado ao domínio. A entrega inclui o código, os arquivos estáticos gerados e as instruções de manutenção no README.
