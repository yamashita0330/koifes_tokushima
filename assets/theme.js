/*
  恋フェスJAPAN テーマ別サブLP共通JS
  カーソル追従・fade-in観測・カウントアップ・浮遊ハート・sticky LINEバー・訪問/スクロール計測ビーコン。
  ページ側は <script>window.KOIFES_SCROLL_STEPS=[['selector','ラベル'], ...];</script> を
  このファイルの読み込み前に置くことで計測対象セクションを差し替えられる（未設定時は既定値を使用）。
*/
(function () {
  // カスタムカーソル追従
  var cursor = document.getElementById('customCursor');
  if (cursor) {
    document.addEventListener('mousemove', function (e) {
      requestAnimationFrame(function () {
        cursor.style.transform = 'translate(' + (e.clientX - 10) + 'px, ' + (e.clientY - 10) + 'px)';
      });
    });
    document.body.addEventListener('mouseover', function (e) {
      if (e.target.closest('.hover-target, button, input, select, a, textarea')) {
        cursor.classList.add('hovered');
      } else {
        cursor.classList.remove('hovered');
      }
    });
  }

  // fade-in-on-scroll
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in-element').forEach(function (el) { observer.observe(el); });

  // .stat-number カウントアップ（stats-areaが交差した時に一括発火）
  var statsArea = document.getElementById('stats-area');
  if (statsArea) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.stat-number').forEach(function (n) {
          var target = +n.dataset.target;
          var curr = 0;
          var int = setInterval(function () {
            curr += target / 50;
            if (curr >= target) { n.innerText = target.toLocaleString(); clearInterval(int); }
            else { n.innerText = Math.floor(curr).toLocaleString(); }
          }, 30);
        });
      });
    }, { threshold: 0.1 });
    statsObserver.observe(statsArea);
  }

  // .animate-num 個別カウントアップ
  var animateNumObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        var target = parseFloat(entry.target.dataset.target);
        var decimals = parseInt(entry.target.dataset.decimals || '0', 10);
        var duration = 1500, steps = 60, increment = target / steps, curr = 0;
        var int = setInterval(function () {
          curr += increment;
          if (curr >= target) {
            entry.target.innerText = decimals > 0 ? target.toFixed(decimals) : Math.round(target).toLocaleString();
            clearInterval(int);
          } else {
            entry.target.innerText = decimals > 0 ? curr.toFixed(decimals) : Math.floor(curr).toLocaleString();
          }
        }, duration / steps);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.animate-num').forEach(function (el) { animateNumObserver.observe(el); });

  // 浮遊ハート背景
  function createFloatingElement() {
    var el = document.createElement('div');
    el.className = 'floating-element';
    el.innerHTML = '♥';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (Math.random() * 2 + 1) + 'rem';
    el.style.animationDuration = (Math.random() * 5 + 12) + 's';
    el.style.color = ['#ff4500', '#ffffff', '#ffd700'][Math.floor(Math.random() * 3)];
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 17000);
  }
  setInterval(createFloatingElement, 2500);

  // 固定LINEバー：スクロール後に表示
  var fixedLineBar = document.getElementById('fixed-line-bar');
  if (fixedLineBar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) fixedLineBar.classList.add('visible');
      else fixedLineBar.classList.remove('visible');
    });
  }

  // ===== 訪問通知ビーコン（Netlify Forms→メール／1端末1日1通） =====
  try {
    var k = 'kf_visit_' + new Date().toISOString().slice(0, 10);
    if (!localStorage.getItem(k)) {
      localStorage.setItem(k, '1');
      var vb = new URLSearchParams();
      vb.append('form-name', 'koifes-visit2');
      vb.append('アクション', '訪問');
      vb.append('ページ', location.pathname + location.search);
      vb.append('流入元', document.referrer || '直接/不明');
      vb.append('端末', navigator.userAgent);
      vb.append('時刻', new Date().toLocaleString('ja-JP'));
      fetch('https://koifes-visit-notify.netlify.app/', { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: vb.toString() });
    }
  } catch (e) {}

  // ===== スクロール到達の計測（1訪問につき最も深く見た場所を1件だけ送信） =====
  var STEPS = window.KOIFES_SCROLL_STEPS || [
    ['.hero-section', '① ヒーロー'],
    ['#stats-area', '② 実績データ'],
    ['#events-area', '③ 開催日程'],
    ['#faq-area', '④ よくある質問'],
    ['#contact-area', '⑤ お問い合わせ']
  ];
  if (window.IntersectionObserver) {
    var deepest = 0, sent = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = +e.target.getAttribute('data-depth');
        if (i > deepest) deepest = i;
      });
    }, { threshold: 0 });
    STEPS.forEach(function (st, i) {
      var el = document.querySelector(st[0]);
      if (!el) return;
      el.setAttribute('data-depth', i);
      io.observe(el);
    });
    var send = function () {
      if (sent) return; sent = true;
      var b = new URLSearchParams();
      b.append('form-name', 'koifes-visit2');
      b.append('アクション', 'スクロール');
      b.append('ラベル', STEPS[deepest][1]);
      b.append('ページ', location.pathname + location.search);
      b.append('流入元', document.referrer || '直接/不明');
      b.append('端末', navigator.userAgent);
      b.append('時刻', new Date().toLocaleString('ja-JP'));
      var body = b.toString(), EP = 'https://koifes-visit-notify.netlify.app/';
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(EP, new Blob([body], { type: 'application/x-www-form-urlencoded' }));
        } else {
          fetch(EP, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body, keepalive: true });
        }
      } catch (e) {}
    };
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') send(); });
    addEventListener('pagehide', send);
  }
})();
