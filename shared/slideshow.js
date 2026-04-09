function el(id) {
  return document.getElementById(id);
}

async function loadSlides() {
  const res = await fetch("./slides.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load slides.json");
  return res.json();
}

function renderDots(count, activeIndex) {
  const wrap = el("dots");
  wrap.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement("div");
    dot.className = `pager-dot${i === activeIndex ? " active" : ""}`;
    wrap.appendChild(dot);
  }
}

function setHero(slide, meta) {
  el("title").textContent = slide.title || meta.defaultTitle || "";
  el("subtitle").textContent = slide.subtitle || "";
  el("logoLabel").textContent = meta.logoLabel || "MSA";
}

function setBackground(slide, meta) {
  const bg = el("bgTexture");
  const src = slide.background?.src || meta.background?.src || "../shared/country-background.png";
  bg.style.backgroundImage = src
    ? `linear-gradient(180deg, rgba(5, 7, 20, 0.28) 0%, rgba(5, 7, 20, 0.92) 84%, rgba(5, 7, 20, 1) 100%), url("${src}")`
    : "linear-gradient(180deg, rgba(5, 7, 20, 0.28) 0%, rgba(5, 7, 20, 0.92) 84%, rgba(5, 7, 20, 1) 100%)";
}

function setTextContent(targetId, value) {
  el(targetId).textContent = value || "";
}

function setHeading(targetId, value, fallback) {
  el(targetId).textContent = value || fallback;
}

function setParties(parties) {
  const list = el("parties");
  list.innerHTML = "";
  (parties || []).forEach((party) => {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = party.name || "Party";
    li.appendChild(strong);
    li.append(` - ${party.description || ""}`);
    list.appendChild(li);
  });
}

function setTimeline(items) {
  const list = el("timeline");
  list.innerHTML = "";
  (items || []).slice(0, 3).forEach((item) => {
    const entry = document.createElement("article");
    entry.className = "timeline-item";

    const dot = document.createElement("span");
    dot.className = "timeline-dot";
    dot.setAttribute("aria-hidden", "true");

    const year = document.createElement("h4");
    year.textContent = item.year || "20XX";

    const text = document.createElement("p");
    text.textContent = item.description || "";

    entry.append(dot, year, text);
    list.appendChild(entry);
  });
}

function setStats(items) {
  const grid = el("stats");
  grid.innerHTML = "";
  (items || []).slice(0, 4).forEach((item) => {
    const card = document.createElement("article");
    card.className = "stat-card";

    const stat = document.createElement("p");
    stat.className = "stat-value";
    stat.textContent = item.value || "XX";

    const label = document.createElement("p");
    label.className = "stat-label";
    label.textContent = item.label || "";

    card.append(stat, label);
    grid.appendChild(card);
  });
}

function setQrCards(items) {
  const grid = el("helpCards");
  grid.innerHTML = "";
  (items || []).slice(0, 2).forEach((item) => {
    const article = document.createElement("article");
    article.className = "qr-card";

    if (item.qr) {
      const img = document.createElement("img");
      img.className = "qr-image";
      img.src = item.qr;
      img.alt = item.label ? `${item.label} QR code` : "QR code";
      article.appendChild(img);
    } else {
      const text = document.createElement("span");
      text.className = "qr-placeholder";
      text.textContent = item.placeholder || "QR CODE";
      article.appendChild(text);
    }

    if (item.url) {
      const link = document.createElement("a");
      link.className = "qr-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = item.label || "Open link";
      article.appendChild(link);
    }

    grid.appendChild(article);
  });
}

function setLearnMore(learnMore) {
  const copy = el("learnMoreText");
  copy.innerHTML = "";
  copy.append(document.createTextNode(learnMore?.text || ""));

  if (learnMore?.url) {
    copy.append(" ");
    const link = document.createElement("a");
    link.href = learnMore.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = learnMore.label || "Learn more";
    copy.appendChild(link);
  }
}

function setImage(targetId, image, fallbackAlt) {
  const element = el(targetId);
  element.src = image?.src || "";
  element.alt = image?.alt || fallbackAlt;
}

function renderSlide(slide, meta, index, total) {
  setBackground(slide, meta);
  setHero(slide, meta);
  setTextContent("backgroundText", slide.whatsHappening?.background);
  setTextContent("impactText", slide.civilianImpact?.experiences);
  setTextContent("helpText", slide.howToHelp?.summary);
  setHeading("partiesHeading", slide.whatsHappening?.partiesHeading, "Key Actors");
  setParties(slide.whatsHappening?.parties);
  setTimeline(slide.whatsHappening?.timeline);
  setStats(slide.civilianImpact?.stats);
  setQrCards(slide.howToHelp?.cards);
  setLearnMore(slide.howToHelp?.learnMore);
  setImage("leftImage", slide.whatsHappening?.image, "Country context image");
  setImage("middleImage", slide.civilianImpact?.image, "Civilian impact image");
  setImage("rightImage", slide.howToHelp?.image, "How to help image");
  renderDots(total, index);
  el("slideCount").textContent = `${index + 1} / ${total}`;
}

async function main() {
  const data = await loadSlides();
  const meta = data.meta || {};
  const slides = data.slides || [];
  if (slides.length === 0) throw new Error("slides.json has no slides");

  let index = 0;
  const intervalMs = (meta.secondsPerSlide || 10) * 1000;
  const show = () => renderSlide(slides[index], meta, index, slides.length);

  show();

  if (slides.length > 1) {
    setInterval(() => {
      index = (index + 1) % slides.length;
      show();
    }, intervalMs);
  }
}

main().catch((err) => {
  document.body.innerHTML = `
    <div style="padding:24px;font-family:system-ui;color:white;background:#111;">
      <h1>Slideshow Error</h1>
      <pre>${err.message}</pre>
    </div>
  `;
});
