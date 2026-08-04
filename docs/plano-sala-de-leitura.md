# Sala de Leitura — plano de implementação

Documento de referência para o próximo ciclo de desenvolvimento.
Escopo deliberadamente enxuto: entregar o núcleo de valor primeiro.

---

## 1. O problema

Hoje a entrega é feita por WhatsApp: uma sequência intercalada de
`fotos → áudio → fotos → áudio`, chegando a 12 áudios e 6+ fotos por leitura.

Três consequências:

- **A estrutura se perde.** O WhatsApp achata tudo numa lista cronológica de
  ~20 bolhas. O vínculo entre carta e interpretação — o coração do trabalho —
  desaparece quando a consulente volta semanas depois.
- **A promessa do FAQ não se sustenta.** "Você pode ouvir quantas vezes quiser"
  não se cumpre com áudio comprimido que some na troca de celular.
- **Áudio tem custo de entrada alto.** Não dá pra escanear nem consumir no
  trabalho. Leitura não ouvida = valor não entregue = consulente que não volta.

## 2. Objetivo do v1

Substituir o envio de ~20 arquivos por **um link privado**:
`intuaguia.com.br/leitura/x7f3k9a2`

A Vanessa monta a leitura no admin, publica, e manda um link só.

### Dentro do v1
- Admin protegido, com login
- Criar leitura → subir arquivos → agrupar em momentos → publicar
- Página pública da leitura, por link secreto
- Estado "em preparo" (link enviado na compra, antes de estar pronto)

### Fora do v1 (fases seguintes)
- Transcrição por IA e resumos
- Ficha da consulente / histórico
- Formulário público de solicitação
- Busca no histórico
- Marcação de quais cartas saíram

## 3. Conceito central: momentos

A leitura não é "mídia avulsa", é uma narrativa em atos.
Cada **momento** = N fotos de cartas + 1 áudio que as interpreta.

```
Leitura
 └── Momento (ordenado)
      ├── fotos: 1..n
      ├── áudio: 1
      └── título (opcional)
```

## 4. Modelo de dados (D1)

```sql
CREATE TABLE leituras (
  id               TEXT PRIMARY KEY,        -- uuid
  token            TEXT UNIQUE NOT NULL,    -- slug secreto da URL pública
  consulente_nome  TEXT NOT NULL,
  tipo_leitura     TEXT NOT NULL,           -- "Mandala Astrológica" etc.
  status           TEXT NOT NULL,           -- rascunho | preparando | publicada
  prazo            TEXT,                    -- ISO date, previsão de entrega
  criada_em        TEXT NOT NULL,
  publicada_em     TEXT
);

CREATE TABLE momentos (
  id             TEXT PRIMARY KEY,
  leitura_id     TEXT NOT NULL REFERENCES leituras(id) ON DELETE CASCADE,
  ordem          INTEGER NOT NULL,
  titulo         TEXT,
  audio_key      TEXT,                      -- chave no R2
  audio_duracao  INTEGER                    -- segundos
);

CREATE TABLE fotos (
  id          TEXT PRIMARY KEY,
  momento_id  TEXT NOT NULL REFERENCES momentos(id) ON DELETE CASCADE,
  ordem       INTEGER NOT NULL,
  r2_key      TEXT NOT NULL
);

CREATE INDEX idx_momentos_leitura ON momentos(leitura_id, ordem);
CREATE INDEX idx_fotos_momento    ON fotos(momento_id, ordem);
```

Três tabelas. Nada de tabela de consulentes no v1 — o nome fica na leitura.
Ela entra na fase 2, junto com o histórico.

## 5. Rotas

**Público**
- `GET /leitura/:token` — a sala de leitura

**Admin** (protegido — ver seção 6)
- `GET  /admin` — lista de leituras, agrupada por status
- `GET  /admin/nova` — criar leitura
- `GET  /admin/leitura/:id` — montar, revisar, publicar
- `POST /admin/api/upload-url` — devolve URL assinada do R2
- `POST /admin/api/leitura/:id/publicar`

