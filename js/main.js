/**
 * Harmonia Wellness Clinic — front-end interactions
 */

(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Header scroll & mobile nav ── */
  const header = $("#header");
  const navToggle = $("#navToggle");
  const mainNav = $("#mainNav");

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 20);
  }

  navToggle?.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  });

  $$(".main-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* Active nav by current page */
  const currentPage = document.body.dataset.page;
  if (currentPage) {
    $$(`.main-nav a[data-nav="${currentPage}"]`).forEach((a) => a.classList.add("active"));
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Toast notifications ── */
  const toastContainer = $("#toastContainer");

  function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  /* ── Form validation ── */
  const validators = {
    required(value) {
      return String(value).trim().length > 0;
    },
    email(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
    },
    phone(value) {
      return /^[\d\s\-+().]{7,}$/.test(String(value).trim());
    },
    date(value) {
      if (!value) return false;
      const d = new Date(value);
      return !Number.isNaN(d.getTime());
    },
    futureDate(value) {
      if (!validators.date(value)) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(value) >= today;
    },
    pastDate(value) {
      if (!validators.date(value)) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return new Date(value) <= today;
    },
    checkbox(el) {
      return el.checked;
    },
  };

  const messages = {
    required: "This field is required.",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid phone number.",
    date: "Please select a valid date.",
    futureDate: "Please choose today or a future date.",
    pastDate: "Please enter a valid date of birth.",
    checkbox: "You must agree to continue.",
  };

  function validateField(input, rules) {
    const group = input.closest(".form-group") || input.closest(".form-check");
    const errorEl = group?.querySelector(".error-msg");
    let valid = true;
    let msg = "";

    for (const rule of rules) {
      if (rule === "checkbox") {
        valid = validators.checkbox(input);
      } else if (rule === "email") {
        valid = validators.required(input.value) && validators.email(input.value);
      } else if (rule === "phone") {
        valid = validators.required(input.value) && validators.phone(input.value);
      } else if (rule === "futureDate") {
        valid = validators.required(input.value) && validators.futureDate(input.value);
      } else if (rule === "pastDate") {
        valid = validators.required(input.value) && validators.pastDate(input.value);
      } else if (rule === "required") {
        valid = validators.required(input.value);
      }

      if (!valid) {
        msg = messages[rule] || messages.required;
        break;
      }
    }

    input.classList.toggle("invalid", !valid);
    if (errorEl) errorEl.textContent = valid ? "" : msg;
    return valid;
  }

  function setupFormValidation(form, fieldRules) {
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let allValid = true;

      Object.entries(fieldRules).forEach(([id, rules]) => {
        const input = form.querySelector(`#${id}`);
        if (input && !validateField(input, rules)) allValid = false;
      });

      if (!allValid) {
        showToast("Please fix the highlighted fields.", "error");
        form.querySelector(".invalid")?.focus();
        return;
      }

      handleFormSuccess(form);
    });

    Object.keys(fieldRules).forEach((id) => {
      const input = form.querySelector(`#${id}`);
      if (!input) return;
      const event = input.type === "checkbox" ? "change" : "blur";
      input.addEventListener(event, () => validateField(input, fieldRules[id]));
    });
  }

  function handleFormSuccess(form) {
    const id = form.id;
    let message = "Thank you! We'll be in touch shortly.";

    if (id === "bookForm") {
      const dept = $("#bookDept")?.value || "the clinic";
      const date = $("#bookDate")?.value || "";
      message = `Appointment request received for ${dept}${date ? ` on ${formatDate(date)}` : ""}. We'll confirm within 2 hours.`;
      form.reset();
    } else if (id === "registerForm") {
      message = "Registration complete! Please bring photo ID to your first visit.";
      form.reset();
    } else if (id === "contactForm") {
      message = "Your message has been sent. Our team will respond within one business day.";
      form.reset();
    }

    showToast(message, "success");
  }

  function formatDate(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const bookDate = $("#bookDate");
  if (bookDate) {
    bookDate.min = new Date().toISOString().split("T")[0];
  }

  const bookDeptSelect = $("#bookDept");
  const urlParams = new URLSearchParams(window.location.search);
  const deptParam = urlParams.get("dept");
  if (bookDeptSelect && deptParam) {
    const options = [...bookDeptSelect.options].map((o) => o.value);
    if (options.includes(deptParam)) bookDeptSelect.value = deptParam;
  }

  setupFormValidation($("#bookForm"), {
    bookFirstName: ["required"],
    bookLastName: ["required"],
    bookEmail: ["email"],
    bookPhone: ["phone"],
    bookDept: ["required"],
    bookDate: ["futureDate"],
    bookTime: ["required"],
    bookConsent: ["checkbox"],
  });

  setupFormValidation($("#registerForm"), {
    regFirstName: ["required"],
    regLastName: ["required"],
    regDob: ["pastDate"],
    regEmail: ["email"],
    regPhone: ["phone"],
    regAddress: ["required"],
    regEmergency: ["required"],
    regConsent: ["checkbox"],
  });

  setupFormValidation($("#contactForm"), {
    contactName: ["required"],
    contactEmail: ["email"],
    contactSubject: ["required"],
    contactMessage: ["required"],
  });

  /* ── Service slideshow (home) ── */
  const slides = $$(".service-slideshow .slide");
  const slideshowDots = $("#slideshowDots");
  const slideshowThumbs = $("#slideshowThumbs");
  let slideshowIndex = 0;
  let slideshowTimer;

  function goToSlideshow(index) {
    if (!slides.length) return;
    slideshowIndex = ((index % slides.length) + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === slideshowIndex);
    });

    $$(".slideshow-dot", slideshowDots).forEach((dot, i) => {
      dot.classList.toggle("active", i === slideshowIndex);
      dot.setAttribute("aria-selected", String(i === slideshowIndex));
    });

    $$(".slideshow-thumb", slideshowThumbs).forEach((thumb, i) => {
      thumb.classList.toggle("active", i === slideshowIndex);
    });
  }

  function resetSlideshowAutoplay() {
    clearInterval(slideshowTimer);
    slideshowTimer = setInterval(() => goToSlideshow(slideshowIndex + 1), 5500);
  }

  if (slides.length) {
    slides.forEach((slide, i) => {
      if (slideshowDots) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = `slider-dot slideshow-dot${i === 0 ? " active" : ""}`;
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Slide ${i + 1}`);
        dot.setAttribute("aria-selected", String(i === 0));
        dot.addEventListener("click", () => {
          goToSlideshow(i);
          resetSlideshowAutoplay();
        });
        slideshowDots.appendChild(dot);
      }

      if (slideshowThumbs) {
        const img = slide.querySelector("img");
        const thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = `slideshow-thumb${i === 0 ? " active" : ""}`;
        thumb.setAttribute("aria-label", `Go to slide ${i + 1}`);
        thumb.innerHTML = `<img src="${img.getAttribute("src")}" alt="" width="100" height="64">`;
        thumb.addEventListener("click", () => {
          goToSlideshow(i);
          resetSlideshowAutoplay();
        });
        slideshowThumbs.appendChild(thumb);
      }
    });

    $("#slideshowPrev")?.addEventListener("click", () => {
      goToSlideshow(slideshowIndex - 1);
      resetSlideshowAutoplay();
    });

    $("#slideshowNext")?.addEventListener("click", () => {
      goToSlideshow(slideshowIndex + 1);
      resetSlideshowAutoplay();
    });

    const slideshowEl = $("#serviceSlideshow");
    slideshowEl?.addEventListener("mouseenter", () => clearInterval(slideshowTimer));
    slideshowEl?.addEventListener("mouseleave", resetSlideshowAutoplay);

    resetSlideshowAutoplay();
  }

  /* ── Testimonial slider ── */
  const track = $("#testimonialTrack");
  const cards = track ? $$(".testimonial-card", track) : [];
  const dotsContainer = $("#sliderDots");
  let currentSlide = 0;
  let slideInterval;

  function goToSlide(index) {
    if (!cards.length) return;
    currentSlide = ((index % cards.length) + cards.length) % cards.length;

    cards.forEach((card, i) => card.classList.toggle("active", i === currentSlide));

    if (dotsContainer) {
      $$(".slider-dot", dotsContainer).forEach((dot, i) => {
        dot.classList.toggle("active", i === currentSlide);
        dot.setAttribute("aria-selected", String(i === currentSlide));
      });
    }
  }

  if (cards.length && dotsContainer) {
    cards.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `slider-dot${i === 0 ? " active" : ""}`;
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Testimonial ${i + 1}`);
      dot.setAttribute("aria-selected", String(i === 0));
      dot.addEventListener("click", () => {
        goToSlide(i);
        resetTestimonialAutoplay();
      });
      dotsContainer.appendChild(dot);
    });

    $("#prevTestimonial")?.addEventListener("click", () => {
      goToSlide(currentSlide - 1);
      resetTestimonialAutoplay();
    });

    $("#nextTestimonial")?.addEventListener("click", () => {
      goToSlide(currentSlide + 1);
      resetTestimonialAutoplay();
    });

    function resetTestimonialAutoplay() {
      clearInterval(slideInterval);
      slideInterval = setInterval(() => goToSlide(currentSlide + 1), 6000);
    }

    resetTestimonialAutoplay();
  }

  /* ── Scroll reveal ── */
  const revealTargets = $$(
    ".dept-card, .team-card, .journey-step, .section-header, .about-content, .about-visual, .cta-banner, .faq-grid > *, .dept-detail-content, .dept-detail-image"
  );

  revealTargets.forEach((el) => el.classList.add("reveal"));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
