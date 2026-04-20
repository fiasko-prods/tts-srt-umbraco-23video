// =====================================================
// SYNCHRONIZED SUBTITLE READER — UNIVERSAL TEMPLATE
// Uses 23video postMessage API
// Version: 1.2
// Author: Marco Iovane maiov@regionsjaelland.dk
// =====================================================
//
// ┌─────────────────────────────────────────────────┐
// │              LANGUAGE CONFIGURATION             │
// ├─────────────────────────────────────────────────┤
// │  Set LANGUAGE below to one of these codes:     │
// │                                                 │
// │  'da'  → Danish       (Dansk)                  │
// │  'en'  → English      (British)                │
// │  'de'  → German       (Deutsch)                │
// │  'ar'  → Arabic       (العربية)                │
// │  'tr'  → Turkish      (Türkçe)                 │
// │  'bs'  → Bosnian      (Bosanski)               │
// │                                                 │
// │  Then paste your SRT content below LANGUAGE.   │
// └─────────────────────────────────────────────────┘

const LANGUAGE = window.SRT_LANGUAGE || 'da';

// =====================================================
// SUBTITLES — REPLACE WITH YOUR SRT CONTENT
// Paste your .srt file content between the backticks
// =====================================================

const SUBTITLES_SRT = window.SRT_SUBTITLES || '';

// =====================================================
// END OF CONFIGURATION — do not edit below this line
// =====================================================

const LANGUAGE_CONFIGS = {
    da: {
        lang: 'da-DK', langAlt: 'da',
        labelOn:  'Deaktiver dansk undertekstlæser',
        labelOff: 'Aktiver dansk undertekstlæser',
        speed: 'Hastighed', pitch: 'Tonehøjde', volume: 'Lydstyrke',
        turbo: '⚡ Turbo tilstand (1.5x hastighed)',
        turboHint: 'Øger hastigheden til 1.5x for endnu hurtigere oplæsning.',
        playing: '▶️ Afspiller', paused: '⏸️ Pauset', ended: '⏹️ Slut',
        waiting: '▶️ Start videoen...',
        statusLabel: 'Video Status', subtitleLabel: 'Undertekst',
        voiceWarning: '⚠️ Dansk talesyntese er ikke installeret på din enhed. Gå til Indstillinger → Tilgængelighed → Tekst til tale → og installer Dansk.',
    },
    en: {
        lang: 'en-GB', langAlt: 'en',
        labelOn:  'Deactivate English subtitles reader',
        labelOff: 'Activate English subtitles reader',
        speed: 'Speed', pitch: 'Pitch', volume: 'Volume',
        turbo: '⚡ Turbo mode (1.5x speed)',
        turboHint: 'Increases reading speed to 1.5x.',
        playing: '▶️ Playing', paused: '⏸️ Paused', ended: '⏹️ Ended',
        waiting: '▶️ Start the video...',
        statusLabel: 'Video Status', subtitleLabel: 'Subtitle',
        voiceWarning: '⚠️ English text-to-speech is not installed on your device. Go to Settings → Accessibility → Text to Speech → and install English.',
    },
    de: {
        lang: 'de-DE', langAlt: 'de',
        labelOn:  'Deutschen Untertitelleser deaktivieren',
        labelOff: 'Deutschen Untertitelleser aktivieren',
        speed: 'Geschwindigkeit', pitch: 'Tonhöhe', volume: 'Lautstärke',
        turbo: '⚡ Turbo-Modus (1.5x Geschwindigkeit)',
        turboHint: 'Erhöht die Lesegeschwindigkeit auf 1.5x.',
        playing: '▶️ Wiedergabe', paused: '⏸️ Pausiert', ended: '⏹️ Beendet',
        waiting: '▶️ Video starten...',
        statusLabel: 'Videostatus', subtitleLabel: 'Untertitel',
        voiceWarning: '⚠️ Deutsche Sprachausgabe ist auf Ihrem Gerät nicht installiert. Gehen Sie zu Einstellungen → Bedienungshilfen → Text-to-Speech → und installieren Sie Deutsch.',
    },
    ar: {
        lang: 'ar-SA', langAlt: 'ar',
        labelOn:  'إيقاف قارئ الترجمة العربية',
        labelOff: 'تفعيل قارئ الترجمة العربية',
        speed: 'السرعة', pitch: 'طبقة الصوت', volume: 'مستوى الصوت',
        turbo: '⚡ وضع توربو (سرعة 1.5x)',
        turboHint: 'يزيد سرعة القراءة إلى 1.5x.',
        playing: '▶️ يعمل', paused: '⏸️ متوقف مؤقتاً', ended: '⏹️ انتهى',
        waiting: '▶️ ابدأ الفيديو...',
        statusLabel: 'حالة الفيديو', subtitleLabel: 'الترجمة',
        voiceWarning: '⚠️ محرك النص إلى كلام للغة العربية غير مثبت على جهازك. انتقل إلى الإعدادات ← إمكانية الوصول ← تحويل النص إلى كلام ← وقم بتثبيت العربية.',
    },
    tr: {
        lang: 'tr-TR', langAlt: 'tr',
        labelOn:  'Türkçe altyazı okuyucuyu devre dışı bırak',
        labelOff: 'Türkçe altyazı okuyucuyu etkinleştir',
        speed: 'Hız', pitch: 'Ses Tonu', volume: 'Ses Seviyesi',
        turbo: '⚡ Turbo modu (1.5x hız)',
        turboHint: 'Okuma hızını 1.5x\'e çıkarır.',
        playing: '▶️ Oynatılıyor', paused: '⏸️ Duraklatıldı', ended: '⏹️ Bitti',
        waiting: '▶️ Videoyu başlat...',
        statusLabel: 'Video Durumu', subtitleLabel: 'Altyazı',
        voiceWarning: '⚠️ Türkçe metin okuma cihazınızda yüklü değil. Ayarlar → Erişilebilirlik → Metinden Sese → bölümüne gidin ve Türkçeyi yükleyin.',
    },
    bs: {
        lang: 'bs-BA', langAlt: 'bs',
        labelOn:  'Deaktiviraj čitač bosanskih titlova',
        labelOff: 'Aktiviraj čitač bosanskih titlova',
        speed: 'Brzina', pitch: 'Visina tona', volume: 'Glasnoća',
        turbo: '⚡ Turbo način (1.5x brzina)',
        turboHint: 'Povećava brzinu čitanja na 1.5x.',
        playing: '▶️ Reprodukcija', paused: '⏸️ Pauzirano', ended: '⏹️ Završeno',
        waiting: '▶️ Pokrenite video...',
        statusLabel: 'Status videa', subtitleLabel: 'Titl',
        voiceWarning: '⚠️ Bosanski govorni sintetizator nije instaliran na vašem uređaju. Idite na Postavke → Pristupačnost → Tekst u govor → i instalirajte bosanski.',
    },
};