**Mídia**
- `GET /midia/:token/:key` — o Worker valida o token da leitura antes de
  servir o arquivo do R2. Os objetos **não** ficam publicamente acessíveis.

## 6. Autenticação: Cloudflare Access

Não escrever código de auth. Usar **Cloudflare Access** (Zero Trust) na frente
de `/admin/*`:

- Grátis até 50 usuários
- Login por Google/e-mail, com one-time PIN
- Zero linha de código de sessão, senha ou cookie para manter
- Já está na mesma conta e no mesmo domínio

Configuração: Zero Trust → Access → Applications → Self-hosted →
`intuaguia.com.br/admin*` → política permitindo só o e-mail da Vanessa.

## 7. Upload: o ponto que decide se a ferramenta vai ser usada

Se ela tiver que subir arquivo por arquivo em 12 caixinhas, vai abandonar e
voltar pro WhatsApp. O fluxo precisa ser **arrastar tudo de uma vez**.

**Agrupamento automático:** os arquivos carregam `lastModified`. Como ela
fotografa e grava em ordem, a sequência natural é
`foto, foto, áudio, foto, áudio…`. Basta ordenar por horário e fechar um
momento sempre que aparecer um áudio. Ela só confere e arrasta o que estiver
fora do lugar.

**Upload direto pro R2:** o Worker gera URLs assinadas e o navegador envia
direto pro bucket. Não passar 150 MB de áudio pelo Worker (há limite de
tamanho de corpo de requisição).

## 8. Página da consulente

- Cabeçalho: nome, tipo de leitura, data — com a identidade visual do site
- Momentos em sequência: fotos das cartas + player do áudio correspondente
- Índice lateral com "Momento 5 de 12"
- Progresso salvo em `localStorage` (ela para e volta depois)
- Botão de baixar os áudios
- Estado "em preparo": *"Sua leitura está sendo preparada — prevista para 05/08"*

**Detalhe técnico:** para o player permitir arrastar a barra de progresso, a
rota `/midia/...` precisa suportar *range requests* (HTTP 206). O R2 suporta
leitura por intervalo; é só repassar o header `Range`.

## 9. Fases seguintes

**Fase 2 — tirar o áudio da frente do gargalo**
Transcrição automática via **Workers AI (Whisper)** — mesma conta, sem
fornecedor novo, e o áudio íntimo não sai da infraestrutura da Cloudflare.

Regras de design que importam mais que a tecnologia:
- O resumo é **isca, não substituto**. Duas ou três linhas por momento, no
  espírito de "aqui a Vanessa fala sobre o padrão que se repete nas suas
  relações". Se o resumo for completo demais, ninguém ouve o áudio — e o valor
  do trabalho dela evapora.
- **A IA rascunha, a Vanessa assina.** Nada publicado automaticamente. Ela
  revisa em 30 segundos. Vai errar nome de carta (baralho cigano, orixás) e
  pode injetar certeza onde ela foi tentativa — o que num contexto terapêutico
  é grave. Passar um glossário das cartas ajuda, mas não dispensa a revisão.

**Fase 3 — continuidade**
- Ficha da consulente com histórico
- Busca no histórico (destravada pela transcrição da fase 2):
  *"quando foi que falamos sobre mudança de cidade?"*
- Formulário público de solicitação, substituindo o vai-e-vem no WhatsApp

**Fase 4 — opcional**
- Marcar quais cartas saíram → *"é a terceira vez que A Torre aparece pra você"*

## 10. Privacidade (LGPD)

O sistema vai guardar nome completo, data de nascimento e relato íntimo —
separação, luto, crises. Isso é dado pessoal, e o contexto é dado sensível.
O FAQ promete "privacidade e respeito são prioridade", o que vira obrigação.

Barato de projetar agora, caro de consertar depois:

- Token da leitura precisa poder ser **revogado**
- Nenhum dado pessoal em URL ou query string
- Definir por quanto tempo áudios e anotações ficam guardados
- Transcrição rodando dentro da Cloudflare, não em API externa
- Cuidado com o que vai parar em backup e em log
