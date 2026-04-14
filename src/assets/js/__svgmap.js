// main.js
document.addEventListener("DOMContentLoaded", function () {
  // ========== ПРОВЕРКА, ЧТО shopData ЗАГРУЖЕН ==========
  if (typeof shopData === "undefined") {
    console.error("shopData не загружен! Подключите shop-data.js перед этим файлом.");
    return;
  }

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
            minZoom: 0.3,
            maxZoom: 10,
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
  let currentFilter = "all";
  let highlightedShopId = null;

  // ========== ЦВЕТА ДЛЯ КАТЕГОРИЙ ==========
  const categoryStyle = {
    mag: {
      name: "Магазин",
      icon: "🛍️",
      originalFill: "#fce4ec",
      hoverFill: "#fff3e0",
      filterFill: "#fff8e1",
      highlightFill: "#ffe0b2",
    },
    serv: {
      name: "Услуги и сервис",
      icon: "🏢",
      originalFill: "#e3f2fd",
      hoverFill: "#e8f4fd",
      filterFill: "#e8f4fd",
      highlightFill: "#bbdefb",
    },
    rest: {
      name: "Ресторан",
      icon: "🍽️",
      originalFill: "#e8f5e9",
      hoverFill: "#f1f8e9",
      filterFill: "#f1f8e9",
      highlightFill: "#c8e6c9",
    },
    baz: {
      name: "Оранжевый базар",
      icon: "🛒",
      originalFill: "#fff8e1",
      hoverFill: "#fff9c4",
      filterFill: "#fff9c4",
      highlightFill: "#fff59d",
    },
    pav: {
      name: "Павильон",
      icon: "🏪",
      originalFill: "#f3e5f5",
      hoverFill: "#f3e5f5",
      filterFill: "#f3e5f5",
      highlightFill: "#e1bee7",
    },
  };

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

  // Проверяет, соответствует ли shop выбранной категории
  function matchesCategory(shopCategoryAttr, selectedCategory) {
    if (selectedCategory === "all") return true;
    if (!shopCategoryAttr) return false;

    const categories = shopCategoryAttr.split(",").map(cat => cat.trim());
    return categories.includes(selectedCategory);
  }

  // Получает первую категорию из атрибута
  function getFirstCategory(shopCategoryAttr) {
    if (!shopCategoryAttr) return null;
    return shopCategoryAttr.split(",")[0].trim();
  }

  function getHoverFill(category) {
    return categoryStyle[category]?.hoverFill || "#f5f5f5";
  }

  function getFilterFill(category) {
    return categoryStyle[category]?.filterFill || "#f5f5f5";
  }

  function getHighlightFill(shopCategoryAttr) {
    if (!shopCategoryAttr) return "#ffe0b2";
    const firstCategory = getFirstCategory(shopCategoryAttr);
    return categoryStyle[firstCategory]?.highlightFill || "#ffe0b2";
  }

  function getCategoryText(category) {
    const texts = {
      mag: "🛍️ Магазин",
      serv: "🏢 Услуги",
      rest: "🍽️ Ресторан",
      baz: "🛒 Оранжевый базар",
      pav: "🏪 Павильон",
    };
    return texts[category] || category;
  }

  // Получает все графические элементы в магазине
  function getAllShapes(shop) {
    return shop.querySelectorAll("path:not(.text-label), circle, rect, ellipse, polygon, line");
  }

  // ========== СОХРАНЕНИЕ ОРИГИНАЛЬНЫХ ЦВЕТОВ ==========
  function saveOriginalColors() {
    allShops.forEach(shop => {
      const shopCategoryAttr = shop.getAttribute("data-category");
      const shapes = getAllShapes(shop);

      shapes.forEach(shape => {
        const existingFill = shape.getAttribute("fill");
        let originalFill;

        if (existingFill && existingFill !== "#fcf2eb" && existingFill !== "#FFFFFF" && existingFill !== "white") {
          originalFill = existingFill;
        } else {
          const firstCategory = getFirstCategory(shopCategoryAttr);
          originalFill = categoryStyle[firstCategory]?.originalFill || "#fcf2eb";
        }

        shape.setAttribute("data-original-fill", originalFill);
        shape.style.fill = originalFill;
      });
    });
  }

  // ========== ПОДСВЕТКА КОНКРЕТНОГО МАГАЗИНА ==========
  function highlightShop(shopId) {
    allShops.forEach(shop => {
      const shapes = getAllShapes(shop);
      shapes.forEach(shape => {
        const originalFill = shape.getAttribute("data-original-fill");
        shape.style.fill = originalFill || "#fcf2eb";
      });
    });

    if (!shopId) {
      highlightedShopId = null;
      return;
    }

    const shop = document.getElementById(shopId);
    if (!shop) return;

    const shopCategoryAttr = shop.getAttribute("data-category");
    const highlightColor = getHighlightFill(shopCategoryAttr);
    const shapes = getAllShapes(shop);

    shapes.forEach(shape => {
      shape.style.fill = highlightColor;
    });

    highlightedShopId = shopId;
  }

  // ========== ФУНКЦИЯ ПОКАЗА ПОПАПА ==========
  function showPopup(shopId) {
    const data = shopData[shopId];
    if (!data) return;

    const popup = document.getElementById("shop-popup");
    const popupTitle = document.getElementById("popup-title");
    const popupDesc = document.getElementById("popup-desc");
    const popupCategory = document.getElementById("popup-category-tag");
    const popupLink = document.getElementById("popup-link");

    if (popupTitle) popupTitle.textContent = data.name;
    if (popupDesc) popupDesc.textContent = data.desc;
    if (popupCategory) {
      popupCategory.textContent = getCategoryText(data.category);
      popupCategory.className = `popup-category category-${data.category}`;
    }

    if (popupLink) {
      if (data.link) {
        popupLink.href = data.link;
        popupLink.style.display = "inline-flex";
      } else {
        popupLink.style.display = "none";
      }
    }

    if (popup) popup.style.display = "flex";
  }

  // ========== ЗАКРЫТИЕ ПОПАПА ==========
  function closePopup() {
    const popup = document.getElementById("shop-popup");
    if (popup) popup.style.display = "none";
  }

  // ========== ПРИМЕНЕНИЕ ФИЛЬТРА ==========
  function applyFilter(category) {
    currentFilter = category;

    allShops.forEach(shop => {
      const shopCategoryAttr = shop.getAttribute("data-category");
      const shapes = getAllShapes(shop);
      const texts = shop.querySelectorAll("text");
      const isMatching = matchesCategory(shopCategoryAttr, category);
      const firstCategory = getFirstCategory(shopCategoryAttr);

      if (category === "all") {
        shapes.forEach(shape => {
          if (shop.id === highlightedShopId) {
            shape.style.fill = getHighlightFill(shopCategoryAttr);
          } else {
            shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
          }
        });
        texts.forEach(text => {
          text.style.opacity = "1";
          text.style.fill = "";
        });
        shop.style.opacity = "1";
        shop.style.filter = "none";
      } else if (isMatching) {
        shapes.forEach(shape => {
          shape.style.fill = getFilterFill(firstCategory);
        });
        texts.forEach(text => {
          text.style.opacity = "1";
          text.style.fill = "";
        });
        shop.style.opacity = "1";
        shop.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.2))";
      } else {
        shapes.forEach(shape => {
          shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
        });
        texts.forEach(text => {
          text.style.opacity = "0.4";
        });
        shop.style.opacity = "0.3";
        shop.style.filter = "grayscale(0.7) brightness(0.6)";
      }
    });
  }

  // ========== ОТКЛЮЧЕНИЕ HOVER ДЛЯ СТАТИЧНЫХ ЭЛЕМЕНТОВ ==========
  function disableStaticHover() {
    const staticElements = svgElement.querySelectorAll('g:not([data-category]), g[data-category="static"]');
    staticElements.forEach(staticElement => {
      staticElement.classList.add("no-hover");
      staticElement.style.pointerEvents = "none";

      // Также отключаем pointer-events для всех дочерних элементов
      const children = staticElement.querySelectorAll("*");
      children.forEach(child => {
        child.style.pointerEvents = "none";
      });
    });
    console.log(`Отключено наведение для ${staticElements.length} статичных элементов`);
  }

  // ========== ДОБАВЛЕНИЕ НАЗВАНИЙ ВНУТРИ SVG ==========
  function addSVGLabels() {
    // Создаём отдельный слой для всех надписей (если ещё не создан)
    let labelsLayer = document.getElementById("shop-labels-layer");
    if (!labelsLayer) {
      labelsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      labelsLayer.setAttribute("id", "shop-labels-layer");
      labelsLayer.setAttribute("style", "pointer-events: none;");
      svgElement.appendChild(labelsLayer);
    }

    allShops.forEach(shop => {
      const shopId = shop.id;
      const shopInfo = shopData[shopId];
      if (!shopInfo) return;

      const shopName = shopInfo.name;
      const shopNameSize = shopInfo.namesize || 12;

      // Ищем ВСЕ графические элементы
      const shapes = getAllShapes(shop);
      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      shapes.forEach(shape => {
        try {
          const bbox = shape.getBBox();
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        } catch (e) {
          console.warn(`Ошибка при получении bbox для ${shape.tagName} в ${shopId}:`, e);
        }
      });

      // Если ничего не нашли, пробуем найти по координатам из атрибутов
      if (minX === Infinity) {
        // Пробуем найти circle и взять его центр
        const circle = shop.querySelector("circle");
        if (circle) {
          const cx = parseFloat(circle.getAttribute("cx"));
          const cy = parseFloat(circle.getAttribute("cy"));
          const r = parseFloat(circle.getAttribute("r")) || 35;

          if (!isNaN(cx) && !isNaN(cy)) {
            minX = cx - r;
            minY = cy - r;
            maxX = cx + r;
            maxY = cy + r;
          }
        }

        // Если всё ещё нет, пробуем rect
        if (minX === Infinity) {
          const rect = shop.querySelector("rect");
          if (rect) {
            const x = parseFloat(rect.getAttribute("x"));
            const y = parseFloat(rect.getAttribute("y"));
            const w = parseFloat(rect.getAttribute("width"));
            const h = parseFloat(rect.getAttribute("height"));

            if (!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h)) {
              minX = x;
              minY = y;
              maxX = x + w;
              maxY = y + h;
            }
          }
        }

        if (minX === Infinity) return;
      }

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Создаём группу для текста с фоном
      const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      textGroup.setAttribute("class", "shop-label");
      textGroup.setAttribute("data-shop-id", shopId);

      // Вычисляем ширину текста
      const textWidth = shopName.length * (shopNameSize * 0.6);
      const textHeight = shopNameSize;

      // Добавляем полупрозрачный фон под текст
      const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute("x", centerX - textWidth / 2 - 8);
      bgRect.setAttribute("y", centerY - textHeight / 2 - 4);
      bgRect.setAttribute("width", textWidth + 16);
      bgRect.setAttribute("height", textHeight + 8);
      bgRect.setAttribute("rx", "6");
      bgRect.setAttribute("ry", "6");
      bgRect.setAttribute("fill", "white");
      bgRect.setAttribute("fill-opacity", "0.0"); //скрываем
      bgRect.setAttribute("stroke", "#164680");
      bgRect.setAttribute("stroke-width", "1");
      bgRect.setAttribute("stroke-opacity", "0.0"); //скрываем

      // Создаём сам текст
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", centerX);
      text.setAttribute("y", centerY);
      text.setAttribute("fill", "#164680");
      text.setAttribute("font-size", shopNameSize);
      text.setAttribute("font-family", "Ubuntu, sans-serif");
      text.setAttribute("font-weight", "500");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("pointer-events", "none");
      text.textContent = shopName;

      // Добавляем фон и текст в группу
      textGroup.appendChild(bgRect);
      textGroup.appendChild(text);

      // Добавляем группу в отдельный слой
      labelsLayer.appendChild(textGroup);
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

    const shapes = getAllShapes(shop);
    if (!shapes.length) return false;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    shapes.forEach(shape => {
      try {
        const bbox = shape.getBBox();
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

    panZoomInstance.zoom(zoomLevel);
    panZoomInstance.pan({
      x: containerRect.width / 2 - centerX * zoomLevel,
      y: containerRect.height / 2 - centerY * zoomLevel,
    });

    return true;
  }

  // ========== ПОЛУЧЕНИЕ ID МАГАЗИНА ИЗ GET-ПАРАМЕТРА ==========
  function getCurrentShopFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const shopId = urlParams.get("location");
    if (!shopId || !shopData[shopId]) return null;
    return { shopId, zoom: shopData[shopId].zoom || 2.0 };
  }

  // ========== АВТОМАТИЧЕСКОЕ ЦЕНТРИРОВАНИЕ ==========
  function initAutoCenterAndHighlight() {
    let targetShop = getCurrentShopFromURL();

    if (targetShop && shopData[targetShop.shopId]) {
      const waitForPanZoom = setInterval(() => {
        if (panZoomInstance && document.getElementById(targetShop.shopId)) {
          clearInterval(waitForPanZoom);
          setTimeout(() => {
            highlightShop(targetShop.shopId);
            centerOnShop(targetShop.shopId, targetShop.zoom);
          }, 200);
        }
      }, 100);
    }
  }

  // ========== НАСТРОЙКА ВИДИМОСТИ ТЕКСТА ПРИ ЗУМЕ ==========
  function adjustTextVisibility() {
    if (!panZoomInstance) return;
    const zoom = panZoomInstance.getZoom();

    document.querySelectorAll("#map-container svg g[id] text").forEach(text => {
      if (zoom >= 0.8) {
        text.style.opacity = "1";
        text.style.visibility = "visible";
      } else if (zoom >= 0.5) {
        text.style.opacity = "0.7";
        text.style.visibility = "visible";
      } else {
        text.style.opacity = "0";
        text.style.visibility = "hidden";
      }
    });
  }

  // ========== ОБНОВЛЕНИЕ ПРИ ИЗМЕНЕНИИ РАЗМЕРА ОКНА ==========
  function handleResize() {
    if (panZoomInstance) {
      setTimeout(() => {
        panZoomInstance.resize();
        panZoomInstance.fit();
        panZoomInstance.center();
        adjustTextVisibility();
      }, 100);
    }
  }

  // ========== ОБРАБОТЧИКИ ДЛЯ МАГАЗИНОВ ==========
  function attachShopEventHandlers() {
    allShops.forEach(shop => {
      shop.style.cursor = "pointer";

      shop.addEventListener("click", event => {
        event.stopPropagation();
        showPopup(shop.id);
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
          showPopup(shop.id);
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

      // Обработчик mouseenter - меняем цвет всех элементов
      shop.addEventListener("mouseenter", () => {
        const shopCategoryAttr = shop.getAttribute("data-category");
        const isInactive = currentFilter !== "all" && !matchesCategory(shopCategoryAttr, currentFilter);
        if (isInactive) return;

        const shapes = getAllShapes(shop);
        const firstCategory = getFirstCategory(shopCategoryAttr);
        const hoverColor = getHoverFill(firstCategory);

        shapes.forEach(shape => {
          shape.style.fill = hoverColor;
        });
      });

      // Обработчик mouseleave - восстанавливаем цвета
      shop.addEventListener("mouseleave", () => {
        const shopCategoryAttr = shop.getAttribute("data-category");
        const shapes = getAllShapes(shop);
        const isInactive = currentFilter !== "all" && !matchesCategory(shopCategoryAttr, currentFilter);
        const firstCategory = getFirstCategory(shopCategoryAttr);

        if (isInactive) {
          shapes.forEach(shape => {
            shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
          });
          shop.style.filter = "grayscale(0.7) brightness(0.6)";
        } else if (currentFilter !== "all" && matchesCategory(shopCategoryAttr, currentFilter)) {
          shapes.forEach(shape => {
            shape.style.fill = getFilterFill(firstCategory);
          });
          shop.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.2))";
        } else {
          if (shop.id === highlightedShopId) {
            shapes.forEach(shape => {
              shape.style.fill = getHighlightFill(shopCategoryAttr);
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
  }

  // ========== ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ ==========
  function initFilters() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilter(btn.getAttribute("data-filter"));
      });
    });
  }

  // ========== ОСНОВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ==========
  function init() {
    console.log("Инициализация SVG карты...");

    // Убираем жесткие размеры SVG
    svgElement.removeAttribute("width");
    svgElement.removeAttribute("height");
    svgElement.setAttribute("width", "100%");

    if (allShops.length === 0) {
      console.warn("Магазины не найдены. Проверьте атрибуты id у элементов <g>");
    }

    saveOriginalColors();
    initPanZoom();
    addSVGLabels();
    attachShopEventHandlers();
    initFilters();
    disableStaticHover(); // Отключаем hover для статичных элементов
    applyFilter("all");
    initAutoCenterAndHighlight();
    window.addEventListener("resize", handleResize);
    setTimeout(adjustTextVisibility, 500);

    // Настройка закрытия попапа
    const closeBtn = document.querySelector(".close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closePopup);
    window.addEventListener("click", event => {
      if (event.target === document.getElementById("shop-popup")) closePopup();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closePopup();
    });

    console.log("Инициализация завершена");
  }

  init();
});
