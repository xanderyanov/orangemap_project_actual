// main.js
document.addEventListener("DOMContentLoaded", function () {
  if (typeof shopData === "undefined") {
    console.error("shopData не загружен! Подключите shop-data.js перед этим файлом.");
    return;
  }

  if (typeof categoryStyle === "undefined") {
    console.error("categoryStyle не загружен! Подключите category-styles.js перед этим файлом.");
    return;
  }

  const mapContainer = document.getElementById("map-container");
  const svgElement = document.querySelector("#map-container svg");

  if (!mapContainer || !svgElement) {
    console.error("map-container или SVG элемент не найден.");
    return;
  }

  const viewportElement =
    svgElement.querySelector("#map-viewport") || svgElement.querySelector(".svg-pan-zoom_viewport");

  if (!viewportElement) {
    console.error("Не найден #map-viewport / .svg-pan-zoom_viewport внутри SVG.");
    return;
  }

  let panZoomInstance = null;
  let resizeTimer = null;
  let touchTimer = null;
  let isPanning = false;
  let currentFilter = "all";
  let highlightedShopId = null;

  window.panZoomInstance = null;

  const allShops = Array.from(viewportElement.children).filter(el => {
    return el.tagName && el.tagName.toLowerCase() === "g" && el.id && el.hasAttribute("data-category");
  });

  function showMap() {
    mapContainer.classList.add("map-visible");
  }

  function hideMap() {
    mapContainer.classList.remove("map-visible");
  }

  hideMap();

  function isStaticElement(shop) {
    const categoryAttr = shop.getAttribute("data-category");
    return !categoryAttr || categoryAttr === "static";
  }

  function matchesCategory(shopCategoryAttr, selectedCategory) {
    if (selectedCategory === "all") return true;
    if (!shopCategoryAttr) return false;

    const categories = shopCategoryAttr
      .split(",")
      .map(cat => cat.trim())
      .filter(Boolean);

    return categories.includes(selectedCategory);
  }

  function getFirstCategory(shopCategoryAttr) {
    if (!shopCategoryAttr) return null;
    const first = shopCategoryAttr.split(",")[0];
    return first ? first.trim() : null;
  }

  function getOriginalFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.originalFill) return shopInfo.originalFill;
    return categoryStyle[category]?.originalFill || "#fcf2eb";
  }

  function getHoverFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.hoverFill) return shopInfo.hoverFill;
    return categoryStyle[category]?.hoverFill || "#f5f5f5";
  }

  function getFilterFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.filterFill) return shopInfo.filterFill;
    return categoryStyle[category]?.filterFill || "#f5f5f5";
  }

  function getHighlightFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.highlightFill) return shopInfo.highlightFill;
    return categoryStyle[category]?.highlightFill || "#ffe0b2";
  }

  function getTextColorForShop(shopId) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.textColor) return shopInfo.textColor;
    return "#164680";
  }

  function getTextHoverColorForShop(shopId) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.textHoverColor) return shopInfo.textHoverColor;
    return "#ff6600";
  }

  function getCategoryText(category) {
    const texts = {
      mag: "Магазин",
      serv: "Услуги",
      rest: "Кафе / Ресторан",
      baz: "Оранжевый базар",
      pav: "Павильон",
      floor3: "3 этаж",
    };
    return texts[category] || category;
  }

  function getAllShapes(shop) {
    return shop.querySelectorAll("path, circle, rect, ellipse, polygon, line, polyline");
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function getCurrentShopConfig() {
    const block = document.getElementById("current-shop");
    if (!block) return null;

    const shopId = block.getAttribute("data-shop-id");
    if (!shopId) return null;

    const zoomAttr = parseFloat(block.getAttribute("data-zoom"));
    const offsetDesktop = parseFloat(block.getAttribute("data-offset-y"));
    const offsetMobile = parseFloat(block.getAttribute("data-offset-y-mobile"));

    const zoom = !isNaN(zoomAttr) && zoomAttr > 0 ? zoomAttr : 2;

    let offsetY = 0;
    if (isMobileViewport() && !isNaN(offsetMobile)) {
      offsetY = offsetMobile;
    } else if (!isNaN(offsetDesktop)) {
      offsetY = offsetDesktop;
    }

    return { shopId, zoom, offsetY };
  }

  function getShopBounds(shop) {
    const shapes = getAllShapes(shop);
    if (!shapes.length) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    shapes.forEach(shape => {
      try {
        const bbox = shape.getBBox();
        if (!bbox || (bbox.width === 0 && bbox.height === 0 && bbox.x === 0 && bbox.y === 0)) {
          return;
        }

        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      } catch (e) {}
    });

    if (minX === Infinity) return null;

    return {
      minX,
      minY,
      maxX,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  function getScreenPointFromViewportCoords(x, y) {
    try {
      const point = svgElement.createSVGPoint();
      point.x = x;
      point.y = y;

      const ctm = viewportElement.getScreenCTM();
      if (!ctm) return null;

      return point.matrixTransform(ctm);
    } catch (e) {
      return null;
    }
  }

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

  function forceSetOriginalColors() {
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

      const textElement = document.querySelector(`.shop-label[data-shop-id="${shopId}"] text`);
      if (textElement) {
        textElement.style.fill = textColor;
      }
    });
  }

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

  window.highlightShop = highlightShop;

  function showPopup(shopId) {
    const data = shopData[shopId];
    if (!data) return;

    const popup = document.getElementById("shop-popup");
    const popupTitle = document.getElementById("popup-title");
    const popupDesc = document.getElementById("popup-desc");
    const popupCategory = document.getElementById("popup-category-tag");
    const popupLink = document.getElementById("popup-link");
    const popupLogo = document.querySelector(".popup-logo img");

    if (popupTitle) popupTitle.textContent = data.name || "";
    if (popupDesc) popupDesc.textContent = data.desc || "";

    if (popupCategory) {
      popupCategory.textContent = getCategoryText(data.category);
      popupCategory.className = `popup-category category-${data.category}`;
    }

    if (popupLogo) {
      const logoContainer = document.querySelector(".popup-logo");

      if (data.logo) {
        popupLogo.src = data.logo;
        popupLogo.alt = data.name || "";
        popupLogo.style.display = "block";
        if (logoContainer) logoContainer.style.display = "flex";
      } else {
        popupLogo.src = "";
        popupLogo.alt = "";
        popupLogo.style.display = "none";
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

  function closePopup() {
    const popup = document.getElementById("shop-popup");
    if (popup) popup.style.display = "none";
  }

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
      const textElement = document.querySelector(`.shop-label[data-shop-id="${shopId}"] text`);

      if (category === "all") {
        shapes.forEach(shape => {
          shape.style.fill = shop.id === highlightedShopId ? highlightColor : originalColor;
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
          textElement.style.visibility = "visible";
        }

        shop.style.opacity = "0.3";
        shop.style.filter = "grayscale(0.7) brightness(0.6)";
      }
    });
  }

  function disableStaticHover() {
    const staticElements = allShops.filter(shop => isStaticElement(shop));

    staticElements.forEach(staticElement => {
      staticElement.classList.add("no-hover");
      staticElement.style.pointerEvents = "none";

      const children = staticElement.querySelectorAll("*");
      children.forEach(child => {
        child.style.pointerEvents = "none";
      });
    });
  }

  function addSVGLabels() {
    let labelsLayer = viewportElement.querySelector("#shop-labels-layer");

    if (!labelsLayer) {
      labelsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      labelsLayer.setAttribute("id", "shop-labels-layer");
      labelsLayer.setAttribute("style", "pointer-events: none;");
      viewportElement.appendChild(labelsLayer);
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

      const bounds = getShopBounds(shop);
      if (!bounds) return;

      const centerX = bounds.centerX;
      let centerY = bounds.centerY;

      if (shopInfo.textOffsetY) {
        centerY += shopInfo.textOffsetY;
      }

      const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      textGroup.setAttribute("class", "shop-label");
      textGroup.setAttribute("data-shop-id", shopId);

      const textWidth = shopName.length * (shopNameSize * 0.6);
      const textHeight = shopNameSize;

      const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute("x", centerX - textWidth / 2 - 8);
      bgRect.setAttribute("y", centerY - textHeight / 2 - 4);
      bgRect.setAttribute("width", textWidth + 16);
      bgRect.setAttribute("height", textHeight + 8);
      bgRect.setAttribute("rx", "6");
      bgRect.setAttribute("ry", "6");

      if (textBgColor) {
        bgRect.setAttribute("fill", textBgColor);
        bgRect.setAttribute("fill-opacity", textBgOpacity);
        bgRect.setAttribute("stroke", textColor);
        bgRect.setAttribute("stroke-width", "1");
        bgRect.setAttribute("stroke-opacity", "0.3");
      } else {
        bgRect.setAttribute("fill", "white");
        bgRect.setAttribute("fill-opacity", "0");
        bgRect.setAttribute("stroke", "#164680");
        bgRect.setAttribute("stroke-width", "1");
        bgRect.setAttribute("stroke-opacity", "0");
      }

      textGroup.appendChild(bgRect);

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

  function centerOnShop(shopId, zoomLevel, offsetY = 0) {
    if (!panZoomInstance) return false;

    const shop = document.getElementById(shopId);
    if (!shop) {
      console.warn(`Магазин ${shopId} не найден`);
      return false;
    }

    const bounds = getShopBounds(shop);
    if (!bounds) {
      console.warn(`Не удалось получить границы магазина ${shopId}`);
      return false;
    }

    try {
      panZoomInstance.resize();
      panZoomInstance.updateBBox();
      panZoomInstance.fit();
      panZoomInstance.center();
      panZoomInstance.zoom(zoomLevel);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const screenPoint = getScreenPointFromViewportCoords(bounds.centerX, bounds.centerY);

          if (!screenPoint) {
            showMap();
            return;
          }

          const rect = mapContainer.getBoundingClientRect();
          const desiredX = rect.left + rect.width / 2;
          const desiredY = rect.top + rect.height / 2 + offsetY;

          panZoomInstance.panBy({
            x: desiredX - screenPoint.x,
            y: desiredY - screenPoint.y,
          });

          highlightShop(shopId);
          applyFilter(currentFilter);
          adjustTextVisibility();
          showMap();
        });
      });

      return true;
    } catch (e) {
      console.error("Ошибка centerOnShop:", e);
      showMap();
      return false;
    }
  }

  window.centerOnShop = centerOnShop;

  function applyCurrentShopView() {
    if (!panZoomInstance) return;

    const config = getCurrentShopConfig();

    if (!config) {
      highlightedShopId = null;
      panZoomInstance.resize();
      panZoomInstance.updateBBox();
      panZoomInstance.fit();
      panZoomInstance.center();
      applyFilter(currentFilter);
      adjustTextVisibility();
      showMap();
      return;
    }

    const shop = document.getElementById(config.shopId);

    if (!shop) {
      highlightedShopId = null;
      panZoomInstance.resize();
      panZoomInstance.updateBBox();
      panZoomInstance.fit();
      panZoomInstance.center();
      applyFilter(currentFilter);
      adjustTextVisibility();
      showMap();
      return;
    }

    centerOnShop(config.shopId, config.zoom, config.offsetY);
  }

  function handleResize() {
    if (!panZoomInstance) return;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyCurrentShopView();
    }, 250);
  }

  function resetMapView() {
    applyCurrentShopView();
  }

  function attachCustomControls() {
    const zoomInBtn = document.getElementById("zoom-in");
    const zoomOutBtn = document.getElementById("zoom-out");
    const zoomResetBtn = document.getElementById("zoom-reset");

    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", () => {
        if (!panZoomInstance) return;
        panZoomInstance.zoomIn();
        adjustTextVisibility();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", () => {
        if (!panZoomInstance) return;
        panZoomInstance.zoomOut();
        adjustTextVisibility();
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener("click", () => {
        if (!panZoomInstance) return;
        resetMapView();
      });
    }
  }

  function attachShopEventHandlers() {
    allShops.forEach(shop => {
      if (isStaticElement(shop)) return;

      const shopId = shop.id;
      shop.style.cursor = "pointer";

      shop.addEventListener("click", event => {
        event.stopPropagation();
        showPopup(shopId);
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
          showPopup(shopId);
        }

        isPanning = false;
      });

      shop.addEventListener("touchmove", () => {
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
          isPanning = true;
        }
      });

      shop.addEventListener("mouseenter", () => {
        const shopCategoryAttr = shop.getAttribute("data-category");
        const isInactive = currentFilter !== "all" && !matchesCategory(shopCategoryAttr, currentFilter);
        if (isInactive) return;

        const shapes = getAllShapes(shop);
        const hoverColor = shop.getAttribute("data-hover-color");

        shapes.forEach(shape => {
          shape.style.fill = hoverColor;
        });

        const textElement = document.querySelector(`.shop-label[data-shop-id="${shopId}"] text`);
        if (textElement) {
          const hoverTextColor = shop.getAttribute("data-text-hover-color");
          if (hoverTextColor) {
            textElement.style.fill = hoverTextColor;
          }
        }
      });

      shop.addEventListener("mouseleave", () => {
        const shopCategoryAttr = shop.getAttribute("data-category");
        const shapes = getAllShapes(shop);
        const isInactive = currentFilter !== "all" && !matchesCategory(shopCategoryAttr, currentFilter);
        const originalColor = shop.getAttribute("data-original-color");
        const filterColor = shop.getAttribute("data-filter-color");
        const highlightColor = shop.getAttribute("data-highlight-color");

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

  function initFilters() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilter(btn.getAttribute("data-filter"));
      });
    });
  }

  function initPanZoom() {
    if (typeof svgPanZoom === "undefined") {
      console.error("svgPanZoom не найден.");
      showMap();
      return;
    }

    try {
      panZoomInstance = svgPanZoom(svgElement, {
        viewportSelector: viewportElement,
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: true,
        center: true,
        minZoom: 0.3,
        maxZoom: 25,
        zoomScaleSensitivity: 0.2,
        onZoom: function () {
          adjustTextVisibility();
        },
      });

      window.panZoomInstance = panZoomInstance;
      panZoomInstance.updateBBox();

      setTimeout(() => {
        applyCurrentShopView();
      }, 300);
    } catch (e) {
      console.error("Ошибка инициализации PanZoom:", e);
      showMap();
    }
  }

  function init() {
    svgElement.removeAttribute("width");
    svgElement.removeAttribute("height");
    svgElement.setAttribute("width", "100%");

    saveOriginalColors();
    addSVGLabels();
    forceSetOriginalColors();
    initPanZoom();
    attachShopEventHandlers();
    attachCustomControls();
    initFilters();
    disableStaticHover();
    applyFilter("all");

    window.addEventListener("resize", handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    setTimeout(adjustTextVisibility, 500);

    const closeBtn = document.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", closePopup);
    }

    window.addEventListener("click", event => {
      if (event.target === document.getElementById("shop-popup")) {
        closePopup();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closePopup();
      }
    });
  }

  init();

  setTimeout(() => {
    showMap();
  }, 2500);
});

window.addEventListener("pageshow", function () {
  const popup = document.getElementById("shop-popup");
  if (popup) popup.style.display = "none";
});

window.addEventListener("popstate", function () {
  const popup = document.getElementById("shop-popup");
  if (popup) popup.style.display = "none";
});
