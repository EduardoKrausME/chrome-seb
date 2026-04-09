// background.js

const RULE_ID_UA = 1;
const RULE_ID_HEADERS = 2;

// 1. Configuração inicial do User-Agent (Sempre Ativo)
chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID_UA],
    addRules: [{
        id: RULE_ID_UA,
        priority: 1,
        action: {
            type: "modifyHeaders",
            requestHeaders: [
                {
                    header: "User-Agent",
                    operation: "set",
                    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15 SEB/3.6.1 SEB/3.5.4 SEB/3.6"
                },
                {
                    header: "sec-ch-ua",
                    operation: "remove"
                }
            ]
        },
        condition: {
            regexFilter: ".*/(mod/quiz|lib/ajax)/.*",
            resourceTypes: [
                "main_frame",
                "sub_frame",
                "xmlhttprequest"
            ]
        }
    }]
});

// 2. Listener do Storage: Atualiza os Headers quando os dados mudam
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.seb_bypass_data) {
        const data = changes.seb_bypass_data.newValue;
        if (data && data.requestHash) {
            updateNetworkHeaders(data.requestHash, data.configKeyHash);
        }
    }
});

function updateNetworkHeaders(reqHash, confHash) {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID_HEADERS],
        addRules: [{
            id: RULE_ID_HEADERS,
            priority: 2,
            action: {
                type: "modifyHeaders",
                requestHeaders: [
                    {
                        header: "X-SafeExamBrowser-RequestHash",
                        operation: "set",
                        value: reqHash
                    },
                    {
                        header: "X-SafeExamBrowser-ConfigKeyHash",
                        operation: "set",
                        value: confHash
                    }
                ]
            },
            condition: {
                urlFilter: "|*mod/quiz/*",
                resourceTypes: [
                    "main_frame",
                    "sub_frame",
                    "xmlhttprequest"
                ]
            }
        }]
    }).then(() => {
        console.log("[Background] Regras de Headers atualizadas via Storage.");
    });
}

// 3. Injeção do window.SafeExamBrowser pelo Background (world: "MAIN")
chrome.webNavigation.onCommitted.addListener(async (details) => {
    // Verifica se é uma navegação no frame principal e se é URL de quiz
    if (details.frameId === 0 && details.url.includes("/mod/quiz/")) {

        // Busca as chaves no storage
        const storage = await chrome.storage.local.get("seb_bypass_data");
        const data = storage.seb_bypass_data;

        if (data && data.configKey && data.browserExamKey) {
            chrome.scripting.executeScript({
                target: { tabId: details.tabId },
                world: "MAIN", // ISSO PERMITE ACESSAR O WINDOW REAL DA PÁGINA
                func: injectSebObject,
                args: [data.configKey, data.browserExamKey]
            }).then(() => console.log("[Background] Objeto SEB injetado no DOM via Scripting API"));
        }
    }
});

// Função que será executada dentro da página (DOM Real)
function injectSebObject(cKey, bKey) {
    window.SafeExamBrowser = {
        security: {
            configKey: cKey,
            browserExamKey: bKey,
            updateKeys: function(ck, bk) { console.log('SEB Keys updated mock'); }
        }
    };
    console.log("%c[SEB PoC] Ambiente Virtualizado Ativo.", "color: green; font-weight: bold; font-size: 14px;");
}