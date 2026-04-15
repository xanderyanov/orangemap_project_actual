// main.js
document.addEventListener("DOMContentLoaded", function () {
  console.log("скрипт карты загружен");
  // ========== ПРОВЕРКА, ЧТО shopData И categoryStyle ЗАГРУЖЕНЫ ==========
  if (typeof shopData === "undefined") {
    console.error("shopData не загружен! Подключите shop-data.js перед этим файлом.");
    return;
  }
  if (typeof categoryStyle === "undefined") {
    console.error("categoryStyle не загружен! Подключите category-styles.js перед этим файлом.");
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

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

  // Проверяет, является ли элемент статичным
  function isStaticElement(shop) {
    const categoryAttr = shop.getAttribute("data-category");
    return !categoryAttr || categoryAttr === "static";
  }

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

  // Получает оригинальный цвет для магазина
  function getOriginalFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.originalFill) {
      return shopInfo.originalFill;
    }
    return categoryStyle[category]?.originalFill || "#fcf2eb";
  }

  // Получает цвет при наведении для магазина
  function getHoverFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.hoverFill && shopInfo.hoverFill !== "") {
      return shopInfo.hoverFill;
    }
    return categoryStyle[category]?.hoverFill || "#f5f5f5";
  }

  // Получает цвет при фильтрации для магазина
  function getFilterFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.filterFill && shopInfo.filterFill !== "") {
      return shopInfo.filterFill;
    }
    return categoryStyle[category]?.filterFill || "#f5f5f5";
  }

  // Получает цвет подсветки для магазина
  function getHighlightFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.highlightFill) {
      return shopInfo.highlightFill;
    }
    return categoryStyle[category]?.highlightFill || "#ffe0b2";
  }

  // Получает обычный цвет текста для магазина
  function getTextColorForShop(shopId) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.textColor) {
      return shopInfo.textColor;
    }
    return "#164680";
  }

  // Получает цвет текста при наведении для магазина
  function getTextHoverColorForShop(shopId) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.textHoverColor) {
      return shopInfo.textHoverColor;
    }
    return "#ff6600";
  }

  function getCategoryText(category) {
    const texts = {
      mag: "Магазин",
      serv: "Услуги",
      rest: "Кафе / Ресторан",
      baz: "Оранжевый базар",
      pav: "Павильон",
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
      const shopId = shop.id;
      const shopCategoryAttr = shop.getAttribute("data-category");
      const shapes = getAllShapes(shop);
      const isStatic = isStaticElement(shop);
      const firstCategory = getFirstCategory(shopCategoryAttr);

      const originalFillColor = getOriginalFillForShop(shopId, firstCategory);

      shapes.forEach(shape => {
        let originalFill;

        if (isStatic) {
          originalFill = shape.getAttribute("fill") || "#fcf2eb";
        } else {
          originalFill = originalFillColor;
        }

        shape.setAttribute("data-original-fill", originalFill);
        if (!isStatic) {
          shape.style.fill = originalFill;
        }
      });
    });
  }

  // ========== ПРИНУДИТЕЛЬНАЯ УСТАНОВКА ЦВЕТОВ ==========
  function forceSetOriginalColors() {
    console.log("Принудительная установка цветов для магазинов...");

    allShops.forEach(shop => {
      const shopId = shop.id;
      const shopInfo = shopData[shopId];

      if (isStaticElement(shop) || !shopInfo) return;

      const shopCategoryAttr = shop.getAttribute("data-category");
      const firstCategory = getFirstCategory(shopCategoryAttr);
      const shapes = getAllShapes(shop);

      const originalColor = getOriginalFillForShop(shopId, firstCategory);
      const hoverColor = getHoverFillForShop(shopId, firstCategory);
      const filterColor = getFilterFillForShop(shopId, firstCategory);
      const highlightColor = getHighlightFillForShop(shopId, firstCategory);
      const textColor = getTextColorForShop(shopId);
      const textHoverColor = getTextHoverColorForShop(shopId);

      shop.setAttribute("data-original-color", originalColor);
      shop.setAttribute("data-hover-color", hoverColor);
      shop.setAttribute("data-filter-color", filterColor);
      shop.setAttribute("data-highlight-color", highlightColor);
      shop.setAttribute("data-text-color", textColor);
      shop.setAttribute("data-text-hover-color", textHoverColor);

      shapes.forEach(shape => {
        if (shape.hasAttribute("fill")) {
          shape.removeAttribute("fill");
        }
        shape.style.fill = originalColor;
        shape.setAttribute("data-original-fill", originalColor);
      });

      // Устанавливаем цвет текста, если он уже существует
      const textElement = document.querySelector(`.shop-label[data-shop-id="${shopId}"] text`);
      if (textElement) {
        textElement.style.fill = textColor;
      }
    });

    console.log("Принудительная установка цветов завершена");
  }

  // ========== ПОДСВЕТКА КОНКРЕТНОГО МАГАЗИНА ==========
  function highlightShop(shopId) {
    allShops.forEach(shop => {
      if (isStaticElement(shop)) return;

      const shapes = getAllShapes(shop);
      const originalColor = shop.getAttribute("data-original-color");
      shapes.forEach(shape => {
        shape.style.fill = originalColor || "#fcf2eb";
      });

      const textElement = document.querySelector(`.shop-label[data-shop-id="${shop.id}"] text`);
      if (textElement) {
        const originalTextColor = shop.getAttribute("data-text-color");
        textElement.style.fill = originalTextColor || "#164680";
      }
    });

    if (!shopId) {
      highlightedShopId = null;
      return;
    }

    const shop = document.getElementById(shopId);
    if (!shop || isStaticElement(shop)) return;

    const highlightColor = shop.getAttribute("data-highlight-color");
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
    const popupLogo = document.querySelector(".popup-logo img");

    if (popupTitle) popupTitle.textContent = data.name;
    if (popupDesc) popupDesc.textContent = data.desc;
    if (popupCategory) {
      popupCategory.textContent = getCategoryText(data.category);
      popupCategory.className = `popup-category category-${data.category}`;
    }

    if (popupLogo) {
      if (data.logo && data.logo !== "") {
        popupLogo.src = data.logo;
        popupLogo.alt = data.name;
        popupLogo.style.display = "block";
        const logoContainer = document.querySelector(".popup-logo");
        if (logoContainer) logoContainer.style.display = "flex";
      } else {
        popupLogo.src = "";
        popupLogo.alt = "";
        popupLogo.style.display = "none";
        const logoContainer = document.querySelector(".popup-logo");
        if (logoContainer) logoContainer.style.display = "none";
      }
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
      const isStatic = isStaticElement(shop);

      if (isStatic) {
        const shapes = getAllShapes(shop);
        shapes.forEach(shape => {
          shape.style.fill = shape.getAttribute("data-original-fill") || "#fcf2eb";
          shape.style.opacity = "1";
        });
        shop.style.opacity = "1";
        shop.style.filter = "none";
        return;
      }

      const shopId = shop.id;
      const shopCategoryAttr = shop.getAttribute("data-category");
      const shapes = getAllShapes(shop);
      const isMatching = matchesCategory(shopCategoryAttr, category);

      const originalColor = shop.getAttribute("data-original-color");
      const filterColor = shop.getAttribute("data-filter-color");
      const highlightColor = shop.getAttribute("data-highlight-color");
      const textColor = shop.getAttribute("data-text-color");

      // Находим текст в отдельном слое
      const textElement = document.querySelector(`.shop-label[data-shop-id="${shopId}"] text`);

      if (category === "all") {
        shapes.forEach(shape => {
          if (shop.id === highlightedShopId) {
            shape.style.fill = highlightColor;
          } else {
            shape.style.fill = originalColor;
          }
        });
        if (textElement) {
          textElement.style.opacity = "1";
          textElement.style.fill = textColor;
          textElement.style.visibility = "visible";
        }
        shop.style.opacity = "1";
        shop.style.filter = "none";
      } else if (isMatching) {
        shapes.forEach(shape => {
          shape.style.fill = filterColor;
        });
        if (textElement) {
          textElement.style.opacity = "1";
          textElement.style.fill = textColor;
          textElement.style.visibility = "visible";
        }
        shop.style.opacity = "1";
        shop.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.2))";
      } else {
        shapes.forEach(shape => {
          shape.style.fill = originalColor;
        });
        if (textElement) {
          textElement.style.opacity = "0.4";
          textElement.style.fill = textColor;
        }
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

      const children = staticElement.querySelectorAll("*");
      children.forEach(child => {
        child.style.pointerEvents = "none";
      });
    });
    console.log(`Отключено наведение для ${staticElements.length} статичных элементов`);
  }

  // ========== ДОБАВЛЕНИЕ НАЗВАНИЙ ВНУТРИ SVG ==========
  function addSVGLabels() {
    let labelsLayer = document.getElementById("shop-labels-layer");
    if (!labelsLayer) {
      labelsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      labelsLayer.setAttribute("id", "shop-labels-layer");
      labelsLayer.setAttribute("style", "pointer-events: none;");
      svgElement.appendChild(labelsLayer);
    }

    allShops.forEach(shop => {
      if (isStaticElement(shop)) return;

      const shopId = shop.id;
      const shopInfo = shopData[shopId];
      if (!shopInfo) return;

      const shopName = shopInfo.name;
      const shopNameSize = shopInfo.namesize || 12;

      const textColor = getTextColorForShop(shopId);
      const textBgColor = shopInfo.textBgColor || null;
      const textBgOpacity = shopInfo.textBgOpacity !== undefined ? shopInfo.textBgOpacity : 0.92;

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

      if (minX === Infinity) {
        const rect = shop.querySelector("rect");
        if (rect) {
          const x = parseFloat(rect.getAttribute("x")) || 0;
          const y = parseFloat(rect.getAttribute("y")) || 0;
          const w = parseFloat(rect.getAttribute("width")) || 0;
          const h = parseFloat(rect.getAttribute("height")) || 0;
          const transform = rect.getAttribute("transform");

          if (transform) {
            const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
            if (matrixMatch) {
              const values = matrixMatch[1].split(",").map(parseFloat);
              const a = values[0],
                b = values[1],
                c = values[2],
                d = values[3],
                e = values[4],
                f = values[5];

              const corners = [
                { x: x, y: y },
                { x: x + w, y: y },
                { x: x, y: y + h },
                { x: x + w, y: y + h },
              ];

              const transformedCorners = corners.map(corner => ({
                x: a * corner.x + c * corner.y + e,
                y: b * corner.x + d * corner.y + f,
              }));

              minX = Math.min(...transformedCorners.map(c => c.x));
              minY = Math.min(...transformedCorners.map(c => c.y));
              maxX = Math.max(...transformedCorners.map(c => c.x));
              maxY = Math.max(...transformedCorners.map(c => c.y));
            }
          } else if (!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h)) {
            minX = x;
            minY = y;
            maxX = x + w;
            maxY = y + h;
          }
        }

        if (minX === Infinity) return;
      }

      const centerX = (minX + maxX) / 2;
      let centerY = (minY + maxY) / 2;

      if (shopInfo.textOffsetY) {
        centerY += shopInfo.textOffsetY;
      }

      const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      textGroup.setAttribute("class", "shop-label");
      textGroup.setAttribute("data-shop-id", shopId);

      const textWidth = shopName.length * (shopNameSize * 0.6);
      const textHeight = shopNameSize;

      if (textBgColor) {
        const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute("x", centerX - textWidth / 2 - 8);
        bgRect.setAttribute("y", centerY - textHeight / 2 - 4);
        bgRect.setAttribute("width", textWidth + 16);
        bgRect.setAttribute("height", textHeight + 8);
        bgRect.setAttribute("rx", "6");
        bgRect.setAttribute("ry", "6");
        bgRect.setAttribute("fill", textBgColor);
        bgRect.setAttribute("fill-opacity", textBgOpacity);
        bgRect.setAttribute("stroke", textColor);
        bgRect.setAttribute("stroke-width", "1");
        bgRect.setAttribute("stroke-opacity", "0.3");
        textGroup.appendChild(bgRect);
      } else {
        const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute("x", centerX - textWidth / 2 - 8);
        bgRect.setAttribute("y", centerY - textHeight / 2 - 4);
        bgRect.setAttribute("width", textWidth + 16);
        bgRect.setAttribute("height", textHeight + 8);
        bgRect.setAttribute("rx", "6");
        bgRect.setAttribute("ry", "6");
        bgRect.setAttribute("fill", "white");
        bgRect.setAttribute("fill-opacity", "0.0");
        bgRect.setAttribute("stroke", "#164680");
        bgRect.setAttribute("stroke-width", "1");
        bgRect.setAttribute("stroke-opacity", "0.0");
        textGroup.appendChild(bgRect);
      }

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", centerX);
      text.setAttribute("y", centerY);
      text.setAttribute("fill", textColor);
      text.setAttribute("font-size", shopNameSize);
      text.setAttribute("font-family", "Ubuntu, sans-serif");
      text.setAttribute("font-weight", "500");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("pointer-events", "none");
      text.textContent = shopName;

      textGroup.appendChild(text);
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

    document.querySelectorAll("#map-container svg .shop-label text").forEach(text => {
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
      if (isStaticElement(shop)) return;

      const shopId = shop.id;
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

      // Обработчик mouseenter - меняем цвет заливки и цвет текста
      shop.addEventListener("mouseenter", () => {
        const shopCategoryAttr = shop.getAttribute("data-category");
        const isInactive = currentFilter !== "all" && !matchesCategory(shopCategoryAttr, currentFilter);
        if (isInactive) return;

        // Меняем цвет заливки фигур
        const shapes = getAllShapes(shop);
        const hoverColor = shop.getAttribute("data-hover-color");
        shapes.forEach(shape => {
          shape.style.fill = hoverColor;
        });

        // Меняем цвет текста в отдельном слое
        const textElement = document.querySelector(`.shop-label[data-shop-id="${shopId}"] text`);
        if (textElement) {
          const hoverTextColor = shop.getAttribute("data-text-hover-color");
          if (hoverTextColor) {
            textElement.style.fill = hoverTextColor;
          }
        }
      });

      // Обработчик mouseleave - восстанавливаем цвета
      shop.addEventListener("mouseleave", () => {
        const shopCategoryAttr = shop.getAttribute("data-category");
        const shapes = getAllShapes(shop);
        const isInactive = currentFilter !== "all" && !matchesCategory(shopCategoryAttr, currentFilter);
        const originalColor = shop.getAttribute("data-original-color");
        const filterColor = shop.getAttribute("data-filter-color");
        const highlightColor = shop.getAttribute("data-highlight-color");

        // Восстанавливаем цвет заливки
        if (isInactive) {
          shapes.forEach(shape => {
            shape.style.fill = originalColor;
          });
          shop.style.filter = "grayscale(0.7) brightness(0.6)";
        } else if (currentFilter !== "all" && matchesCategory(shopCategoryAttr, currentFilter)) {
          shapes.forEach(shape => {
            shape.style.fill = filterColor;
          });
          shop.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.2))";
        } else {
          if (shop.id === highlightedShopId) {
            shapes.forEach(shape => {
              shape.style.fill = highlightColor;
            });
          } else {
            shapes.forEach(shape => {
              shape.style.fill = originalColor;
            });
          }
          shop.style.filter = "none";
        }

        // Восстанавливаем цвет текста в отдельном слое
        const textElement = document.querySelector(`.shop-label[data-shop-id="${shopId}"] text`);
        if (textElement) {
          const originalTextColor = shop.getAttribute("data-text-color");
          if (originalTextColor) {
            textElement.style.fill = originalTextColor;
          }
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

    svgElement.removeAttribute("width");
    svgElement.removeAttribute("height");
    svgElement.setAttribute("width", "100%");

    if (allShops.length === 0) {
      console.warn("Магазины не найдены. Проверьте атрибуты id у элементов <g>");
    }

    saveOriginalColors();
    addSVGLabels(); // СНАЧАЛА создаём текст
    forceSetOriginalColors(); // ПОТОМ устанавливаем цвета
    initPanZoom();
    attachShopEventHandlers();
    initFilters();
    disableStaticHover();
    applyFilter("all");
    initAutoCenterAndHighlight();
    window.addEventListener("resize", handleResize);
    setTimeout(adjustTextVisibility, 500);

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
