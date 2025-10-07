const inputElement = document.getElementById('target-input');
const keyRows = Array.from(document.querySelectorAll('.key-row'));
const ttsFeedback = document.getElementById('tts-feedback');
const scanSpeedInput = document.getElementById('scan-speed');
const speedValueSpan = document.getElementById('speed-value');

const SWITCH_KEY_CODE = 32; // Spacebar

// --- Global State ---
let isScanning = false;
let isScanningRows = true;
let scanTimer = null;
let activeGroupIndex = -1;
let activeKeyIndex = -1;
let currentScanSpeed = parseInt(scanSpeedInput.value); 

// --- Core Utility Functions ---

function resetScanClasses() {
    keyRows.forEach(row => {
        row.classList.remove('active-group');
        row.querySelectorAll('.key').forEach(key => key.classList.remove('active-key'));
    });
}

function speakText(text) {
    // Web Speech API for TTS (Cognitive/Visual)
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
        
        // Use ARIA live region for screen reader confirmation
        ttsFeedback.textContent = text;
    }
}

function executeKeyAction(keyData) {
    const key = keyData.getAttribute('data-key');
    const action = keyData.getAttribute('data-action');
    let outputText = '';

    inputElement.focus(); 

    if (action === 'delete') {
        inputElement.value = inputElement.value.slice(0, -1);
        outputText = 'Delete';
    } else if (action === 'space') {
        inputElement.value += ' ';
        outputText = 'Space';
    } else if (action === 'enter') {
        inputElement.value += '\n';
        outputText = 'Enter';
    } else {
        inputElement.value += key.toLowerCase();
        outputText = key.toLowerCase();
    }
    
    // Provide instant feedback for Cognitive and Screen Reader users
    speakText(outputText);
}

// --- Scanning Logic ---

function startRowScan() {
    stopScan();
    isScanningRows = true;
    isScanning = true;
    activeKeyIndex = -1;
    activeGroupIndex = 0;
    
    keyRows[activeGroupIndex].classList.add('active-group');

    scanTimer = setInterval(() => {
        keyRows[activeGroupIndex].classList.remove('active-group');
        activeGroupIndex = (activeGroupIndex + 1) % keyRows.length;
        keyRows[activeGroupIndex].classList.add('active-group');
    }, currentScanSpeed); // Uses dynamic speed
}

function startKeyScan() {
    stopScan();
    isScanningRows = false;
    isScanning = true;
    
    const activeRow = keyRows[activeGroupIndex];
    const keysInRow = Array.from(activeRow.querySelectorAll('.key'));
    activeKeyIndex = 0;
    
    activeRow.classList.remove('active-group');
    keysInRow[activeKeyIndex].classList.add('active-key');

    scanTimer = setInterval(() => {
        keysInRow[activeKeyIndex].classList.remove('active-key');
        activeKeyIndex = (activeKeyIndex + 1) % keysInRow.length;
        keysInRow[activeKeyIndex].classList.add('active-key');
    }, currentScanSpeed / 2); // Key scanning is half the row speed
}

function stopScan() {
    if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = null;
    }
    isScanning = false;
}

// --- Main Input Handler (The "Switch Click" Logic) ---

function handleSwitchClick() {
    if (!isScanning) {
        // Start the Row Scan.
        resetScanClasses();
        startRowScan();
    } else if (isScanningRows) {
        // Select the row and start Key Scan.
        startKeyScan();
    } else {
        // Execute the action and reset the whole process.
        stopScan(); 
        
        const activeRow = keyRows[activeGroupIndex];
        const keysInRow = Array.from(activeRow.querySelectorAll('.key'));
        const selectedKeyData = keysInRow[activeKeyIndex];
        
        executeKeyAction(selectedKeyData);
        
        // Restart the row scan for continuous input
        resetScanClasses();
        startRowScan(); 
    }
}

// --- Event Listeners and Setup ---

// 1. Listen for the Switch Input (Spacebar)
document.addEventListener('keydown', (e) => {
    if (e.keyCode === SWITCH_KEY_CODE) {
        e.preventDefault(); 
        handleSwitchClick();
    }
});

// 2. Theme Toggle (Visual/Color Blindness)
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-contrast');
});

// 3. Scan Speed Adjustment (Cognitive)
scanSpeedInput.addEventListener('input', (e) => {
    currentScanSpeed = parseInt(e.target.value);
    speedValueSpan.textContent = currentScanSpeed + 'ms';
    // Restart scan immediately if running to apply new speed
    if (isScanning) {
        // The current phase is maintained, but the timer is recreated with the new speed
        if (isScanningRows) {
            startRowScan();
        } else {
            // Need to save the current key index before restarting the key scan
            const tempGroupIndex = activeGroupIndex;
            // Stop, then immediately start the key scan with the new speed
            startKeyScan(tempGroupIndex); 
        }
    }
});

// 4. TTS Read Button (Cognitive/Visual)
document.getElementById('speak-button').addEventListener('click', () => {
    const textToSpeak = inputElement.value || 'Input area is empty.';
    speakText(textToSpeak);
});


// Initial call to set up the system, ready for the first spacebar press
resetScanClasses();