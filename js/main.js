(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const themeToggle = document.querySelector(".theme-toggle");
  const themeColorMeta = document.querySelector("#theme-color-meta");
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const toast = document.querySelector(".toast");
  const roleElement = document.querySelector(".typed-role");
  const roleKeys = roleElement.dataset.roleKeys.split("|");
  let roles = [];
  let roleClusters = [];
  let roleIndex = 0;
  let characterIndex = 0;
  let deleting = false;
  let roleInitialized = false;
  let toastTimer;

  const segmentText = (text) => {
    if ("Segmenter" in Intl) {
      return Array.from(
        new Intl.Segmenter(root.lang, { granularity: "grapheme" }).segment(
          text,
        ),
        (part) => part.segment,
      );
    }
    return Array.from(text);
  };

  const updateRoles = (dictionary) => {
    roles = roleKeys.map((key) => dictionary[key]);
    roleClusters = roles.map(segmentText);
    if (!roleInitialized) {
      characterIndex = roleClusters[0].length;
      roleInitialized = true;
    } else {
      characterIndex = Math.min(characterIndex, roleClusters[roleIndex].length);
    }
    roleElement.textContent = roleClusters[roleIndex]
      .slice(0, characterIndex)
      .join("");
  };

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    themeColorMeta.content = theme === "light" ? "#eef1f8" : "#0b1020";
    themeToggle.querySelector(".theme-symbol").textContent =
      theme === "light" ? "☾" : "☼";
    try {
      localStorage.setItem("asp-theme", theme);
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  };
  setTheme(root.dataset.theme || "dark");
  themeToggle.addEventListener("click", () =>
    setTheme(root.dataset.theme === "dark" ? "light" : "dark"),
  );

  const applyLanguage = (language) => {
    const dictionary =
      window.PORTFOLIO_LANG[language] || window.PORTFOLIO_LANG.en;
    root.lang = language;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const translation = dictionary[element.dataset.i18n];
      if (translation !== undefined) element.innerHTML = translation;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const translation = dictionary[element.dataset.i18nAria];
      if (translation !== undefined)
        element.setAttribute("aria-label", translation);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
      const translation = dictionary[element.dataset.i18nAlt];
      if (translation !== undefined) element.setAttribute("alt", translation);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const translation = dictionary[element.dataset.i18nTitle];
      if (translation !== undefined) element.setAttribute("title", translation);
    });
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.lang === language),
      );
    });
    menuToggle.setAttribute(
      "aria-label",
      dictionary[
        menuToggle.getAttribute("aria-expanded") === "true"
          ? "menuClose"
          : "menuOpen"
      ],
    );
    updateRoles(dictionary);
    try {
      localStorage.setItem("asp-language", language);
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  };

  let preferredLanguage = "en";
  try {
    preferredLanguage = localStorage.getItem("asp-language") || "en";
  } catch {
    /* Keep English as the default. */
  }
  applyLanguage(preferredLanguage);
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.lang));
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    navMenu.classList.toggle("is-open", !isOpen);
    menuToggle.setAttribute(
      "aria-label",
      window.PORTFOLIO_LANG[root.lang][isOpen ? "menuOpen" : "menuClose"],
    );
  });
  navMenu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute(
        "aria-label",
        window.PORTFOLIO_LANG[root.lang].menuOpen,
      );
    }),
  );

  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const active = link.hash === `#${entry.target.id}`;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((element) => element.classList.add("is-revealed"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    revealItems.forEach((element) => revealObserver.observe(element));
  }

  if (!reducedMotion) {
    const typeRole = () => {
      const currentRole = roleClusters[roleIndex];
      roleElement.textContent = currentRole.slice(0, characterIndex).join("");
      if (!deleting && characterIndex === currentRole.length) {
        deleting = true;
        window.setTimeout(typeRole, 1400);
        return;
      }
      if (deleting && characterIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
      characterIndex += deleting ? -1 : 1;
      window.setTimeout(typeRole, deleting ? 48 : 78);
    };
    window.setTimeout(typeRole, 1600);
  }

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const counter = entry.target;
        const target = Number(counter.dataset.target);
        if (reducedMotion) counter.textContent = String(target);
        else {
          const start = performance.now();
          const duration = 700;
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            counter.textContent = String(
              Math.round(target * (1 - (1 - progress) ** 3)),
            );
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
        observer.unobserve(counter);
      });
    },
    { threshold: 0.8 },
  );
  document
    .querySelectorAll(".counter")
    .forEach((counter) => counterObserver.observe(counter));

  document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter-button").forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle("is-active", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      document.querySelectorAll("[data-category]").forEach((card) => {
        card.hidden =
          button.dataset.filter !== "all" &&
          card.dataset.category !== button.dataset.filter;
      });
    });
  });

  let activeSlide = 0;
  const slides = [...document.querySelectorAll(".project-slide")];
  document.querySelectorAll("[data-carousel]").forEach((button) => {
    button.addEventListener("click", () => {
      activeSlide =
        (activeSlide +
          (button.dataset.carousel === "next" ? 1 : -1) +
          slides.length) %
        slides.length;
      slides.forEach((slide, index) => {
        slide.hidden = index !== activeSlide;
        slide.classList.toggle("is-current", index === activeSlide);
      });
      document.querySelector("#slide-current").textContent = String(
        activeSlide + 1,
      ).padStart(2, "0");
    });
  });

  if (
    !reducedMotion &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  const backToTop = document.querySelector(".back-to-top");
  const updateBackToTop = () =>
    backToTop.classList.toggle("is-visible", window.scrollY > 400);
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }),
  );

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(
      () => toast.classList.remove("is-visible"),
      2200,
    );
  };
  document
    .querySelector("[data-copy-email]")
    .addEventListener("click", async () => {
      const email = "setpainga73@gmail.com";
      try {
        if (navigator.clipboard && window.isSecureContext)
          await navigator.clipboard.writeText(email);
        else {
          const temporaryInput = document.createElement("textarea");
          temporaryInput.value = email;
          temporaryInput.setAttribute("readonly", "");
          temporaryInput.style.position = "fixed";
          temporaryInput.style.opacity = "0";
          document.body.append(temporaryInput);
          temporaryInput.select();
          const copied = document.execCommand("copy");
          temporaryInput.remove();
          if (!copied) throw new Error("Clipboard unavailable");
        }
        showToast(window.PORTFOLIO_LANG[root.lang].copiedToast);
      } catch {
        showToast(email);
      }
    });

  document.querySelector("#year").textContent = new Date().getFullYear();
})();
