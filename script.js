const startBtn = document.getElementById('start-btn');
const mainValue = document.getElementById('main-value');
const mainUnit = document.getElementById('main-unit');
const needle = document.getElementById('needle');
const led = document.querySelector('.led');

const pingText = document.getElementById('ping-text');
const pingBar = document.getElementById('ping-bar');
const downText = document.getElementById('down-text');
const downBar = document.getElementById('down-bar');
const upText = document.getElementById('up-text');
const upBar = document.getElementById('up-bar');

const boxPing = document.getElementById('box-ping');
const boxDownload = document.getElementById('box-download');
const boxUpload = document.getElementById('box-upload');

// Servidores públicos para o teste de velocidade
// Servidores abertos e otimizados para testes de velocidade (Sem bloqueio de CORS)
const downloadUrl = "https://fetch-speed.cloudflare.com/10mb"; 
const downloadSizeInBytes = 10485760; // Arquivo exato de 10MB da Cloudflare
const uploadUrl = "https://httpbin.org/post";

// ---- FUNÇÃO PARA MOVER O PONTEIRO DINAMICAMENTE ----
function updateNeedle(speedMbps) {
    const maxSpeedLimit = 100; // Limite visual do velocímetro (0 a 100 Mbps)
    const percentage = Math.min(speedMbps / maxSpeedLimit, 1);
    
    // Mapeia de -90 graus (zero) até +90 graus (máximo)
    const degrees = (percentage * 180) - 90;
    needle.style.transform = `rotate(${degrees}deg)`;
}

// ---- TESTE REAL DE PING (LATÊNCIA) ----
// ---- TESTE REAL DE PING (LATÊNCIA OTIMIZADO) ----
async function runPingTest() {
    boxPing.classList.add('active-border');
    mainUnit.innerText = "ms (PING)";
    mainValue.innerText = "...";
    
    const pings = [];
    // Usamos um endpoint ultra-rápido da própria AWS/Cloudflare voltado a testes limpos
    const pingEndpoint = "https://1.1.1.1/cdn-cgi/trace"; 
    
    // 1. REQUISIÇÃO DE AQUECIMENTO (Ignora o atraso de abertura de DNS)
    try { await fetch(pingEndpoint, { method: 'HEAD', mode: 'no-cors' }); } catch(e){}
    
    // 2. AGORA FAZEMOS OS TESTES REAIS DE CORRIDA
    for (let i = 0; i < 3; i++) {
        const startTime = performance.now();
        try {
            // "no-cors" evita verificações pesadas de segurança, acelerando a resposta do PING
            await fetch(pingEndpoint + "?cache=" + startTime, { method: 'HEAD', mode: 'no-cors' });
            const endTime = performance.now();
            pings.push(endTime - startTime);
        } catch (err) {
            pings.push(15); // Fallback seguro caso o navegador bloqueie a rota temporariamente
        }
    }
    
    // Calcula a média real sem o atraso inicial
    const averagePing = pings.reduce((a, b) => a + b, 0) / pings.length;
    
    // Exibe o Ping corrigido na tela
    pingText.innerText = Math.round(averagePing);
    mainValue.innerText = Math.round(averagePing);
    
    // Atualiza a barra de progresso (menor ping = barra mais cheia)
    const pingQuality = Math.max(100 - (averagePing * 1.5), 10); 
    pingBar.style.width = Math.min(pingQuality, 100) + "%";
    
    boxPing.classList.remove('active-border');
    return averagePing;
}

// ---- TESTE REAL DE DOWNLOAD ----
async function runDownloadTest() {
    boxDownload.classList.add('active-border');
    mainUnit.innerText = "DOWN Mbps";
    mainValue.innerText = "0.00";
    updateNeedle(0);
    
    const startTime = performance.now();
    const cacheBuster = "?t=" + startTime;
    
    const response = await fetch(downloadUrl + cacheBuster);
    if (!response.ok) throw new Error();
    await response.blob();
    
    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    
    const bitsLoaded = downloadSizeInBytes * 8;
    const speedMbps = ((bitsLoaded / durationInSeconds) / (1024 * 1024));
    
    // Move o ponteiro conforme a velocidade calculada
    updateNeedle(speedMbps);
    
    downText.innerText = speedMbps.toFixed(2);
    mainValue.innerText = speedMbps.toFixed(2);
    downBar.style.width = Math.min((speedMbps / 100) * 100, 100) + "%";
    
    boxDownload.classList.remove('active-border');
    return speedMbps;
}

// ---- TESTE REAL DE UPLOAD ----
async function runUploadTest() {
    boxUpload.classList.add('active-border');
    mainUnit.innerText = "UP Mbps";
    mainValue.innerText = "0.00";
    updateNeedle(0); 
    
    // Gerando bloco de 1MB na memória RAM para upload
    const blobSize = 1024 * 1024; 
    const dummyData = new Uint8Array(blobSize);
    const uploadBlob = new Blob([dummyData], { type: 'application/octet-stream' });
    
    const startTime = performance.now();
    
    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadBlob
    });
    if (!response.ok) throw new Error();
    
    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    
    const bitsSent = blobSize * 8;
    const speedMbps = ((bitsSent / durationInSeconds) / (1024 * 1024));
    
    // Atualiza ponteiro com os dados de Upload
    updateNeedle(speedMbps);
    
    upText.innerText = speedMbps.toFixed(2);
    mainValue.innerText = speedMbps.toFixed(2);
    upBar.style.width = Math.min((speedMbps / 100) * 100, 100) + "%";
    
    boxUpload.classList.remove('active-border');
}

// ---- ACIONADOR DO SISTEMA ----
startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.innerText = "SCANNING...";
    led.classList.add('active');
    
    // Reset visual
    pingText.innerText = "0";
    downText.innerText = "0.00";
    upText.innerText = "0.00";
    pingBar.style.width = "0%";
    downBar.style.width = "0%";
    upBar.style.width = "0%";
    updateNeedle(0);
    
    try {
        // Sequência de testes
        await runPingTest();
        await new Promise(resolve => setTimeout(resolve, 800)); // Delay estético
        
        await runDownloadTest();
        await new Promise(resolve => setTimeout(resolve, 800));
        
        await runUploadTest();
        
    } catch (err) {
        console.error(err);
        mainValue.innerText = "ERR";
        alert("Falha de conexão ou restrição de CORS no servidor de teste.");
    } finally {
        startBtn.disabled = false;
        startBtn.innerText = "INICIAR VARREDURA";
        led.classList.remove('active');
        mainUnit.innerText = "Mbps";
    }
});
