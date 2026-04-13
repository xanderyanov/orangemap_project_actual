document.addEventListener("DOMContentLoaded", function () {
  // ========== ДАННЫЕ О МАГАЗИНАХ ==========
  const shopData = {
    mag_afrodita: {
      name: "Афродита",
      desc: "🛍️ Магазин косметики и парфюмерии.",
      category: "mag",
    },
    mag_secondhand: {
      name: "Second Hand",
      desc: "👕 Магазин одежды из Европы.",
      category: "mag",
    },
    off_mfc: {
      name: "МФЦ",
      desc: "📋 Многофункциональный центр услуг.",
      category: "off",
    },
    off_bmw: {
      name: "BMW AutoShow",
      desc: "🚗 Автосалон BMW.",
      category: "off",
    },
    rest_bq: {
      name: "BQ Burger",
      desc: "🍔 Ресторан быстрого питания.",
      category: "rest",
    },
  };

  // ========== НАХОДИМ ЭЛЕМЕНТЫ ==========
  const svgElement = document.querySelector("#map-container svg");
  if (!svgElement) {
    console.error("SVG элемент не найден!");
    return;
  }

  // ========== ИНИЦИАЛИЗАЦИЯ PANZOOM ==========
  let panZoomInstance = null;

  function initPanZoom() {
    setTimeout(function () {
      try {
        if (typeof svgPanZoom !== "undefined") {
          panZoomInstance = svgPanZoom(svgElement, {
            zoomEnabled: true,
            controlIconsEnabled: true,
            fit: true,
            center: true,
            minZoom: 0.5,
            maxZoom: 5,
            zoomScaleSensitivity: 0.2,
          });
          console.log("PanZoom инициализирован");
        } else {
          console.warn("svgPanZoom не найден, повторная попытка...");
          setTimeout(initPanZoom, 100);
        }
      } catch (e) {
        console.error("Ошибка:", e);
      }
    }, 100);
  }

  // ========== НАХОДИМ ВСЕ МАГАЗИНЫ ==========
  const allShops = svgElement.querySelectorAll("g[id]");
  console.log(`Найдено магазинов: ${allShops.length}`);

  // ========== ОБРАБОТЧИКИ ДЛЯ ДЕСКТОПА И МОБИЛЫ ==========
  let touchTimer = null;
  let isPanning = false;

  // ========== ЕДИНЫЙ ИСТОЧНИК ЦВЕТОВ ДЛЯ КАТЕГОРИЙ ==========
  const categoryStyle = {
    mag: {
      name: "Магазин",
      icon: "🛍️",
      originalFill: "#fce4ec", // оригинальный цвет для магазинов (розоватый)
      hoverFill: "#fff3e0", // цвет заливки при наведении
      filterFill: "#fff8e1", // цвет заливки при фильтрации
    },
    off: {
      name: "Офис",
      icon: "🏢",
      originalFill: "#e3f2fd", // оригинальный цвет для офисов (голубоватый)
      hoverFill: "#e8f4fd",
      filterFill: "#e8f4fd",
    },
    rest: {
      name: "Ресторан",
      icon: "🍽️",
      originalFill: "#e8f5e9", // оригинальный цвет для ресторанов (зеленоватый)
      hoverFill: "#f1f8e9",
      filterFill: "#f1f8e9",
    },
  };

  // Сохраняем оригинальные цвета (если они не заданы в SVG)
  function saveOriginalColors() {
    allShops.forEach(shop => {
      const shopCategory = shop.getAttribute("data-category");
      const shapes = shop.querySelectorAll("path:not(.text-label)");

      shapes.forEach(path => {
        // Если в SVG уже есть fill, используем его, иначе берём из categoryStyle
        const existingFill = path.getAttribute("fill");
        let originalFill;

        if (existingFill && existingFill !== "#fcf2eb") {
          originalFill = existingFill;
        } else {
          originalFill = categoryStyle[shopCategory]?.originalFill || "#fcf2eb";
        }

        path.setAttribute("data-original-fill", originalFill);

        // Применяем оригинальный цвет
        path.style.fill = originalFill;
      });
    });
  }

  function getHoverFill(category) {
    return categoryStyle[category]?.hoverFill || "#f5f5f5";
  }

  function getFilterFill(category) {
    return categoryStyle[category]?.filterFill || "#f5f5f5";
  }

  // Сохраняем оригинальные цвета
  saveOriginalColors();

  // ===== ОБРАБОТЧИКИ ДЛЯ КАЖДОГО МАГАЗИНА =====
  allShops.forEach(shop => {
    shop.style.cursor = "pointer";

    // ===== КЛИК (десктоп) =====
    shop.addEventListener("click", event => {
      event.stopPropagation();
      const shopId = shop.id;
      const data = shopData[shopId];
      if (data) showPopup(shopId);
    });

    // ===== МОБИЛА: обработка тач-событий =====
    shop.addEventListener("touchstart", e => {
      e.stopPropagation();
      touchTimer = setTimeout(() => {
        isPanning = true;
      }, 200);
    });

    shop.addEventListener("touchend", e => {
      e.stopPropagation();
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }

      if (!isPanning) {
        e.preventDefault();
        const shopId = shop.id;
        const data = shopData[shopId];
        if (data) showPopup(shopId);
      }
      isPanning = false;
    });

    shop.addEventListener("touchmove", e => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
        isPanning = true;
      }
    });

    // ===== ПОДСВЕТКА ПРИ НАВЕДЕНИИ =====
    shop.addEventListener("mouseenter", () => {
      const shopCategory = shop.getAttribute("data-category");
      const isInactive = currentFilter !== "all" && shopCategory !== currentFilter;

      if (isInactive) {
        return;
      }

      const shapes = shop.querySelectorAll("path:not(.text-label)");
      const hoverColor = getHoverFill(shopCategory);

      shapes.forEach(shape => {
        shape.style.fill = hoverColor;
      });

      shop.style.transition = "all 0.2s ease";
    });

    shop.addEventListener("mouseleave", () => {
      const shopCategory = shop.getAttribute("data-category");
      const shapes = shop.querySelectorAll("path:not(.text-label)");
      const isInactive = currentFilter !== "all" && shopCategory !== currentFilter;

      if (isInactive) {
        shapes.forEach(shape => {
          shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
        });
        shop.style.filter = "grayscale(0.7) brightness(0.6)";
      } else if (currentFilter !== "all" && shopCategory === currentFilter) {
        shapes.forEach(shape => {
          shape.style.fill = getFilterFill(shopCategory);
        });
        shop.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.2))";
      } else {
        shapes.forEach(shape => {
          shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
        });
        shop.style.filter = "none";
      }
    });
  });

  // ========== ФУНКЦИЯ ПОКАЗА ПОПАПА ==========
  function showPopup(shopId) {
    const data = shopData[shopId];
    if (!data) return;

    const popup = document.getElementById("shop-popup");
    const popupTitle = document.getElementById("popup-title");
    const popupDesc = document.getElementById("popup-desc");
    const popupCategory = document.getElementById("popup-category-tag");

    popupTitle.textContent = data.name;
    popupDesc.textContent = data.desc;
    popupCategory.textContent = getCategoryText(data.category);
    popupCategory.className = `popup-category category-${data.category}`;

    popup.style.display = "flex";
  }

  function getCategoryText(category) {
    const style = categoryStyle[category];
    return style ? `${style.icon} ${style.name}` : category;
  }

  // ========== ФИЛЬТРАЦИЯ ==========
  let currentFilter = "all";

  function applyFilter(category) {
    currentFilter = category;
    allShops.forEach(shop => {
      const shopCategory = shop.getAttribute("data-category");
      const shapes = shop.querySelectorAll("path:not(.text-label)");
      const texts = shop.querySelectorAll("text");

      if (category === "all") {
        shapes.forEach(shape => {
          shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
        });
        texts.forEach(text => {
          text.style.fill = "";
          text.style.opacity = "1";
        });
        shop.style.opacity = "1";
        shop.style.filter = "none";
      } else if (shopCategory === category) {
        shapes.forEach(shape => {
          shape.style.fill = getFilterFill(category);
        });
        texts.forEach(text => {
          text.style.fill = "";
          text.style.opacity = "1";
        });
        shop.style.opacity = "1";
        shop.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.2))";
      } else {
        shapes.forEach(shape => {
          shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
        });
        texts.forEach(text => {
          text.style.fill = "";
          text.style.opacity = "0.6";
        });
        shop.style.opacity = "0.3";
        shop.style.filter = "grayscale(0.7) brightness(0.6)";
      }
    });
  }

  // ========== КНОПКИ ФИЛЬТРОВ ==========
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilter(btn.getAttribute("data-filter"));
    });
  });

  // ========== ЗАКРЫТИЕ ПОПАПА ==========
  function closePopup() {
    document.getElementById("shop-popup").style.display = "none";
  }

  document.querySelector(".close-btn")?.addEventListener("click", closePopup);
  window.addEventListener("click", event => {
    if (event.target === document.getElementById("shop-popup")) closePopup();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePopup();
  });

  // ========== ОБНОВЛЕНИЕ ПРИ ИЗМЕНЕНИИ РАЗМЕРА ОКНА ==========
  window.addEventListener("resize", () => {
    if (panZoomInstance) {
      panZoomInstance.resize();
      panZoomInstance.fit();
      panZoomInstance.center();
    }
  });

  // ========== ЗАПУСК ==========
  initPanZoom();
  applyFilter("all");
});
