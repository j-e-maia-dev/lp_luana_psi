# WhatsApp Lead Capture Widget

Widget de chat humanizado para captacao de leads com estetica WhatsApp, conformidade LGPD e rastreamento avancado.

---

## Recursos

- Chat humanizado com efeito "digitando..."
- Validacao de nome, email e WhatsApp
- Notificacoes automaticas empilhadas
- Conformidade com LGPD (checkbox de consentimento)
- Rastreamento de visitantes por 90 dias
- Captura de UTM e parametros (gclid, fbclid)
- Integracao com GTM (DataLayer)
- Webhook, Google Sheets, LocalStorage
- Menu dropdown com opcoes
- 100% responsivo
- Abre WhatsApp em nova aba

---

## Instalacao Rapida

Cole estas 3 linhas antes do `</body>` do seu site:

```html
<link rel="stylesheet" href="whatsapp-widget.css">
<script src="whatsapp-widget-config.js"></script>
<script src="whatsapp-widget.js"></script>
```

---

## Estrutura de Arquivos

```
whatsapp-widget-config.js   <- EDITE AQUI (configuracoes)
whatsapp-widget.css         <- Estilos (nao precisa editar)
whatsapp-widget.js          <- Logica (nao precisa editar)
index.html                  <- Pagina de demonstracao
DOCUMENTACAO.md             <- Este arquivo
```

---

## Configuracoes Principais

Todas as configuracoes estao em `whatsapp-widget-config.js`:

### Perfil (Cabecalho do Chat)

```javascript
profile: {
    name: "Ana",                 // Nome do(a) atendente
    role: "Atendimento",         // Cargo
    gender: "female",            // "female" ou "male" (para pronomes)
    photo: "",                   // URL da foto (vazio = avatar padrao)
    status: "online",            // "online" ou "offline"
    statusMessage: "Normalmente responde em minutos"
}
```

**Genero e Pronomes:**
- `"female"` -> usa "a", "Obrigada", "Bem-vinda"
- `"male"` -> usa "o", "Obrigado", "Bem-vindo"

### Numero do WhatsApp

```javascript
whatsapp: {
    number: "5511999999999",     // Com codigo do pais, sem + ou espacos
    defaultMessage: `Ola! Vim pelo site...

*Meus dados:*
- *Nome:* {userName}
- *E-mail:* {userEmail}
- *WhatsApp:* {userPhone}`,
    desktopBehavior: "ask"       // "ask", "web" ou "app"
}
```

**Variaveis na mensagem do WhatsApp:**
- `{userName}` - Nome do lead
- `{userEmail}` - Email do lead
- `{userPhone}` - Telefone formatado

**Opcoes de `desktopBehavior`:**

| Valor | Comportamento |
|-------|---------------|
| `"ask"` | Pergunta ao usuario: WhatsApp Web ou Aplicativo |
| `"web"` | Abre direto no WhatsApp Web |
| `"app"` | Abre direto no WhatsApp Desktop |

**Tempo de redirecionamento automatico:**

```javascript
whatsapp: {
    autoRedirectDelay: 4  // Segundos para redirecionar se usuario nao clicar
}
```

Se o usuario nao escolher uma opcao, sera redirecionado automaticamente apos X segundos.

**Nota:** No mobile, sempre abre o app. Links abrem em nova aba.

### Tempos (em milissegundos)

```javascript
timing: {
    firstNotification: 2000,     // Primeira notificacao
    secondNotification: 7000,    // Segunda apos a primeira
    typingDuration: {
        min: 600,                // Minimo "digitando"
        max: 1200                // Maximo "digitando"
    },
    messageDelay: 300,           // Entre mensagens
    redirectDelay: 1200          // Antes de ir pro WhatsApp
}
```

### Fluxo de Mensagens

