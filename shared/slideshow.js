function el(id) {
  return document.getElementById(id);
}

async function loadSlides() {
  const params = new URLSearchParams(window.location.search);
  const version = params.get("v");
  const slidesUrl = version ? `./slides.json?v=${encodeURIComponent(version)}` : "./slides.json";
  const res = await fetch(slidesUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load slides.json");
  return res.json();
}

function createNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderDots(count, activeIndex) {
  const wrap = el("dots");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement("div");
    dot.className = `pager-dot${i === activeIndex ? " active" : ""}`;
    wrap.appendChild(dot);
  }
}

function setHero(sectionSlide, meta) {
  const countryTitle = sectionSlide.slide.title || meta.defaultTitle || "";
  el("title").textContent = sectionSlide.section.title || countryTitle;
  el("subtitle").textContent = countryTitle;
  el("logoLabel").textContent = meta.logoLabel || "MSA";
}

function setSourcesLink(meta) {
  const button = el("sourcesButton");
  if (!button) return;

  const countryLabel = meta.defaultTitle || document.title || "Country";
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const countryPath = pathParts[pathParts.length - 2] || "";
  const params = new URLSearchParams({ country: countryLabel, path: countryPath });
  button.href = `../sources/index.html?${params.toString()}`;
}

function setBackground(slide, meta) {
  const bg = el("bgTexture");
  const background = slide.background || meta.background || {};
  const src = background.src || "../shared/country-background.png";
  bg.style.backgroundSize = background.size || "cover";
  bg.style.backgroundPosition = background.position || "center";
  bg.style.backgroundRepeat = background.repeat || "no-repeat";
  bg.style.opacity = background.opacity || "";
  bg.style.backgroundImage = src
    ? `linear-gradient(180deg, rgba(5, 7, 20, 0.28) 0%, rgba(5, 7, 20, 0.92) 84%, rgba(5, 7, 20, 1) 100%), url("${src}")`
    : "linear-gradient(180deg, rgba(5, 7, 20, 0.28) 0%, rgba(5, 7, 20, 0.92) 84%, rgba(5, 7, 20, 1) 100%)";
}

function createContentBlock(title, text) {
  if (!title && !text) return null;
  const article = createNode("article", "content-block");
  if (title) {
    article.appendChild(createNode("h3", "", title));
  }
  if (text) {
    article.appendChild(createNode("p", "", text));
  }
  return article;
}

function createPartiesBlock(title, parties) {
  if (!parties?.length) return null;
  const article = createNode("article", "content-block");
  article.appendChild(createNode("h3", "", title || "Main Parties Involved"));

  const list = createNode("ul", "party-list");
  parties.forEach((party) => {
    const item = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = party.name || "Party";
    item.appendChild(strong);
    item.append(` - ${party.description || ""}`);
    list.appendChild(item);
  });

  article.appendChild(list);
  return article;
}

function createTimelineBlock(title, items) {
  if (!items?.length) return null;
  const article = createNode("article", "content-block");
  article.appendChild(createNode("h3", "", title || "Timeline"));

  const list = createNode("div", "timeline");
  items.slice(0, 3).forEach((item) => {
    const entry = createNode("article", "timeline-item");
    const dot = createNode("span", "timeline-dot");
    dot.setAttribute("aria-hidden", "true");

    const year = createNode("h4", "", item.year || "20XX");
    const text = createNode("p", "", item.description || "");

    entry.append(dot, year, text);
    list.appendChild(entry);
  });

  article.appendChild(list);
  return article;
}

function createStatsBlock(title, items) {
  if (!items?.length) return null;
  const wrap = createNode("article", "feature-stack");
  wrap.appendChild(createNode("h3", "stack-heading", title || "Key Figures"));

  const grid = createNode("div", "stats-grid");
  items.slice(0, 4).forEach((item) => {
    const card = createNode("article", "stat-card");
    const stat = createNode("p", "stat-value", item.value || "XX");
    const label = createNode("p", "stat-label", item.label || "");
    card.append(stat, label);
    grid.appendChild(card);
  });

  wrap.appendChild(grid);
  return wrap;
}

