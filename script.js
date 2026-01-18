// Initialize Lucide Icons
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
    
    //                              TAB SWITCHING
    
    const tabs = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            views.forEach(view => {
                view.style.display = 'none';
                view.classList.remove('active');
            });

            const targetId = `view-${tab.dataset.tab}`;
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.style.display = 'block';
                setTimeout(() => targetView.classList.add('active'), 10); 
            }
        });
    });
    //                          MANUAL BUILDER LOGIC
    
    // Elements
    const basePicker = document.getElementById('base-picker');
    const baseHexInput = document.getElementById('hex-input');
    const basePreview = document.getElementById('base-preview');
    const chipButtons = document.querySelectorAll('.var-chip');
    const builderGrid = document.getElementById('builder-grid');
    const paletteCount = document.getElementById('palette-count');
    const clearBtn = document.querySelector('.action-btn.danger'); // Assuming it's the Clear button

    let builderPalette = [];
    
    // --- 1. Base Color Handling ---
    function updateBaseColor(hex) {
        if(basePreview) basePreview.style.backgroundColor = hex;
        if(baseHexInput) baseHexInput.value = hex;
        if(basePicker) basePicker.value = hex;
    }

    if(basePicker) {
        basePicker.addEventListener('input', (e) => updateBaseColor(e.target.value));
    }
    
    if(baseHexInput) {
        baseHexInput.addEventListener('input', (e) => {
            let hex = e.target.value;
            if (!hex.startsWith('#')) hex = '#' + hex;
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                updateBaseColor(hex);
            }
        });
    }

    // --- 2. Color Utilities (TinyColor-ish equivalent) ---
    const Utils = {
        hexToRgb: (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        },
        rgbToHex: (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        adjustLightness: (hex, percent) => {
            // Simple HSL lightness shift would be better, but doing quick RGB Lerp for now
            // Or better: use tinycolor logic if imported, but we are Vanilla.
            // Let's implement a basic HSL converter for quality results.
            let {r, g, b} = Utils.hexToRgb(hex);
            
            // RGB to HSL
            r /= 255; g /= 255; b /= 255;
            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max == min) { h = s = 0; } 
            else {
                let d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch(max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            // Adjust
            l = Math.max(0, Math.min(1, l + percent));

            // HSL to RGB
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            
            const hue2rgb = (p, q, t) => {
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
            g = Math.round(hue2rgb(p, q, h) * 255);
            b = Math.round(hue2rgb(p, q, h - 1/3) * 255);

            return Utils.rgbToHex(r, g, b);
        },
        shiftHue: (hex, degree) => {
            let {r, g, b} = Utils.hexToRgb(hex);
             // RGB to HSL logic repeated... (Simplify for brevity in this snippet, ideally reusable func)
             r /= 255; g /= 255; b /= 255;
             let max = Math.max(r, g, b), min = Math.min(r, g, b);
             let h, s, l = (max + min) / 2;
 
             if (max == min) { h = s = 0; } 
             else {
                 let d = max - min;
                 s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                 switch(max) {
                     case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                     case g: h = (b - r) / d + 2; break;
                     case b: h = (r - g) / d + 4; break;
                 }
                 h /= 6;
             }
             
             // Shift Hue
             h = (h * 360 + degree) % 360;
             if (h < 0) h += 360;
             h /= 360;

             // Back to RGB
             let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
             let p = 2 * l - q;
             const hue2rgb = (p, q, t) => {
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
            g = Math.round(hue2rgb(p, q, h) * 255);
            b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
            return Utils.rgbToHex(r, g, b);
        },
        mixColors: (color1, color2, weight) => {
            // weight 0-100% of color2
            const c1 = Utils.hexToRgb(color1);
            const c2 = Utils.hexToRgb(color2);
            const w = weight / 100;
            const r = Math.round(c1.r * (1 - w) + c2.r * w);
            const g = Math.round(c1.g * (1 - w) + c2.g * w);
            const b = Math.round(c1.b * (1 - w) + c2.b * w);
            return Utils.rgbToHex(r, g, b);
        },

        generateScale: (hex) => {
            const white = '#ffffff';
            const black = '#000000';
            return {
                25: Utils.mixColors(hex, white, 95),
                50: Utils.mixColors(hex, white, 90),
                100: Utils.mixColors(hex, white, 80),
                200: Utils.mixColors(hex, white, 60),
                300: Utils.mixColors(hex, white, 40),
                400: Utils.mixColors(hex, white, 20),
                500: hex,
                600: Utils.mixColors(hex, black, 20),
                700: Utils.mixColors(hex, black, 40),
                800: Utils.mixColors(hex, black, 60),
                900: Utils.mixColors(hex, black, 80),
                950: Utils.mixColors(hex, black, 90),
                975: Utils.mixColors(hex, black, 95)
            };
        },
        getContrastColor: (hex) => {
            const {r, g, b} = Utils.hexToRgb(hex);
            // YIQ equation
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? '#1f2937' : '#ffffff'; // Dark Gray for light bg, White for dark bg
        }
    };

    // --- 3. Generate Variations ---
    function generateColor(type, baseHex) {
        switch(type) {
            case 'base': return baseHex;
            case 'lighter': return Utils.adjustLightness(baseHex, 0.15);
            case 'light': return Utils.adjustLightness(baseHex, 0.1);
            case 'dark': return Utils.adjustLightness(baseHex, -0.1);
            case 'darker': return Utils.adjustLightness(baseHex, -0.2);
            case 'shade': return Utils.adjustLightness(baseHex, -0.05); // Subtle
            case 'tint': return Utils.adjustLightness(baseHex, 0.05);
            case 'highlight': return Utils.adjustLightness(baseHex, 0.25);
            
            // Harmonies
            case 'complementary': return Utils.shiftHue(baseHex, 180);
            case 'comp-light': return Utils.adjustLightness(Utils.shiftHue(baseHex, 180), 0.15);
            case 'comp-dark': return Utils.adjustLightness(Utils.shiftHue(baseHex, 180), -0.15);
            case 'triadic-1': return Utils.shiftHue(baseHex, 120);
            case 'triadic-2': return Utils.shiftHue(baseHex, 240);
            case 'analogous-warm': return Utils.shiftHue(baseHex, 30);
            case 'analogous-cool': return Utils.shiftHue(baseHex, -30);
            case 'split-1': return Utils.shiftHue(baseHex, 150);
            case 'split-2': return Utils.shiftHue(baseHex, 210);

            // Accents
            case 'warm': return Utils.shiftHue(baseHex, 15);
            case 'cool': return Utils.shiftHue(baseHex, -15);
            
            default: return baseHex;
        }
    }

    // --- 4. Add to Grid ---
    const builderPanel = document.getElementById('builder-panel');
    const tipsPanel = document.getElementById('tips-panel');

    function updatePanelsInteractivity() {
         if (builderPalette.length > 0) {
            builderPanel.classList.remove('hidden');
            tipsPanel.classList.remove('hidden');
        } else {
            builderPanel.classList.add('hidden');
            tipsPanel.classList.add('hidden');
        }
    }
    
    // Initial check
    updatePanelsInteractivity();

    function addColorToGrid(hex) {
        // Filter Duplicates
        if (builderPalette.includes(hex)) return;
        
        builderPalette.push(hex);
        updatePanelsInteractivity();
        renderGrid();
    }

    function removeColor(index) {
        builderPalette.splice(index, 1);
        updatePanelsInteractivity();
        renderGrid();
    }

    function renderGrid() {
        builderGrid.innerHTML = '';
        
        builderPalette.forEach((hex, index) => {
            const card = document.createElement('div');
            card.className = 'color-card';
            card.style.backgroundColor = hex;
            
            const textColor = Utils.getContrastColor(hex);
            const indexOpacity = textColor === '#ffffff' ? '0.7' : '0.6';

            card.innerHTML = `
                <span class="card-index" style="color: ${textColor}; opacity: ${indexOpacity}">${index + 1}</span>
                <div class="card-actions">
                    <button class="card-btn copy-btn" title="Copy Code"><i data-lucide="copy"></i></button>
                    <button class="card-btn delete-btn" title="Remove Color"><i data-lucide="x"></i></button>
                </div>
                <span class="card-hex" style="color: ${textColor}">${hex}</span>
            `;
            
            // Interaction: Copy
            const copyBtn = card.querySelector('.copy-btn');
            // Adjust button icon color for better contrast if needed, or stick to overlay logic
            // The overlay is dark, so white icons usually work. If text is dark (light bg), maybe icon should be dark?
            if (textColor !== '#ffffff') {
                copyBtn.style.color = '#000';
                copyBtn.style.background = 'rgba(255,255,255,0.3)'; // Lighter bg for dark text
                card.querySelector('.delete-btn').style.color = '#000';
                card.querySelector('.delete-btn').style.background = 'rgba(255,255,255,0.3)';
            }

            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(hex).then(() => {
                    copyBtn.innerHTML = '<i data-lucide="check"></i>';
                    const originalColor = copyBtn.style.color;
                    copyBtn.style.color = '#15803d'; // Green check
                    lucide.createIcons();
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i data-lucide="copy"></i>';
                        copyBtn.style.color = originalColor;
                        lucide.createIcons();
                    }, 1500);
                });
            });

            // Interaction: Delete
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeColor(index);
            });

            builderGrid.appendChild(card);
        });

        paletteCount.innerText = `${builderPalette.length} colors`;
        lucide.createIcons();
    }
    
    // Event Listeners
    chipButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const newColor = generateColor(type, basePicker.value);
            addColorToGrid(newColor);
        });
    });

    // Clear Handler
     if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            builderPalette = [];
            updatePanelsInteractivity();
        });
    }

    // Export Menu Logic
    const exportTrigger = document.getElementById('export-trigger');
    const exportMenu = document.getElementById('export-menu');

    if(exportTrigger && exportMenu) {
        exportTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!exportMenu.contains(e.target) && !exportTrigger.contains(e.target)) {
                exportMenu.classList.add('hidden');
            }
        });
    }

    // -------------------------------------------------------------------------
    //                          MOOD BUILDER (AI) LOGIC
    // -------------------------------------------------------------------------
    
    // Elements
    const moodCards = document.querySelectorAll('.mood-card');
    const numBtns = document.querySelectorAll('.num-btn');
    const moodCountDisplay = document.getElementById('mood-count-display');
    const aiGenerateFullBtn = document.getElementById('ai-generate-btn');

    let selectedMood = 'energetic'; // Default
    let selectedCount = 5; // Default

    // Mood Map (Base Colors ideal for these moods - Arrays for variety)
    const moodColors = {
        'energetic': ['#f59e0b', '#ef4444', '#eab308', '#f97316'], 
        'calm': ['#60a5fa', '#a7f3d0', '#c4b5fd', '#94a3b8'],      
        'professional': ['#1e3a8a', '#3f4f6e', '#1e293b', '#0f172a'],
        'luxurious': ['#7c3aed', '#be185d', '#4338ca', '#312e81'], 
        'natural': ['#15803d', '#3f6212', '#065f46', '#57534e'],    
        'creative': ['#e11d48', '#8b5cf6', '#db2777', '#f43f5e'],   
        'trustworthy': ['#0369a1', '#075985', '#0c4a6e', '#334155'], 
        'modern': ['#374151', '#64748b', '#71717a', '#18181b'],     
        'friendly': ['#fbbf24', '#fcd34d', '#fdba74', '#84cc16'],   
        'elegant': ['#18181b', '#27272a', '#4b5563', '#52525b'],    
        'spiritual': ['#8b5cf6', '#7c3aed', '#6366f1', '#a855f7'],  
        'bold': ['#dc2626', '#b91c1c', '#991b1b', '#ea580c'],       
        'playful': ['#f472b6', '#fb7185', '#22d3ee', '#facc15'],    
        'minimalist': ['#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'], 
        'vintage': ['#d97706', '#b45309', '#78350f', '#a16207'],    
        'warm': ['#fb923c', '#fdba74', '#fecaca', '#fca5a5'],       
        'fresh': ['#84cc16', '#bef264', '#86efac', '#34d399'],      
        'sophisticated': ['#4b5563', '#374151', '#52525b', '#71717a'] 
    };

    // 1. Mood Selection
    moodCards.forEach(card => {
        card.addEventListener('click', () => {
            // Visual update
            moodCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // State update
            selectedMood = card.dataset.mood;
        });
    });

    // 2. Count Selection
    numBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Visual update
            numBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // State update
            selectedCount = parseInt(btn.dataset.count);
            if(moodCountDisplay) moodCountDisplay.textContent = selectedCount;
        });
    });

    // 3. Generate Logic
    let currentMoodPalette = [];
    const moodResultPanel = document.getElementById('mood-result-panel');
    const moodResultGrid = document.getElementById('mood-result-grid');
    const moodMeta = document.getElementById('mood-meta');
    
    // Actions
    const moodNewBtn = document.getElementById('mood-new-btn');
    const moodSaveBtn = document.getElementById('mood-save-btn');
    const moodVisualizerBtn = document.getElementById('mood-visualizer-btn');
    
    // Export Menu
    const moodExportTrigger = document.getElementById('mood-export-trigger');
    const moodExportMenu = document.getElementById('mood-export-menu');

    function renderMoodGrid() {
        if(!moodResultGrid) return;
        moodResultGrid.innerHTML = '';
        
        currentMoodPalette.forEach((hex, index) => {
            const card = document.createElement('div');
            card.className = 'color-card';
            card.style.backgroundColor = hex;
            
            const textColor = Utils.getContrastColor(hex);
            const indexOpacity = textColor === '#ffffff' ? '0.7' : '0.6';

            card.innerHTML = `
                <span class="card-index" style="color: ${textColor}; opacity: ${indexOpacity}">${index + 1}</span>
                <div class="card-actions">
                    <button class="card-btn copy-btn" title="Copy Code"><i data-lucide="copy"></i></button>
                </div>
                <span class="card-hex" style="color: ${textColor}">${hex}</span>
            `;

            // Action: Copy
             const copyBtn = card.querySelector('.copy-btn');
             if (textColor !== '#ffffff') {
                copyBtn.style.color = '#000';
                copyBtn.style.background = 'rgba(255,255,255,0.3)';
            }
             
             copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(hex).then(() => {
                    copyBtn.innerHTML = '<i data-lucide="check"></i>';
                    const originalColor = copyBtn.style.color;
                    copyBtn.style.color = '#15803d';
                    lucide.createIcons();
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i data-lucide="copy"></i>';
                        copyBtn.style.color = originalColor;
                        lucide.createIcons();
                    }, 1500);
                });
            });
            
            moodResultGrid.appendChild(card);
        });
        
        lucide.createIcons();
    }

    // Export Toggle Logic
    if(moodExportTrigger && moodExportMenu) {
        moodExportTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            moodExportMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
             if (!moodExportMenu.contains(e.target) && !moodExportTrigger.contains(e.target)) {
                moodExportMenu.classList.add('hidden');
            }
        });
    }

    function generateMoodPalette() {
         const options = moodColors[selectedMood];
         // Pick random seed from array
         let baseHex = options ? options[Math.floor(Math.random() * options.length)] : '#3b82f6';
         
         // Apply small hue jitter for "infinite" variety (+/- 15 degrees)
         // Note: Assuming Utils.shiftHue takes (hex, degree) where degree is mapped to 0-1 or 0-360 depending on implementation.
         // Looking at Utils code: h = (h * 360 + degree) % 360. So degree is in degrees.
         const jitter = Math.floor(Math.random() * 30) - 15; 
         baseHex = Utils.shiftHue(baseHex, jitter);

         // Update Meta
         if(moodMeta) {
             const moodName = selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1);
             moodMeta.textContent = `${selectedCount} colors • ${moodName} mood`;
         }

         // Reset
         currentMoodPalette = [];
         
         // Generate Palette based on Count with Method Shuffling
         // We shuffle the methods so we get different harmonies for index > 0
         let genMethods = ['complementary', 'analogous-warm', 'analogous-cool', 'lighter', 'darker', 'triadic-1', 'triadic-2', 'split-1'];
         
         // Fisher-Yates shuffle
         for (let i = genMethods.length - 1; i > 0; i--) {
             const j = Math.floor(Math.random() * (i + 1));
             [genMethods[i], genMethods[j]] = [genMethods[j], genMethods[i]];
         }
         
         // Always keep Base as first idea, then append shuffled methods
         // Strategy: First color is Base. Rest use shuffled methods.
         
         for(let i=0; i < selectedCount; i++) {
             let col;
             if (i === 0) {
                 col = baseHex;
             } else {
                 // Use shuffled methods (cyclically if count > methods)
                 const type = genMethods[(i - 1) % genMethods.length];
                 col = generateColor(type, baseHex);
             }
             
             currentMoodPalette.push(col);
         }

         // Render
         renderMoodGrid();
         if(moodResultPanel) moodResultPanel.classList.remove('hidden');
         
         // Scroll to result (Optional: if user is spamming 'New' maybe don't scroll? 
         // But logic is fine, it scrolls to view if not in view. smooth behavior is nice)
    }

    if(aiGenerateFullBtn) {
        aiGenerateFullBtn.addEventListener('click', generateMoodPalette);
    }

    // Result Actions
    if(moodNewBtn) {
        moodNewBtn.addEventListener('click', generateMoodPalette);
    }

    if(moodSaveBtn) {
        moodSaveBtn.addEventListener('click', () => {
             // Copy to builder
             builderPalette = [...currentMoodPalette];
             
             // Switch
             const manualTab = document.querySelector('.tab-btn[data-tab="manual"]');
             if(manualTab) manualTab.click();
             
             updatePanelsInteractivity();
             renderGrid();
        });
    }

    if(moodVisualizerBtn) {
        moodVisualizerBtn.addEventListener('click', () => {
             // Switch to System View
             const sysTab = document.querySelector('.tab-btn[data-tab="system"]');
             if(sysTab) sysTab.click();
        });
    }

    // Default Init
    lucide.createIcons();
    console.log("App Initialized");

    // -------------------------------------------------------------------------
    //                          DESIGN SYSTEM VISUALIZER
    // -------------------------------------------------------------------------
    
    // Manual Visualizer Button
    const manualVisualizerBtn = document.querySelector('.builder-actions .action-btn.primary');
    const systemScalesContainer = document.getElementById('system-scales-container');

    function renderDesignSystem() {
        if (!systemScalesContainer) return;
        systemScalesContainer.innerHTML = '';
        const previewContainer = document.getElementById('system-preview-container');
        if(previewContainer) previewContainer.innerHTML = '';
        
        // Determine Active Palette
        let activePalette = [];
        const moodHasData = currentMoodPalette && currentMoodPalette.length > 0;
        const manualHasData = builderPalette && builderPalette.length > 0;
        const activeTab = document.querySelector('.view-section.active').id;
        
        if (activeTab === 'view-ai' && moodHasData) {
            activePalette = currentMoodPalette;
        } else if (activeTab === 'view-manual' && manualHasData) {
            activePalette = builderPalette;
        } else {
             activePalette = moodHasData ? currentMoodPalette : builderPalette;
        }

        if (!activePalette || activePalette.length === 0) {
            if(previewContainer) previewContainer.innerHTML = ''; 
            systemScalesContainer.innerHTML = `<div class="empty-state"><i data-lucide="palette" style="width:48px;height:48px;margin-bottom:1rem;"></i><p>Generate a palette to see the Design System.</p></div>`;
            lucide.createIcons();
            return;
        }

        // --- DEFINE SEMANTIC COLORS ---
        const primary = activePalette[0];
        const secondary = activePalette[1] || Utils.shiftHue(primary, 30);
        const accent = activePalette[2] || Utils.shiftHue(primary, -30);
        
        // Neutral: Desaturated primary (Mix with dark grey)
        // Mix 20% primary with 80% grey #6b7280
        const neutral = Utils.mixColors(primary, '#6b7280', 20); 
        
        // Semantics
        const success = '#10b981';
        const warning = '#f59e0b';
        const error   = '#ef4444';

        const designRoles = [
            { name: 'Primary',   hex: primary },
            { name: 'Secondary', hex: secondary },
            { name: 'Accent',    hex: accent },
            { name: 'Neutral',   hex: neutral },
            { name: 'Success',   hex: success },
            { name: 'Warning',   hex: warning },
            { name: 'Error',     hex: error }
        ];

        // --- PREVIEW RENDER ---
        if (previewContainer) {
            previewContainer.innerHTML = `<h3 style="text-align:center; color:white; margin-bottom:1.5rem; font-size:1.5rem;">Design System Preview</h3>`;
            
            const btn1 = `<button class="comp-btn" style="background:${primary}; color:${Utils.getContrastColor(primary)}">Primary</button>`;
            const btn2 = `<button class="comp-btn" style="background:${secondary}; color:${Utils.getContrastColor(secondary)}">Secondary</button>`; 
            const btn3 = `<button class="comp-btn" style="background:${error}; color:${Utils.getContrastColor(error)}">Error</button>`;
            const btn4 = `<button class="comp-btn" style="background:${success}; color:${Utils.getContrastColor(success)}">Success</button>`;

             // Cards logic
             const pText = Utils.getContrastColor(primary);
             const tag1Bg = Utils.mixColors(primary, '#ffffff', 85);
             const tag1Tx = Utils.mixColors(primary, '#000000', 20);
             
             const cardLight = `
                <div class="comp-card" style="background:#ffffff; color:#1f2937;">
                    <h4 style="color:${primary}">Material Card</h4>
                    <p>Surface colors, typography, and branded accents.</p>
                    <div class="comp-tags">
                        <span class="comp-tag" style="background:${tag1Bg}; color:${tag1Tx}">Tag 1</span>
                        <span class="comp-tag" style="background:#f3f4f6; color:#374151">Tag 2</span>
                    </div>
                </div>
            `;
             const cardDark = `
                <div class="comp-card" style="background:#1f2937; color:#f9fafb; border:1px solid rgba(255,255,255,0.05);">
                    <h4 style="color:${Utils.mixColors(primary, '#ffffff', 40)}">Dark Surface</h4>
                    <p style="color:#9ca3af">Inverted surface legibility test.</p>
                    <button class="comp-btn" style="background:${primary}; color:${pText}; align-self:flex-start; margin-top:auto; font-size:0.8rem; padding:0.5rem 1rem;">Action</button>
                </div>
            `;

            const alerts = `
                <div class="comp-alert" style="background:${Utils.mixColors(warning, '#ffffff', 85)}; color:#78350f; border-left-color:${warning}">
                    <strong>Warning:</strong> System alert state.
                </div>
                <div class="comp-alert" style="background:${Utils.mixColors(success, '#ffffff', 85)}; color:#064e3b; border-left-color:${success}">
                    <strong>Success:</strong> Operation completed.
                </div>
            `;

            previewContainer.innerHTML += `
                <div class="comp-section">
                    <div class="comp-row-btns">${btn1} ${btn2} ${btn3} ${btn4}</div>
                    <div class="comp-row-cards">${cardLight} ${cardDark}</div>
                    <div class="comp-alerts">${alerts}</div>
                </div>
            `;
        }

        // --- SCALES RENDER ---
        designRoles.forEach(role => {
            const scale = Utils.generateScale(role.hex);
            const section = document.createElement('div');
            section.className = 'scale-section';
            
            let gridHtml = '';
            // Material Sort Order: 25 -> 975
            // Ensure scale keys are sorted numerically
            const sortedKeys = Object.keys(scale).sort((a,b) => parseInt(a)-parseInt(b));

            sortedKeys.forEach(step => {
                const stepHex = scale[step];
                const textColor = Utils.getContrastColor(stepHex); 
                gridHtml += `
                    <div class="scale-card" style="background-color: ${stepHex};">
                        <span class="scale-step" style="color: ${textColor}; opacity: 0.8;">${step}</span>
                        <span class="scale-hex" style="color: ${textColor}">${stepHex}</span>
                    </div>
                `;
            });

            section.innerHTML = `
                <div class="scale-header">
                    <h3>${role.name}</h3>
                    <span class="theme-tag"><i data-lucide="sun" width="14"></i> Light</span>
                </div>
                <div class="scale-grid">
                    ${gridHtml}
                </div>
            `;
            systemScalesContainer.appendChild(section);
        });
        
        lucide.createIcons();
    }

    // Wiring Up
    if (moodVisualizerBtn) {
        moodVisualizerBtn.addEventListener('click', () => {
            const systemTabBtn = document.querySelector('[data-tab="system"]');
            if(systemTabBtn) systemTabBtn.click();
        });
    }

    if (manualVisualizerBtn) {
        manualVisualizerBtn.addEventListener('click', () => {
             const systemTabBtn = document.querySelector('[data-tab="system"]');
             if(systemTabBtn) systemTabBtn.click();
        });
    }

    // Tab Switch Listener Hook to Trigger Render
    const sysTabBtn = document.querySelector('[data-tab="system"]');
    if (sysTabBtn) {
        sysTabBtn.addEventListener('click', () => {
            setTimeout(renderDesignSystem, 50); 
        });
    }

    // -------------------------------------------------------------------------
    //                        EXPORT DROPDOWN FUNCTIONALITY
    // -------------------------------------------------------------------------
    
    const exportDropdown = document.getElementById('export-dropdown');
    const headerExportBtn = document.getElementById('header-export-btn');
    const exportSaveImageBtn = document.getElementById('export-save-image');
    const exportCopyCSSBtn = document.getElementById('export-copy-css');
    const exportCopyJSONBtn = document.getElementById('export-copy-json');

    // Get active palette
    function getActivePalette() {
        const activeView = document.querySelector('.view-section.active');
        if (!activeView) return [];
        
        if (activeView.id === 'view-ai' && currentMoodPalette && currentMoodPalette.length > 0) {
            return currentMoodPalette;
        } else if (activeView.id === 'view-manual' && builderPalette && builderPalette.length > 0) {
            return builderPalette;
        }
        return currentMoodPalette.length > 0 ? currentMoodPalette : builderPalette;
    }

    // Generate CSS code
    function generateCSSCode(palette) {
        if (!palette || palette.length === 0) return '';
        
        let css = ':root {\n';
        palette.forEach((color, index) => {
            css += `  --color-${index + 1}: ${color};\n`;
        });
        css += '}';
        return css;
    }

    // Generate JSON code
    function generateJSONCode(palette) {
        if (!palette || palette.length === 0) return '';
        
        const paletteObj = {
            name: "ChromeGen Palette",
            colors: palette.map((color, index) => ({
                id: index + 1,
                hex: color,
                name: `Color ${index + 1}`
            }))
        };
        return JSON.stringify(paletteObj, null, 2);
    }

    // Generate and download palette image
    function downloadPaletteImage(palette) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const colorWidth = 120;
        const colorHeight = 200;
        const padding = 20;
        
        canvas.width = (colorWidth * palette.length) + (padding * 2);
        canvas.height = colorHeight + (padding * 2) + 60;
        
        // Background
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw colors
        palette.forEach((color, index) => {
            const x = padding + (index * colorWidth);
            const y = padding;
            
            // Color rectangle
            ctx.fillStyle = color;
            ctx.fillRect(x, y, colorWidth, colorHeight);
            
            // Hex text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(color.toUpperCase(), x + (colorWidth / 2), y + colorHeight + 30);
        });
        
        // Title
        ctx.fillStyle = '#a855f7';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ChromeGen Palette', padding, canvas.height - 15);
        
        // Download
        const link = document.createElement('a');
        link.download = 'chromegen-palette.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // Copy to clipboard with feedback
    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i data-lucide="check"></i><span>Copied!</span>';
            lucide.createIcons();
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                lucide.createIcons();
            }, 2000);
        });
    }

    // Toggle dropdown
    if (headerExportBtn && exportDropdown) {
        headerExportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const palette = getActivePalette();
            
            if (!palette || palette.length === 0) {
                alert('Please generate a palette first!');
                return;
            }
            
            exportDropdown.classList.toggle('hidden');
            lucide.createIcons();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (exportDropdown && !exportDropdown.contains(e.target) && e.target !== headerExportBtn) {
            exportDropdown.classList.add('hidden');
        }
    });

    // Save Image
    if (exportSaveImageBtn) {
        exportSaveImageBtn.addEventListener('click', () => {
            const palette = getActivePalette();
            if (palette && palette.length > 0) {
                downloadPaletteImage(palette);
                exportDropdown.classList.add('hidden');
            }
        });
    }

    // Copy CSS
    if (exportCopyCSSBtn) {
        exportCopyCSSBtn.addEventListener('click', () => {
            const palette = getActivePalette();
            if (palette && palette.length > 0) {
                const css = generateCSSCode(palette);
                copyToClipboard(css, exportCopyCSSBtn);
                setTimeout(() => {
                    exportDropdown.classList.add('hidden');
                }, 2000);
            }
        });
    }

    // Copy JSON
    if (exportCopyJSONBtn) {
        exportCopyJSONBtn.addEventListener('click', () => {
            const palette = getActivePalette();
            if (palette && palette.length > 0) {
                const json = generateJSONCode(palette);
                copyToClipboard(json, exportCopyJSONBtn);
                setTimeout(() => {
                    exportDropdown.classList.add('hidden');
                }, 2000);
            }
        });
    }

});