```javascript
messages: {
    notifications: [
        "Ola! Sou {article} {profileName}...",
        "Vamos la, quero saber mais..."
    ],
    flow: [
        { type: "bot", text: "Pra comecar, como posso te chamar?" },
        { type: "input", field: "name", placeholder: "Seu nome...", validation: "name" },
        { type: "bot", text: "Que bom te conhecer, {userName}!" },
        { type: "input", field: "email", placeholder: "Seu e-mail...", validation: "email" },
        { type: "bot", text: "E qual seu WhatsApp?" },
        { type: "input", field: "phone", placeholder: "(00) 00000-0000", validation: "phone" },
        { type: "bot", text: "Perfeito! Vamos continuar pelo WhatsApp" },
        { type: "redirect" }
    ],
    validation: {
        name: "Ops, nao entendi... pode me falar seu nome de novo?",
        email: "Hmm, esse e-mail nao ta certinho...",
        phone: "Esse numero ta estranho... coloca com DDD"
    }
}
```

**Variaveis disponiveis:**

| Variavel | Descricao |
|----------|-----------|
| `{profileName}` | Nome do atendente |
| `{userName}` | Nome do usuario |
| `{article}` | "a" ou "o" (genero) |
| `{thanks}` | "Obrigada" ou "Obrigado" |
| `{welcome}` | "Bem-vinda" ou "Bem-vindo" |

---

## LGPD / Politica de Privacidade

O widget inclui checkbox de consentimento obrigatorio:

```javascript
privacy: {
    enabled: true,
    checkboxLabel: "Li, aceito os termos e quero receber contato!",
    linkText: "Ver termos",
    requiredMessage: "Marque a caixa acima para continuar",
    confirmationMessage: "So mais uma coisa! Confirma abaixo...",
    consentDeclaration: "Declaro que li e aceito a Politica de Privacidade...",
    modalTitle: "Politica de Privacidade",
    modalContent: `<h3>Coleta de Dados</h3><p>...</p>`
}
```

**Comportamento:**
1. Checkbox aparece desde o inicio do chat
2. Ao marcar, mostra "Aceite confirmado"
3. Se nao marcar ate o final, bot pede confirmacao
4. Declaracao de consentimento e salva com o lead

**Dados salvos:**
```javascript
{
    privacyAccepted: true,
    privacyAcceptedAt: "2024-01-01T10:00:00.000Z",
    consentDeclaration: "Declaro que li e aceito..."
}
```

---

## Rastreamento Avancado (90 dias)

O widget rastreia visitantes por 90 dias no localStorage:

```javascript
tracking: {
    enabled: true,
    captureUTM: true,
    utmParams: ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"],
    extraParams: ["gclid", "fbclid", "ref", "source"],
    gtm: {
        enabled: true,
        events: { ... }
    },
    persistence: {
        enabled: true,
        expirationDays: 90,
        trackVisits: true,
        trackPages: true,
        recognizeReturning: true
    }
}
```

**Dados rastreados:**
- Visitor ID unico (persistente)
- Primeira visita e ultima visita
- Contagem de visitas
- UTMs da primeira visita (preservados)
- Parametros extras (gclid, fbclid)
- Paginas visitadas
- Dispositivo e referrer
- Se ja converteu antes

---

## Dados do Lead

O objeto completo do lead:

```javascript
{
    id: "abc123xyz...",
    visitorId: "v_xyz..._1704067200000",
    name: "Joao Silva",
    email: "joao@email.com",
    phone: "11999999999",
    utm: {
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "campanha"
    },
    tracking: {
        firstVisit: "2024-01-01T10:00:00.000Z",
        lastVisit: "2024-01-15T14:30:00.000Z",
        visitCount: 5,
        isReturning: true,
        pagesVisited: 12,
        referrer: "https://google.com",
        device: { ... },
        extraParams: { gclid: "..." }
    },
    privacyAccepted: true,
    privacyAcceptedAt: "2024-01-01T10:00:00.000Z",
    consentDeclaration: "Declaro que...",
    startedAt: "2024-01-01T10:00:00.000Z",
    completedAt: "2024-01-01T10:02:30.000Z",
    pageUrl: "https://seusite.com/pagina",
    pageTitle: "Titulo da Pagina"
}
```

