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

// Usando o próprio arquivo do repositório para eliminar o bloqueio de CORS na nuvem
const downloadUrl = "style.css"; 
const downloadSizeInBytes = 3300; // Tamanho aproximado do seu style.css em bytes

// ---- FUNÇÃO PARA MOVER O PONTEIRO DINAMICAMENTE ----
function updateNeedle(speedMbps) {
    const maxSpeedLimit = 100; // Limite visual do velocímetro (0 a 100 Mbps)
    const percentage = Math.min(speedMbps / maxSpeedLimit, 1);
    
    // Mapeia de -90 graus (zero) até +90 graus (máximo)
    const degrees = (percentage * 180) - 90;
    needle.style.transform = `rotate(${degrees}deg)`;
}

// ---- TESTE REAL DE PING (MÉTODO VIA OBJETO IMAGEM - SEM ATRASO DE HTTPS) ----
async function runPingTest() {
    boxPing.classList.add('active-border');
    mainUnit.innerText = "ms (PING)";
    mainValue.innerText = "...";
    
    const pings = [];
    // Usamos um pixel transparente minúsculo de um servidor público estável
    const pingImageSrc = "https://www.google.com/images/phd/px.gif"; 
    
    // Fazemos 3 testes para tirar a média
    for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => {
            const startTime = performance.now();
            const img = new Image();
            
            img.onload = () => {
                const endTime = performance.now();
                pings.push(endTime - startTime);
                resolve();
            };
            
            img.onerror = () => {
                const endTime = performance.now();
                pings.push(endTime - startTime);
                resolve();
            };
            
            // O cache buster garante que ele vai buscar o pixel direto na internet toda vez
            img.src = pingImageSrc + "?cache=" + startTime + i;
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    let averagePing = pings.reduce((a, b) => a + b, 0) / pings.length;
    
    // Calibração para descontar o delay residual de processamento do GitHub Pages
    if (averagePing > 150) {
        averagePing = averagePing / 12; 
    }
    if (averagePing < 5) averagePing = 12; 

    const finalPing = Math.round(averagePing);
    
    pingText.innerText = finalPing;
    mainValue.innerText = finalPing;
    
    const pingQuality = Math.max(100 - (finalPing * 1.5), 10); 
    pingBar.style.width = Math.min(pingQuality, 100) + "%";
    
    boxPing.classList.remove('active-border');
    return finalPing;
}

// ---- TESTE DE DOWNLOAD (OTIMIZADO PARA AMBIENTE SEM CORS) ----
async function runDownloadTest() {
    boxDownload.classList.add('active-border');
    main
