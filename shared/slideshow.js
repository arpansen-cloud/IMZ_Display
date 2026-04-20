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

function createBulletBlock(title, items) {
  if (!items?.length) return null;
  const article = createNode("article", "content-block");
  if (title) {
    article.appendChild(createNode("h3", "", title));
  }

  const list = createNode("ul", "bullet-list");
  items.forEach((item) => {
    if (!item) return;
    const entry = document.createElement("li");
    entry.textContent = item;
    list.appendChild(entry);
  });

  article.appendChild(list);
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
  wrap.appendChild(createNode("h3", "stack-heading section-heading", title || "Key Figures"));

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

function normalizeQrSrc(src) {
  if (!src) return src;

  try {
    const url = new URL(src, window.location.href);
    const size = url.searchParams.get("size");

    if (size) {
      url.searchParams.set("size", "500x500");
    }

    return url.toString();
  } catch (error) {
    return src.replace(/size=\d+x\d+/i, "size=500x500");
  }
}

function createQrBlock(title, items) {
  if (!items?.length) return null;
  const wrap = createNode("article", "feature-stack qr-section");
  wrap.appendChild(createNode("h3", "stack-heading section-heading", title || "How to Help"));

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
    const qrContainer = createNode("div", "qr-container");

    if (item.qr) {
      const img = document.createElement("img");
      img.className = "qr-image";
      img.src = normalizeQrSrc(item.qr);
      img.alt = item.label ? `${item.label} QR code` : "QR code";
      img.loading = "eager";
      img.decoding = "sync";
      qrContainer.appendChild(img);
    } else {
      qrContainer.appendChild(createNode("span", "qr-placeholder", item.placeholder || "QR CODE"));
    }

    if (item.label) {
      const label = document.createElement("span");
      label.className = "qr-link";
      label.textContent = item.label;
      qrContainer.appendChild(label);
    }

    article.appendChild(qrContainer);
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

function buildSectionSlides(slides, meta = {}) {
  const getSlide = (index) => slides[index] || slides[0];

  return [
    {
      slide: getSlide(0),
      slides: [getSlide(0), getSlide(1)],
      section: {
        key: "whatsHappening",
        variant: "afghanistan-overview",
        title: "Civilian Impact",
        eyebrow: "Section 1",
      },
    },
    {
      slide: getSlide(1),
      slides: [getSlide(0), getSlide(1)],
      section: {
        key: "civilianImpact",
        variant: "afghanistan-background",
        title: "Key Information",
        eyebrow: "Section 2",
      },
    },
    {
      slide: getSlide(2),
      slides: [getSlide(2)],
      section: {
        key: "howToHelp",
        variant: "afghanistan-howToHelp",
        title: "How to Help",
        eyebrow: "Section 3",
      },
    },
  ];
}

function buildContextBullets(analysisSlide, overviewSlide) {
  const source =
    analysisSlide?.civilianImpact?.experiences ||
    analysisSlide?.whatsHappening?.background ||
    overviewSlide?.whatsHappening?.background ||
    "";

  return source
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function hasText(value) {
  return Boolean(value && value.trim());
}

function getStandardHeading(sectionKey, blockKey, index, fallbackHeading) {
  const headingMap = {
    whatsHappening: {
      background: ["Background / Overview", "Civilian Impact", "How Support Helps"],
      parties: ["Main Parties Involved", "Who Is Most Affected", "Aid Organizations"],
      timeline: ["Timeline", "Impact Timeline", "Ways to Make an Impact"],
    },
    civilianImpact: {
      experiences: ["Experiences", "How Civilians Are Affected", "How You Can Help"],
      stats: ["Key Figures", "Impact Statistics", "Support Priorities"],
    },
    howToHelp: {
      summary: ["Summary", "Support Needs", "How You Can Help"],
      learnMore: ["Learn More", "Resources", "Additional Resources"],
      cards: ["Support Options", "Support Options", "Ways to Make an Impact"],
    },
  };

  return headingMap[sectionKey]?.[blockKey]?.[index] || fallbackHeading;
}

function renderSection(sectionSlide) {
  const shell = el("sectionShell");
  shell.innerHTML = "";

  const panelClass = [
    "feature-panel",
    `feature-panel-${sectionSlide.section.key}`,
    sectionSlide.section.variant ? `feature-panel-${sectionSlide.section.variant}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const panel = createNode("section", panelClass);
  panel.appendChild(createNode("p", "section-eyebrow", sectionSlide.section.eyebrow));

  const gridClass =
    sectionSlide.section.key === "whatsHappening"
      ? "feature-grid"
      : "feature-grid feature-grid-fill";
  const grid = createNode("div", gridClass);
  const copy = createNode("div", "feature-copy");
  const side = createNode("aside", "feature-side");
  let trailingNode = null;
  const appendIfPresent = (parent, node) => {
    if (node) parent.appendChild(node);
  };

  if (sectionSlide.section.variant === "afghanistan-overview") {
    const overviewSlide = sectionSlide.slides[0];
    const impactSlide = sectionSlide.slides[1];
    const overviewImage =
      sectionSlide.slides.length > 1 && overviewSlide !== impactSlide
        ? overviewSlide.civilianImpact?.image || impactSlide.whatsHappening?.image
        : overviewSlide.whatsHappening?.image || overviewSlide.civilianImpact?.image;

    appendIfPresent(
      copy,
      createContentBlock("Background / Overview", overviewSlide.whatsHappening?.background),
    );
    appendIfPresent(
      copy,
      createContentBlock("Civilian Impact", impactSlide.whatsHappening?.background),
    );
    appendIfPresent(
      copy,
      createPartiesBlock("Who Is Most Affected", impactSlide.whatsHappening?.parties),
    );

    appendIfPresent(
      side,
      createStatsBlock("Key Figures", overviewSlide.civilianImpact?.stats),
    );
    appendIfPresent(
      side,
      createImageCard(
        overviewImage,
        "Country civilian impact image",
      ),
    );
  }

  if (sectionSlide.section.variant === "afghanistan-background") {
    const overviewSlide = sectionSlide.slides[0];
    const analysisSlide = sectionSlide.slides[1];
    const topCards = createNode("div", "afghanistan-background-top");
    const contextBlock = createBulletBlock(
      "Background / Context",
      buildContextBullets(analysisSlide, overviewSlide),
    );
    const partiesBlock = createPartiesBlock("Main Parties Involved", overviewSlide.whatsHappening?.parties);

    if (contextBlock) {
      contextBlock.classList.add("info-card");
      topCards.appendChild(contextBlock);
    }
    if (partiesBlock) {
      partiesBlock.classList.add("info-card");
      topCards.appendChild(partiesBlock);
    }

    appendIfPresent(copy, topCards);

    const timelineBlock = createTimelineBlock("Timeline", overviewSlide.whatsHappening?.timeline);
    if (timelineBlock) {
      timelineBlock.classList.add("info-card", "timeline-card");
    }
    appendIfPresent(copy, timelineBlock);

    appendIfPresent(
      side,
      createStatsBlock("Impact Statistics", analysisSlide.civilianImpact?.stats),
    );
    appendIfPresent(
      side,
      createImageCard(
        analysisSlide.civilianImpact?.image || analysisSlide.whatsHappening?.image || overviewSlide.civilianImpact?.image,
        "Country background image",
      ),
    );
  }

  if (sectionSlide.section.variant === "afghanistan-howToHelp") {
    const slide = sectionSlide.slides[0];

    if (hasText(slide.howToHelp?.summary)) {
      appendIfPresent(
        copy,
        createContentBlock("How to Make an Impact", slide.howToHelp?.summary),
      );
    }

    appendIfPresent(
      copy,
      createContentBlock(
        "Support Priorities",
        "Direct support helps keep food assistance, health services, and emergency protection available for civilians facing prolonged crisis.",
      ),
    );

    if (hasText(slide.howToHelp?.learnMore?.text) || slide.howToHelp?.learnMore?.url) {
      appendIfPresent(
        copy,
        createLearnMoreBlock("Learn More", slide.howToHelp?.learnMore),
      );
    }

    if (slide.howToHelp?.cards?.length) {
      const qrBlock = createQrBlock("Support Options", slide.howToHelp?.cards);
      if (qrBlock) {
        qrBlock.classList.add("afghanistan-support-qr");
      }
      appendIfPresent(
        side,
        qrBlock,
      );
    }

    const prioritiesBlock = createStatsBlock("Support Priorities", slide.civilianImpact?.stats);
    if (prioritiesBlock) {
      prioritiesBlock.classList.add("afghanistan-support-priorities");
    }
    appendIfPresent(
      side,
      prioritiesBlock,
    );

    const supportImage = createImageCard(
      slide.howToHelp?.image || slide.civilianImpact?.image,
      "Country support image",
    );
    if (supportImage) {
      supportImage.classList.add("afghanistan-support-image");
    }
    appendIfPresent(
      copy,
      supportImage,
    );
  }

  if (!sectionSlide.section.variant && sectionSlide.section.key === "whatsHappening") {
    sectionSlide.slides.forEach((slide, index) => {
      appendIfPresent(
        copy,
        createContentBlock(
          getStandardHeading("whatsHappening", "background", index, "Background / Overview"),
          slide.whatsHappening?.background,
        ),
      );
      appendIfPresent(
        copy,
        createPartiesBlock(
          getStandardHeading("whatsHappening", "parties", index, "Main Parties Involved"),
          slide.whatsHappening?.parties,
        ),
      );
      appendIfPresent(
        copy,
        createTimelineBlock(
          getStandardHeading("whatsHappening", "timeline", index, "Timeline"),
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

  if (!sectionSlide.section.variant && sectionSlide.section.key === "civilianImpact") {
    sectionSlide.slides.forEach((slide, index) => {
      appendIfPresent(
        copy,
        createContentBlock(
          getStandardHeading("civilianImpact", "experiences", index, "Experiences"),
          slide.civilianImpact?.experiences,
        ),
      );
      appendIfPresent(
        side,
        createStatsBlock(
          getStandardHeading("civilianImpact", "stats", index, "Key Figures"),
          slide.civilianImpact?.stats,
        ),
      );
      appendIfPresent(
        side,
        createImageCard(
          slide.civilianImpact?.image,
          "Civilian impact image",
        ),
      );
    });
  }

  if (!sectionSlide.section.variant && sectionSlide.section.key === "howToHelp") {
    sectionSlide.slides.forEach((slide, index) => {
      if (hasText(slide.howToHelp?.summary)) {
        appendIfPresent(
          copy,
          createContentBlock(
            getStandardHeading("howToHelp", "summary", index, "Summary"),
            slide.howToHelp?.summary,
          ),
        );
      }
      if (hasText(slide.howToHelp?.learnMore?.text) || slide.howToHelp?.learnMore?.url) {
        appendIfPresent(
          copy,
          createLearnMoreBlock(
            getStandardHeading("howToHelp", "learnMore", index, "Learn More"),
            slide.howToHelp?.learnMore,
          ),
        );
      }
      if (slide.howToHelp?.cards?.length) {
        appendIfPresent(
          side,
          createQrBlock(
            getStandardHeading("howToHelp", "cards", index, "Support Options"),
            slide.howToHelp?.cards,
          ),
        );
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
  if (trailingNode) {
    panel.appendChild(trailingNode);
  }
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

  const sectionSlides = buildSectionSlides(slides, meta);
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