---

## Eventos do GTM (DataLayer)

| Evento | Quando dispara |
|--------|----------------|
| `whatsapp_widget_open` | Usuario abre o chat |
| `whatsapp_widget_close` | Usuario fecha o chat |
| `whatsapp_widget_message` | Bot envia mensagem |
| `whatsapp_field_filled` | Usuario preenche campo |
| `whatsapp_lead_captured` | Lead completo |
| `whatsapp_redirect` | Redirecionou pro WhatsApp |
| `whatsapp_visitor_returned` | Visitante retornando |

Todos os eventos incluem `visitorId` para rastreamento.

---

## Integracoes

### Webhook

```javascript
webhook: {
    enabled: true,
    url: "https://seu-webhook.com/endpoint",
    method: "POST",
    headers: { "Content-Type": "application/json" }
}
```

### Google Sheets

1. Crie uma planilha
2. Va em **Extensoes -> Apps Script**
3. Cole:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.id,
    data.visitorId,
    data.name,
    data.email,
    data.phone,
    data.utm?.utm_source || '',
    data.utm?.utm_medium || '',
    data.tracking?.visitCount || 1,
    data.tracking?.isReturning ? 'Sim' : 'Nao',
    data.privacyAcceptedAt,
    data.pageUrl
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. **Implantar -> Nova implantacao -> App da Web**
5. Copie a URL para o config

---

## API JavaScript

```javascript
// Controles basicos
WhatsAppWidget.open();
WhatsAppWidget.close();
WhatsAppWidget.getLeadData();
WhatsAppWidget.getSessionId();

// Rastreamento
WhatsAppWidget.getVisitorId();
WhatsAppWidget.getTrackingData();
WhatsAppWidget.isReturningVisitor();
WhatsAppWidget.hasConverted();
WhatsAppWidget.getCachedLead();

// Storage (debug)
WhatsAppWidget.storage.get('visitor_data');
WhatsAppWidget.storage.cleanup();
```

---

## Menu Dropdown (3 pontinhos)

O menu no cabecalho inclui:
- **Politica de Privacidade** - Abre modal de termos
- **Agradecimento** - Modal de agradecimento
- **Fechar chat** - Fecha o chat completamente
- **Fechar menu** - Fecha apenas o dropdown

---

## Personalizacao Visual

### Posicao

```javascript
appearance: {
    position: "right",        // "right" ou "left"
    bottomOffset: "20px",
    sideOffset: "20px",
    zIndex: 999999,
    buttonAnimation: true,
    buttonPulse: true
}
```

### Foto de Perfil

```javascript
profile: {
    photo: "https://seusite.com/foto.jpg"
}
```
Use imagens quadradas, minimo 96x96px.

---

## Validacoes

| Campo | Regras |
|-------|--------|
| Nome | 2-50 caracteres, letras e espacos |
| Email | Formato valido |
| Telefone | 10-11 digitos (DDD + numero) |

---

## Debug

```javascript
advanced: {
    debug: true
}
```

---

## Checklist de Implementacao

- [ ] Editei o numero do WhatsApp
- [ ] Personalizei nome e foto do perfil
- [ ] Ajustei as mensagens do fluxo
- [ ] Configurei a Politica de Privacidade (LGPD)
- [ ] Configurei webhook/Google Sheets
- [ ] Testei em mobile
- [ ] Verifiquei eventos no GTM
- [ ] Removi `debug: true` em producao

---

## Licenca

**Todos os direitos reservados.**

Este projeto e de propriedade de Thiago / Mundo Transparente.
O uso, copia, modificacao ou distribuicao deste codigo requer autorizacao previa por escrito do autor.

Para solicitar autorizacao ou licenciamento, entre em contato com o proprietario.
