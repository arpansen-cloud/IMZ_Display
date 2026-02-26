function el(id){ return document.getElementById(id); }

async function loadSlides() {
    const res = await fetch("./slides.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load slides.json");
    return res.json();
}

function renderDots(n, idx){
    const wrap = el("dots");
    wrap.innerHTML = "";
    for(let i=0;i<n;i++){
        const d = document.createElement("div");
        d.className = "dot" + (i===idx ? " active" : "");
        wrap.appendChild(d);
    }
}

function setBackgroundMedia(slide){
    const bg = el("bg");
    bg.innerHTML = "";

    const m = slide.media;
    if(!m || !m.type || !m.src){
        const p = document.createElement("div");
        p.style.color = "rgba(255,255,255,0.7)";
        p.style.padding = "30px";
        p.textContent = "Add slide.media in slides.json";
        bg.appendChild(p);
        return;
    }

    if(m.type === "video"){
        const v = document.createElement("video");
        v.src = m.src;
        v.autoplay = true;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        bg.appendChild(v);
    } else {
        const img = document.createElement("img");
        img.src = m.src;
        img.alt = slide.title ?? "slide";
        bg.appendChild(img);
    }
}

function setText(slide, meta){
    el("title").textContent = slide.title || meta.defaultTitle || "";
    el("subtitle").textContent = slide.subtitle || "";
    el("badge").textContent = meta.badge || "";
    el("footLeft").textContent = meta.footerLeft || "";
}

function setPoints(slide){
    const box = el("points");
    box.innerHTML = "";

    (slide.points || []).slice(0, 3).forEach(pt => {
        const card = document.createElement("div");
        card.className = "point";

        const h = document.createElement("h3");
        h.textContent = pt.heading || "";

        const p = document.createElement("p");
        p.textContent = pt.text || "";

        card.appendChild(h);
        card.appendChild(p);
        box.appendChild(card);
    });
}

function setCTA(slide){
    const cta = el("cta");
    cta.innerHTML = "";

    if(!slide.cta) return;

    if(slide.cta.qr){
        const img = document.createElement("img");
        img.className = "qr";
        img.src = slide.cta.qr;
        img.alt = "QR code";
        cta.appendChild(img);
    }

    if(slide.cta.label && slide.cta.url){
        const a = document.createElement("a");
        a.href = slide.cta.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = slide.cta.label;
        cta.appendChild(a);
    }
}

async function main(){
    const data = await loadSlides();
    const meta = data.meta || {};
    const slides = data.slides || [];
    if(slides.length === 0) throw new Error("slides.json has no slides");

    let idx = 0;
    const intervalMs = (meta.secondsPerSlide || 8) * 1000;

    const show = () => {
        const slide = slides[idx];
        setBackgroundMedia(slide);
        setText(slide, meta);
        setPoints(slide);
        setCTA(slide);
        renderDots(slides.length, idx);
        el("footRight").textContent = `${idx+1} / ${slides.length}`;
    };

    show();
    setInterval(() => {
        idx = (idx + 1) % slides.length;
        show();
    }, intervalMs);
}

main().catch(err => {
    document.body.innerHTML = `
    <div style="padding:24px;font-family:system-ui;color:white;background:#111;">
      <h1>Slideshow Error</h1>
      <pre>${err.message}</pre>
    </div>
  `;
});