// =====================================================
// SYNCHRONIZED SUBTITLE READER — UNIVERSAL TEMPLATE
// Uses 23video postMessage API
// Version: 1.28Op  (Op = Optimised for Safari iPadOS / ITP)
// Author: Marco Iovane maiov@regionsjaelland.dk
// =====================================================
//
// What's new in 1.28Op vs 1.28
// ────────────────────────────────────────────────────────────────────────────
//   1. LOCAL CLOCK — once any time signal arrives from the iframe a 5 Hz
//      local clock extrapolates the video time using performance.now() and
//      drives updateSubtitle(). Subtitles keep advancing even if the
//      23video iframe stops emitting events (Safari iPadOS + ITP).
//
//   2. CALIBRATION — every inbound time signal (timeupdate, progress,
//      getCurrentTime response) re-anchors the local clock. Drift > 1.5 s
//      is treated as a seek; smaller drift just nudges the anchor.
//
//   3. ADDITIONAL EVENTS — subscribes to `seeked` and `seeking`. When these
//      do make it through ITP they accelerate recovery.
//
//   4. RESYNC BUTTON — a visible "↻" button next to the toggle. When the
//      automatic pipeline cannot detect a pause or seek (no events arriving),
//      one tap probes the player and re-anchors the clock.
//
//   5. HEALTH CHECK — if no time signal arrives for 4 s while the video is
//      believed to be playing, TTS is soft-paused instead of drifting into
//      nonsense. As soon as a signal returns we recalibrate and resume.
//
//   6. WINDOW BLUR HEURISTIC — when the parent window loses focus (often
//      because the user tapped the iframe player), we send a probe and
//      briefly raise the alertness of the calibration loop.
//
//   7. FULL CLEANUP — all timers, observers and listeners are now stored
//      on `window` and torn down on the next initTTSReader() call. Fixes
//      pollInterval, voice-check setTimeouts, and MutationObserver leaking
//      across SPA navigations.
//
//   iOS speech path (`iosSpeakUntil`-based, gesture-unlocked) is preserved
//   verbatim. No changes to speech timing logic.
//
// Honest limits
// ────────────────────────────────────────────────────────────────────────────
//   Under aggressive ITP where the iframe sends nothing back at all, pause
//   and seek cannot be detected automatically — same-origin policy blocks
//   any other inspection of the cross-origin player. The health check
//   prevents TTS drift; the Resync button is the user's recovery path.
// =====================================================

