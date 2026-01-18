/**
 * ============================================
 * WHATSAPP LEAD CAPTURE WIDGET - JAVASCRIPT
 * ============================================
 *
 * Widget independente de chat humanizado para
 * captação de leads com estética WhatsApp.
 */

(function() {
    'use strict';

    // Aguarda o config estar disponível
    const initWidget = () => {
        if (typeof WHATSAPP_WIDGET_CONFIG === 'undefined') {
            console.error('[WhatsApp Widget] Config não encontrado. Certifique-se de carregar whatsapp-widget-config.js primeiro.');
            return;
        }

        const CONFIG = WHATSAPP_WIDGET_CONFIG;
        const DEBUG = CONFIG.advanced?.debug || false;

        // ==========================================
        // UTILIDADES
        // ==========================================

        const log = (...args) => {
            if (DEBUG) console.log('[WhatsApp Widget]', ...args);
        };

        const generateId = (length = 16) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        const getRandomDelay = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        const getCurrentTime = () => {
            const now = new Date();
            return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        };

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // ==========================================
        // VALIDAÇÕES
        // ==========================================

        const validators = {
            name: (value) => {
                const trimmed = value.trim();
                // Mínimo 2 caracteres, apenas letras e espaços
                const regex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
                return regex.test(trimmed);
            },

            email: (value) => {
                const trimmed = value.trim().toLowerCase();
                // Validação de email robusta
                const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!regex.test(trimmed)) return false;

                // Verificações adicionais
                const [local, domain] = trimmed.split('@');
                if (local.length > 64 || domain.length > 255) return false;
                if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;

                return true;
            },

            phone: (value) => {
                // Remove tudo exceto números
                const numbers = value.replace(/\D/g, '');
                // Aceita 10 ou 11 dígitos (com ou sem 9)
                return numbers.length >= 10 && numbers.length <= 11;
            }
        };

        const formatPhone = (value) => {
            const numbers = value.replace(/\D/g, '');
            if (numbers.length <= 2) return numbers;
            if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
            if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
        };

        // ==========================================
        // TRACKING E ANALYTICS
        // ==========================================

        const STORAGE_PREFIX = CONFIG.advanced?.storagePrefix || 'wwl_';
        const EXPIRATION_DAYS = CONFIG.tracking?.persistence?.expirationDays || 90;

        // Storage Manager com expiração
        const storage = {
            set: (key, value, expirationDays = EXPIRATION_DAYS) => {
                try {
                    const item = {
                        value: value,
                        expiry: Date.now() + (expirationDays * 24 * 60 * 60 * 1000),
                        createdAt: Date.now()
                    };
                    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(item));
                    return true;
                } catch (e) {
                    console.warn('[WhatsApp Widget] Storage error:', e);
                    return false;
                }
            },

            get: (key) => {
                try {
                    const itemStr = localStorage.getItem(STORAGE_PREFIX + key);
                    if (!itemStr) return null;

                    const item = JSON.parse(itemStr);

                    // Verifica expiração
                    if (Date.now() > item.expiry) {
                        localStorage.removeItem(STORAGE_PREFIX + key);
                        return null;
                    }

                    return item.value;
                } catch (e) {
                    return null;
                }
            },

            update: (key, updateFn, expirationDays = EXPIRATION_DAYS) => {
                const current = storage.get(key);
                const updated = updateFn(current);
                return storage.set(key, updated, expirationDays);
            },

            remove: (key) => {
                try {
                    localStorage.removeItem(STORAGE_PREFIX + key);
                    return true;
                } catch (e) {
                    return false;
                }
            },

            // Limpa itens expirados
            cleanup: () => {
                try {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith(STORAGE_PREFIX)) {
                            const itemStr = localStorage.getItem(key);
                            if (itemStr) {
                                const item = JSON.parse(itemStr);
                                if (Date.now() > item.expiry) {
                                    keysToRemove.push(key);
                                }
                            }
                        }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    log('Storage cleanup: removed', keysToRemove.length, 'expired items');
                } catch (e) {
                    console.warn('[WhatsApp Widget] Cleanup error:', e);
                }
            }
        };

        // Visitor Tracking
        const visitor = {
            getId: () => {
                let visitorId = storage.get('visitor_id');
                if (!visitorId) {
                    visitorId = 'v_' + generateId(20) + '_' + Date.now();
                    storage.set('visitor_id', visitorId);
                }
                return visitorId;
            },

            getData: () => {
                return storage.get('visitor_data') || {
                    firstVisit: null,
                    lastVisit: null,
                    visitCount: 0,
                    pages: [],
                    utm: {},
                    extraParams: {},
                    leadData: null,
                    converted: false,
                    device: null,
                    referrer: null
                };
            },

            update: (data) => {
                storage.set('visitor_data', data);
            },

            isReturning: () => {
                const data = visitor.getData();
                return data.visitCount > 1;
            },

            hasConverted: () => {
                const data = visitor.getData();
                return data.converted === true;
            },

            getLeadData: () => {
                const data = visitor.getData();
                return data.leadData;
            }
        };

        // Captura UTMs e parâmetros extras
        const captureURLParams = () => {
            const params = new URLSearchParams(window.location.search);
            const captured = { utm: {}, extra: {} };

            // UTM params
            if (CONFIG.tracking.captureUTM) {
                CONFIG.tracking.utmParams.forEach(param => {
                    const value = params.get(param);
                    if (value) captured.utm[param] = value;
                });
            }

            // Extra params (gclid, fbclid, etc)
            if (CONFIG.tracking.extraParams) {
                CONFIG.tracking.extraParams.forEach(param => {
                    const value = params.get(param);
                    if (value) captured.extra[param] = value;
                });
            }

            return captured;
        };

        // Registra visita
        const trackVisit = () => {
            if (!CONFIG.tracking?.persistence?.enabled) return;

            const visitorId = visitor.getId();
            const data = visitor.getData();
            const now = new Date().toISOString();
            const urlParams = captureURLParams();

            // Primeira visita
            if (!data.firstVisit) {
                data.firstVisit = now;
                data.referrer = document.referrer || null;
                data.device = {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.platform,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    isMobile: isMobileDevice()
                };
            }

            // Atualiza última visita
            data.lastVisit = now;
            data.visitCount = (data.visitCount || 0) + 1;

            // Captura UTMs (mantém os primeiros, não sobrescreve)
            if (Object.keys(urlParams.utm).length > 0) {
                data.utm = { ...urlParams.utm, ...data.utm };
                // Salva também o UTM mais recente
                data.lastUtm = urlParams.utm;
            }

            // Captura params extras
            if (Object.keys(urlParams.extra).length > 0) {
                data.extraParams = { ...data.extraParams, ...urlParams.extra };
            }

            // Rastreia páginas visitadas
            if (CONFIG.tracking.persistence.trackPages) {
                const pageInfo = {
                    url: window.location.href,
                    path: window.location.pathname,
                    title: document.title,
                    visitedAt: now
                };

                if (!data.pages) data.pages = [];

                // Evita duplicatas consecutivas
                const lastPage = data.pages[data.pages.length - 1];
                if (!lastPage || lastPage.path !== pageInfo.path) {
                    data.pages.push(pageInfo);
                    // Mantém apenas as últimas 50 páginas
                    if (data.pages.length > 50) {
                        data.pages = data.pages.slice(-50);
                    }
                }
            }

            visitor.update(data);

            // Evento de visitante retornando
            if (data.visitCount > 1 && CONFIG.tracking.persistence.recognizeReturning) {
                pushToDataLayer(CONFIG.tracking.gtm.events.visitorReturned, {
                    visitorId: visitorId,
                    visitCount: data.visitCount,
                    firstVisit: data.firstVisit,
                    hasConverted: data.converted
                });

                log('Returning visitor detected:', visitorId, 'Visits:', data.visitCount);
            }

            return visitorId;
        };

        // Salva dados do lead no cache
        const cacheLeadData = (leadData) => {
            if (!CONFIG.tracking?.persistence?.enabled) return;

            const data = visitor.getData();
            data.leadData = leadData;
            data.converted = true;
            data.convertedAt = new Date().toISOString();
            visitor.update(data);

            log('Lead data cached for', EXPIRATION_DAYS, 'days');
        };

        // Recupera UTMs combinados (do cache + URL atual)
        const getUTMParams = () => {
            if (!CONFIG.tracking.captureUTM) return {};

            const urlParams = captureURLParams();
            const cachedData = visitor.getData();

            // Prioriza UTMs do cache (primeira visita), mas inclui novos se existirem
            return {
                ...cachedData.utm,
                ...urlParams.utm
            };
        };

        // Recupera todos os dados de tracking
        const getTrackingData = () => {
            const visitorId = visitor.getId();
            const data = visitor.getData();
            const urlParams = captureURLParams();

            return {
                visitorId: visitorId,
                firstVisit: data.firstVisit,
                lastVisit: data.lastVisit,
                visitCount: data.visitCount,
                isReturning: data.visitCount > 1,
                hasConverted: data.converted,
                convertedAt: data.convertedAt,
                utm: { ...data.utm, current: urlParams.utm },
                extraParams: { ...data.extraParams, ...urlParams.extra },
                referrer: data.referrer,
                device: data.device,
                pagesVisited: data.pages?.length || 0,
                cachedLeadData: data.leadData
            };
        };

        const pushToDataLayer = (eventName, data = {}) => {
            if (!CONFIG.tracking.gtm.enabled) return;

            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: eventName,
                ...data,
                ...CONFIG.tracking.customTags,
                visitorId: visitor.getId()
            });

            log('DataLayer push:', eventName, data);
        };

        // ==========================================
        // INTEGRAÇÕES
        // ==========================================

        const sendToWebhook = async (leadData) => {
            if (!CONFIG.integrations.webhook.enabled) return;

            try {
                const response = await fetch(CONFIG.integrations.webhook.url, {
                    method: CONFIG.integrations.webhook.method,
                    headers: CONFIG.integrations.webhook.headers,
                    body: JSON.stringify(leadData)
                });

                log('Webhook response:', response.status);
                return response.ok;
            } catch (error) {
                console.error('[WhatsApp Widget] Webhook error:', error);
                return false;
            }
        };

        const sendToGoogleSheets = async (leadData) => {
            if (!CONFIG.integrations.googleSheets.enabled) return;

            try {
                const response = await fetch(CONFIG.integrations.googleSheets.scriptUrl, {
                    method: 'POST',
                    body: JSON.stringify(leadData)
                });

                log('Google Sheets response:', response.status);
                return response.ok;
            } catch (error) {
                console.error('[WhatsApp Widget] Google Sheets error:', error);
                return false;
            }
        };

        const saveToLocalStorage = (leadData) => {
            if (!CONFIG.integrations.localStorage.enabled) return;

            try {
                const key = CONFIG.integrations.localStorage.key;
                const stored = JSON.parse(localStorage.getItem(key) || '[]');

                stored.push({
                    ...leadData,
                    savedAt: new Date().toISOString()
                });

                // Limita o número de leads armazenados
                while (stored.length > CONFIG.advanced.maxStoredLeads) {
                    stored.shift();
                }

                localStorage.setItem(key, JSON.stringify(stored));
                log('Saved to localStorage');
            } catch (error) {
                console.error('[WhatsApp Widget] LocalStorage error:', error);
            }
        };

        // ==========================================
        // ÍCONES SVG
        // ==========================================

        const icons = {
            whatsapp: `<svg viewBox="0 0 24 24" class="wwl-button-icon"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,

            back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,

            menu: `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`,

            send: `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,

            check: `<svg viewBox="0 0 16 15"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/></svg>`,

            doubleCheck: `<svg viewBox="0 0 16 15"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/></svg>`,

            defaultAvatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 212 212'%3E%3Cpath fill='%23DFE5E7' d='M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z'/%3E%3Cpath fill='%23FFF' d='M173.561 171.615a62.767 62.767 0 0 0-2.065-2.955 67.7 67.7 0 0 0-2.608-3.299 70.112 70.112 0 0 0-3.184-3.527 71.097 71.097 0 0 0-5.924-5.47 72.458 72.458 0 0 0-10.204-7.026 75.2 75.2 0 0 0-5.98-3.055c-.062-.028-.118-.059-.18-.087-9.792-4.44-22.106-7.529-37.416-7.529s-27.624 3.089-37.416 7.529c-.338.153-.653.318-.985.474a75.37 75.37 0 0 0-6.229 3.298 72.589 72.589 0 0 0-9.15 6.395 71.243 71.243 0 0 0-5.924 5.47 70.064 70.064 0 0 0-3.184 3.527 67.142 67.142 0 0 0-2.609 3.299 63.292 63.292 0 0 0-2.065 2.955 56.33 56.33 0 0 0-1.447 2.324c-.033.056-.073.119-.104.174a47.92 47.92 0 0 0-1.07 1.926c-.559 1.068-.818 1.678-.818 1.678v.398c18.285 17.927 43.322 28.985 70.945 28.985 27.678 0 52.761-11.103 71.055-29.095v-.289s-.619-1.45-1.992-3.778a58.346 58.346 0 0 0-1.446-2.322zM106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 3.624-.896 37.124 37.124 0 0 0 5.12-1.958 36.307 36.307 0 0 0 6.15-3.67 35.923 35.923 0 0 0 9.489-10.48 36.558 36.558 0 0 0 2.422-4.84 37.051 37.051 0 0 0 1.716-5.25c.299-1.208.542-2.443.725-3.701.275-1.887.417-3.827.417-5.811s-.142-3.925-.417-5.811a38.734 38.734 0 0 0-1.215-5.494 36.68 36.68 0 0 0-3.648-8.298 35.923 35.923 0 0 0-9.489-10.48 36.347 36.347 0 0 0-6.15-3.67 37.124 37.124 0 0 0-5.12-1.958 37.67 37.67 0 0 0-3.624-.896 39.875 39.875 0 0 0-7.68-.737c-21.162 0-37.345 16.183-37.345 37.345 0 21.159 16.183 37.342 37.345 37.342z'/%3E%3C/svg%3E`
        };

        // ==========================================
        // ESTADO DO WIDGET
        // ==========================================

        const state = {
            isOpen: false,
            sessionId: generateId(CONFIG.advanced.sessionIdLength),
            flowIndex: 0,
            leadData: {
                id: null,
                visitorId: null,
                name: '',
                email: '',
                phone: '',
                utm: {},
                tags: CONFIG.tracking.customTags,
                tracking: {},
                startedAt: null,
                completedAt: null,
                pageUrl: window.location.href,
                pageTitle: document.title,
                userAgent: navigator.userAgent,
                privacyAccepted: false,
                privacyAcceptedAt: null,
                consentDeclaration: null
            },
            notificationCount: 0,
            notificationMessages: [],  // Mensagens de notificação já adicionadas
            currentInputField: null,
            isProcessing: false,
            privacyAccepted: false,
            awaitingChoice: false,  // Flag para impedir fechar sem escolher
            timers: {
                firstNotification: null,
                secondNotification: null
            }
        };

        // ==========================================
        // CRIAÇÃO DO DOM
        // ==========================================

        const createWidget = () => {
            // Container principal
            const widget = document.createElement('div');
            widget.className = `wwl-widget ${CONFIG.appearance.position === 'left' ? 'wwl-left' : ''}`;
            widget.style.setProperty('--wwl-bottom-offset', CONFIG.appearance.bottomOffset);
            widget.style.setProperty('--wwl-side-offset', CONFIG.appearance.sideOffset);
            widget.style.setProperty('--wwl-z-index', CONFIG.appearance.zIndex);

            widget.innerHTML = `
                <!-- Balão de Preview (empilhamento de mensagens) -->
                <div class="wwl-preview">
                    <div class="wwl-preview-messages"></div>
                </div>

                <!-- Janela do Chat -->
                <div class="wwl-chat" role="dialog" aria-label="Chat WhatsApp">
                    <!-- Header -->
                    <div class="wwl-header">
                        <button class="wwl-header-back" aria-label="Fechar chat">
                            ${icons.back}
                        </button>
                        <div class="wwl-avatar-container">
                            <div class="wwl-avatar-ring">
                                <img
                                    src="${CONFIG.profile.photo || icons.defaultAvatar}"
                                    alt="${CONFIG.profile.name}"
                                    class="wwl-avatar"
                                    onerror="this.src='${icons.defaultAvatar}'"
                                >
                            </div>
                            <div class="wwl-status-dot ${CONFIG.profile.status !== 'online' ? 'wwl-offline' : ''}"></div>
                        </div>
                        <div class="wwl-header-info">
                            <div class="wwl-header-name">${CONFIG.profile.name}</div>
                            <div class="wwl-header-status">${CONFIG.profile.status === 'online' ? CONFIG.ui.online : CONFIG.profile.statusMessage}</div>
                        </div>
                        <button class="wwl-header-menu" aria-label="Menu">
                            ${icons.menu}
                        </button>
                    </div>

                    <!-- Menu Dropdown (fora do header para evitar overflow) -->
                    <div class="wwl-dropdown-menu wwl-hidden">
                        <button class="wwl-dropdown-item" data-action="privacy">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                            </svg>
                            <span>Política de Privacidade</span>
                        </button>
                        <button class="wwl-dropdown-item" data-action="thanks">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            <span>Agradecimento</span>
                        </button>
                        <div class="wwl-dropdown-divider"></div>
                        <button class="wwl-dropdown-item wwl-dropdown-close" data-action="close-chat">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                            <span>Fechar chat</span>
                        </button>
                        <button class="wwl-dropdown-item" data-action="close-menu">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                            </svg>
                            <span>Fechar menu</span>
                        </button>
                    </div>

                    <!-- Mensagens -->
                    <div class="wwl-messages" role="log" aria-live="polite"></div>

                    <!-- Consentimento LGPD -->
                    ${CONFIG.privacy?.enabled ? `
                    <div class="wwl-consent-area wwl-hidden">
                        <div class="wwl-consent-form">
                            <label class="wwl-consent-checkbox">
                                <input type="checkbox" class="wwl-consent-input">
                                <span class="wwl-consent-check"></span>
                                <span class="wwl-consent-label">${CONFIG.privacy.checkboxLabel}</span>
                            </label>
                            <button class="wwl-privacy-link" type="button">${CONFIG.privacy.linkText}</button>
                        </div>
                        <div class="wwl-consent-confirmed wwl-hidden">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <span>Aceite confirmado</span>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Input -->
                    <div class="wwl-input-area">
                        <div class="wwl-input-container">
                            <textarea
                                class="wwl-input"
                                placeholder="${CONFIG.ui.inputPlaceholder}"
                                rows="1"
                                disabled
                                aria-label="Digite sua mensagem"
                            ></textarea>
                        </div>
                        <button class="wwl-send-btn" disabled aria-label="Enviar mensagem">
                            ${icons.send}
                        </button>
                    </div>
                </div>

                <!-- Modal de Agradecimento -->
                <div class="wwl-thanks-modal">
                    <div class="wwl-thanks-backdrop"></div>
                    <div class="wwl-thanks-content">
                        <div class="wwl-thanks-icon">
                            <svg viewBox="0 0 24 24" width="40" height="40">
                                <path fill="#25D366" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </div>
                        <h3>Obrigado pelo contato!</h3>
                        <p>Agradecemos seu interesse. Nossa equipe esta pronta para te atender!</p>
                        <button class="wwl-thanks-close">OK</button>
                        <div class="wwl-thanks-hint">Toque para fechar</div>
                    </div>
                </div>

                <!-- Modal de Política de Privacidade -->
                ${CONFIG.privacy?.enabled ? `
                <div class="wwl-privacy-modal">
                    <div class="wwl-privacy-backdrop"></div>
                    <div class="wwl-privacy-content">
                        <div class="wwl-privacy-header">
                            <h2>${CONFIG.privacy.modalTitle}</h2>
                            <button class="wwl-privacy-close" aria-label="Fechar">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                        <div class="wwl-privacy-body">
                            ${CONFIG.privacy.modalContent}
                        </div>
                        <div class="wwl-privacy-footer">
                            <button class="wwl-privacy-accept">Entendi</button>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Botão Flutuante -->
                <button class="wwl-button ${CONFIG.appearance.buttonPulse ? 'wwl-pulse' : ''}" aria-label="Abrir chat WhatsApp">
                    ${icons.whatsapp}
                    <span class="wwl-badge" aria-live="polite">0</span>
                </button>
            `;

            document.body.appendChild(widget);
            return widget;
        };

        // ==========================================
        // REFERÊNCIAS DOM
        // ==========================================

        const widget = createWidget();
        const elements = {
            widget,
            button: widget.querySelector('.wwl-button'),
            badge: widget.querySelector('.wwl-badge'),
            preview: widget.querySelector('.wwl-preview'),
            previewMessages: widget.querySelector('.wwl-preview-messages'),
            chat: widget.querySelector('.wwl-chat'),
            messages: widget.querySelector('.wwl-messages'),
            input: widget.querySelector('.wwl-input'),
            sendBtn: widget.querySelector('.wwl-send-btn'),
            backBtn: widget.querySelector('.wwl-header-back'),
            // Menu dropdown
            menuBtn: widget.querySelector('.wwl-header-menu'),
            dropdownMenu: widget.querySelector('.wwl-dropdown-menu'),
            // Thanks modal
            thanksModal: widget.querySelector('.wwl-thanks-modal'),
            // Privacy/LGPD elements
            consentArea: widget.querySelector('.wwl-consent-area'),
            consentForm: widget.querySelector('.wwl-consent-form'),
            consentConfirmed: widget.querySelector('.wwl-consent-confirmed'),
            consentInput: widget.querySelector('.wwl-consent-input'),
            privacyLink: widget.querySelector('.wwl-privacy-link'),
            privacyModal: widget.querySelector('.wwl-privacy-modal'),
            privacyClose: widget.querySelector('.wwl-privacy-close'),
            privacyAccept: widget.querySelector('.wwl-privacy-accept'),
            privacyBackdrop: widget.querySelector('.wwl-privacy-backdrop')
        };

        // ==========================================
        // FUNÇÕES DO CHAT
        // ==========================================

        const scrollToBottom = () => {
            elements.messages.scrollTop = elements.messages.scrollHeight;
        };

        const addMessage = (type, text, showStatus = false) => {
            const messageEl = document.createElement('div');
            messageEl.className = `wwl-message wwl-${type}`;

            const isUser = type === 'user';
            const statusHtml = isUser ? `
                <div class="wwl-bubble-status ${showStatus ? 'wwl-read' : ''}">
                    ${icons.doubleCheck}
                </div>
            ` : '';

            messageEl.innerHTML = `
                <div class="wwl-bubble">
                    <div class="wwl-bubble-text">${text}</div>
                    <div class="wwl-bubble-footer">
                        <span class="wwl-bubble-time">${getCurrentTime()}</span>
                        ${statusHtml}
                    </div>
                </div>
            `;

            elements.messages.appendChild(messageEl);
            scrollToBottom();

            // Marca como lido após um delay
            if (isUser && !showStatus) {
                setTimeout(() => {
                    const statusEl = messageEl.querySelector('.wwl-bubble-status');
                    if (statusEl) statusEl.classList.add('wwl-read');
                }, CONFIG.timing.readReceiptDelay);
            }

            return messageEl;
        };

        const showTyping = () => {
            const typingEl = document.createElement('div');
            typingEl.className = 'wwl-typing';
            typingEl.innerHTML = `
                <div class="wwl-typing-bubble">
                    <div class="wwl-typing-dots">
                        <span class="wwl-typing-dot"></span>
                        <span class="wwl-typing-dot"></span>
                        <span class="wwl-typing-dot"></span>
                    </div>
                </div>
            `;
            elements.messages.appendChild(typingEl);
            scrollToBottom();
            return typingEl;
        };

        const hideTyping = (typingEl) => {
            if (typingEl && typingEl.parentNode) {
                typingEl.remove();
            }
        };

        const showError = (message) => {
            const errorEl = document.createElement('div');
            errorEl.className = 'wwl-error';
            errorEl.innerHTML = `<div class="wwl-error-text">${message}</div>`;
            elements.messages.appendChild(errorEl);
            scrollToBottom();

            setTimeout(() => {
                if (errorEl.parentNode) errorEl.remove();
            }, 3000);
        };

        // ==========================================
        // FUNÇÕES DE PRIVACIDADE / LGPD
        // ==========================================

        const showPrivacyModal = () => {
            if (elements.privacyModal) {
                elements.privacyModal.classList.add('wwl-show');
                log('Privacy modal opened');
            }
        };

        const hidePrivacyModal = () => {
            if (elements.privacyModal) {
                elements.privacyModal.classList.remove('wwl-show');
                log('Privacy modal closed');
            }
        };

        // ==========================================
        // FUNÇÕES DO MENU DROPDOWN
        // ==========================================

        const toggleDropdownMenu = () => {
            if (elements.dropdownMenu) {
                elements.dropdownMenu.classList.toggle('wwl-hidden');
            }
        };

        const hideDropdownMenu = () => {
            if (elements.dropdownMenu) {
                elements.dropdownMenu.classList.add('wwl-hidden');
            }
        };

        const showThanksModal = () => {
            if (elements.thanksModal) {
                elements.thanksModal.classList.add('wwl-show');
                hideDropdownMenu();
                log('Thanks modal opened');
            }
        };

        const hideThanksModal = () => {
            if (elements.thanksModal) {
                elements.thanksModal.classList.remove('wwl-show');
                log('Thanks modal closed');
            }
        };

        const handleMenuAction = (action) => {
            hideDropdownMenu();

            switch (action) {
                case 'privacy':
                    showPrivacyModal();
                    break;
                case 'thanks':
                    showThanksModal();
                    break;
                case 'close-chat':
                    closeChat();
                    break;
                case 'close-menu':
                    // Apenas fecha o menu (já fechado acima)
                    break;
            }
        };

        const showConsentArea = () => {
            if (elements.consentArea && CONFIG.privacy?.enabled) {
                elements.consentArea.classList.remove('wwl-hidden');
                // Se já aceitou, mostra confirmação; senão mostra formulário
                if (state.privacyAccepted) {
                    if (elements.consentForm) elements.consentForm.classList.add('wwl-hidden');
                    if (elements.consentConfirmed) elements.consentConfirmed.classList.remove('wwl-hidden');
                } else {
                    if (elements.consentForm) elements.consentForm.classList.remove('wwl-hidden');
                    if (elements.consentConfirmed) elements.consentConfirmed.classList.add('wwl-hidden');
                }
            }
        };

        const hideConsentArea = () => {
            if (elements.consentArea) {
                elements.consentArea.classList.add('wwl-hidden');
                // Reset do estado visual para uso futuro
                if (elements.consentForm) {
                    elements.consentForm.classList.remove('wwl-hidden');
                }
                if (elements.consentConfirmed) {
                    elements.consentConfirmed.classList.add('wwl-hidden');
                }
            }
        };

        const isConsentRequired = () => {
            return CONFIG.privacy?.enabled && !state.privacyAccepted;
        };

        const isConsentGiven = () => {
            if (!CONFIG.privacy?.enabled) return true;
            return elements.consentInput?.checked || state.privacyAccepted;
        };

        const recordConsent = () => {
            if (elements.consentInput?.checked) {
                state.privacyAccepted = true;
                state.leadData.privacyAccepted = true;
                state.leadData.privacyAcceptedAt = new Date().toISOString();
                state.leadData.consentDeclaration = CONFIG.privacy?.consentDeclaration ||
                    'Usuário aceitou os termos de privacidade e autorização de contato.';
                log('Privacy consent recorded:', state.leadData.consentDeclaration);
            }
        };

        const enableInput = (placeholder, fieldType) => {
            elements.input.disabled = false;
            elements.input.placeholder = placeholder;
            elements.sendBtn.disabled = false;
            elements.input.focus();
            state.currentInputField = fieldType;

            // Máscara para telefone
            if (fieldType === 'phone') {
                elements.input.addEventListener('input', handlePhoneInput);
            }
        };

        const disableInput = () => {
            elements.input.disabled = true;
            elements.input.placeholder = CONFIG.ui.inputPlaceholder;
            elements.sendBtn.disabled = true;
            elements.input.removeEventListener('input', handlePhoneInput);
            state.currentInputField = null;
        };

        const handlePhoneInput = (e) => {
            e.target.value = formatPhone(e.target.value);
        };

        // ==========================================
        // PROCESSAMENTO DO FLUXO
        // ==========================================

        const processText = (text) => {
            const isFemale = CONFIG.profile.gender === 'female';

            return text
                .replace(/{profileName}/g, CONFIG.profile.name)
                .replace(/{userName}/g, state.leadData.name || 'você')
                .replace(/{article}/g, isFemale ? 'a' : 'o')
                .replace(/{thanks}/g, isFemale ? 'Obrigada' : 'Obrigado')
                .replace(/{welcome}/g, isFemale ? 'Bem-vinda' : 'Bem-vindo');
        };

        const processFlow = async () => {
            if (state.isProcessing) return;
            state.isProcessing = true;

            const flow = CONFIG.messages.flow;

            while (state.flowIndex < flow.length) {
                const step = flow[state.flowIndex];

                if (step.type === 'bot') {
                    // Mostra digitando
                    const typingEl = showTyping();
                    const delay = getRandomDelay(
                        CONFIG.timing.typingDuration.min,
                        CONFIG.timing.typingDuration.max
                    );
                    await sleep(delay);
                    hideTyping(typingEl);

                    // Adiciona mensagem
                    addMessage('bot', processText(step.text));

                    pushToDataLayer(CONFIG.tracking.gtm.events.messageReceived, {
                        messageType: 'bot',
                        flowIndex: state.flowIndex
                    });

                    await sleep(CONFIG.timing.messageDelay);
                    state.flowIndex++;

                } else if (step.type === 'input') {
                    enableInput(step.placeholder, step.field);
                    state.isProcessing = false;
                    return; // Aguarda input do usuário

                } else if (step.type === 'redirect') {
                    // Verifica consentimento ANTES de redirecionar
                    if (CONFIG.privacy?.enabled && !state.privacyAccepted) {
                        // Usuário não deu o check - pede confirmação
                        const typingEl = showTyping();
                        const delay = getRandomDelay(
                            CONFIG.timing.typingDuration.min,
                            CONFIG.timing.typingDuration.max
                        );
                        await sleep(delay);
                        hideTyping(typingEl);

                        // Mensagem pedindo confirmação
                        const confirmMsg = CONFIG.privacy.confirmationMessage ||
                            'Só mais uma coisa! Confirma abaixo que aceita receber nosso contato 👇';
                        addMessage('bot', processText(confirmMsg));

                        // Aguarda consentimento
                        state.currentInputField = 'consent';
                        state.isProcessing = false;
                        return;
                    }

                    // Tem consentimento - prossegue com redirect
                    await sleep(CONFIG.timing.redirectDelay);
                    redirectToWhatsApp();
                    state.flowIndex++;
                }
            }

            state.isProcessing = false;
        };

        const handleUserInput = async () => {
            // Verifica se está aguardando consentimento (após preencher tudo)
            if (state.currentInputField === 'consent') {
                if (!state.privacyAccepted) {
                    showError(CONFIG.privacy?.requiredMessage || 'Marque a caixa acima para continuar');
                    return;
                }
                // Consentimento já foi dado (via checkbox), fluxo já continua automaticamente
                return;
            }

            const value = elements.input.value.trim();
            if (!value || !state.currentInputField) return;

            const currentStep = CONFIG.messages.flow[state.flowIndex];
            const fieldType = currentStep.validation;

            // Valida o input
            if (validators[fieldType] && !validators[fieldType](value)) {
                showError(CONFIG.messages.validation[fieldType]);
                elements.input.focus();
                return;
            }

            // Limpa e desabilita input
            elements.input.value = '';
            disableInput();

            // Adiciona mensagem do usuário
            let displayValue = value;
            if (fieldType === 'phone') {
                displayValue = formatPhone(value);
                state.leadData.phone = value.replace(/\D/g, '');
            } else if (fieldType === 'email') {
                state.leadData.email = value.trim().toLowerCase();
                displayValue = state.leadData.email;
            } else if (fieldType === 'name') {
                state.leadData.name = value.trim();
                displayValue = state.leadData.name;
            }

            addMessage('user', displayValue);

            pushToDataLayer(CONFIG.tracking.gtm.events.fieldFilled, {
                field: fieldType,
                flowIndex: state.flowIndex
            });

            state.flowIndex++;

            // Verifica se coletou todos os dados
            if (state.leadData.name && state.leadData.email && state.leadData.phone) {
                await saveLead();
            }

            // Continua o fluxo
            await sleep(CONFIG.timing.messageDelay);
            processFlow();
        };

        // ==========================================
        // SALVAR LEAD
        // ==========================================

        const saveLead = async () => {
            state.leadData.id = state.sessionId;
            state.leadData.completedAt = new Date().toISOString();
            state.leadData.utm = getUTMParams();

            // Adiciona dados completos de tracking
            const trackingData = getTrackingData();
            state.leadData.visitorId = trackingData.visitorId;
            state.leadData.tracking = {
                firstVisit: trackingData.firstVisit,
                lastVisit: trackingData.lastVisit,
                visitCount: trackingData.visitCount,
                isReturning: trackingData.isReturning,
                pagesVisited: trackingData.pagesVisited,
                referrer: trackingData.referrer,
                device: trackingData.device,
                extraParams: trackingData.extraParams
            };

            log('Lead data:', state.leadData);

            // Salva no cache persistente (90 dias)
            cacheLeadData(state.leadData);

            // Dispara evento no GTM
            pushToDataLayer(CONFIG.tracking.gtm.events.leadCaptured, {
                leadId: state.leadData.id,
                visitorId: state.leadData.visitorId,
                ...state.leadData
            });

            // Envia para as integrações
            await Promise.all([
                sendToWebhook(state.leadData),
                sendToGoogleSheets(state.leadData),
                Promise.resolve(saveToLocalStorage(state.leadData))
            ]);
        };

        // ==========================================
        // REDIRECIONAMENTO WHATSAPP
        // ==========================================

        const isMobileDevice = () => {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (window.innerWidth <= 768);
        };

        const buildWhatsAppURLs = () => {
            const number = CONFIG.whatsapp.number;
            let message = CONFIG.whatsapp.defaultMessage;

            // Formata o telefone para exibição
            const phoneFormatted = state.leadData.phone ? formatPhone(state.leadData.phone) : '';

            // Substitui variáveis na mensagem
            message = message
                .replace(/{userName}/g, state.leadData.name || '')
                .replace(/{userEmail}/g, state.leadData.email || '')
                .replace(/{userPhone}/g, phoneFormatted);

            const encodedMessage = encodeURIComponent(message);

            return {
                app: `https://wa.me/${number}?text=${encodedMessage}`,
                web: `https://web.whatsapp.com/send?phone=${number}&text=${encodedMessage}`
            };
        };

        // Tenta abrir WhatsApp em nova aba
        // Se popup for bloqueado, navegador mostra sua UI nativa
        const goToWhatsApp = (type = 'app') => {
            const urls = buildWhatsAppURLs();
            const url = type === 'web' ? urls.web : urls.app;

            pushToDataLayer(CONFIG.tracking.gtm.events.redirected, {
                leadId: state.leadData.id,
                redirectType: type
            });

            // Tenta abrir em nova aba - navegador mostra UI nativa se bloqueado
            window.open(url, '_blank', 'noopener,noreferrer');
            log('WhatsApp redirect attempted:', type);
        };


        // Mensagem com botoes estilo WhatsApp Business API
        // Desktop: 2 botoes (Web e App) - usuario DEVE escolher
        // Mobile: 1 botao (App) - padrao
        const showWhatsAppChoiceMessage = () => {
            const autoRedirectSeconds = 6; // 6 segundos para escolher
            let countdown = autoRedirectSeconds;
            let autoRedirectTimer = null;

            // Marca que usuario precisa escolher (impede fechar chat)
            state.awaitingChoice = true;

            // Constroi URLs para os botoes
            const urls = buildWhatsAppURLs();
            const isMobile = isMobileDevice();

            // Cria mensagem com botoes grandes e destacados
            const messageEl = document.createElement('div');
            messageEl.className = 'wwl-message wwl-bot wwl-choice-message';

            // Mobile: apenas botao do App | Desktop: dois botoes
            const buttonsHtml = isMobile ? `
                <a href="${urls.app}" target="_blank" rel="noopener noreferrer" class="wwl-bubble-btn wwl-bubble-btn-primary" data-type="app">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                        <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Abrir WhatsApp
                </a>
            ` : `
                <a href="${urls.web}" target="_blank" rel="noopener noreferrer" class="wwl-bubble-btn" data-type="web">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    WhatsApp Web
                </a>
                <a href="${urls.app}" target="_blank" rel="noopener noreferrer" class="wwl-bubble-btn wwl-bubble-btn-primary" data-type="app">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                        <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Aplicativo Desktop
                </a>
            `;

            messageEl.innerHTML = `
                <div class="wwl-bubble wwl-bubble-interactive">
                    <div class="wwl-bubble-text" style="font-size: 15px; font-weight: 500; text-align: center;">
                        ${isMobile ? 'Clique para abrir o WhatsApp:' : 'Escolha como quer abrir o WhatsApp:'}
                    </div>
                    <div class="wwl-bubble-buttons">
                        ${buttonsHtml}
                    </div>
                    <div class="wwl-bubble-footer">
                        <span class="wwl-bubble-time">${getCurrentTime()}</span>
                        <span class="wwl-bubble-countdown">Redirecionando em <strong>${countdown}s</strong></span>
                    </div>
                </div>
            `;

            elements.messages.appendChild(messageEl);
            scrollToBottom();

            const countdownEl = messageEl.querySelector('.wwl-bubble-countdown strong');
            const countdownContainer = messageEl.querySelector('.wwl-bubble-countdown');

            // Event listeners nos botoes
            const buttons = messageEl.querySelectorAll('.wwl-bubble-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Se esta em cooldown, ignora
                    if (btn.classList.contains('wwl-cooldown')) {
                        e.preventDefault();
                        return;
                    }

                    // Usuario fez escolha - libera para fechar
                    state.awaitingChoice = false;

                    // Para o timer de auto-redirect
                    clearInterval(autoRedirectTimer);

                    // Atualiza visual
                    if (countdownContainer) {
                        countdownContainer.innerHTML = '<span style="color: #25D366;">Abrindo...</span>';
                    }

                    // Marca o botao como clicado e adiciona cooldown
                    btn.classList.add('wwl-clicked');
                    btn.classList.add('wwl-cooldown');

                    // Remove cooldown apos 1.5 segundos (permite clicar novamente)
                    setTimeout(() => {
                        btn.classList.remove('wwl-cooldown');
                        if (countdownContainer) {
                            countdownContainer.innerHTML = '<span style="color: #667781;">Clique novamente se precisar</span>';
                        }
                    }, 1500);

                    // Dispara evento de tracking
                    const type = btn.dataset.type;
                    pushToDataLayer(CONFIG.tracking.gtm.events.redirected, {
                        leadId: state.leadData.id,
                        redirectType: type,
                        method: 'button_click'
                    });

                    log('WhatsApp redirect via button click:', type);
                });
            });

            // Auto-redirect apos 6 segundos
            autoRedirectTimer = setInterval(() => {
                countdown--;
                if (countdownEl) countdownEl.textContent = countdown + 's';

                if (countdown <= 0) {
                    clearInterval(autoRedirectTimer);

                    // Atualiza visual
                    if (countdownContainer) {
                        countdownContainer.innerHTML = '<span style="color: #25D366;">Abrindo...</span>';
                    }

                    // Libera para fechar e tenta abrir
                    state.awaitingChoice = false;
                    goToWhatsApp('app');
                    log('WhatsApp auto-redirect after 6s');
                }
            }, 1000);

            // Salva referencia do timer no state
            state.redirectTimer = autoRedirectTimer;
        };

        // Funcao legada mantida para compatibilidade
        const showWhatsAppChoice = () => {
            showWhatsAppChoiceMessage();
        };

        const redirectToWhatsApp = () => {
            // Mobile: vai direto pro app
            if (isMobileDevice()) {
                goToWhatsApp('app');
                return;
            }

            // Desktop: verifica config ou mostra escolha
            const desktopBehavior = CONFIG.whatsapp.desktopBehavior || 'ask';

            if (desktopBehavior === 'app') {
                goToWhatsApp('app');
            } else if (desktopBehavior === 'web') {
                goToWhatsApp('web');
            } else {
                // 'ask' - mostra modal de escolha
                showWhatsAppChoice();
            }
        };

        // ==========================================
        // CONTROLES DO WIDGET
        // ==========================================

        const openChat = () => {
            state.isOpen = true;
            elements.chat.classList.add('wwl-open');
            elements.preview.classList.remove('wwl-show');
            elements.badge.classList.remove('wwl-show');
            state.notificationCount = 0;

            // Cancela timers de notificação
            clearTimeout(state.timers.firstNotification);
            clearTimeout(state.timers.secondNotification);

            // Registra início se for primeira vez
            if (!state.leadData.startedAt) {
                state.leadData.startedAt = new Date().toISOString();
            }

            pushToDataLayer(CONFIG.tracking.gtm.events.widgetOpen, {
                sessionId: state.sessionId
            });

            // Mostra área de consentimento desde o início (se habilitado e não aceito)
            if (CONFIG.privacy?.enabled && !state.privacyAccepted) {
                showConsentArea();
            }

            // Se já tem mensagens de notificação, continua o fluxo a partir do input
            // Se não, inicia o fluxo normalmente
            if (state.flowIndex === 0 && !state.isProcessing) {
                setTimeout(() => processFlow(), 500);
            }

            log('Chat opened');
        };

        const closeChat = () => {
            // Se esta aguardando escolha de WhatsApp, impede fechar
            if (state.awaitingChoice) {
                // Scroll para os botoes e destaca
                scrollToBottom();
                const choiceMsg = elements.messages.querySelector('.wwl-choice-message');
                if (choiceMsg) {
                    choiceMsg.style.animation = 'none';
                    choiceMsg.offsetHeight; // Trigger reflow
                    choiceMsg.style.animation = 'wwl-shake 0.5s ease';
                }
                log('Cannot close - awaiting WhatsApp choice');
                return;
            }

            state.isOpen = false;
            elements.chat.classList.remove('wwl-open');

            pushToDataLayer(CONFIG.tracking.gtm.events.widgetClose, {
                sessionId: state.sessionId,
                flowIndex: state.flowIndex
            });

            log('Chat closed');
        };

        const showNotification = (index) => {
            const messages = CONFIG.messages.notifications;
            if (index >= messages.length) return;

            // Processa variáveis na mensagem
            const messageText = processText(messages[index]);
            const timeNow = getCurrentTime();

            // Adiciona mensagem dentro do chat (sincronizado)
            addMessage('bot', messageText);
            state.notificationMessages.push(messageText);

            // Cria elemento de mensagem para o preview (empilhamento)
            const previewMsg = document.createElement('div');
            previewMsg.className = 'wwl-preview-msg';
            previewMsg.innerHTML = `
                <div class="wwl-preview-msg-text">${messageText}</div>
                <div class="wwl-preview-msg-time">${timeNow}</div>
            `;
            elements.previewMessages.appendChild(previewMsg);

            // Mostra o preview
            elements.preview.classList.add('wwl-show');

            // Anima a entrada da nova mensagem
            requestAnimationFrame(() => {
                previewMsg.classList.add('wwl-show');
            });

            // Atualiza badge de notificação
            state.notificationCount = index + 1;
            elements.badge.textContent = state.notificationCount;
            elements.badge.classList.add('wwl-show');

            log('Notification shown:', index + 1);
        };

        // ==========================================
        // EVENT LISTENERS
        // ==========================================

        // Botão principal
        elements.button.addEventListener('click', () => {
            if (state.isOpen) {
                closeChat();
            } else {
                openChat();
            }
        });

        // Botão voltar/fechar
        elements.backBtn.addEventListener('click', closeChat);

        // Menu dropdown (3 pontinhos)
        if (elements.menuBtn) {
            elements.menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdownMenu();
            });
        }

        // Itens do menu dropdown
        if (elements.dropdownMenu) {
            elements.dropdownMenu.addEventListener('click', (e) => {
                const item = e.target.closest('.wwl-dropdown-item');
                if (item) {
                    const action = item.dataset.action;
                    handleMenuAction(action);
                }
            });
        }

        // Fecha dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (elements.dropdownMenu && !elements.dropdownMenu.classList.contains('wwl-hidden')) {
                if (!elements.dropdownMenu.contains(e.target) && !elements.menuBtn.contains(e.target)) {
                    hideDropdownMenu();
                }
            }
        });

        // Modal de Agradecimento - fecha ao clicar em qualquer lugar
        if (elements.thanksModal) {
            elements.thanksModal.addEventListener('click', hideThanksModal);
        }

        // Clique no preview abre o chat
        elements.preview.addEventListener('click', openChat);

        // Enviar mensagem
        elements.sendBtn.addEventListener('click', handleUserInput);

        // Enter para enviar
        elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserInput();
            }
        });

        // Auto-resize do textarea
        elements.input.addEventListener('input', () => {
            elements.input.style.height = 'auto';
            elements.input.style.height = Math.min(elements.input.scrollHeight, 100) + 'px';
        });

        // Fecha ao clicar fora (opcional)
        document.addEventListener('click', (e) => {
            if (state.isOpen && !widget.contains(e.target)) {
                // Descomente para fechar ao clicar fora:
                // closeChat();
            }
        });

        // Tecla ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isOpen) {
                // Fecha modal de agradecimento primeiro
                if (elements.thanksModal?.classList.contains('wwl-show')) {
                    hideThanksModal();
                // Fecha modal de privacidade
                } else if (elements.privacyModal?.classList.contains('wwl-show')) {
                    hidePrivacyModal();
                // Fecha dropdown menu
                } else if (elements.dropdownMenu && !elements.dropdownMenu.classList.contains('wwl-hidden')) {
                    hideDropdownMenu();
                } else {
                    closeChat();
                }
            }
        });

        // Event listeners para Privacy/LGPD
        if (CONFIG.privacy?.enabled) {
            // Checkbox de consentimento - minimiza ao marcar
            if (elements.consentInput) {
                elements.consentInput.addEventListener('change', () => {
                    if (elements.consentInput.checked) {
                        // Esconde o formulário e mostra confirmação
                        if (elements.consentForm) {
                            elements.consentForm.classList.add('wwl-hidden');
                        }
                        if (elements.consentConfirmed) {
                            elements.consentConfirmed.classList.remove('wwl-hidden');
                        }
                        // Registra o consentimento imediatamente
                        recordConsent();

                        // Se estava aguardando consentimento (após telefone), continua o fluxo
                        if (state.currentInputField === 'consent') {
                            state.currentInputField = null;
                            addMessage('user', '✓ Aceito receber contato');
                            setTimeout(() => processFlow(), CONFIG.timing.messageDelay);
                        }
                    } else {
                        // Mostra o formulário novamente (caso desmarque)
                        if (elements.consentForm) {
                            elements.consentForm.classList.remove('wwl-hidden');
                        }
                        if (elements.consentConfirmed) {
                            elements.consentConfirmed.classList.add('wwl-hidden');
                        }
                        // Remove o consentimento
                        state.privacyAccepted = false;
                        state.leadData.privacyAccepted = false;
                        state.leadData.privacyAcceptedAt = null;
                        state.leadData.consentDeclaration = null;
                    }
                });
            }

            // Link para abrir modal de privacidade
            if (elements.privacyLink) {
                elements.privacyLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    showPrivacyModal();
                });
            }

            // Botão fechar modal
            if (elements.privacyClose) {
                elements.privacyClose.addEventListener('click', hidePrivacyModal);
            }

            // Botão "Entendi" no modal
            if (elements.privacyAccept) {
                elements.privacyAccept.addEventListener('click', hidePrivacyModal);
            }

            // Clique no backdrop fecha modal
            if (elements.privacyBackdrop) {
                elements.privacyBackdrop.addEventListener('click', hidePrivacyModal);
            }
        }

        // ==========================================
        // INICIALIZAÇÃO
        // ==========================================

        const init = () => {
            // Limpa itens expirados do storage
            storage.cleanup();

            // Registra visita e obtém/cria visitor ID
            const visitorId = trackVisit();

            log('Widget initialized');
            log('Session ID:', state.sessionId);
            log('Visitor ID:', visitorId);

            // Captura UTMs (do cache + URL atual)
            state.leadData.utm = getUTMParams();

            // Adiciona dados de tracking ao lead
            const trackingData = getTrackingData();
            state.leadData.visitorId = visitorId;
            state.leadData.tracking = {
                firstVisit: trackingData.firstVisit,
                visitCount: trackingData.visitCount,
                isReturning: trackingData.isReturning,
                referrer: trackingData.referrer,
                extraParams: trackingData.extraParams
            };

            // Se é visitante que já converteu, loga
            if (trackingData.hasConverted) {
                log('Returning converted visitor:', trackingData.cachedLeadData?.name);
            }

            // Primeira notificação após X segundos
            state.timers.firstNotification = setTimeout(() => {
                if (!state.isOpen) {
                    showNotification(0);

                    // Segunda notificação após mais X segundos
                    state.timers.secondNotification = setTimeout(() => {
                        if (!state.isOpen) {
                            showNotification(1);
                        }
                    }, CONFIG.timing.secondNotification);
                }
            }, CONFIG.timing.firstNotification);
        };

        // Inicia o widget
        init();

        // Expõe API pública (opcional)
        window.WhatsAppWidget = {
            open: openChat,
            close: closeChat,
            getLeadData: () => ({ ...state.leadData }),
            getSessionId: () => state.sessionId,
            // Funções de Tracking
            getVisitorId: () => visitor.getId(),
            getTrackingData: getTrackingData,
            isReturningVisitor: () => visitor.isReturning(),
            hasConverted: () => visitor.hasConverted(),
            getCachedLead: () => visitor.getLeadData(),
            // Storage direto (para debug)
            storage: {
                get: storage.get,
                cleanup: storage.cleanup
            }
        };
    };

    // Executa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

})();
