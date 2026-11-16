# Mapa Interativo de Supernatural — Levantamento e Roadmap

## 1. Visão geral

Site (projeto de fã, não oficial) com um mapa interativo dos EUA mostrando todos os lugares visitados por Sam e Dean Winchester e a rota entre eles. Ao passar o mouse numa cidade: episódio, resumo curto e uma imagem. Objetivo secundário: gerar alguma receita.

- **Público:** fandom grande, fiel e majoritariamente anglófono.
- **Posicionamento:** "road trip" dos irmãos no Impala, 15 temporadas (~327 episódios).
- **Idioma:** inglês primeiro (ou bilíngue EN/PT-BR).

## 2. Levantamento

### 2.1 Escopo funcional
| Item | Prioridade |
|---|---|
| Mapa com marcadores por cidade | MVP |
| Tooltip/hover: episódio, temporada, imagem | MVP |
| Linhas de rota entre episódios consecutivos | MVP |
| Filtro por temporada | MVP |
| Página/painel de detalhe do episódio | v1 |
| Animação da rota episódio a episódio | v1 |
| Contador de km rodados pelo Impala | v1 |
| Busca (cidade, episódio, monstro) | v1 |
| Compartilhar link de um ponto/episódio | v1 |
| Bilíngue EN/PT-BR | v1 |
| Ilustrações próprias (ícone do monstro) | v2 |
| Loja de pôsteres com arte original | v2 |

### 2.2 Stack sugerida
- **Front-end:** Leaflet (gratuito) + OpenStreetMap/tiles estilizados; alternativa Mapbox (gratuito até certo volume).
- **Framework:** JavaScript puro/Vite, ou Astro/Next.js se for investir em SEO por página de episódio.
- **Dados:** arquivo JSON/GeoJSON versionado no repositório (sem backend no início).
- **Hospedagem:** GitHub Pages, Netlify ou Vercel (grátis).
- **Analytics:** Plausible, Umami ou Google Analytics.

### 2.3 Modelo de dados (proposta)
```json
{
  "id": "s01e01",
  "season": 1,
  "episode": 1,
  "title": "Pilot",
  "city": "Lawrence",
  "state": "KS",
  "lat": 38.9717,
  "lng": -95.2353,
  "locationType": "real | approximate | fictional",
  "summary": "Resumo original, escrito por nós.",
  "image": { "src": "...", "source": "Wikimedia Commons", "license": "CC BY-SA 4.0", "author": "..." }
}
```
Campo `locationType` resolve o problema de cidades fictícias/vagas; campo `image` guarda licença e autoria (obrigatório para evitar problemas).

### 2.4 Riscos e mitigação
| Risco | Impacto | Mitigação |
|---|---|---|
| Direitos autorais (Warner Bros.) | Alto | Sem screenshots, sem logo, fotos livres (Wikimedia/Unsplash), arte própria, aviso de "projeto de fã" |
| AdSense rejeitar o site | Médio | Conteúdo original (resumos próprios), não depender só de anúncios |
| Catalogação demorada (~327 eps) | Médio | Lançar por temporadas, começar pela 1 |
| Locais fictícios/vagos | Médio | `locationType` + marcação visual diferente |
| Rota "inventada" entre pontos | Baixo | Deixar claro que é ligação entre pontos, não trajeto real |
| Copiar texto de wikis | Médio | Usar só como referência; escrever tudo com palavras próprias |
| Monetização com pouco tráfego | Médio | Doações/afiliados primeiro; expectativa de renda complementar |

### 2.5 Monetização (ordem de adoção)
1. Doações (Ko-fi / Buy Me a Coffee / Apoia.se) — baixo risco, desde o lançamento.
2. Afiliados Amazon (DVDs, livros) — após ter tráfego mínimo.
3. Produtos próprios com arte original (pôster do mapa) — print-on-demand.
4. Anúncios — só com tráfego relevante e conteúdo original.

