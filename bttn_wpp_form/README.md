# WhatsApp Lead Capture Widget

Widget de chat humanizado para captacao de leads com estetica WhatsApp, conformidade LGPD e rastreamento avancado.

![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-Proprietary-red)

---

## Demonstracao

O widget aparece como um botao flutuante do WhatsApp no canto inferior direito do site. Ao clicar, abre uma conversa humanizada que coleta nome, email e telefone antes de redirecionar para o WhatsApp.

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
- Modal de agradecimento
- Escolha WhatsApp Web ou App (desktop)
- 100% responsivo
- Abre WhatsApp em nova aba
- Zero dependencias (Vanilla JS)

---

## Instalacao Rapida

Cole estas 3 linhas antes do `</body>` do seu site:

```html
<link rel="stylesheet" href="whatsapp-widget.css">
<script src="whatsapp-widget-config.js"></script>
<script src="whatsapp-widget.js"></script>
```

---

## Configuracao

Edite o arquivo `whatsapp-widget-config.js`:

```javascript
// Numero do WhatsApp (com codigo do pais)
whatsapp: {
    number: "5511999999999"
}

// Dados do atendente
profile: {
    name: "Ana",
    role: "Atendimento",
    gender: "female"  // ou "male"
}
```

---

## Estrutura de Arquivos

```
bttn_wpp_form/
├── index.html                  # Pagina de demonstracao
├── whatsapp-widget.css         # Estilos
├── whatsapp-widget-config.js   # Configuracoes (EDITE AQUI)
├── whatsapp-widget.js          # Logica principal
├── INSTALACAO.md               # Guia completo de instalacao
├── DOCUMENTACAO.md             # Documentacao tecnica
├── LICENSE                     # Licenca de uso
└── README.md                   # Este arquivo
```

---

## Documentacao

- **[INSTALACAO.md](INSTALACAO.md)** - Guia passo a passo para iniciantes e experts
- **[DOCUMENTACAO.md](DOCUMENTACAO.md)** - Referencia tecnica completa

---

## Integracoes Suportadas

| Integracao | Descricao |
|------------|-----------|
| **Webhook** | Envia dados para qualquer URL (Zapier, Make, N8N) |
| **Google Sheets** | Via Apps Script |
| **LocalStorage** | Backup automatico no navegador |
| **GTM/DataLayer** | Eventos para Google Tag Manager |

---

## Eventos GTM

```javascript
whatsapp_widget_open      // Usuario abriu o chat
whatsapp_widget_close     // Usuario fechou o chat
whatsapp_field_filled     // Campo preenchido
whatsapp_lead_captured    // Lead completo
whatsapp_redirect         // Redirecionou pro WhatsApp
whatsapp_visitor_returned // Visitante retornando
```

---

## API JavaScript

```javascript
WhatsAppWidget.open();           // Abre o chat
WhatsAppWidget.close();          // Fecha o chat
WhatsAppWidget.getLeadData();    // Dados do lead
WhatsAppWidget.getVisitorId();   // ID do visitante
WhatsAppWidget.isReturningVisitor(); // Visitante recorrente?
```

---

## Licenca

**Todos os direitos reservados.**

Este projeto e propriedade de Thiago / Mundo Transparente.
O uso, copia, modificacao ou distribuicao requer autorizacao previa por escrito.

Para licenciamento, entre em contato com o proprietario.

---

## Autor

**Thiago / Mundo Transparente**

---

*Widget desenvolvido com assistencia de Claude (Anthropic)*