function createQrBlock(title, items) {
  if (!items?.length) return null;
  const wrap = createNode("article", "feature-stack");
  wrap.appendChild(createNode("h3", "stack-heading", title || "How to Help"));

  const grid = createNode("div", "qr-grid");
  const cards = items.slice(0, 3);
  grid.classList.toggle("single-card", cards.length === 1);
  grid.classList.toggle("three-cards", cards.length === 3);
  grid.classList.toggle("has-primary", cards.some((item) => item.primary));

  cards.forEach((item) => {
    const article = document.createElement("article");
    const textOnlyCard = !item.qr && !item.url;
    const qrImageCard = Boolean(item.qr);
    article.className = `qr-card${textOnlyCard ? " qr-card-text" : ""}${qrImageCard ? " qr-card-image" : ""}${item.primary ? " qr-card-primary" : ""}`;

    if (item.qr) {
      const img = document.createElement("img");
      img.className = "qr-image";
      img.src = item.qr;
      img.alt = item.label ? `${item.label} QR code` : "QR code";
      article.appendChild(img);
    } else {
      article.appendChild(createNode("span", "qr-placeholder", item.placeholder || "QR CODE"));
    }

    if (item.label) {
      const label = document.createElement("span");
      label.className = "qr-link";
      label.textContent = item.label;
      article.appendChild(label);
    }

    grid.appendChild(article);
  });

  wrap.appendChild(grid);
  return wrap;
}

function createLearnMoreBlock(title, learnMore) {
  if (!learnMore?.text && !learnMore?.url) return null;
  const article = createNode("article", "content-block learn-more");
  article.appendChild(createNode("h3", "", title || "Learn More"));

  const copy = document.createElement("p");
  copy.append(document.createTextNode(learnMore?.text || ""));

  if (learnMore?.label) {
    copy.append(" ");
    copy.append(document.createTextNode(learnMore.label));
  }

  article.appendChild(copy);
  return article;
}

function createImageCard(image, fallbackAlt, heading) {
  if (!image?.src && !heading) return null;

  const wrap = createNode("div", "feature-stack");
  if (image?.src) {
    const figure = createNode("figure", "media-card feature-media-card");
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || fallbackAlt;
    img.dataset.mode = image.mode || "photo";
    figure.classList.toggle("qr-media-card", img.dataset.mode === "qr");
    figure.appendChild(img);
    wrap.appendChild(figure);
  }

  return wrap;
}

function buildSectionSlides(slides) {
  const sections = [
    { key: "whatsHappening", title: "What's Happening", eyebrow: "Section 1" },
    { key: "civilianImpact", title: "Civilian Impact", eyebrow: "Section 2" },
    { key: "howToHelp", title: "How to Help", eyebrow: "Section 3" },
  ];

  return sections.map((section) => ({
    slide: slides[0],
    slides,
    section,
  }));
}

function getEntryLabel(slide, index, total) {
  if (total <= 1) return "";
  return slide.subtitle || "";
}

function hasText(value) {
  return Boolean(value && value.trim());
}