### 2.6 Questões em aberto (decidir antes da Etapa 1)
- Idioma: só EN, ou EN + PT-BR desde o início?
- Qual critério para "local do episódio" quando há vários (principal vs. todos)?
- Fonte de dados base: pesquisa manual, wiki de fãs (só como referência) ou ambos?
- Nome/domínio sem usar a marca "Supernatural" de forma que pareça oficial.
- Entidade para receber (pessoa física/MEI) caso a receita cresça.

## 3. Etapas e roadmap

### Etapa 0 — Fundação (≈ 1 semana)
- Definir nome, domínio e identidade visual própria (sem logo da série).
- Decidir idioma e as questões em aberto.
- Criar repositório, estrutura do projeto e deploy automático.
- Definir esquema de dados (seção 2.3) e checklist de licenças de imagem.
- Redigir aviso legal ("projeto de fã, não afiliado à Warner Bros.") e política de remoção.
- **Entrega:** site "em construção" no ar + repositório pronto.

### Etapa 1 — Protótipo do mapa (≈ 1 semana)
- Mapa Leaflet com 5–10 episódios de exemplo.
- Marcadores, tooltip no hover (episódio + imagem), linha de rota.
- Layout responsivo (mobile primeiro; fandom navega muito no celular).
- **Entrega:** protótipo navegável para validar a experiência.

### Etapa 2 — MVP: Temporada 1 completa (≈ 2–3 semanas)
- Catalogar os 22 episódios da T1: cidade, coordenadas, tipo de local, resumo próprio.
- Imagens: fotos livres das cidades com licença registrada.
- Filtro por temporada, painel de detalhe do episódio.
- Tratamento visual de locais fictícios/aproximados.
- Analytics e botão de doação (Ko-fi).
- **Entrega:** MVP público.

### Etapa 3 — Lançamento e validação (≈ 1–2 semanas)
- Divulgar em Reddit (r/Supernatural), Tumblr, TikTok, Pinterest, grupos de fãs.
- Coletar feedback (formulário simples + métricas).
- **Critério de decisão:** tráfego, tempo no site, compartilhamentos e doações justificam catalogar o restante? Se não, ajustar proposta antes de investir mais.

### Etapa 4 — Expansão de conteúdo (≈ 2–3 meses, em ondas)
- Catalogar temporadas 2–15, uma por vez, publicando cada uma (gera novo motivo para divulgar).
- Animação da rota episódio a episódio.
- Contador de quilômetros do Impala.
- Busca e links compartilháveis por episódio.
- Versão bilíngue (se aplicável).
- **Entrega:** série completa mapeada.

### Etapa 5 — Crescimento e SEO (contínuo)
- Páginas individuais por episódio e por cidade (SEO).
- Sitemap, meta tags, Open Graph (cards bonitos ao compartilhar).
- Newsletter/redes sociais com "ponto do dia".
- Parcerias com criadores de conteúdo e comunidades de fãs.

### Etapa 6 — Monetização (começa na 2, intensifica após a 5)
- Afiliados Amazon.
- Pôster do mapa com arte original (print-on-demand).
- Anúncios, se o tráfego justificar.
- Avaliar consulta jurídica (propriedade intelectual) ao começar a gerar receita real.

## 4. Linha do tempo resumida

| Fase | Duração estimada | Marco |
|---|---|---|
| Etapa 0 — Fundação | 1 sem | Repo + deploy + aviso legal |
| Etapa 1 — Protótipo | 1 sem | Mapa funcional com exemplos |
| Etapa 2 — MVP (T1) | 2–3 sem | Temporada 1 publicada |
| Etapa 3 — Validação | 1–2 sem | Decisão go/no-go |
| Etapa 4 — Expansão | 2–3 meses | T2–T15 |
| Etapa 5 — Crescimento | contínuo | SEO e comunidade |
| Etapa 6 — Monetização | paralelo | Doações → afiliados → produtos → anúncios |

Estimativas assumem trabalho solo, parcial. O gargalo é a catalogação de conteúdo, não o código.
