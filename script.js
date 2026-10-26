/**
 * Управление фоновым видео, ускоренным затемнением при скролле, глитчами и терминалом
 */
document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------
  // 1. Управление воспроизведением видео
  // --------------------------------------------------
  const desktopVideo = document.querySelector('.bg-video-desktop');
  const mobileVideo = document.querySelector('.bg-video-mobile');
  const isMobileQuery = window.matchMedia('(max-width: 768px)');

  function syncVideos() {
    const isMobile = isMobileQuery.matches;
    const activeVideo = isMobile ? mobileVideo : desktopVideo;
    const inactiveVideo = isMobile ? desktopVideo : mobileVideo;

    if (inactiveVideo && !inactiveVideo.paused) {
      inactiveVideo.pause();
    }

    if (activeVideo && activeVideo.paused) {
      activeVideo.play().catch(() => {});
    }
  }

  isMobileQuery.addEventListener('change', syncVideos);
  syncVideos();

  // Запуск при взаимодействии, если автоплей заблокирован браузером
  const startOnInteraction = () => {
    const activeVideo = isMobileQuery.matches ? mobileVideo : desktopVideo;
    if (activeVideo && activeVideo.paused) {
      activeVideo.play().catch(() => {});
    }
    window.removeEventListener('click', startOnInteraction);
    window.removeEventListener('touchstart', startOnInteraction);
  };

  window.addEventListener('click', startOnInteraction, { once: true });
  window.addEventListener('touchstart', startOnInteraction, { once: true });

  // --------------------------------------------------
  // 2. Раннее затемнение при скролле («затемняется раньше»)
  // --------------------------------------------------
  const scrollDarkness = document.getElementById('scrollDarkness');

  function handleScrollDarkness() {
    if (!scrollDarkness) return;
    const scrollY = window.scrollY;
    // Затемнение наступает быстро: уже на первых 180-220px (28% экрана) всё погружается в темноту
    const fadeDistance = window.innerHeight * 0.28;
    const progress = Math.min(1, Math.max(0, scrollY / fadeDistance));
    scrollDarkness.style.opacity = progress.toFixed(3);
  }

  window.addEventListener('scroll', handleScrollDarkness, { passive: true });
  handleScrollDarkness();

  // --------------------------------------------------
  // 3. Плавное появление терминала при прокрутке вниз
  // --------------------------------------------------
  const terminalCard = document.getElementById('terminalCard');

  if (terminalCard) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            terminalCard.classList.add('is-revealed');
          } else {
            if (window.scrollY < window.innerHeight * 0.25) {
              terminalCard.classList.remove('is-revealed');
            }
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    observer.observe(terminalCard);
  }

  // --------------------------------------------------
  // 4. Глитч-эффект для скрытого автора
  // --------------------------------------------------
  const glitchWrapper = document.getElementById('glitchAuthor');
  if (glitchWrapper) {
    const glitchTextEl = glitchWrapper.querySelector('.glitch-text');
    const glitchChars = [
      '█', '▓', '▒', '░', '▌', '▀', '■', '╳',
      '0', '1', 'Ø', 'X', '#', '?', '%', '&', '*', '!', '/', '\\'
    ];
    const length = 9;

    function getRandomGlitchString() {
      let str = '';
      for (let i = 0; i < length; i++) {
        str += glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      return str;
    }

    function runGlitch() {
      const newStr = getRandomGlitchString();
      if (glitchTextEl) glitchTextEl.textContent = newStr;
      glitchWrapper.setAttribute('data-text', newStr);

      const delay = Math.floor(Math.random() * 90) + 60;
      setTimeout(runGlitch, delay);
    }

    runGlitch();
  }

  // --------------------------------------------------
  // 5. Обработка команд терминала (clear и flag)
  // --------------------------------------------------
  const terminalInput = document.getElementById('terminalInput');
  const terminalOutputArea = document.getElementById('terminalOutputArea');
  const terminalHistory = document.getElementById('terminalHistory');

  if (terminalCard && terminalInput && terminalOutputArea && terminalHistory) {
    terminalCard.addEventListener('click', () => {
      terminalInput.focus();
    });

    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = terminalInput.value.trim();
        if (!val) return;

        const cmd = val.toLowerCase();

        // 1. Команда clear — очистка и сворачивание терминала
        if (cmd === 'clear') {
          terminalHistory.innerHTML = '';
          terminalOutputArea.classList.remove('has-output');
          terminalInput.value = '';
          return;
        }

        // 2. Команда flag — вывод секретного флага красным шрифтом
        let responseHtml = '';
        if (cmd === 'flag') {
          responseHtml = '<span class="term-flag">flag{y0u_f1nd_m3_br4h}</span>';
        } else {
          responseHtml = `zsh: command not found: ${escapeHtml(val)}`;
        }

        // Добавляем запись в историю вывода снизу
        const logItem = document.createElement('div');
        logItem.className = 'term-log-item';
        logItem.innerHTML = `
          <div class="term-log-cmd">
            <span class="term-prompt">&gt;</span>
            <span>${escapeHtml(val)}</span>
          </div>
          <div class="term-log-res">${responseHtml}</div>
        `;

        terminalHistory.appendChild(logItem);

        // Открываем область вывода внизу
        terminalOutputArea.classList.add('has-output');

        // Очищаем строку ввода и скроллим панель к последней строке
        terminalInput.value = '';
        setTimeout(() => {
          terminalOutputArea.scrollTop = terminalOutputArea.scrollHeight;
        }, 40);
      }
    });
  }

  // --------------------------------------------------
  // 6. Интерактивная заглушка для кнопки портфолио
  // --------------------------------------------------
  const heroPortfolioBtn = document.getElementById('heroPortfolioBtn');
  const heroPortfolioSub = document.getElementById('heroPortfolioSub');

  if (heroPortfolioBtn && heroPortfolioSub) {
    let feedbackTimeout = null;
    const origText = heroPortfolioSub.textContent;

    heroPortfolioBtn.addEventListener('click', () => {
      heroPortfolioSub.textContent = '[ раздел в разработке ]';
      heroPortfolioSub.style.color = '#ffffff';

      clearTimeout(feedbackTimeout);
      feedbackTimeout = setTimeout(() => {
        heroPortfolioSub.textContent = origText;
        heroPortfolioSub.style.color = '';
      }, 2400);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
