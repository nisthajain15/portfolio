(function () {
  const config = window.PORTFOLIO || {};
  const root = document.documentElement;
  const themeButton = document.getElementById("themeToggle");
  const navToggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("site-menu");
  const searchInput = document.getElementById("project-search");
  const clearSearch = document.getElementById("clear-search");
  const projectsMount = document.querySelector("[data-projects]");
  const emptyState = document.querySelector("[data-empty]");
  const searchStatus = document.querySelector("[data-search-status]");
  const filtersMount = document.querySelector("[data-tech-filters]");
  const chatToggle = document.getElementById("chat-toggle");
  const chatClose = document.getElementById("chat-close");
  const chatPanel = document.getElementById("chat-panel");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatLog = document.querySelector("[data-chat-log]");
  const contactForm = document.getElementById("contact-form");

  let activeTech = "All";
  const chatHistory = [];

  function text(value) {
    return String(value || "").trim();
  }

  function isHttpUrl(value) {
    return /^https?:\/\//i.test(text(value));
  }

  function displayName() {
    return text(config.name) || "Personal Portfolio";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("portfolio-theme", theme);
    if (!themeButton) return;
    const next = theme === "dark" ? "light" : "dark";
    themeButton.setAttribute("aria-label", "Switch to " + next + " mode");
    const label = themeButton.querySelector(".theme-label");
    if (label) label.textContent = next === "dark" ? "Dark" : "Light";
  }

  function initTheme() {
    const saved = localStorage.getItem("portfolio-theme");
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  function setPageIdentity() {
    const name = displayName();
    document.title = text(config.name)
      ? config.name + " — Portfolio"
      : "Personal Portfolio";
    const brand = document.querySelector("[data-brand]");
    if (brand) brand.textContent = text(config.name) ? config.name.split(" ")[0] : "Portfolio";
    const heading = document.querySelector("[data-hero-name]");
    if (heading) heading.textContent = name;
    const titleEl = document.querySelector("[data-hero-title]");
    if (titleEl) titleEl.textContent = text(config.title);
    const intro = document.querySelector("[data-hero-intro]");
    if (intro) intro.textContent = text(config.introduction);
    const footer = document.querySelector("[data-footer]");
    if (footer) {
      footer.textContent = text(config.name)
        ? "© " + new Date().getFullYear() + " " + config.name
        : "Personal coursework portfolio";
    }
  }

  function renderSocial(containerSelector) {
    const mount = document.querySelector(containerSelector);
    if (!mount) return;
    mount.innerHTML = "";
    const links = [
      { href: config.github, label: "GitHub" },
      { href: config.linkedin, label: "LinkedIn" },
      { href: config.resumeUrl, label: "Resume" },
    ].filter(function (item) {
      return isHttpUrl(item.href);
    });
    links.forEach(function (item) {
      const a = document.createElement("a");
      a.className = "btn btn-ghost";
      a.href = item.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = item.label;
      mount.appendChild(a);
    });
  }

  function renderAbout() {
    const aboutText = document.querySelector("[data-about-text]");
    if (aboutText) aboutText.textContent = text(config.about);
    const facts = [];
    if (text(config.college)) facts.push(["College", config.college]);
    if (text(config.degree)) facts.push(["Degree", config.degree]);
    if (text(config.yearSemester)) facts.push(["Year / semester", config.yearSemester]);
    if (text(config.interests)) facts.push(["Interests", config.interests]);
    if (text(config.careerGoals)) facts.push(["Career goals", config.careerGoals]);
    const list = document.querySelector("[data-about-facts]");
    if (!list) return;
    list.innerHTML = facts
      .map(function (item) {
        return "<li><span>" + item[0] + "</span>" + item[1] + "</li>";
      })
      .join("");
  }

  function renderSkills() {
    const mount = document.querySelector("[data-skills]");
    if (!mount) return;
    const groups = config.skills || {};
    mount.innerHTML = Object.keys(groups)
      .filter(function (category) {
        return Array.isArray(groups[category]) && groups[category].some(text);
      })
      .map(function (category) {
        const items = groups[category]
          .filter(text)
          .map(function (skill) {
            return "<li>" + skill + "</li>";
          })
          .join("");
        return (
          '<article class="card skill-card"><h3>' +
          category +
          "</h3><ul>" +
          items +
          "</ul></article>"
        );
      })
      .join("");
  }

  function allProjects() {
    return Array.isArray(config.projects) ? config.projects.slice(0, 5) : [];
  }

  function uniqueTechnologies() {
    const set = new Set();
    allProjects().forEach(function (project) {
      (project.technologies || []).forEach(function (tech) {
        if (text(tech)) set.add(tech);
      });
    });
    return Array.from(set);
  }

  function matchesQuery(project, query) {
    if (!query) return true;
    const haystack = [
      project.title,
      project.description,
      (project.technologies || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  function renderFilters() {
    if (!filtersMount) return;
    const techs = ["All"].concat(uniqueTechnologies());
    filtersMount.innerHTML = "";
    techs.forEach(function (tech) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.textContent = tech;
      button.setAttribute("aria-pressed", String(tech === activeTech));
      button.addEventListener("click", function () {
        activeTech = tech;
        renderFilters();
        renderProjects();
      });
      filtersMount.appendChild(button);
    });
  }

  function projectCard(project) {
    const tags = (project.technologies || [])
      .filter(text)
      .map(function (tech) {
        return '<span class="tag">' + tech + "</span>";
      })
      .join("");
    const actions = [];
    if (isHttpUrl(project.github)) {
      actions.push(
        '<a class="btn btn-ghost" href="' +
          project.github +
          '" target="_blank" rel="noopener noreferrer">View on GitHub</a>'
      );
    }
    if (isHttpUrl(project.live)) {
      actions.push(
        '<a class="btn btn-primary" href="' +
          project.live +
          '" target="_blank" rel="noopener noreferrer">Live Demo</a>'
      );
    }
    return (
      '<article class="card project-card">' +
      "<h3>" +
      project.title +
      "</h3>" +
      "<p>" +
      project.description +
      "</p>" +
      '<div class="tags">' +
      tags +
      "</div>" +
      '<div class="project-actions">' +
      actions.join("") +
      "</div>" +
      "</article>"
    );
  }

  function renderProjects() {
    const query = text(searchInput && searchInput.value).toLowerCase();
    if (clearSearch) clearSearch.hidden = !query;
    const results = allProjects().filter(function (project) {
      const techOk =
        activeTech === "All" ||
        (project.technologies || []).some(function (tech) {
          return tech.toLowerCase() === activeTech.toLowerCase();
        });
      return techOk && matchesQuery(project, query);
    });
    if (projectsMount) {
      projectsMount.innerHTML = results.map(projectCard).join("");
    }
    if (emptyState) emptyState.hidden = results.length > 0;
    if (searchStatus) {
      searchStatus.textContent = query
        ? results.length + " project" + (results.length === 1 ? "" : "s") + " matching “" + searchInput.value + "”"
        : "";
    }
  }

  function renderContact() {
    const list = document.querySelector("[data-contact-list]");
    if (!list) return;
    const items = [];
    if (text(config.email)) {
      items.push(
        "<li>Email: <a href=\"mailto:" + config.email + "\">" + config.email + "</a></li>"
      );
    }
    if (isHttpUrl(config.github)) {
      items.push(
        '<li>GitHub: <a href="' +
          config.github +
          '" target="_blank" rel="noopener noreferrer">' +
          config.github +
          "</a></li>"
      );
    }
    if (isHttpUrl(config.linkedin)) {
      items.push(
        '<li>LinkedIn: <a href="' +
          config.linkedin +
          '" target="_blank" rel="noopener noreferrer">Profile</a></li>'
      );
    }
    list.innerHTML =
      items.join("") ||
      "<li>Add email, GitHub, and LinkedIn in <code>js/config.js</code>.</li>";
  }

  function renderChatSuggestions() {
    const mount = document.querySelector("[data-chat-suggestions]");
    if (!mount) return;
    (config.suggestedQuestions || []).forEach(function (question) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = question;
      button.addEventListener("click", function () {
        chatInput.value = question;
        sendChat(question);
      });
      mount.appendChild(button);
    });
  }

  function addBubble(role, message) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + role;
    bubble.textContent = message;
    chatLog.appendChild(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
    return bubble;
  }

  function portfolioContext() {
    return JSON.stringify(
      {
        name: config.name || null,
        title: config.title,
        introduction: config.introduction,
        about: config.about,
        college: config.college || null,
        degree: config.degree,
        yearSemester: config.yearSemester || null,
        skills: config.skills,
        projects: allProjects().map(function (project) {
          return {
            title: project.title,
            description: project.description,
            technologies: project.technologies,
            github: isHttpUrl(project.github) ? project.github : null,
            live: isHttpUrl(project.live) ? project.live : null,
          };
        }),
        github: isHttpUrl(config.github) ? config.github : null,
        linkedin: isHttpUrl(config.linkedin) ? config.linkedin : null,
        email: text(config.email) || null,
      },
      null,
      2
    );
  }

  async function sendChat(message) {
    const content = text(message);
    if (!content) return;
    addBubble("user", content);
    chatHistory.push({ role: "user", content: content });
    chatInput.value = "";
    const loading = addBubble("loading", "Thinking…");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory.slice(-12),
          portfolioContext: portfolioContext(),
        }),
      });
      const data = await response.json().catch(function () {
        return {};
      });
      loading.remove();
      if (!response.ok) {
        const errorText =
          data.error ||
          "The chatbot could not reach the API. Add credentials on the server and try again.";
        addBubble("system", errorText);
        return;
      }
      const reply = text(data.reply);
      if (!reply) {
        addBubble("system", "The API returned an empty reply.");
        return;
      }
      chatHistory.push({ role: "assistant", content: reply });
      addBubble("assistant", reply);
    } catch (error) {
      loading.remove();
      addBubble(
        "system",
        "Could not contact /api/chat. For local testing use `npx vercel dev`, or deploy to Vercel with environment variables."
      );
    }
  }

  function setupContactForm() {
    if (!contactForm) return;
    const errorEl = document.querySelector("[data-form-error]");
    const successEl = document.querySelector("[data-form-success]");

    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      errorEl.hidden = true;
      successEl.hidden = true;
      const formData = new FormData(contactForm);
      const name = text(formData.get("name"));
      const email = text(formData.get("email"));
      const message = text(formData.get("message"));
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (name.length < 2 || !emailOk || message.length < 10) {
        errorEl.hidden = false;
        errorEl.textContent =
          "Please enter your name, a valid email, and a message of at least 10 characters.";
        return;
      }

      if (!isHttpUrl(config.contactFormEndpoint)) {
        successEl.hidden = false;
        successEl.textContent =
          "Your message looks valid, but it was not sent. This site has no email backend yet. Email " +
          (text(config.email) || "the address you add in js/config.js") +
          " directly, or set contactFormEndpoint to a Formspree/Web3Forms URL.";
        return;
      }

      try {
        const response = await fetch(config.contactFormEndpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
        });
        if (!response.ok) throw new Error("Form endpoint failed");
        successEl.hidden = false;
        successEl.textContent = "Message submitted through your configured form endpoint.";
        contactForm.reset();
      } catch (error) {
        errorEl.hidden = false;
        errorEl.textContent = "The form endpoint could not be reached. Use email instead.";
      }
    });
  }

  function setupNav() {
    if (navToggle && menu) {
      navToggle.addEventListener("click", function () {
        const open = menu.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", String(open));
        navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          menu.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }
    if (themeButton) {
      themeButton.addEventListener("click", function () {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
      });
    }
  }

  function setupChat() {
    function setOpen(open) {
      chatPanel.hidden = !open;
      chatToggle.setAttribute("aria-expanded", String(open));
    }
    chatToggle.addEventListener("click", function () {
      setOpen(chatPanel.hidden);
    });
    chatClose.addEventListener("click", function () {
      setOpen(false);
    });
    chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      sendChat(chatInput.value);
    });
    chatInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendChat(chatInput.value);
      }
    });
  }

  initTheme();
  setPageIdentity();
  renderSocial("[data-hero-social]");
  renderAbout();
  renderSkills();
  renderFilters();
  renderProjects();
  renderContact();
  renderChatSuggestions();
  setupNav();
  setupContactForm();
  setupChat();

  if (searchInput) {
    searchInput.addEventListener("input", renderProjects);
  }
  if (clearSearch) {
    clearSearch.addEventListener("click", function () {
      searchInput.value = "";
      renderProjects();
      searchInput.focus();
    });
  }
})();
