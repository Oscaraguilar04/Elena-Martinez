(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var toggle = document.getElementById("menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  var navLinks = document.querySelectorAll(".nav-link");
  var sections = document.querySelectorAll("main section[id]");
  var contactForm = document.getElementById("contact-form");
  var guideForm = document.getElementById("guide-form");
  var formStatus = document.getElementById("form-status");
  var guideStatus = document.getElementById("guide-status");
  var yearEl = document.getElementById("year");
  var intentField = contactForm ? contactForm.elements.namedItem("intent") : null;
  var messageField = contactForm ? contactForm.elements.namedItem("message") : null;

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function closeMenu() {
    if (!header || !toggle || !mobileNav) return;
    header.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    mobileNav.hidden = true;
    document.body.style.overflow = "";
  }

  function openMenu() {
    header.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    mobileNav.hidden = false;
    document.body.style.overflow = "hidden";
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      if (header.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  function onScrollChrome() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 16);
    }
  }

  onScrollChrome();
  window.addEventListener("scroll", onScrollChrome, { passive: true });

  function scrollToId(id) {
    var target = document.querySelector(id);
    if (!target) return;
    var offset = header ? header.offsetHeight - 1 : 0;
    var top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      if (!document.querySelector(id)) return;
      event.preventDefault();
      scrollToId(id);
    });
  });

  function setActiveLink() {
    var offset = (header ? header.offsetHeight : 72) + 48;
    var current = "home";

    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top - offset <= 0) {
        current = section.id;
      }
    });

    if (current === "trust" || current === "about" || current === "stories") {
      current = current === "trust" ? "home" : current === "about" ? "sell" : "guide";
    }

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      link.classList.toggle("is-active", href === "#" + current);
    });
  }

  setActiveLink();
  window.addEventListener("scroll", setActiveLink, { passive: true });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );

    document.querySelectorAll(".reveal").forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index % 3, 2) * 80 + "ms";
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  function prefillContact(intent, message) {
    if (!contactForm) return;

    if (intent) {
      var radio = contactForm.querySelector('input[name="intent"][value="' + intent + '"]');
      if (radio) radio.checked = true;
    }

    if (messageField && message) {
      messageField.value = message;
    }
  }

  document.querySelectorAll("[data-intent]").forEach(function (link) {
    link.addEventListener("click", function () {
      prefillContact(link.getAttribute("data-intent"), link.getAttribute("data-message"));
    });
  });

  function setFieldError(input, isError) {
    var field = input.closest("label") || input.closest("fieldset");
    if (field) field.classList.toggle("is-error", isError);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function bindForm(form, statusEl, successText, fields) {
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var valid = true;

      fields.forEach(function (name) {
        var input = form.elements.namedItem(name);
        if (!input) return;
        var empty = !String(input.value || "").trim();
        if (name === "intent") {
          empty = !form.querySelector('input[name="intent"]:checked');
          var pills = form.querySelector(".intent-pills");
          if (pills) pills.classList.toggle("is-error", empty);
        } else {
          setFieldError(input, empty);
        }
        if (empty) valid = false;
      });

      var email = form.elements.namedItem(fields.indexOf("email") > -1 ? "email" : "guide-email");
      if (email && email.value.trim() && !isValidEmail(email.value.trim())) {
        setFieldError(email, true);
        valid = false;
      }

      if (!valid) {
        statusEl.textContent = "Please complete the required fields.";
        statusEl.classList.add("is-error");
        return;
      }

      statusEl.classList.remove("is-error");
      statusEl.textContent = "";
      form.reset();
      fields.forEach(function (name) {
        var input = form.elements.namedItem(name);
        if (input && input.tagName) setFieldError(input, false);
      });
      var pills = form.querySelector(".intent-pills");
      if (pills) pills.classList.remove("is-error");
      var host = form.closest(".guide-card") || form;
      host.classList.add("is-complete");
      var success = document.getElementById(form.id === "guide-form" ? "guide-success" : "contact-success");
      if (success) success.hidden = false;
    });

    form.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        setFieldError(input, false);
        if (statusEl && statusEl.textContent.indexOf("Please") === 0) {
          statusEl.textContent = "";
          statusEl.classList.remove("is-error");
        }
      });
    });
  }

  bindForm(
    contactForm,
    formStatus,
    "Thanks — Elena will be in touch shortly.",
    ["name", "email", "phone", "intent", "message"]
  );

  bindForm(
    guideForm,
    guideStatus,
    "Thanks! Your guide is ready.",
    ["guide-name", "guide-email"]
  );

})();