function renderSection(sectionSlide) {
  const shell = el("sectionShell");
  shell.innerHTML = "";

  const panel = createNode("section", `feature-panel feature-panel-${sectionSlide.section.key}`);
  panel.appendChild(createNode("p", "section-eyebrow", sectionSlide.section.eyebrow));

  const gridClass =
    sectionSlide.section.key === "whatsHappening"
      ? "feature-grid"
      : "feature-grid feature-grid-fill";
  const grid = createNode("div", gridClass);
  const copy = createNode("div", "feature-copy");
  const side = createNode("aside", "feature-side");
  const appendIfPresent = (parent, node) => {
    if (node) parent.appendChild(node);
  };

  if (sectionSlide.section.key === "whatsHappening") {
    sectionSlide.slides.forEach((slide, index) => {
      const label = getEntryLabel(slide, index, sectionSlide.slides.length);
      const suffix = label ? ` - ${label}` : "";
      const timelineHeading = slide.whatsHappening?.timelineHeading || "Timeline";
      const timelineSuffix = slide.whatsHappening?.timelineHeading ? "" : suffix;
      appendIfPresent(copy, createContentBlock(`Background${suffix}`, slide.whatsHappening?.background));
      appendIfPresent(
        copy,
        createPartiesBlock(
          `${slide.whatsHappening?.partiesHeading || "Main Parties Involved"}${suffix}`,
          slide.whatsHappening?.parties,
        ),
      );
      appendIfPresent(
        copy,
        createTimelineBlock(
          `${timelineHeading}${timelineSuffix}`,
          slide.whatsHappening?.timeline,
        ),
      );
      appendIfPresent(
        side,
        createImageCard(
          slide.whatsHappening?.image,
          "Country context image",
        ),
      );
    });
  }

  if (sectionSlide.section.key === "civilianImpact") {
    sectionSlide.slides.forEach((slide, index) => {
      const label = getEntryLabel(slide, index, sectionSlide.slides.length);
      const suffix = label ? ` - ${label}` : "";
      appendIfPresent(copy, createContentBlock(`Experiences${suffix}`, slide.civilianImpact?.experiences));
      appendIfPresent(side, createStatsBlock(`Key Figures${suffix}`, slide.civilianImpact?.stats));
      appendIfPresent(
        side,
        createImageCard(
          slide.civilianImpact?.image,
          "Civilian impact image",
        ),
      );
    });
  }

  if (sectionSlide.section.key === "howToHelp") {
    sectionSlide.slides.forEach((slide, index) => {
      const label = getEntryLabel(slide, index, sectionSlide.slides.length);
      const suffix = label ? ` - ${label}` : "";
      if (hasText(slide.howToHelp?.summary)) {
        appendIfPresent(copy, createContentBlock(`Summary${suffix}`, slide.howToHelp?.summary));
      }
      if (hasText(slide.howToHelp?.learnMore?.text) || slide.howToHelp?.learnMore?.url) {
        appendIfPresent(copy, createLearnMoreBlock(`Learn More${suffix}`, slide.howToHelp?.learnMore));
      }
      if (slide.howToHelp?.cards?.length) {
        appendIfPresent(side, createQrBlock(`Support Options${suffix}`, slide.howToHelp?.cards));
      }
      appendIfPresent(
        side,
        createImageCard(
          slide.howToHelp?.image,
          "How to help image",
        ),
      );
    });
  }

  if (!copy.children.length) {
    copy.appendChild(createContentBlock("", "No content available for this section yet."));
  }

  if (!side.children.length) {
    grid.classList.add("feature-grid-single");
  } else {
    grid.appendChild(side);
  }

  grid.prepend(copy);
  panel.appendChild(grid);
  shell.appendChild(panel);
}

function renderSlide(sectionSlide, meta, index, total) {
  setBackground(sectionSlide.slide, meta);
  setHero(sectionSlide, meta);
  renderSection(sectionSlide);
  renderDots(total, index);
  el("slideCount").textContent = `${index + 1} / ${total}`;
}

async function main() {
  const data = await loadSlides();
  const meta = data.meta || {};
  const slides = data.slides || [];
  if (slides.length === 0) throw new Error("slides.json has no slides");

  const sectionSlides = buildSectionSlides(slides);
  const hasMultipleSlides = sectionSlides.length > 1;
  setSourcesLink(meta);

  let index = 0;
  const show = () => renderSlide(sectionSlides[index], meta, index, sectionSlides.length);
  const prev = () => {
    index = (index - 1 + sectionSlides.length) % sectionSlides.length;
    show();
  };
  const next = () => {
    index = (index + 1) % sectionSlides.length;
    show();
  };

  show();

  const prevButton = el("prevButton");
  const nextButton = el("nextButton");
  const dots = el("dots");
  const slideCount = el("slideCount");

  if (!hasMultipleSlides) {
    if (prevButton) prevButton.hidden = true;
    if (nextButton) nextButton.hidden = true;
    if (dots) dots.hidden = true;
    if (slideCount) slideCount.hidden = true;
    return;
  }

  if (prevButton) {
    prevButton.addEventListener("click", prev);
  }

  if (nextButton) {
    nextButton.addEventListener("click", next);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") prev();
    if (event.key === "ArrowRight") next();
  });
}

main().catch((err) => {
  document.body.innerHTML = `
    <div style="padding:24px;font-family:system-ui;color:white;background:#111;">
      <h1>Slideshow Error</h1>
      <pre>${err.message}</pre>
    </div>
  `;
});
