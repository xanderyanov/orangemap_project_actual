document.addEventListener("DOMContentLoaded", function () {
  // ========== ДАННЫЕ О МАГАЗИНАХ (с zoom для каждого) ==========
  const shopData = {
    pav_afrodita: {
      name: "Афродита",
      namesize: 12,
      desc: "Магазин косметики и парфюмерии.",
      category: "mag",
      link: "/ru/shops/afrodita",
      zoom: 2.0,
    },
    mag_secondhand: {
      name: "Second Hand",
      namesize: 14,
      desc: "Магазин одежды из Европы.",
      category: "mag",
      link: "/ru/shops/secondhand",
      zoom: 2.0,
    },
    serv_mfc: {
      name: "ФСО",
      namesize: 28,
      desc: "Многофункциональный центр услуг.",
      category: "off",
      link: "/ru/offices/mfc",
      zoom: 1.5,
    },
    rest_bmw: {
      name: "BMW AutoShow",
      namesize: 16,
      desc: "Автосалон BMW.",
      category: "off",
      link: "/ru/offices/bmw",
      zoom: 1.8,
    },
    baz_bq: {
      name: "BQ Burger",
      namesize: 10,
      desc: "Ресторан быстрого питания.",
      category: "rest",
      link: "/ru/restaurants/bq",
      zoom: 2.5,
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

  // ========== ПЕРЕМЕННЫЕ ДЛЯ ОБРАБОТКИ СОБЫТИЙ ==========
  let touchTimer = null;
  let isPanning = false;

  // ========== ЦВЕТА ДЛЯ КАТЕГОРИЙ ==========
  const categoryStyle = {
    mag: {
      name: "Магазин",
      icon: "🛍️",
      originalFill: "#fce4ec",
      hoverFill: "#fff3e0",
      filterFill: "#fff8e1",
      highlightFill: "#ffe0b2", // цвет для подсветки выбранного магазина
    },
    serv: {
      name: "Услуги и сервис",
      icon: "🏢",
      originalFill: "#e3f2fd",
      hoverFill: "#e8f4fd",
      filterFill: "#e8f4fd",
      highlightFill: "#bbdefb", // цвет для подсветки выбранного магазина
    },
    rest: {
      name: "Ресторан",
      icon: "🍽️",
      originalFill: "#e8f5e9",
      hoverFill: "#f1f8e9",
      filterFill: "#f1f8e9",
      highlightFill: "#c8e6c9", // цвет для подсветки выбранного магазина
    },
    baz: {
      name: "Оранжевый базар",
      icon: "🍽️",
      originalFill: "#e8f5e9",
      hoverFill: "#f1f8e9",
      filterFill: "#f1f8e9",
      highlightFill: "#c8e6c9", // цвет для подсветки выбранного магазина
    },
    pav: {
      name: "Павильон",
      icon: "🍽️",
      originalFill: "#e8f5e9",
      hoverFill: "#f1f8e9",
      filterFill: "#f1f8e9",
      highlightFill: "#c8e6c9", // цвет для подсветки выбранного магазина
    },
  };

  function getHighlightFill(category) {
    return categoryStyle[category]?.highlightFill || "#ffe0b2";
  }

  // ========== СОХРАНЕНИЕ ОРИГИНАЛЬНЫХ ЦВЕТОВ ==========
  function saveOriginalColors() {
    allShops.forEach(shop => {
      const shopCategory = shop.getAttribute("data-category");
      const shapes = shop.querySelectorAll("path:not(.text-label)");

      shapes.forEach(path => {
        const existingFill = path.getAttribute("fill");
        let originalFill;

        if (existingFill && existingFill !== "#fcf2eb") {
          originalFill = existingFill;
        } else {
          originalFill = categoryStyle[shopCategory]?.originalFill || "#fcf2eb";
        }

        path.setAttribute("data-original-fill", originalFill);
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

  saveOriginalColors();

  // ========== ПОДСВЕТКА КОНКРЕТНОГО МАГАЗИНА ==========
  let highlightedShopId = null;

  function highlightShop(shopId) {
    // Сначала сбрасываем подсветку у всех магазинов
    allShops.forEach(shop => {
      const shapes = shop.querySelectorAll("path:not(.text-label)");
      const originalFill = shop.getAttribute("data-original-fill");
      shapes.forEach(shape => {
        shape.style.fill = originalFill || "#fcf2eb";
      });
    });

    if (!shopId) return;

    const shop = document.getElementById(shopId);
    if (!shop) return;

    const shopCategory = shop.getAttribute("data-category");
    const highlightColor = getHighlightFill(shopCategory);
    const shapes = shop.querySelectorAll("path:not(.text-label)");

    shapes.forEach(shape => {
      shape.style.fill = highlightColor;
    });

    highlightedShopId = shopId;
  }

  // ========== ОБРАБОТЧИКИ ДЛЯ МАГАЗИНОВ ==========
  allShops.forEach(shop => {
    shop.style.cursor = "pointer";

    shop.addEventListener("click", event => {
      event.stopPropagation();
      const shopId = shop.id;
      const data = shopData[shopId];
      if (data) showPopup(shopId);
    });

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

    shop.addEventListener("mouseenter", () => {
      const shopCategory = shop.getAttribute("data-category");
      const isInactive = currentFilter !== "all" && shopCategory !== currentFilter;
      if (isInactive) return;

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
        // Если это подсвеченный магазин, возвращаем цвет подсветки, а не оригинальный
        if (shop.id === highlightedShopId) {
          shapes.forEach(shape => {
            shape.style.fill = getHighlightFill(shopCategory);
          });
        } else {
          shapes.forEach(shape => {
            shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
          });
        }
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
    const popupLink = document.getElementById("popup-link");

    popupTitle.textContent = data.name;
    popupDesc.textContent = data.desc;
    popupCategory.textContent = getCategoryText(data.category);
    popupCategory.className = `popup-category category-${data.category}`;

    if (popupLink) {
      if (data.link) {
        popupLink.href = data.link;
        popupLink.style.display = "inline-flex";
      } else {
        popupLink.style.display = "none";
      }
    }

    popup.style.display = "flex";
  }

  function getCategoryText(category) {
    const texts = {
      mag: "🛍️ Магазин",
      off: "🏢 Офис",
      rest: "🍽️ Ресторан",
    };
    return texts[category] || category;
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
          // Если это подсвеченный магазин, возвращаем цвет подсветки
          if (shop.id === highlightedShopId) {
            shape.style.fill = getHighlightFill(shopCategory);
          } else {
            shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
          }
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
          // Неактивные магазины становятся серыми, даже если были подсвечены
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

  // ========== ДОБАВЛЕНИЕ НАЗВАНИЙ ВНУТРИ SVG ==========
  function addSVGLabels() {
    const allShops = document.querySelectorAll("#map-container g[id]");

    allShops.forEach(shop => {
      const shopId = shop.id;
      const shopInfo = shopData[shopId];
      if (!shopInfo) return;

      const shopName = shopInfo.name;
      const shopNameSize = shopInfo.namesize || 12;

      const paths = shop.querySelectorAll("path");
      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      paths.forEach(path => {
        const bbox = path.getBBox();
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", centerX);
      text.setAttribute("y", centerY);
      text.setAttribute("fill", "#164680");
      text.setAttribute("font-size", shopNameSize);
      text.setAttribute("font-family", "Ubuntu, sans-serif");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("pointer-events", "none");
      text.textContent = shopName;

      shop.appendChild(text);
    });
  }

  // ========== ФУНКЦИЯ ЦЕНТРИРОВАНИЯ НА МАГАЗИНЕ ==========
  function centerOnShop(shopId, zoomLevel) {
    if (!panZoomInstance) {
      console.warn("PanZoom не инициализирован");
      return false;
    }

    const shop = document.getElementById(shopId);
    if (!shop) {
      console.warn(`Магазин ${shopId} не найден`);
      return false;
    }

    const paths = shop.querySelectorAll("path");
    if (!paths.length) return false;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    paths.forEach(path => {
      try {
        const bbox = path.getBBox();
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      } catch (e) {}
    });

    if (minX === Infinity) return false;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const container = document.getElementById("map-container");
    const containerRect = container.getBoundingClientRect();
    const svgRect = svgElement.getBoundingClientRect();
    const viewBox = svgElement.viewBox.baseVal;

    panZoomInstance.zoom(zoomLevel);
    const zoom = panZoomInstance.getZoom();

    const targetX = -(centerX * zoom) + containerRect.width / 2;
    const targetY = -(centerY * zoom) + containerRect.height / 2;

    panZoomInstance.pan({ x: targetX, y: targetY });

    return true;
  }

  // ========== ПОЛУЧЕНИЕ ID МАГАЗИНА ИЗ СКРЫТОГО БЛОКА ==========
  function getCurrentShopFromPage() {
    const shopBlock = document.getElementById("current-shop");
    if (!shopBlock) return null;

    const shopId = shopBlock.getAttribute("data-shop-id");
    if (!shopId) return null;

    const zoom = parseFloat(shopBlock.getAttribute("data-zoom")) || 2.0;

    return { shopId, zoom };
  }

  // ========== ПОЛУЧЕНИЕ ID МАГАЗИНА ИЗ GET-ПАРАМЕТРА ==========
  function getCurrentShopFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const shopId = urlParams.get("location");
    if (!shopId || !shopData[shopId]) return null;

    const zoom = shopData[shopId].zoom || 2.0;
    return { shopId, zoom };
  }

  // ========== АВТОМАТИЧЕСКОЕ ЦЕНТРИРОВАНИЕ И ПОДСВЕТКА ==========
  function initAutoCenterAndHighlight() {
    // Приоритет: скрытый блок #current-shop имеет приоритет над GET-параметром
    let targetShop = getCurrentShopFromPage();

    if (!targetShop) {
      targetShop = getCurrentShopFromURL();
    }

    if (targetShop && shopData[targetShop.shopId]) {
      const waitForPanZoom = setInterval(() => {
        if (panZoomInstance && document.getElementById(targetShop.shopId)) {
          clearInterval(waitForPanZoom);
          setTimeout(() => {
            // Подсвечиваем магазин
            highlightShop(targetShop.shopId);
            // Центрируем карту
            centerOnShop(targetShop.shopId, targetShop.zoom);
          }, 200);
        }
      }, 100);
    }
  }

  // ========== ЗАПУСК ==========
  initPanZoom();
  setTimeout(addSVGLabels, 100);
  setTimeout(initAutoCenterAndHighlight, 500);
  applyFilter("all");
});
