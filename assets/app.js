/* ==========================================================================
   Git kursi — interaktiv xulq-atvor (shared component)

   0) REJIM (mode): 📱 O'qish  /  💻 Amaliyot
      - Birinchi tashrifda ekran o'lchamiga qarab avtomatik tanlanadi
      - Foydalanuvchi tanlasa — localStorage'da eslab qolinadi (barcha darslar uchun)
      - ?mode=read / ?mode=do  bilan havola orqali ham majburlash mumkin
   1) Quiz: darhol (avtomatik) javob/fikr beradi — retrieval practice uchun
   2) Buyruqlarni nusxalash tugmasi (.cmd -> "Copy")
   3) Checklist holatini localStorage'da saqlaydi
   4) Bosib chiqarishdan oldin barcha <details> ochiladi (to'liq konspekt)

   Darslar shu faylni <script defer src="../assets/app.js"> bilan ulaydi.
   ========================================================================== */
(function () {
  "use strict";

  var STORE_MODE = "git-course:mode";
  var MODES = { READ: "read", DO: "do" };

  /* ---------- kichik yordamchilar --------------------------------------- */
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function store(key, val) {          // localStorage xatolarga chidamli o'ram
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  // Sahifa nomi (faqat fayl nomi) — file:// va GitHub Pages'da bir xil kalit bo'lsin
  function pageKey() {
    var parts = location.pathname.split("/");
    return parts[parts.length - 1] || "index.html";
  }

  /* ======================================================================
     0) REJIM
     ====================================================================== */
  function detectMode() {
    // 1-o'rin: havoladagi ?mode=...
    var q = (location.search.match(/[?&]mode=(read|do)\b/) || [])[1];
    if (q) return q;
    // 2-o'rin: avval tanlangani
    var saved = store(STORE_MODE);
    if (saved === MODES.READ || saved === MODES.DO) return saved;
    // 3-o'rin: ekran kengligi. Tor ekran = telefon = o'qish rejimi.
    var narrow = window.matchMedia && window.matchMedia("(max-width: 820px)").matches;
    var touchOnly = window.matchMedia && window.matchMedia("(hover: none)").matches;
    return (narrow || touchOnly) ? MODES.READ : MODES.DO;
  }

  function applyMode(mode, remember) {
    document.body.classList.toggle("mode-read", mode === MODES.READ);
    document.body.classList.toggle("mode-do", mode === MODES.DO);
    if (remember) store(STORE_MODE, mode);
    $all("[data-set-mode]").forEach(function (btn) {
      var pressed = btn.getAttribute("data-set-mode") === mode;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
  }

  // Rejim almashganda ekran "sakramasin": ko'rinib turgan sarlavhaga qaytamiz
  function switchMode(mode) {
    var anchor = $all("h2, h1").filter(function (h) {
      return h.getBoundingClientRect().top < 120;
    }).pop();
    var before = anchor ? anchor.getBoundingClientRect().top : null;

    applyMode(mode, true);

    if (anchor && before !== null) {
      var after = anchor.getBoundingClientRect().top;
      window.scrollBy(0, after - before);
    }
  }

  function buildModebar() {
    var main = document.querySelector("main.lesson");
    if (!main || main.querySelector(".modebar")) return;

    var isHome = /(^|\/)index\.html?$/.test(location.pathname) ||
                 /\/$/.test(location.pathname);

    var bar = document.createElement("div");
    bar.className = "modebar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Kursni ishlatish rejimi");
    bar.innerHTML =
      '<span class="modebar-label">Rejim</span>' +
      '<button type="button" class="modebtn" data-set-mode="read">📱 O\'qish</button>' +
      '<button type="button" class="modebtn" data-set-mode="do">💻 Amaliyot</button>' +
      (isHome ? "" : '<a class="modebar-home" href="' + homeHref() + '">Kurs ↑</a>');

    main.insertBefore(bar, main.firstChild);
  }

  // index.html ga to'g'ri nisbiy yo'l (lessons/ va reference/ ichidan bir pog'ona yuqori)
  function homeHref() {
    return /\/(lessons|reference)\//.test(location.pathname) ? "../index.html" : "index.html";
  }

  function initModes() {
    buildModebar();
    $all("[data-set-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchMode(btn.getAttribute("data-set-mode"));
      });
    });
    applyMode(detectMode(), false);
  }

  /* ======================================================================
     1) QUIZ
     ======================================================================
     Belgilash (markup):
       <div class="quiz">
         <p class="quiz-q"><span class="num">SAVOL 1</span> Matn?</p>
         <ul class="quiz-options">
           <li><button class="quiz-option" data-correct="true">To'g'ri javob</button></li>
           <li><button class="quiz-option">Boshqa</button></li>
         </ul>
         <div class="quiz-explain">Nega bunday — izoh.</div>
       </div>                                                                */
  function initQuiz(quiz) {
    var options = $all(".quiz-option", quiz);
    var explain = quiz.querySelector(".quiz-explain");
    var answered = false;

    options.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (answered) return;
        answered = true;

        var isCorrect = btn.getAttribute("data-correct") === "true";

        options.forEach(function (o) {
          o.disabled = true;
          if (o.getAttribute("data-correct") === "true") {
            o.classList.add("correct");
            addMark(o, "✓");
          }
        });

        if (!isCorrect) {
          btn.classList.add("incorrect");
          addMark(btn, "✗");
        }
        if (explain) explain.classList.add("show");
      });
    });

    function addMark(el, symbol) {
      if (el.querySelector(".mark")) return;
      var span = document.createElement("span");
      span.className = "mark";
      span.textContent = symbol;
      el.appendChild(span);
    }
  }

  /* ======================================================================
     2) NUSXA OLISH (copy) — faqat amaliyot rejimida ko'rinadi (CSS)
     ====================================================================== */
  function initCopy(cmd) {
    // Nusxalanadigan matn: data-cmd bo'lsa o'sha, bo'lmasa ko'rinadigan matn.
    var text = cmd.getAttribute("data-cmd");
    if (text === null) text = cmd.textContent.trim();

    var btn = document.createElement("button");
    btn.className = "cmd-copy";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Buyruqdan nusxa olish");

    btn.addEventListener("click", function () {
      var done = function () {
        btn.textContent = "Nusxa ✓";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });

    cmd.appendChild(btn);
  }

  /* ======================================================================
     3) CHECKLIST holatini saqlash
     ====================================================================== */
  function initChecklist(box) {
    $all('input[type="checkbox"]', box).forEach(function (inp, i) {
      var key = "git-course:" + pageKey() + ":chk:" + (inp.id || i);
      if (store(key) === "1") inp.checked = true;
      inp.addEventListener("change", function () {
        store(key, inp.checked ? "1" : "0");
      });
    });
  }

  /* ======================================================================
     4) BOSMA (print): barcha yopiq javoblarni ochib beramiz
     ====================================================================== */
  function initPrint() {
    if (!window.matchMedia) return;
    window.addEventListener("beforeprint", function () {
      $all("details").forEach(function (d) {
        if (!d.open) { d.open = true; d.dataset.wasClosed = "1"; }
      });
    });
    window.addEventListener("afterprint", function () {
      $all("details[data-was-closed]").forEach(function (d) {
        d.open = false;
        delete d.dataset.wasClosed;
      });
    });
  }

  /* ---------- Ishga tushirish ------------------------------------------- */
  function boot() {
    initModes();                        // eng avval: sahifa "sakramasin"
    $all(".quiz").forEach(initQuiz);
    $all(".cmd").forEach(initCopy);
    $all(".checklist").forEach(initChecklist);
    initPrint();
  }

  // <script defer> bilan DOM tayyor bo'ladi; baribir himoya qo'yamiz.
  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
