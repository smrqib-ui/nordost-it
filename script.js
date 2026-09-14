/* QBS-Solutions — Landing Page Interaktionen
   Bewusst schlank: Header-Status, eine Hero-Einblendung, Hero-Video-Steuerung,
   mobile Navigation, Demo-Formular. Bewegung respektiert prefers-reduced-motion. */

(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Header: fester Hintergrund nach dem Scrollen ------------------- */
  var last = null;
  function syncHeader() {
    var scrolled = window.scrollY > 40;
    if (scrolled === last) return;
    last = scrolled;
    header.toggleAttribute("data-scrolled", scrolled);
  }
  syncHeader();
  window.addEventListener("scroll", function () {
    window.requestAnimationFrame(syncHeader);
  }, { passive: true });

  /* --- Hero-Einblendung: eine orchestrierte Bewegung ----------------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    if (reduceMotion) {
      hero.classList.add("is-ready");
    } else {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { hero.classList.add("is-ready"); });
      });
    }
  }

  /* --- Hero-Video: letzte Sekunden abschneiden, bei reduzierter Bewegung
         stoppen, im Hintergrund pausieren -------------------------------- */
  var TRIM_END = 2; // Sekunden am Ende, die nicht gezeigt werden
  var video = document.querySelector("[data-hero-video]");
  if (video) {
    if (reduceMotion) {
      video.pause();
      video.removeAttribute("autoplay");
    } else {
      // vor den letzten TRIM_END Sekunden zurück an den Anfang springen
      video.addEventListener("timeupdate", function () {
        if (isFinite(video.duration) && video.duration > TRIM_END &&
            video.currentTime >= video.duration - TRIM_END) {
          video.currentTime = 0;
        }
      });
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) video.pause();
        else { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      });
    }
  }

  /* --- Mobile Navigation ------------------------------------------------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");
  if (toggle && mobileNav) {
    var setNav = function (open) {
      header.toggleAttribute("data-nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      mobileNav.hidden = !open;
    };
    toggle.addEventListener("click", function () {
      setNav(!header.hasAttribute("data-nav-open"));
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.hasAttribute("data-nav-open")) setNav(false);
    });
  }

  /* --- Kontaktformular: Versand an info@qbs-solutions.ch via FormSubmit --- */
  var form = document.querySelector("[data-form]");
  var note = document.querySelector("[data-form-note]");
  if (form && note) {
    var endpoint = form.getAttribute("action");
    var fallbackMail = "info@qbs-solutions.ch";

    var setNote = function (text, isError) {
      note.hidden = false;
      note.classList.toggle("is-error", !!isError);
      note.textContent = text;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Wird gesendet …"; }
      note.hidden = true;

      fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      })
        .then(function (r) { return r.ok ? r.json().catch(function () { return {}; }) : Promise.reject(r); })
        .then(function () {
          var first = ((form.elements.name && form.elements.name.value) || "").trim().split(/\s+/)[0];
          setNote((first ? "Danke, " + first + " – " : "Danke – ") +
            "Ihre Anfrage ist eingegangen. Wir melden uns innerhalb eines Arbeitstags.", false);
          form.reset();
        })
        .catch(function () {
          setNote("Senden hat nicht geklappt. Bitte schreiben Sie uns direkt an " +
            fallbackMail + " oder rufen Sie an.", true);
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  }

  /* --- Jahr in der Fusszeile ------------------------------------------ */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
