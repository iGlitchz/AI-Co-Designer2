// ==================== SETTINGS PANEL FUNCTIONALITY ====================
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const primaryColorInput = document.getElementById('primaryColor');
const primaryColorHex = document.getElementById('primaryColorHex');
const secondaryColorInput = document.getElementById('secondaryColor');
const secondaryColorHex = document.getElementById('secondaryColorHex');
const resetColorsBtn = document.getElementById('resetColorsBtn');
const nightModeToggle = document.getElementById('nightModeToggle');
const customInstructionsTextarea = document.getElementById('customInstructions');
const brandMasterFolderInput = document.getElementById('brandMasterFolder');
const browseFolderBtn = document.getElementById('browseFolderBtn');
const folderInput = document.getElementById('folderInput');

// Default colors
const defaultColors = {
    primary: '#667eea',
    secondary: '#764ba2'
};

// Load settings from localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('chatSettings') || '{}');

    // Load night mode first so the rest of UI paints in the right theme.
    const isNightMode = Boolean(settings.nightMode);
    if (nightModeToggle) {
        nightModeToggle.checked = isNightMode;
    }
    applyNightMode(isNightMode);
    
    // Load colors
    if (settings.primaryColor) {
        primaryColorInput.value = settings.primaryColor;
        primaryColorHex.value = settings.primaryColor;
        applyColors(settings.primaryColor, settings.secondaryColor || defaultColors.secondary);
    }
    if (settings.secondaryColor) {
        secondaryColorInput.value = settings.secondaryColor;
        secondaryColorHex.value = settings.secondaryColor;
    }
    
    // Load custom instructions
    if (settings.customInstructions) {
        customInstructionsTextarea.value = settings.customInstructions;
    }
    
    // Load brand master folder
    if (settings.brandMasterFolder) {
        brandMasterFolderInput.value = settings.brandMasterFolder;
    }
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        primaryColor: primaryColorInput.value,
        secondaryColor: secondaryColorInput.value,
        nightMode: nightModeToggle ? nightModeToggle.checked : false,
        customInstructions: customInstructionsTextarea.value.trim(),
        brandMasterFolder: brandMasterFolderInput.value.trim()
    };
    
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    applyColors(settings.primaryColor, settings.secondaryColor);
    applyNightMode(settings.nightMode);
    
    // Show confirmation
    const originalText = saveSettingsBtn.textContent;
    saveSettingsBtn.textContent = '✓ Settings Saved!';
    saveSettingsBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
    setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
        saveSettingsBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 2000);
    
    console.log('✅ Settings saved:', settings);
}

function applyNightMode(enabled) {
    document.body.classList.toggle('night-mode', Boolean(enabled));
}

// Apply colors to the interface
function applyColors(primary, secondary) {
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);

    // Clear stale inline tab styles from previously active tabs.
    document.querySelectorAll('.view-tab').forEach((tab) => {
        tab.style.background = '';
        tab.style.color = '';
    });
    
    // Update gradients
    const gradientElements = document.querySelectorAll('.chat-window-header, .settings-panel-header, .view-tab.active, .save-settings-btn, .browse-btn, .save-btn');
    gradientElements.forEach(el => {
        el.style.background = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
    });
}

// Sync color picker with hex input
primaryColorInput.addEventListener('input', (e) => {
    primaryColorHex.value = e.target.value;
});

primaryColorHex.addEventListener('input', (e) => {
    const hex = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        primaryColorInput.value = hex;
    }
});

secondaryColorInput.addEventListener('input', (e) => {
    secondaryColorHex.value = e.target.value;
});

secondaryColorHex.addEventListener('input', (e) => {
    const hex = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        secondaryColorInput.value = hex;
    }
});

// Reset colors to default
resetColorsBtn.addEventListener('click', () => {
    primaryColorInput.value = defaultColors.primary;
    primaryColorHex.value = defaultColors.primary;
    secondaryColorInput.value = defaultColors.secondary;
    secondaryColorHex.value = defaultColors.secondary;
    applyColors(defaultColors.primary, defaultColors.secondary);
});

if (nightModeToggle) {
    nightModeToggle.addEventListener('change', (e) => {
        applyNightMode(e.target.checked);
    });
}

// Open settings panel
settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('show');
});

// Close settings panel
closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('show');
});

// Close settings panel when clicking outside
document.addEventListener('click', (e) => {
    if (settingsPanel.classList.contains('show') && 
        !settingsPanel.contains(e.target) && 
        e.target !== settingsBtn &&
        !settingsBtn.contains(e.target)) {
        settingsPanel.classList.remove('show');
    }
});

// Browse folder button
browseFolderBtn.addEventListener('click', () => {
    folderInput.click();
});

// Handle folder selection
folderInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
        const firstFile = e.target.files[0];
        // Get the folder path from the first file
        const folderPath = firstFile.webkitRelativePath.split('/')[0];
        const fullPath = firstFile.path ? firstFile.path.replace(/[^\/\\]*$/, '') : folderPath;
        brandMasterFolderInput.value = fullPath || folderPath;
    }
});

// Save settings button
saveSettingsBtn.addEventListener('click', saveSettings);

// Load settings on page load
loadSettings();

// ==================== AUDIO TEST ====================
document.getElementById('audioTestBtn').addEventListener('click', function () {
    const btn = this;
    btn.classList.add('playing');

    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Two-tone chime: 880 Hz then 1100 Hz
    function playTone(freq, startTime, duration) {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playTone(880,  ctx.currentTime,        0.35);
    playTone(1100, ctx.currentTime + 0.25, 0.35);

    setTimeout(() => btn.classList.remove('playing'), 700);
});
