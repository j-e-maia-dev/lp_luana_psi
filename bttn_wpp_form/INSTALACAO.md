# Guia de Instalacao - WhatsApp Lead Capture Widget

Manual completo para instalar o widget de captura de leads no seu site ou landing page.

---

## Indice

1. [Requisitos](#requisitos)
2. [Instalacao Rapida (3 minutos)](#instalacao-rapida)
3. [Instalacao Detalhada para Iniciantes](#instalacao-detalhada-para-iniciantes)
4. [Configuracao Avancada para Desenvolvedores](#configuracao-avancada-para-desenvolvedores)
5. [Integracao com Plataformas](#integracao-com-plataformas)
6. [Troubleshooting](#troubleshooting)

---

## Requisitos

### Minimos
- Site com acesso ao codigo HTML
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Recomendados
- HTTPS habilitado (para LocalStorage funcionar corretamente)
- Google Tag Manager (para rastreamento avancado)

---

## Instalacao Rapida

**Tempo estimado: 3 minutos**

### Passo 1: Baixe os arquivos

Baixe estes 3 arquivos e coloque na pasta do seu site:
- `whatsapp-widget.css`
- `whatsapp-widget-config.js`
- `whatsapp-widget.js`

### Passo 2: Adicione ao HTML

Cole estas 3 linhas **ANTES** do `</body>` (fechamento do body):

```html
<link rel="stylesheet" href="whatsapp-widget.css">
<script src="whatsapp-widget-config.js"></script>
<script src="whatsapp-widget.js"></script>
```

### Passo 3: Configure seu numero

Abra `whatsapp-widget-config.js` e altere o numero do WhatsApp:

```javascript
whatsapp: {
    number: "5511999999999",  // <- Coloque seu numero aqui
```

**Pronto!** O widget ja esta funcionando.

---

## Instalacao Detalhada para Iniciantes

### O que e este widget?

E um botao verde do WhatsApp que aparece no canto inferior direito do seu site. Quando o visitante clica, abre uma conversa humanizada que coleta:
- Nome
- E-mail
- Telefone

Depois redireciona para o WhatsApp com os dados ja preenchidos.

### Passo a Passo Visual

#### 1. Localize a pasta do seu site

Seu site tem uma pasta com arquivos. Geralmente voce acessa via:
- **FTP** (FileZilla, WinSCP)
- **Painel de Hospedagem** (cPanel, Hostinger, etc.)
- **Pasta local** (se trabalha no computador)

#### 2. Faca upload dos arquivos

Copie os 3 arquivos para a **mesma pasta** onde esta seu `index.html`:

```
sua-pasta/
├── index.html          (sua pagina)
├── whatsapp-widget.css      (NOVO)
├── whatsapp-widget-config.js (NOVO)
└── whatsapp-widget.js       (NOVO)
```

#### 3. Edite seu HTML

Abra o arquivo HTML da sua pagina (index.html, landing.html, etc.) em um editor de texto (Notepad++, VS Code, ou ate o Bloco de Notas).

Procure por `</body>` - geralmente esta no final do arquivo.

**ANTES:**
```html
    </body>
</html>
```

**DEPOIS:**
```html
    <!-- WhatsApp Widget -->
    <link rel="stylesheet" href="whatsapp-widget.css">
    <script src="whatsapp-widget-config.js"></script>
    <script src="whatsapp-widget.js"></script>
    </body>
</html>
```

#### 4. Configure seu numero de WhatsApp

Abra o arquivo `whatsapp-widget-config.js` e encontre esta linha:

```javascript
number: "5511999999999",
```

Substitua pelo seu numero:
- Inclua o codigo do pais (55 para Brasil)
- Inclua o DDD (11, 21, 19, etc.)
- Nao use espacos, tracos ou parenteses
- Nao use o sinal de +

**Exemplos:**
| Numero Original | Formato Correto |
|-----------------|-----------------|
| (11) 99999-9999 | 5511999999999 |
| +55 21 98888-7777 | 5521988887777 |
| 19 99123-4567 | 5519991234567 |

#### 5. Personalize o atendente

No mesmo arquivo, encontre a secao `profile`:

```javascript
profile: {
    name: "Ana",              // Nome do atendente
    role: "Atendimento",      // Cargo
    gender: "female",         // "female" ou "male"
    photo: "",                // URL da foto (opcional)
    status: "online",         // "online" ou "offline"
    statusMessage: "Normalmente responde em minutos"
}
```

**Dica sobre genero:**
- `"female"` usa: "a Ana", "Obrigada", "Bem-vinda"
- `"male"` usa: "o Pedro", "Obrigado", "Bem-vindo"

#### 6. Teste

Abra seu site no navegador. Voce deve ver:
1. Botao verde do WhatsApp no canto inferior direito
2. Apos 2 segundos, uma notificacao aparece
3. Ao clicar, abre o chat humanizado

---

## Configuracao Avancada para Desenvolvedores

### Estrutura do Projeto

```
whatsapp-widget/
├── index.html                  # Demo/teste
├── whatsapp-widget.css         # Estilos (CSS puro, sem dependencias)
├── whatsapp-widget-config.js   # Configuracoes (edite este)
├── whatsapp-widget.js          # Logica (IIFE, sem dependencias)
├── DOCUMENTACAO.md             # Documentacao tecnica completa
├── INSTALACAO.md               # Este arquivo
└── LICENSE                     # Licenca de uso
```

### Arquitetura

- **Zero dependencias**: Vanilla JS, CSS puro
- **IIFE Pattern**: Escopo isolado, sem poluicao global
- **LocalStorage**: Persistencia de 90 dias com expiracao automatica
- **DataLayer**: Integracao nativa com GTM
- **Responsive**: Mobile-first, funciona em qualquer tela

### Carregamento Assincrono

Para melhor performance, carregue de forma assincrona:

```html
<link rel="stylesheet" href="whatsapp-widget.css">
<script src="whatsapp-widget-config.js"></script>
<script src="whatsapp-widget.js" defer></script>
```

Ou com carregamento dinamico:

```html
<script>
(function() {
    // CSS
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'whatsapp-widget.css';
    document.head.appendChild(css);

    // Config
    var config = document.createElement('script');
    config.src = 'whatsapp-widget-config.js';
    config.onload = function() {
        // Widget (apos config carregar)
        var widget = document.createElement('script');
        widget.src = 'whatsapp-widget.js';
        document.body.appendChild(widget);
    };
    document.body.appendChild(config);
})();
</script>
```

### CDN / Hospedagem Externa

Hospede os arquivos em CDN para melhor performance:

```html
<link rel="stylesheet" href="https://seu-cdn.com/whatsapp-widget.css">
<script src="https://seu-cdn.com/whatsapp-widget-config.js"></script>
<script src="https://seu-cdn.com/whatsapp-widget.js"></script>
```

### API JavaScript

Controle o widget programaticamente:

```javascript
// Abrir/Fechar
WhatsAppWidget.open();
WhatsAppWidget.close();

// Dados
WhatsAppWidget.getLeadData();      // Dados do lead atual
WhatsAppWidget.getSessionId();     // ID da sessao
WhatsAppWidget.getVisitorId();     // ID persistente do visitante

// Tracking
WhatsAppWidget.getTrackingData();  // Todos os dados de rastreamento
WhatsAppWidget.isReturningVisitor(); // true/false
WhatsAppWidget.hasConverted();     // Se ja converteu antes
WhatsAppWidget.getCachedLead();    // Dados do lead em cache
```

### Webhook / API

Configure o webhook para receber leads em tempo real:

```javascript
// Em whatsapp-widget-config.js
integrations: {
    webhook: {
        enabled: true,
        url: "https://sua-api.com/leads",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer seu-token"
        }
    }
}
```

**Payload enviado:**
```json
{
    "id": "abc123xyz",
    "visitorId": "v_xyz_1704067200000",
    "name": "Joao Silva",
    "email": "joao@email.com",
    "phone": "11999999999",
    "utm": {
        "utm_source": "google",
        "utm_medium": "cpc"
    },
    "tracking": {
        "firstVisit": "2024-01-01T10:00:00.000Z",
        "visitCount": 3,
        "isReturning": true
    },
    "privacyAccepted": true,
    "privacyAcceptedAt": "2024-01-01T10:02:00.000Z"
}
```

### Eventos GTM (DataLayer)

```javascript
// Eventos disparados automaticamente
window.dataLayer.push({
    event: 'whatsapp_widget_open',
    visitorId: '...'
});

// Eventos disponiveis:
// - whatsapp_widget_open
// - whatsapp_widget_close
// - whatsapp_widget_message
// - whatsapp_field_filled
// - whatsapp_lead_captured
// - whatsapp_redirect
// - whatsapp_visitor_returned
```

### Customizacao CSS

Sobrescreva estilos sem editar o arquivo original:

```css
/* Cor do botao */
.wwl-button {
    background: #FF6B00 !important; /* Laranja */
}

/* Posicao */
.wwl-widget {
    --wwl-bottom-offset: 100px;
    --wwl-side-offset: 30px;
}

/* Tamanho do chat */
.wwl-chat {
    width: 400px !important;
    height: 600px !important;
}
```

---

## Integracao com Plataformas

### WordPress

#### Opcao 1: Tema (functions.php)

```php
function add_whatsapp_widget() {
    wp_enqueue_style('whatsapp-widget', get_template_directory_uri() . '/whatsapp-widget.css');
    wp_enqueue_script('whatsapp-widget-config', get_template_directory_uri() . '/whatsapp-widget-config.js', array(), '1.0', true);
    wp_enqueue_script('whatsapp-widget', get_template_directory_uri() . '/whatsapp-widget.js', array('whatsapp-widget-config'), '1.0', true);
}
add_action('wp_enqueue_scripts', 'add_whatsapp_widget');
```

#### Opcao 2: Plugin (Header/Footer)

Use plugins como "Insert Headers and Footers" e cole o codigo no Footer.

### Shopify

No painel admin:
1. Va em **Online Store > Themes > Edit Code**
2. Abra `theme.liquid`
3. Antes de `</body>`, adicione o codigo

Ou crie arquivos em **Assets** e referencie:
```liquid
{{ 'whatsapp-widget.css' | asset_url | stylesheet_tag }}
<script src="{{ 'whatsapp-widget-config.js' | asset_url }}"></script>
<script src="{{ 'whatsapp-widget.js' | asset_url }}"></script>
```

### Wix

1. Va em **Configuracoes > Codigo Personalizado**
2. Adicione novo codigo no **Body - End**
3. Cole o codigo HTML

### Webflow

1. Va em **Project Settings > Custom Code**
2. Na secao **Footer Code**, cole o codigo

### Landing Pages (Unbounce, Leadpages, etc.)

Na secao de scripts/codigo personalizado, adicione no Footer/Body.

### Google Tag Manager

Crie uma Tag do tipo **Custom HTML**:

```html
<link rel="stylesheet" href="https://seu-site.com/whatsapp-widget.css">
<script src="https://seu-site.com/whatsapp-widget-config.js"></script>
<script src="https://seu-site.com/whatsapp-widget.js"></script>
```

Trigger: **All Pages** ou paginas especificas.

---

## Troubleshooting

### Widget nao aparece

**Causa 1: Arquivos nao encontrados**
- Verifique se os 3 arquivos estao na mesma pasta do HTML
- Confira se os nomes estao corretos (case-sensitive)

**Causa 2: Ordem dos scripts**
- O config.js DEVE vir ANTES do widget.js

**Causa 3: Erro no config**
- Abra o console do navegador (F12 > Console)
- Procure por erros em vermelho

### Botao aparece mas chat nao abre

**Causa: Erro JavaScript**
- Abra o console (F12) e verifique erros
- Certifique-se que nao ha conflito com outros scripts

### Redirecionamento nao funciona

**Causa 1: Numero incorreto**
- Verifique se o numero esta no formato correto (5511999999999)
- Nao use +, espacos ou caracteres especiais

**Causa 2: Bloqueador de popup**
- O WhatsApp abre em nova aba
- Desative bloqueadores de popup para testar

### LocalStorage nao funciona

**Causa: HTTP em vez de HTTPS**
- Alguns navegadores bloqueiam LocalStorage em HTTP
- Use HTTPS no seu site

### Conflito de CSS

**Causa: Estilos do seu site afetando o widget**
- O widget usa prefixo `.wwl-` para evitar conflitos
- Se necessario, aumente a especificidade ou use `!important`

### Debug

Ative o modo debug no config:

```javascript
advanced: {
    debug: true
}
```

Abra o console (F12) e veja os logs detalhados.

---

## Suporte

Para duvidas ou problemas:
1. Consulte a [DOCUMENTACAO.md](DOCUMENTACAO.md) completa
2. Verifique o [Troubleshooting](#troubleshooting) acima
3. Entre em contato com o proprietario do projeto

---

**Autor:** Thiago / Mundo Transparente
**Versao:** 1.0.0
**Licenca:** Todos os direitos reservados - Uso requer autorizacao
