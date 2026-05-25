const startBtn = document.getElementById('start-btn');
const mainValue = document.getElementById('main-value');
const mainUnit = document.getElementById('main-unit');
const needle = document.getElementById('needle');
const led = document.querySelector('.led');

const downText = document.getElementById('down-text');
const downBar = document.getElementById('down-bar');
const upText = document.getElementById('up-text');
const upBar = document.getElementById('up-bar');
const fpsText = document.getElementById('fps-text');
const fpsBar = document.getElementById('fps-bar');

const boxDownload = document.getElementById('box-download');
const boxUpload = document.getElementById('box-upload');

// Links públicos reais e seguros para os testes
const downloadUrl = "https://images.unsplash.com/photo-1541701494587-cb58502866ab"; 
const downloadSizeInBytes = 5242880; // Arquivo de 5MB
const uploadUrl = "https://httpbin.org/post";

// ---- MONITOR DE FPS REAL ----
let fpsCount = 0;
let lastFpsUpdateTime = performance.now();

function updateFPS() {
    fpsCount++;
    const now = performance.now();
    if (now >= lastFpsUpdateTime + 1000) {
        fpsText.innerText = fpsCount;
        // Normaliza a barra de progresso baseada em um monitor padrão de 60Hz
        const pct = Math.min((fpsCount / 60) * 100, 100);
        fpsBar.style.width = pct + "%";
        fpsCount = 0;
        lastFpsUpdateTime = now;
    }
    requestAnimationFrame(updateFPS);
}
// Inicializa o monitor de FPS em segundo plano imediatamente
requestAnimationFrame(updateFPS);


// ---- FUNÇÃO PARA MOVER O PONTEIRO DINAMICAMENTE ----
function updateNeedle(speedMbps) {
    // Definimos o limite máximo visual do velocímetro como 100 Mbps
    const maxSpeedLimit = 100;
    const percentage = Math.min(speedMbps / maxSpeedLimit, 1);
    
    // Mapeamento físico: 0 Mbps = -90deg (esquerda), 100+ Mbps = 90deg (direita)
    const degrees = (percentage * 180) - 90;
    needle.style.transform = `rotate(${degrees}deg)`;
}


// ---- TESTE REAL DE DOWNLOAD ----
async function runDownloadTest() {
    boxDownload.classList.add('active-border');
    mainUnit.innerText = "DOWN Mbps";
    
    const startTime = performance.now();
    const cacheBuster = "?t=" + startTime;
    
    const response = await fetch(downloadUrl + cacheBuster);
    if (!response.ok) throw new Error();
    await response.blob();
    
    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    
    const bitsLoaded = downloadSizeInBytes * 8;
    const speedMbps = ((bitsLoaded / durationInSeconds) / (1024 * 1024));
    
    // Animação do ponteiro subindo até o valor final
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
    updateNeedle(0); // Reseta o ponteiro para subir no upload
    
    // Criando um arquivo fictício pesado em memória (~1MB) para enviar
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
    
    // Atualiza ponteiro e painel com os dados do Upload
    updateNeedle(speedMbps);
    
    upText.innerText = speedMbps.toFixed(2);
    mainValue.innerText = speedMbps.toFixed(2);
    upBar.style.width = Math.min((speedMbps / 100) * 100, 100) + "%";
    
    boxUpload.classList.remove('active-border');
}


// ---- CONTROLE DO DISPARADOR ----
startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.innerText = "SCANNING...";
    led.classList.add('active');
    
    // Limpa marcações anteriores
    downText.innerText = "0.00";
    upText.innerText = "0.00";
    downBar.style.width = "0%";
    upBar.style.width = "0%";
    
    try {
        // Executa em ordem sequencial idêntica aos medidores oficiais
        await runDownloadTest();
        
        // Pequena pausa de transição de 1 segundo para visualização estética
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await runUploadTest();
        
    } catch (err) {
        console.error(err);
        mainValue.innerText = "ERR";
        alert("Falha crítica no hardware de rede ou barreira de CORS.");
    } finally {
        startBtn.disabled = false;
        startBtn.innerText = "INICIAR VARREDURA";
        led.classList.remove('active');
        mainUnit.innerText = "Mbps";
    }
});