const CFG = LANGUAGE_CONFIGS[LANGUAGE] || LANGUAGE_CONFIGS['da'];

if (window.videoSpeechReaderLoaded_v124) {
    console.log('⚠️ Video Speech Reader v1.24 already loaded, skipping');
} else {
    window.videoSpeechReaderLoaded_v124 = true;
    window.videoSpeechReaderLoaded = true;

(function() {
    'use strict';

    const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent)
               || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
               || (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

    let subtitles            = [];
    let iframe               = null;
    let availableVoices      = [];
    let currentSubtitleIndex = -1;
    let isVideoPlaying       = false;
    let playerReady          = false;
    let currentlySpeaking    = false;
    let justSeeked           = false;
    let postSeekCooldown     = false;
    let lastKnownTime        = 0;
    let ttsEnabled           = !isIOS; // desktop starts enabled, iOS starts disabled
    let iosSpeakUntil        = 0;
    let speakGeneration      = 0;

    const VOL_TTS_ON  = isIOS ? 30 : 10;
    const VOL_TTS_OFF = 100;

    window.addEventListener('message', handlePlayerMessage);

    function loadVoices() {
        const voices = speechSynthesis.getVoices();
        if (voices.length) availableVoices = voices;
    }
    speechSynthesis.onvoiceschanged = () => { loadVoices(); checkVoiceWarning(); };
    loadVoices();
    setTimeout(loadVoices, 500);
    setTimeout(() => { loadVoices(); checkVoiceWarning(); }, 1500);
    setTimeout(() => { loadVoices(); checkVoiceWarning(); }, 3000);

    function checkVoiceWarning() {
        if (isIOS) return;
        if (!availableVoices.length) return; // not loaded yet
        const voice = getVoice();
        if (voice) return; // correct voice found — nothing to do
        // No matching voice — show warning and disable
        const el    = document.getElementById('tts-voice-warning');
        const icon  = document.getElementById('tts-bubble-icon');
        const label = document.getElementById('tts-toggle-label');
        if (el)    el.style.display = 'block';
        if (ttsEnabled) {
            ttsEnabled = false;
            speechSynthesis.cancel();
            speakGeneration++;
            if (icon)  { icon.style.opacity = '0.3'; icon.style.filter = 'grayscale(100%)'; }
            if (label) { label.style.opacity = '0.45'; label.textContent = CFG.labelOff; }
            setPlayerVolume(VOL_TTS_OFF);
        }
    }

    function getVoice() {
        if (!availableVoices.length) return null;
        let v = availableVoices.find(v => v.lang === CFG.lang);
        if (!v) v = availableVoices.find(v => v.lang.startsWith(CFG.langAlt + '-') || v.lang === CFG.langAlt);
        if (!v) v = availableVoices.find(v =>
            v.name.toLowerCase().includes(CFG.langAlt.toLowerCase()) ||
            v.name.toLowerCase().includes(CFG.lang.toLowerCase())
        );
        return v || null;
    }

    function parseSRT(srtContent) {
        const parsed = [];
        const blocks = srtContent.trim().split(/\r?\n\r?\n/);
        for (const block of blocks) {
            if (!block.trim()) continue;
            const lines = block.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 3) continue;
            const m = lines[1].match(
                /(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})/
            );
            if (!m) continue;
            parsed.push({
                startTime: +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000,
                endTime:   +m[5]*3600 + +m[6]*60 + +m[7] + +m[8]/1000,
                text: lines.slice(2).join(' ').trim()
            });
        }
        return parsed;
    }

    function cleanText(text) {
        return text
            .replace(/^[\s\-]+/, '')
            .replace(/\s*\-\s*$/, ',')
            .replace(/\.|!|\?/g, ',')
            .replace(/,{2,}/g, ',')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    function speak(text, isSeekedSubtitle) {
        isSeekedSubtitle = isSeekedSubtitle || false;
        if (!ttsEnabled) return;
        text = cleanText(text);
        if (!text) return;

        const fastMode = document.getElementById('fast-mode')?.checked || false;
        let rate = parseFloat(document.getElementById('rate-slider')?.value || 1.2);
        if (fastMode) rate = Math.min(rate * 1.25, 2.0);
        if (isIOS) rate = Math.max(rate * 0.95, 0.5);

        // ── iOS path (v1.21 unchanged) ────────────────────────────────────────
        if (isIOS) {
            if (!isSeekedSubtitle && Date.now() < iosSpeakUntil) return;
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voice = getVoice();
            if (voice) utterance.voice = voice;
            utterance.lang   = CFG.lang;
            utterance.rate   = rate;
            utterance.pitch  = parseFloat(document.getElementById('pitch-slider')?.value || 1.0);
            utterance.volume = parseFloat(document.getElementById('volume-slider')?.value || 1.5);
            const sub = subtitles[currentSubtitleIndex];
            if (sub) {
                const remainingSecs = Math.max(sub.endTime - lastKnownTime, 0.5);
                iosSpeakUntil = Date.now() + (remainingSecs * 1000) + 500;
            }
            currentlySpeaking = true;
            utterance.onstart = () => { currentlySpeaking = true; };
            utterance.onend = () => {
                currentlySpeaking = false;
                if (isSeekedSubtitle) {
                    justSeeked = false;
                    postSeekCooldown = true;
                    let idx = -1;
                    for (let i = 0; i < subtitles.length; i++) {
                        if (lastKnownTime >= subtitles[i].startTime &&
                            lastKnownTime <= subtitles[i].endTime) { idx = i; break; }
                    }
                    if (idx >= 0 && idx !== currentSubtitleIndex) {
                        currentSubtitleIndex = idx;
                        postSeekCooldown = false;
                        speak(subtitles[idx].text);
                    }
                }
            };
            utterance.onerror = () => {
                currentlySpeaking = false;
                justSeeked = false;
                postSeekCooldown = false;
            };
            speechSynthesis.speak(utterance);
            return;
        }

        // ── Desktop / Android path ────────────────────────────────────────────
        speakGeneration++;
        const myGen = speakGeneration;
        const spokenIdx = currentSubtitleIndex;

        if (isSeekedSubtitle) speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getVoice();
        if (voice) utterance.voice = voice;
        utterance.lang   = CFG.lang;
        utterance.rate   = rate;
        utterance.pitch  = parseFloat(document.getElementById('pitch-slider')?.value || 1.0);
        utterance.volume = parseFloat(document.getElementById('volume-slider')?.value || 1.5);

        currentlySpeaking = true;
        utterance.onstart = () => { if (myGen === speakGeneration) currentlySpeaking = true; };
        utterance.onend = () => {
            if (myGen !== speakGeneration) return;
            currentlySpeaking = false;
            if (isSeekedSubtitle) {
                justSeeked = false;
                postSeekCooldown = true;
                let idx = -1;
                for (let i = 0; i < subtitles.length; i++) {
                    if (lastKnownTime >= subtitles[i].startTime &&
                        lastKnownTime <= subtitles[i].endTime) { idx = i; break; }
                }
                if (idx >= 0 && idx !== currentSubtitleIndex) {
                    currentSubtitleIndex = idx;
                    postSeekCooldown = false;
                    speak(subtitles[idx].text);
                }
            } else if (ttsEnabled && isVideoPlaying) {
                const sub = subtitles[currentSubtitleIndex];
                if (sub && currentSubtitleIndex !== spokenIdx &&
                    lastKnownTime >= sub.startTime && lastKnownTime <= sub.endTime) {
                    speak(subtitles[currentSubtitleIndex].text);
                }
            }
        };
        utterance.onerror = (e) => {
            if (myGen !== speakGeneration) return;
            currentlySpeaking = false;
            justSeeked = false;
            postSeekCooldown = false;
        };

        speechSynthesis.speak(utterance);
    }

    function updateDisplay(index) {
        const display = document.getElementById('current-subtitle');
        const counter = document.getElementById('subtitle-counter');
        if (display && index >= 0)
            display.innerHTML = `<p style="margin:0;">${subtitles[index].text}</p>`;
        if (counter && index >= 0)
            counter.textContent = `${index + 1} / ${subtitles.length}`;
    }

    function updateSubtitle(currentTime) {
        lastKnownTime = currentTime;
        if (isIOS && !isVideoPlaying) return;

        let activeIndex = -1;
        for (let i = 0; i < subtitles.length; i++) {
            if (currentTime >= subtitles[i].startTime &&
                currentTime <= subtitles[i].endTime) {
                activeIndex = i; break;
            }
        }

        if (justSeeked && activeIndex >= 0) {
            updateDisplay(activeIndex);
            currentSubtitleIndex = activeIndex;
            return;
        }

        const isSpeaking = isIOS ? (Date.now() < iosSpeakUntil) : currentlySpeaking;

        if (activeIndex >= 0) {
            updateDisplay(activeIndex);
            if (isVideoPlaying && ttsEnabled) {
                if (isIOS) {
                    if (isSpeaking) {
                        currentSubtitleIndex = activeIndex;
                    } else {
                        currentSubtitleIndex = activeIndex;
                        speak(subtitles[activeIndex].text);
                    }
                    return;
                }
                const alreadySeen = activeIndex === currentSubtitleIndex;
                if (alreadySeen) return;
                const jumped = !postSeekCooldown &&
                               currentSubtitleIndex >= 0 &&
                               Math.abs(activeIndex - currentSubtitleIndex) > 1;
                if (jumped) {
                    currentSubtitleIndex = activeIndex;
                    justSeeked = true;
                    speak(subtitles[activeIndex].text, true);
                } else if (currentlySpeaking) {
                    currentSubtitleIndex = activeIndex;
                } else {
                    currentSubtitleIndex = activeIndex;
                    postSeekCooldown = false;
                    speak(subtitles[activeIndex].text);
                }
            }
        } else {
            const display = document.getElementById('current-subtitle');
            if (display) display.innerHTML = '<p style="margin:0;opacity:0.4;">...</p>';
            currentSubtitleIndex = activeIndex;
            if (isIOS) iosSpeakUntil = 0;
        }
    }

    function handlePlayerMessage(event) {
        if (!event.data) return;
        try {
            const data = JSON.parse(event.data);
            const isReadyMsg = data.ready === true
                || (data.context === 'player.js' && data.event === 'ready')
                || (data.context === 'player.js' && !playerReady);
            if (isReadyMsg && !playerReady) {
                playerReady = true;
                if (iframe) subscribeToEvents();
                if (data.ready === true || data.event === 'ready') return;
            }
            if (data.context !== 'player.js') return;
            if (data.event) handleEvent(data.event, data.value);
        } catch (e) { /* not JSON */ }
    }

    function handleEvent(eventName, value) {
        const currentTime = typeof value === 'number'
            ? value
            : (value?.seconds ?? value?.currentTime ?? value?.time);
        switch (eventName) {
            case 'play':
                isVideoPlaying = true;
                if (document.getElementById('video-status'))
                    document.getElementById('video-status').textContent = CFG.playing;
                break;
            case 'pause':
                isVideoPlaying = false;
                if (document.getElementById('video-status'))
                    document.getElementById('video-status').textContent = CFG.paused;
                speakGeneration++;
                speechSynthesis.cancel();
                currentlySpeaking = false;
                justSeeked = false;
                postSeekCooldown = false;
                iosSpeakUntil = 0;
                break;
            case 'ended':
                isVideoPlaying = false;
                speakGeneration++;
                speechSynthesis.cancel();
                currentlySpeaking = false;
                justSeeked = false;
                postSeekCooldown = false;
                iosSpeakUntil = 0;
                if (document.getElementById('video-status'))
                    document.getElementById('video-status').textContent = CFG.ended;
                break;
            case 'timeupdate':
            case 'progress':
                if (currentTime !== undefined && currentTime !== null) {
                    if (!isVideoPlaying) {
                        isVideoPlaying = true;
                        if (document.getElementById('video-status'))
                            document.getElementById('video-status').textContent = CFG.playing;
                    }
                    updateSubtitle(currentTime);
                }
                break;
            case 'getCurrentTime':
                if (currentTime !== undefined && currentTime !== null && isVideoPlaying) {
                    updateSubtitle(currentTime);
                }
                break;
        }
    }

    function subscribeToEvents() {
        if (!iframe || !playerReady) return;
        const origin  = 'https://regionsjaelland.23video.com';
        const version = '0.0.12';
        ['play', 'pause', 'ended', 'timeupdate', 'progress'].forEach(evt => {
            iframe.contentWindow.postMessage(JSON.stringify({
                context: 'player.js', version, method: 'addEventListener', value: evt
            }), origin);
        });
        setInterval(() => {
            if (!iframe) return;
            iframe.contentWindow.postMessage(JSON.stringify({
                context: 'player.js', version, method: 'getCurrentTime'
            }), origin);
            if (ttsEnabled) setPlayerVolume(VOL_TTS_ON);
        }, 1000);
        setPlayerVolume(ttsEnabled ? VOL_TTS_ON : VOL_TTS_OFF);
    }

    function setPlayerVolume(level) {
        if (!iframe) return;
        iframe.contentWindow.postMessage(JSON.stringify({
            context: 'player.js', version: '0.0.12', method: 'setVolume', value: level
        }), 'https://regionsjaelland.23video.com');
    }

    function toggleTTS() {
        ttsEnabled = !ttsEnabled;
        const icon  = document.getElementById('tts-bubble-icon');
        const label = document.getElementById('tts-toggle-label');

        if (!ttsEnabled) {
            speakGeneration++;
            speechSynthesis.cancel();
            currentlySpeaking = false;
            justSeeked = false;
            iosSpeakUntil = 0;
            setPlayerVolume(VOL_TTS_OFF);
            if (icon)  { icon.style.opacity = '0.3'; icon.style.filter = 'grayscale(100%)'; }
            if (label) { label.style.opacity = '0.45'; label.textContent = CFG.labelOff; }
        } else {
            if (icon)  { icon.style.opacity = '1'; icon.style.filter = 'none'; }
            if (label) { label.style.opacity = '1'; label.textContent = CFG.labelOn; }
            currentSubtitleIndex = -1;
            currentlySpeaking = false;
            justSeeked = false;
            postSeekCooldown = false;
            iosSpeakUntil = 0;
            setPlayerVolume(VOL_TTS_ON);

            if (isIOS && subtitles.length > 0) {
                let activeIdx = -1;
                for (let i = 0; i < subtitles.length; i++) {
                    if (lastKnownTime >= subtitles[i].startTime &&
                        lastKnownTime <= subtitles[i].endTime) {
                        activeIdx = i; break;
                    }
                }
                if (activeIdx < 0) {
                    for (let i = 0; i < subtitles.length; i++) {
                        if (subtitles[i].startTime > lastKnownTime) {
                            activeIdx = i; break;
                        }
                    }
                }
                if (activeIdx < 0) activeIdx = 0;
                currentSubtitleIndex = activeIdx;
                updateDisplay(activeIdx);
                const text = cleanText(subtitles[activeIdx].text);
                const rate = Math.max(parseFloat(document.getElementById('rate-slider')?.value || 1.2) * 0.95, 0.5);
                const u = new SpeechSynthesisUtterance(text);
                const v = getVoice();
                if (v) u.voice = v;
                u.lang   = CFG.lang;
                u.rate   = rate;
                u.pitch  = parseFloat(document.getElementById('pitch-slider')?.value || 1.0);
                u.volume = parseFloat(document.getElementById('volume-slider')?.value || 1.5);
                const sub = subtitles[activeIdx];
                const remainingSecs = Math.max(sub.endTime - lastKnownTime, 0.5);
                iosSpeakUntil = Date.now() + (remainingSecs * 1000) + 500;
                currentlySpeaking = true;
                u.onend  = () => { currentlySpeaking = false; };
                u.onerror = () => { currentlySpeaking = false; iosSpeakUntil = 0; };
                speechSynthesis.speak(u);
            }
        }
    }

    function injectToggleButton() {
        const iframeWrapper  = iframe.parentNode;
        const videoSchemaDiv = iframeWrapper ? iframeWrapper.parentNode : null;

        const btn = document.createElement('div');
        btn.id = 'tts-toggle-wrapper';
        btn.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:0.55rem',
            'cursor:pointer', 'user-select:none',
            'padding:0.5rem 1rem 0.5rem 0.5rem',
            'border-radius:999px', 'margin-top:0.75rem',
            'transition:background 0.15s', 'font-family:system-ui,sans-serif'
        ].join(';');

        btn.innerHTML = `
            <div id="tts-bubble-icon" style="
                position:relative; display:inline-flex; align-items:center;
                justify-content:center; width:72px; height:54px;
                background:rgba(0,128,156,0.13); border:4px solid #00809c;
                border-radius:10px; flex-shrink:0;
                transition:opacity 0.2s,filter 0.2s;
                font-size:16px; font-weight:900; color:#00809c;
                -webkit-text-stroke:0.1px #00809c;
                letter-spacing:1px; line-height:1;
                font-family:Arial,sans-serif; box-sizing:border-box;
                opacity:${isIOS ? '0.3' : '1'};
                filter:${isIOS ? 'grayscale(100%)' : 'none'};">
                A&nbsp;ع&nbsp;あ
                <span style="position:absolute;bottom:-9px;left:12px;width:0;height:0;
                    border-left:6px solid transparent;border-right:6px solid transparent;
                    border-top:8px solid #00809c;display:block;"></span>
                <span style="position:absolute;bottom:-6px;left:13px;width:0;height:0;
                    border-left:5px solid transparent;border-right:5px solid transparent;
                    border-top:7px solid white;display:block;"></span>
            </div>
            <span id="tts-toggle-label" style="
                font-size:2rem; font-weight:700; color:#00809c;
                opacity:${isIOS ? '0.45' : '1'};
                transition:opacity 0.2s;">
                ${isIOS ? CFG.labelOff : CFG.labelOn}
            </span>
        `;

        btn.addEventListener('click', toggleTTS);
        btn.addEventListener('mouseenter', () => { btn.style.background = '#e6f4f6'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });

        if (videoSchemaDiv && iframeWrapper) {
            try { videoSchemaDiv.insertBefore(btn, iframeWrapper.nextSibling); }
            catch(e) { document.body.appendChild(btn); }
        } else if (iframeWrapper && iframeWrapper.parentNode) {
            try { iframeWrapper.parentNode.insertBefore(btn, iframeWrapper.nextSibling); }
            catch(e) { document.body.appendChild(btn); }
        } else {
            document.body.appendChild(btn);
        }

        const warning = document.createElement('p');
        warning.id = 'tts-voice-warning';
        warning.style.cssText = [
            'display:none',
            'margin:0.5rem 0 0 0',
            'padding:0.6rem 0.9rem',
            'background:#fff3cd',
            'border:1px solid #ffc107',
            'border-radius:6px',
            'font-size:0.9rem',
            'color:#856404',
            'font-family:system-ui,sans-serif',
            'max-width:480px'
        ].join(';');
        warning.textContent = CFG.voiceWarning || '';
        btn.insertAdjacentElement('afterend', warning);

        // Now that the DOM element exists, run the voice check
        checkVoiceWarning();
    }

    function createUI() {
        const container = document.createElement('div');
        container.style.cssText = 'margin:2rem 0;padding:2rem;border:2px solid #0066cc;border-radius:8px;background:white;font-family:system-ui;';
        container.innerHTML = `
            <div style="padding:1rem;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:8px;margin-bottom:1.5rem;">
                <div style="display:flex;justify-content:space-between;">
                    <div>
                        <div style="font-size:0.85rem;opacity:0.9;">${CFG.statusLabel}</div>
                        <div id="video-status" style="font-size:1.2rem;font-weight:bold;">${CFG.paused}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.85rem;opacity:0.9;">${CFG.subtitleLabel}</div>
                        <div id="subtitle-counter" style="font-size:1.2rem;font-weight:bold;">0 / ${subtitles.length}</div>
                    </div>
                </div>
            </div>
            <div id="current-subtitle" style="padding:2rem;background:#1a1a1a;color:#fff;border-radius:8px;
                min-height:120px;font-size:1.3rem;text-align:center;margin-bottom:1.5rem;
                display:flex;align-items:center;justify-content:center;">
                <p style="margin:0;opacity:0.6;">${CFG.waiting}</p>
            </div>
            <div style="padding:1rem;background:#f8f9fa;border-radius:8px;margin-bottom:1rem;">
                <div style="margin-bottom:0.75rem;">
                    <label style="display:block;margin-bottom:0.25rem;font-weight:600;">
                        ${CFG.speed}: <span id="rate-value">1.2x</span>
                    </label>
                    <input type="range" id="rate-slider" min="0.5" max="2" step="0.1" value="1.2" style="width:100%;">
                </div>
                <div style="margin-bottom:0.75rem;">
                    <label style="display:block;margin-bottom:0.25rem;font-weight:600;">
                        ${CFG.pitch}: <span id="pitch-value">1.0x</span>
                    </label>
                    <input type="range" id="pitch-slider" min="0.5" max="2" step="0.1" value="1.0" style="width:100%;">
                </div>
                <div>
                    <label style="display:block;margin-bottom:0.25rem;font-weight:600;">
                        ${CFG.volume}: <span id="volume-value">150%</span>
                    </label>
                    <input type="range" id="volume-slider" min="0" max="2" step="0.1" value="1.5" style="width:100%;">
                </div>
                <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #dee2e6;">
                    <label style="display:flex;align-items:center;cursor:pointer;font-weight:600;">
                        <input type="checkbox" id="fast-mode" style="margin-right:0.5rem;width:18px;height:18px;cursor:pointer;">
                        ${CFG.turbo}
                    </label>
                    <p style="margin:0.5rem 0 0 0;font-size:0.85rem;color:#666;">${CFG.turboHint}</p>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        document.getElementById('rate-slider').addEventListener('input', e => {
            document.getElementById('rate-value').textContent = e.target.value + 'x';
        });
        document.getElementById('pitch-slider').addEventListener('input', e => {
            document.getElementById('pitch-value').textContent = e.target.value + 'x';
        });
        document.getElementById('volume-slider').addEventListener('input', e => {
            document.getElementById('volume-value').textContent = Math.round(e.target.value * 100) + '%';
        });
    }

    async function init() {
        for (let i = 0; i < 20; i++) {
            iframe = document.querySelector('iframe[src*="23video"], iframe[src*="regionsjaelland"]');
            if (iframe) break;
            await new Promise(r => setTimeout(r, 500));
        }
        if (!iframe) { console.error('❌ No iframe found'); return; }
        subtitles = parseSRT(SUBTITLES_SRT);
        createUI();
        injectToggleButton();
        if (playerReady) subscribeToEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }

})();

} // End guard