window.initTTSReader = function(SRT_LANGUAGE_ARG, SRT_SUBTITLES_ARG) {

    // ── Cleanup previous instance (now exhaustive) ────────────────────────
    ['tts-toggle-wrapper', 'tts-voice-warning',
     'tts-log-container', 'tts-ui-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    document.querySelectorAll('[data-tts-reader]').forEach(el => el.remove());

    if (window._ttsMessageHandler) {
        window.removeEventListener('message', window._ttsMessageHandler);
        window._ttsMessageHandler = null;
    }
    if (window._ttsBlurHandler) {
        window.removeEventListener('blur', window._ttsBlurHandler);
        window._ttsBlurHandler = null;
    }
    if (window._ttsFocusHandler) {
        window.removeEventListener('focus', window._ttsFocusHandler);
        window._ttsFocusHandler = null;
    }
    ['_ttsPollInterval', '_ttsLocalClock'].forEach(k => {
        if (window[k]) { try { clearInterval(window[k]); } catch(e){} window[k] = null; }
    });
    ['_ttsVoiceTimeout1', '_ttsVoiceTimeout2', '_ttsVoiceTimeout3',
     '_ttsInitTimeout', '_ttsMutationTimeout'].forEach(k => {
        if (window[k]) { try { clearTimeout(window[k]); } catch(e){} window[k] = null; }
    });
    if (window._ttsMutationObserver) {
        try { window._ttsMutationObserver.disconnect(); } catch(e) {}
        window._ttsMutationObserver = null;
    }
    try { speechSynthesis.cancel(); } catch(e) {}

    const LANGUAGE      = SRT_LANGUAGE_ARG || window.SRT_LANGUAGE   || 'da';
    const SUBTITLES_SRT = SRT_SUBTITLES_ARG || window.SRT_SUBTITLES || '';

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
            resync: 'Synkronisér',
            resyncTitle: 'Tryk efter pause eller spring i videoen',
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
            resync: 'Resync',
            resyncTitle: 'Tap after pausing or seeking in the video',
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
            resync: 'Synchronisieren',
            resyncTitle: 'Nach Pause oder Sprung im Video tippen',
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
            resync: 'إعادة المزامنة',
            resyncTitle: 'اضغط بعد الإيقاف المؤقت أو القفز',
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
            resync: 'Yeniden senkronize',
            resyncTitle: 'Duraklatma veya atlama sonrası dokunun',
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
            resync: 'Sinkroniziraj',
            resyncTitle: 'Dodirnite nakon pauze ili premotavanja',
        },
    };

    const CFG = LANGUAGE_CONFIGS[LANGUAGE] || LANGUAGE_CONFIGS['da'];

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
    let ttsEnabled           = !isIOS;
    let iosSpeakUntil        = 0;
    let speakGeneration      = 0;
    let hasReceivedPlayEvent = false;

    // ── Local-clock state ────────────────────────────────────────────────
    let lcAnchorPerf  = null;       // performance.now() at last calibration
    let lcAnchorVideo = null;       // video time at that calibration
    let lcLastSignal  = 0;          // performance.now() of last inbound time
    let lcSoftPaused  = false;      // health-check has soft-paused us

    const LC_TICK_MS         = 200;
    const LC_DRIFT_SEEK      = 1.5;   // s — gap that triggers seek-style restart
    const LC_HEALTH_TIMEOUT  = 4000;  // ms — no signal for this long → soft pause
    const LC_BLUR_PROBE_MS   = 250;   // delay after blur before probing

    const VOL_TTS_ON  = isIOS ? 30 : 10;
    const VOL_TTS_OFF = 100;

    const PLAYER_ORIGIN  = 'https://regionsjaelland.23video.com';
    const PLAYER_VERSION = '0.0.12';

    // ── Voice loading ────────────────────────────────────────────────────
    function loadVoices() {
        const voices = speechSynthesis.getVoices();
        if (voices.length) availableVoices = voices;
    }
    speechSynthesis.onvoiceschanged = () => { loadVoices(); checkVoiceWarning(); };
    loadVoices();
    window._ttsVoiceTimeout1 = setTimeout(loadVoices, 500);
    window._ttsVoiceTimeout2 = setTimeout(() => { loadVoices(); checkVoiceWarning(); }, 1500);
    window._ttsVoiceTimeout3 = setTimeout(() => { loadVoices(); checkVoiceWarning(); }, 3000);

    function checkVoiceWarning() {
        if (isIOS) return;
        if (!availableVoices.length) return;
        const voice = getVoice();
        if (voice) return;
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

    // ── SRT parsing ──────────────────────────────────────────────────────
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

    // ── Local clock ──────────────────────────────────────────────────────
    function lcExtrapolate() {
        if (lcAnchorPerf === null) return null;
        return lcAnchorVideo + (performance.now() - lcAnchorPerf) / 1000;
    }

    function lcCalibrate(videoTime) {
        if (typeof videoTime !== 'number' || isNaN(videoTime) || videoTime < 0) return;
        lcLastSignal = performance.now();

        const prev = lcExtrapolate();
        if (prev !== null && isVideoPlaying) {
            const drift = videoTime - prev;
            if (Math.abs(drift) > LC_DRIFT_SEEK) {
                // Treat as seek: cancel, mark justSeeked, fresh anchor
                speakGeneration++;
                try { speechSynthesis.cancel(); } catch(e) {}
                currentlySpeaking = false;
                iosSpeakUntil = 0;
                justSeeked = true;
                postSeekCooldown = false;
                currentSubtitleIndex = -1;
            }
            // small drift → silent re-anchor, no further action
        }
        lcAnchorPerf  = performance.now();
        lcAnchorVideo = videoTime;
        lastKnownTime = videoTime;

        if (lcSoftPaused) {
            lcSoftPaused = false; // a signal returned → resume
        }
    }

    function lcStart() {
        if (window._ttsLocalClock) return;
        window._ttsLocalClock = setInterval(() => {
            if (!isVideoPlaying) return;
            if (lcAnchorPerf === null) return;
            // Health check
            if (performance.now() - lcLastSignal > LC_HEALTH_TIMEOUT) {
                if (!lcSoftPaused) {
                    lcSoftPaused = true;
                    speakGeneration++;
                    try { speechSynthesis.cancel(); } catch(e) {}
                    currentlySpeaking = false;
                    iosSpeakUntil = 0;
                    console.log('💤 No time signal for ' + LC_HEALTH_TIMEOUT + 'ms — soft-pausing TTS');
                }
                // Probe — if anything responds we'll resume
                sendPlayerCmd('getCurrentTime');
                return;
            }
            if (lcSoftPaused) return;
            const t = lcExtrapolate();
            if (t !== null) updateSubtitle(t);
        }, LC_TICK_MS);
    }

    function lcStop() {
        if (window._ttsLocalClock) {
            clearInterval(window._ttsLocalClock);
            window._ttsLocalClock = null;
        }
        lcAnchorPerf = null;
        lcAnchorVideo = null;
        lcSoftPaused = false;
    }

    // ── Speak (iOS path UNCHANGED, desktop path UNCHANGED) ───────────────
    function speak(text, isSeekedSubtitle) {
        isSeekedSubtitle = isSeekedSubtitle || false;
        if (!ttsEnabled) return;
        text = cleanText(text);
        if (!text) return;

        const fastMode = document.getElementById('fast-mode')?.checked || false;
        let rate = parseFloat(document.getElementById('rate-slider')?.value || 1.2);
        if (fastMode) rate = Math.min(rate * 1.25, 2.0);
        if (isIOS) rate = Math.max(rate * 0.95, 0.5);

        // ── iOS path ──────────────────────────────────────────────────────
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

        // ── Desktop / Android path ────────────────────────────────────────
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
        utterance.onerror = () => {
            if (myGen !== speakGeneration) return;
            currentlySpeaking = false;
            justSeeked = false;
            postSeekCooldown = false;
        };

        speechSynthesis.speak(utterance);
    }

    // ── Display + subtitle dispatch ──────────────────────────────────────
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

    // ── Player message I/O ───────────────────────────────────────────────
    function sendPlayerCmd(method, value) {
        if (!iframe) return;
        const payload = { context: 'player.js', version: PLAYER_VERSION, method };
        if (value !== undefined) payload.value = value;
        try {
            iframe.contentWindow.postMessage(JSON.stringify(payload), PLAYER_ORIGIN);
        } catch(e) {}
    }

    function setPlayerVolume(level) { sendPlayerCmd('setVolume', level); }

    window._ttsMessageHandler = handlePlayerMessage;
    window.addEventListener('message', handlePlayerMessage);

    function handlePlayerMessage(event) {
        if (!event.data) return;
        try {
            const data = JSON.parse(event.data);
            const isGenuineReady = data.ready === true
                || (data.context === 'player.js' && data.event === 'ready');
            const isFirstMsg = data.context === 'player.js' && !playerReady;

            if (isGenuineReady || isFirstMsg) {
                const wasReady = playerReady;
                playerReady = true;
                if (iframe) {
                    if (isGenuineReady || !wasReady) {
                        console.log('✅ Player ready — subscribing' + (wasReady ? ' (re-subscribe)' : ''));
                        subscribeToEvents();
                    }
                }
                if (isGenuineReady) return;
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
                hasReceivedPlayEvent = true;
                isVideoPlaying = true;
                if (typeof currentTime === 'number') lcCalibrate(currentTime);
                lcStart();
                if (document.getElementById('video-status'))
                    document.getElementById('video-status').textContent = CFG.playing;
                break;

            case 'pause':
                hasReceivedPlayEvent = true;
                isVideoPlaying = false;
                if (typeof currentTime === 'number') lcCalibrate(currentTime);
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
                hasReceivedPlayEvent = true;
                isVideoPlaying = false;
                lcStop();
                speakGeneration++;
                speechSynthesis.cancel();
                currentlySpeaking = false;
                justSeeked = false;
                postSeekCooldown = false;
                iosSpeakUntil = 0;
                if (document.getElementById('video-status'))
                    document.getElementById('video-status').textContent = CFG.ended;
                break;

            case 'seeking':
                speakGeneration++;
                try { speechSynthesis.cancel(); } catch(e) {}
                currentlySpeaking = false;
                iosSpeakUntil = 0;
                justSeeked = true;
                postSeekCooldown = false;
                if (typeof currentTime === 'number') lcCalibrate(currentTime);
                break;

            case 'seeked':
                if (typeof currentTime === 'number') {
                    // Force seek-style calibration
                    lcAnchorPerf = null; // ensure drift check on next calibrate is relative
                    lcCalibrate(currentTime);
                    justSeeked = true;
                    postSeekCooldown = false;
                    currentSubtitleIndex = -1;
                }
                break;

            case 'timeupdate':
            case 'progress':
                if (currentTime !== undefined && currentTime !== null) {
                    if (!isVideoPlaying) {
                        hasReceivedPlayEvent = true;
                        isVideoPlaying = true;
                        if (document.getElementById('video-status'))
                            document.getElementById('video-status').textContent = CFG.playing;
                    }
                    lcCalibrate(currentTime);
                    lcStart();
                }
                break;

            case 'getCurrentTime':
                if (currentTime !== undefined && currentTime !== null) {
                    if (!hasReceivedPlayEvent && !isVideoPlaying && currentTime > 0) {
                        hasReceivedPlayEvent = true;
                        isVideoPlaying = true;
                        console.log('▶ Detected already-playing at t:' + currentTime.toFixed(2));
                        if (document.getElementById('video-status'))
                            document.getElementById('video-status').textContent = CFG.playing;
                    }
                    if (isVideoPlaying) {
                        lcCalibrate(currentTime);
                        lcStart();
                    }
                }
                break;
        }
    }

    function subscribeToEvents() {
        if (!iframe || !playerReady) return;
        if (window._ttsPollInterval) {
            clearInterval(window._ttsPollInterval);
            window._ttsPollInterval = null;
        }
        ['play', 'pause', 'ended', 'timeupdate', 'progress', 'seeking', 'seeked'].forEach(evt => {
            sendPlayerCmd('addEventListener', evt);
        });
        window._ttsPollInterval = setInterval(() => {
            if (!iframe) {
                clearInterval(window._ttsPollInterval);
                window._ttsPollInterval = null;
                return;
            }
            sendPlayerCmd('getCurrentTime');
            if (ttsEnabled) setPlayerVolume(VOL_TTS_ON);
        }, 1000);
        setPlayerVolume(ttsEnabled ? VOL_TTS_ON : VOL_TTS_OFF);

        // Probe immediately — catches the case where player is already playing
        // (cookie consent dialog had been blocking)
        setTimeout(() => sendPlayerCmd('getCurrentTime'), 300);
    }

    // ── Window blur / focus heuristic ────────────────────────────────────
    // When the parent window loses focus the user has likely tapped into
    // the iframe — pause TTS speech briefly and probe the player so any
    // pause / seek that happens manifests as a fresh time signal.
    window._ttsBlurHandler = () => {
        if (!iframe) return;
        // Don't kill the local clock — just nudge the calibrator.
        setTimeout(() => sendPlayerCmd('getCurrentTime'), LC_BLUR_PROBE_MS);
    };
    window._ttsFocusHandler = () => {
        if (!iframe) return;
        sendPlayerCmd('getCurrentTime');
    };
    window.addEventListener('blur', window._ttsBlurHandler);
    window.addEventListener('focus', window._ttsFocusHandler);

    // ── Toggle + Resync ──────────────────────────────────────────────────
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
            // Probe the player to refresh local clock as soon as enabled
            sendPlayerCmd('getCurrentTime');
        }
    }

    function resyncFromUser() {
        // Hard reset of speech state, then probe the player.
        speakGeneration++;
        try { speechSynthesis.cancel(); } catch(e) {}
        currentlySpeaking = false;
        iosSpeakUntil = 0;
        justSeeked = true;
        postSeekCooldown = false;
        currentSubtitleIndex = -1;
        // Soft-pause until a fresh signal arrives, with a 1.5 s safety release
        lcSoftPaused = true;
        sendPlayerCmd('getCurrentTime');
        setTimeout(() => {
            if (lcSoftPaused) {
                lcSoftPaused = false;
                console.log('⚠️ Resync probe got no response — keeping last anchor');
            }
        }, 1500);
        const btn = document.getElementById('tts-resync-btn');
        if (btn) {
            btn.style.transform = 'scale(0.92)';
            setTimeout(() => { btn.style.transform = 'scale(1)'; }, 150);
        }
    }

    // ── UI ───────────────────────────────────────────────────────────────
    function injectToggleButton() {
        const iframeWrapper  = iframe.parentNode;
        const videoSchemaDiv = iframeWrapper ? iframeWrapper.parentNode : null;

        const wrapper = document.createElement('div');
        wrapper.id = 'tts-toggle-wrapper';
        wrapper.style.cssText = [
            'display:flex', 'align-items:center', 'gap:0.75rem', 'flex-wrap:wrap',
            'margin-top:0.75rem', 'font-family:system-ui,sans-serif'
        ].join(';');

        const btn = document.createElement('div');
        btn.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:0.55rem',
            'cursor:pointer', 'user-select:none',
            'padding:0.5rem 1rem 0.5rem 0.5rem',
            'border-radius:999px',
            'transition:background 0.15s'
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

        // Resync button — visible always, primary recovery for iOS/ITP cases
        const resync = document.createElement('button');
        resync.id = 'tts-resync-btn';
        resync.title = CFG.resyncTitle;
        resync.setAttribute('aria-label', CFG.resync);
        resync.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:0.4rem',
            'padding:0.55rem 1rem',
            'background:#fff', 'color:#00809c',
            'border:2px solid #00809c', 'border-radius:999px',
            'font-size:1rem', 'font-weight:700',
            'cursor:pointer', 'user-select:none',
            'font-family:system-ui,sans-serif',
            'transition:transform 0.15s, background 0.15s'
        ].join(';');
        resync.innerHTML = `<span style="font-size:1.2rem;line-height:1;">↻</span><span>${CFG.resync}</span>`;
        resync.addEventListener('click', resyncFromUser);
        resync.addEventListener('mouseenter', () => { resync.style.background = '#e6f4f6'; });
        resync.addEventListener('mouseleave', () => { resync.style.background = '#fff'; });

        wrapper.appendChild(btn);
        wrapper.appendChild(resync);

        if (videoSchemaDiv && iframeWrapper) {
            try { videoSchemaDiv.insertBefore(wrapper, iframeWrapper.nextSibling); }
            catch(e) { document.body.appendChild(wrapper); }
        } else if (iframeWrapper && iframeWrapper.parentNode) {
            try { iframeWrapper.parentNode.insertBefore(wrapper, iframeWrapper.nextSibling); }
            catch(e) { document.body.appendChild(wrapper); }
        } else {
            document.body.appendChild(wrapper);
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
        wrapper.insertAdjacentElement('afterend', warning);

        checkVoiceWarning();
    }

    function createUI() {
        const container = document.createElement('div');
        container.setAttribute('data-tts-reader', '1');
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

    // ── Init ─────────────────────────────────────────────────────────────
    async function init() {
        console.log('📄 v1.28Op | SRT length:' + SUBTITLES_SRT.length +
                    ' | first 80 chars: ' + SUBTITLES_SRT.substring(0, 80).replace(/\n/g, '↵'));

        iframe = document.querySelector('iframe[src*="23video"], iframe[src*="regionsjaelland"]');
        if (!iframe) {
            console.log('⏳ iframe not found — waiting via MutationObserver');
            await new Promise(resolve => {
                const observer = new MutationObserver(() => {
                    const found = document.querySelector('iframe[src*="23video"], iframe[src*="regionsjaelland"]');
                    if (found) {
                        iframe = found;
                        observer.disconnect();
                        window._ttsMutationObserver = null;
                        console.log('✅ iframe appeared');
                        resolve();
                    }
                });
                window._ttsMutationObserver = observer;
                observer.observe(document.body, { childList: true, subtree: true });
                window._ttsMutationTimeout = setTimeout(() => {
                    try { observer.disconnect(); } catch(e) {}
                    window._ttsMutationObserver = null;
                    if (!iframe) {
                        console.error('❌ No iframe found after 60s');
                        resolve();
                    }
                }, 60000);
            });
        }

        if (!iframe) return;

        subtitles = parseSRT(SUBTITLES_SRT);
        console.log('✅ iframe found | subs:' + subtitles.length);
        createUI();
        injectToggleButton();
        if (playerReady) subscribeToEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        window._ttsInitTimeout = setTimeout(init, 1000);
    }

})();

}; // end initTTSReader
