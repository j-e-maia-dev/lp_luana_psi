/**
 * ============================================
 * WHATSAPP LEAD CAPTURE WIDGET - CONFIGURAÇÕES
 * ============================================
 *
 * Edite este arquivo para personalizar o widget.
 * Todas as configurações importantes estão aqui.
 */

const WHATSAPP_WIDGET_CONFIG = {

    // ==========================================
    // DADOS DO PERFIL (Cabeçalho do Chat)
    // ==========================================
    profile: {
        name: "Luana",                              // Nome que aparece no chat
        role: "Psicóloga",                          // Cargo/função
        gender: "female",                           // "female" ou "male" (para pronomes)
        photo: "",                                  // URL da foto (deixe vazio para placeholder)
        status: "online",                           // "online" ou "offline"
        statusMessage: "Normalmente responde em minutos"
    },

    // ==========================================
    // NÚMERO DO WHATSAPP (para redirecionamento)
    // ==========================================
    whatsapp: {
        number: "5519989276280",                    // Número com código do país (sem + ou espaços)

        // Mensagem enviada ao WhatsApp (com dados do lead)
        // Variáveis: {userName}, {userEmail}, {userPhone}
        defaultMessage: `Olá! Vim pelo site e gostaria de agendar uma consulta.

*Meus dados:*
- *Nome:* {userName}
- *E-mail:* {userEmail}
- *WhatsApp:* {userPhone}`,

        // Comportamento no Desktop:
        // "ask" = pergunta ao usuário (Web ou App)
        // "web" = abre direto no WhatsApp Web
        // "app" = abre direto no WhatsApp Desktop/App
        desktopBehavior: "ask",

        // Tempo (em segundos) para redirecionar automaticamente
        // caso o usuário não clique em nenhuma opção
        autoRedirectDelay: 4
    },

    // ==========================================
    // TEMPOS E DELAYS (em milissegundos)
    // ==========================================
    timing: {
        firstNotification: 2000,                   // Primeira mensagem após 2 segundos
        secondNotification: 7000,                  // Segunda mensagem 7s depois da primeira
        typingDuration: {
            min: 600,                              // Tempo mínimo "digitando..."
            max: 1200                              // Tempo máximo "digitando..."
        },
        messageDelay: 300,                         // Delay entre mensagens consecutivas
        readReceiptDelay: 400,                     // Delay para mostrar "visto"
        redirectDelay: 1500                        // Delay antes de redirecionar pro WhatsApp
    },

    // ==========================================
    // MENSAGENS DO CHAT (Fluxo de Conversa)
    // ==========================================
    messages: {
        // Mensagens de notificação (aparecem no balão externo E dentro do chat)
        // 1ª após 2s, 2ª após mais 7s - empilhadas com hora
        // Variáveis: {profileName}, {article}, {thanks}, {welcome}
        notifications: [
            "Olá! Sou {article} {profileName}, psicóloga humanista 😊",
            "Que bom que você chegou até aqui. Posso te ajudar a agendar uma sessão?"
        ],

        // Fluxo principal de mensagens (continua após as notificações)
        // Humanizado: conversa de pessoa pra pessoa
        flow: [
            {
                type: "bot",
                text: "Pra começar, como posso te chamar?"
            },
            {
                type: "input",
                field: "name",
                placeholder: "Seu nome...",
                validation: "name"
            },
            {
                type: "bot",
                text: "Prazer, {userName}! Me passa seu melhor e-mail?"
            },
            {
                type: "input",
                field: "email",
                placeholder: "Seu e-mail...",
                validation: "email"
            },
            {
                type: "bot",
                text: "E qual seu WhatsApp? Assim podemos conversar por lá 😊"
            },
            {
                type: "input",
                field: "phone",
                placeholder: "(00) 00000-0000",
                validation: "phone"
            },
            {
                type: "bot",
                text: "Perfeito, {userName}! Vamos continuar pelo WhatsApp 💜"
            },
            {
                type: "redirect"
            }
        ],

        // Mensagens de erro de validação (humanizadas)
        validation: {
            name: "Ops, não entendi... pode me falar seu nome de novo?",
            email: "Hmm, esse e-mail não tá certo... confere pra mim?",
            phone: "Esse número tá estranho... coloca com DDD, tipo (11) 99999-9999"
        }
    },

    // ==========================================
    // TEXTOS DA INTERFACE
    // ==========================================
    ui: {
        inputPlaceholder: "Digite uma mensagem...",
        sendButton: "Enviar",
        typing: "digitando...",
        online: "Online agora!",
        offline: "offline"
    },

    // ==========================================
    // TRACKING E ANALYTICS
    // ==========================================
    tracking: {
        enabled: true,

        // UTM parameters para capturar da URL
        captureUTM: true,
        utmParams: ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"],

        // Parâmetros extras para capturar (ex: gclid, fbclid)
        extraParams: ["gclid", "fbclid", "ref", "source"],

        // Google Tag Manager
        gtm: {
            enabled: true,
            events: {
                widgetOpen: "whatsapp_widget_open",
                widgetClose: "whatsapp_widget_close",
                messageReceived: "whatsapp_widget_message",
                leadCaptured: "whatsapp_lead_captured",
                fieldFilled: "whatsapp_field_filled",
                redirected: "whatsapp_redirect",
                visitorReturned: "whatsapp_visitor_returned"
            }
        },

        // Tags customizadas
        customTags: {
            source: "whatsapp_widget",
            version: "1.0.0"
        },

        // Cache/Persistência de dados
        persistence: {
            enabled: true,
            expirationDays: 90,                     // Dados expiram após 90 dias
            trackVisits: true,                      // Rastreia visitas do usuário
            trackPages: true,                       // Rastreia páginas visitadas
            recognizeReturning: true                // Reconhece visitantes que retornam
        }
    },

    // ==========================================
    // INTEGRAÇÕES (Destino dos Dados)
    // ==========================================
    integrations: {
        // Webhook (Zapier, Make, N8N, seu backend)
        webhook: {
            enabled: false,
            url: "https://seu-webhook.com/endpoint",
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        },

        // Google Sheets via Apps Script
        googleSheets: {
            enabled: false,
            scriptUrl: "https://script.google.com/macros/s/SEU_SCRIPT_ID/exec"
        },

        // LocalStorage (sempre ativo para backup)
        localStorage: {
            enabled: true,
            key: "whatsapp_widget_leads"
        }
    },

    // ==========================================
    // APARÊNCIA
    // ==========================================
    appearance: {
        position: "right",                          // "right" ou "left"
        bottomOffset: "20px",                       // Distância do fundo
        sideOffset: "20px",                         // Distância da lateral
        zIndex: 999999,                             // z-index do widget

        // Cores principais
        colors: {
            primary: "#25D366",                     // Verde WhatsApp
            primaryDark: "#128C7E",                 // Verde escuro
            headerBg: "#075E54",                    // Fundo do cabeçalho
            chatBg: "#E5DDD5",                      // Fundo do chat
            bubbleBot: "#FFFFFF",                   // Balão do bot
            bubbleUser: "#DCF8C6",                  // Balão do usuário
            textDark: "#303030",                    // Texto escuro
            textLight: "#FFFFFF",                   // Texto claro
            textMuted: "#667781"                    // Texto secundário
        },

        // Animação do botão
        buttonAnimation: true,
        buttonPulse: true
    },

    // ==========================================
    // LGPD / POLÍTICA DE PRIVACIDADE
    // ==========================================
    privacy: {
        enabled: true,                              // Ativa checkbox de consentimento

        // Texto do checkbox (aparece ao lado da caixa)
        checkboxLabel: "Li, aceito os termos e quero receber contato!",

        // Texto do link (aparece após o checkbox)
        linkText: "Ver termos",

        // Mensagem de erro se não marcar o checkbox
        requiredMessage: "Marque a caixa acima para continuar",

        // Mensagem do bot pedindo confirmação (aparece após o telefone)
        confirmationMessage: "Só mais uma coisa! Confirma abaixo que aceita receber nosso contato 👇",

        // Declaração de consentimento (salva junto com o lead - LGPD)
        consentDeclaration: "Declaro que li e aceito a Política de Privacidade e autorizo o contato por WhatsApp, e-mail e telefone para receber informações sobre produtos e serviços.",

        // Conteúdo do modal (suporta HTML)
        modalTitle: "Política de Privacidade e Termos de Uso",
        modalContent: `
            <h3>Coleta de Dados</h3>
            <p>Ao preencher este formulário, você está fornecendo voluntariamente seus dados pessoais (nome, e-mail e telefone) para nossa empresa.</p>

            <h3>Finalidade</h3>
            <p>Seus dados serão utilizados para:</p>
            <ul>
                <li>Entrar em contato via WhatsApp, e-mail ou telefone</li>
                <li>Enviar informações sobre nossos produtos e serviços</li>
                <li>Oferecer atendimento personalizado</li>
            </ul>

            <h3>Consentimento</h3>
            <p>Ao marcar a caixa de aceite e enviar seus dados, você declara que:</p>
            <ul>
                <li>Concorda em receber mensagens via WhatsApp</li>
                <li>Concorda em receber e-mails informativos e promocionais</li>
                <li>Concorda em receber ligações telefônicas</li>
            </ul>

            <h3>Seus Direitos (LGPD)</h3>
            <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul>
                <li>Solicitar acesso aos seus dados</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão dos seus dados</li>
                <li>Revogar seu consentimento a qualquer momento</li>
            </ul>

            <h3>Contato</h3>
            <p>Para exercer seus direitos ou tirar dúvidas, entre em contato conosco.</p>
        `
    },

    // ==========================================
    // CONFIGURAÇÕES AVANÇADAS
    // ==========================================
    advanced: {
        debug: false,                               // Ativa logs no console
        storagePrefix: "wwl_",                      // Prefixo para localStorage
        sessionIdLength: 16,                        // Tamanho do ID de sessão
        maxStoredLeads: 100                         // Máximo de leads no localStorage
    }
};

// Não modifique abaixo desta linha
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WHATSAPP_WIDGET_CONFIG;
}
