/* ==========================================================================
   Git kursi — interaktiv xulq-atvor (shared component)
   1) Quiz: darhol (avtomatik) javob/fikr beradi  — retrieval practice uchun
   2) Buyruqlarni nusxalash tugmasi (.cmd -> "Copy")
   3) Checklist holatini localStorage'da saqlaydi
   Darslar shu faylni <script defer src="../assets/app.js"> bilan ulaydi.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- 1) QUIZ ---------------------------------------------------- */
  // Belgilash (markup):
  //   <div class="quiz">
  //     <p class="quiz-q"><span class="num">SAVOL 1</span> Matn?</p>
  //     <ul class="quiz-options">
  //       <li><button class="quiz-option" data-correct="true">To'g'ri javob</button></li>
  //       <li><button class="quiz-option">Boshqa</button></li>
  //     </ul>
  //     <div class="quiz-explain">Nega bunday — izoh.</div>
  //   </div>
  function initQuiz(quiz) {
    var options = Array.prototype.slice.call(
      quiz.querySelectorAll(".quiz-option")
    );
    var explain = quiz.querySelector(".quiz-explain");
    var answered = false;

    options.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (answered) return;
        answered = true;

        var isCorrect = btn.getAttribute("data-correct") === "true";

        options.forEach(function (o) {
          o.disabled = true;
          var ok = o.getAttribute("data-correct") === "true";
          if (ok) {
            o.classList.add("correct");
            addMark(o, "✓"); // ✓
          }
        });

        if (!isCorrect) {
          btn.classList.add("incorrect");
          addMark(btn, "✗"); // ✗
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

  /* ---------- 2) NUSXA OLISH (copy) ------------------------------------- */
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

  /* ---------- 3) CHECKLIST holatini saqlash ----------------------------- */
  function initChecklist(box) {
    var inputs = box.querySelectorAll('input[type="checkbox"]');
    Array.prototype.forEach.call(inputs, function (inp, i) {
      var key = "git-course:" + location.pathname + ":chk:" + (inp.id || i);
      try {
        if (localStorage.getItem(key) === "1") inp.checked = true;
      } catch (e) {}
      inp.addEventListener("change", function () {
        try {
          localStorage.setItem(key, inp.checked ? "1" : "0");
        } catch (e) {}
      });
    });
  }

  /* ---------- Ishga tushirish ------------------------------------------- */
  function boot() {
    document.querySelectorAll(".quiz").forEach(initQuiz);
    document.querySelectorAll(".cmd").forEach(initCopy);
    document.querySelectorAll(".checklist").forEach(initChecklist);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
