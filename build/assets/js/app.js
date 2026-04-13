var $window;
var prevWindowWidth = 0;
var windowWidth;
var vh;
var vh100;

// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
vh = window.innerHeight * 0.01;
vh100 = vh * 100;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty("--vh", `${vh}px`);
document.documentElement.style.setProperty("--100vh", `${vh100}px`);
//in selector we set style, for example
//height: calc(var(--vh, 1vh) * 100); for 100vh

function initVars() {
  console.log("start init vars");
  $window = $(window);
  windowWidth = $window.width();
  windowHeight = $window.height();
  headerHeight = $(".site__header").outerHeight();
}

// $(function () {
//   initVars();
// });

// ========== ПОЛУЧАЕМ ЭЛЕМЕНТЫ ==========
const htmlElement = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const lightLabel = document.getElementById("lightLabel");
const darkLabel = document.getElementById("darkLabel");
const demoBtn = document.getElementById("demoBtn");

// ========== ФУНКЦИЯ УСТАНОВКИ ТЕМЫ ==========
function setTheme(theme) {
  if (theme === "dark") {
    htmlElement.setAttribute("data-theme", "dark");
    themeToggle.checked = true;
    lightLabel.classList.remove("active");
    darkLabel.classList.add("active");
  } else {
    htmlElement.removeAttribute("data-theme");
    themeToggle.checked = false;
    lightLabel.classList.add("active");
    darkLabel.classList.remove("active");
  }
  localStorage.setItem("siteTheme", theme);
}

// ========== ПОЛУЧАЕМ СОХРАНЁННУЮ ТЕМУ ==========
const savedTheme = localStorage.getItem("siteTheme");

if (savedTheme === "dark") {
  setTheme("dark");
} else if (savedTheme === "light") {
  setTheme("light");
} else {
  // Если нет сохранения — определяем системные настройки
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

// ========== ОБРАБОТЧИК ПЕРЕКЛЮЧЕНИЯ ==========
themeToggle.addEventListener("change", e => {
  if (e.target.checked) {
    setTheme("dark");
  } else {
    setTheme("light");
  }
});

// ========== ОБРАБОТЧИК КЛИКА ПО МЕТКАМ ==========
lightLabel.addEventListener("click", () => {
  if (htmlElement.getAttribute("data-theme") === "dark") {
    setTheme("light");
  }
});

darkLabel.addEventListener("click", () => {
  if (htmlElement.getAttribute("data-theme") !== "dark") {
    setTheme("dark");
  }
});

// ========== ДЕМОНСТРАЦИОННАЯ КНОПКА ==========
demoBtn.addEventListener("click", () => {
  alert("Тема работает! Цвет фона и текста изменились.\nВыбор сохранён в localStorage.");
});

// ========== СЛЕДИМ ЗА СИСТЕМНЫМИ НАСТРОЙКАМИ (если нет сохранения) ==========
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  if (!localStorage.getItem("siteTheme")) {
    setTheme(e.matches ? "dark" : "light");
  }
});

function siteResizeFunction() {
  initVars();

  prevWindowWidth = windowWidth;
  console.log(prevWindowWidth);
  windowWidth = $window.width();
  console.log(windowWidth);

  if (prevWindowWidth < 1440 && windowWidth >= 1441) {
    $(".cartArea").removeClass("active");
    $(".cartArea__overlay").removeClass("active");
    console.log("123321");
  }
}

// console.log("resize-enable");

$(function () {
  let previousWidth = window.innerWidth;

  var resizeTimer; // Переменная для debounce таймера
  $(window).on("resize", function () {
    // Обработчик изменения размера окна с debounce
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(function () {
      const currentWidth = window.innerWidth;

      if (previousWidth < 1440 && currentWidth >= 1440) {
        // условие выполнено: экран перешел границу 1440px
        $(".cartArea").removeClass("active");
        $(".cartArea__overlay").removeClass("active");
      }

      if (previousWidth < 1080 && currentWidth >= 1080) {
        // условие выполнено: экран перешел границу 1080
        $(".catalog__left").removeClass("active");
        $(".catalog__overlay").removeClass("active");

        resetMenuStateDesktop();
      }

      if (previousWidth >= 1080 && currentWidth < 1080) {
        // условие выполнено: экран перешел границу 1080
        $(".catalog__left").removeClass("active");
        $(".catalog__overlay").removeClass("active");

        resetMenuStateMobile();
      }

      previousWidth = currentWidth; // сохраняем новое разрешение
    }, 100); // Задержка 250мс
  });
});

// Самовызывающаяся функция (IIFE) - изолирует код от глобальной области видимости
(function () {
  "use strict"; // Строгий режим - помогает избежать ошибок и делает код более безопасным

  // ==========================================
  // 1. НАХОДИМ ЭЛЕМЕНТЫ НА СТРАНИЦЕ
  // ==========================================
  const box1 = document.querySelector(".box1"); // Элемент, который будет двигаться медленнее (параллакс)
  const box2 = document.querySelector(".box2"); // Элемент, который будет наезжать (стандартное движение)

  // Проверяем, существуют ли элементы на странице
  // Если хотя бы одного нет - выходим из функции, чтобы не было ошибок
  if (!box1 || !box2) return;

  // ==========================================
  // 2. НАСТРОЙКИ ПАРАЛЛАКС-ЭФФЕКТА
  // ==========================================
  const settings = {
    speed: 0.5, // Скорость движения: 0.3 = 30% от скорости прокрутки
    // Чем меньше число (0.1-0.5), тем медленнее движение
    // Чем больше (0.8-0.95), тем быстрее (почти как обычная прокрутка)
  };

  // ==========================================
  // 3. ПЕРЕМЕННЫЕ СОСТОЯНИЯ (ФЛАГИ)
  // ==========================================
  let hasBeenVisible = false; // Был ли элемент box1 уже виден хотя бы раз?
  let startScrollPosition = 0; // Запоминаем позицию прокрутки, когда box1 появился впервые
  let box1OriginalBottom = 0; // Запоминаем исходную нижнюю границу box1 (нужно для динамического ограничения)

  // ==========================================
  // 4. СОЗДАЕМ НАБЛЮДАТЕЛЬ (Intersection Observer)
  // ==========================================
  // Его задача - следить, когда элемент появляется на экране или исчезает
  const observer = new IntersectionObserver(
    entries => {
      // entries - массив элементов, за которыми мы следим (у нас только box1)
      entries.forEach(entry => {
        // entry.isIntersecting = true, если элемент виден на экране
        //                     = false, если элемент скрыт за пределами экрана
        if (entry.isIntersecting) {
          // ПРОВЕРЯЕМ: виден ли элемент впервые?
          if (!hasBeenVisible) {
            // ЗАПОМИНАЕМ начальную позицию прокрутки
            // window.scrollY - сколько пикселей прокручено от верха страницы
            startScrollPosition = window.scrollY;

            // Отмечаем, что элемент уже был виден
            hasBeenVisible = true;

            // СБРАСЫВАЕМ трансформацию!
            // Важно: убираем любое смещение, которое могло примениться до этого
            // translateY(0px) - возвращаем элемент в исходную позицию
            box1.style.transform = "translateY(0px)";

            // ==========================================
            // ЗАПОМИНАЕМ ИСХОДНУЮ ПОЗИЦИЮ НИЗА box1
            // ==========================================
            // getBoundingClientRect() - возвращает размеры элемента и его позицию относительно окна браузера
            const rect = box1.getBoundingClientRect();

            // rect.bottom - расстояние от верха окна до нижней границы элемента
            // window.scrollY - текущая прокрутка страницы
            // Складываем их, чтобы получить абсолютную позицию низа элемента относительно документа
            // Например: элемент находится на 500px от верха документа, его высота 300px
            // rect.bottom = 300px (от верха окна), scrollY = 500px
            // box1OriginalBottom = 300 + 500 = 800px (низ элемента на 800px от верха документа)
            box1OriginalBottom = rect.bottom + window.scrollY;

            // Небольшое пояснение зачем это нужно:
            // Мы будем использовать эту информацию, чтобы понять, когда box1 почти полностью
            // ушел за пределы экрана. Когда это произойдет - мы остановим параллакс-эффект,
            // чтобы элемент не "застревал" и не двигался рывками.
          }
        }
      });
    },
    {
      // Настройки наблюдателя:
      threshold: 0.01, // Порог срабатывания (0.01 = 1%)
      // Это значит, что наблюдатель сработает, когда хотя бы 1% элемента
      // станет видимым на экране. Можно поставить 0 - сработает при первом пикселе
    },
  );

  // ==========================================
  // 5. НАЧИНАЕМ СЛЕДИТЬ ЗА ЭЛЕМЕНТОМ
  // ==========================================
  observer.observe(box1);

  // ==========================================
  // 6. ОСНОВНАЯ ФУНКЦИЯ ПАРАЛЛАКСА
  // ==========================================
  // Вычисляет и применяет смещение для box1 на основе текущей прокрутки
  function updateParallax() {
    // ВАЖНО: если элемент еще ни разу не был виден - ничего не делаем
    // Это предотвращает лишние вычисления и возможные дергания
    if (!hasBeenVisible) {
      // Явно сбрасываем трансформацию, чтобы элемент точно был на месте
      box1.style.transform = "translateY(0px)";
      return; // Выходим из функции
    }

    // ==========================================
    // 7. ПОЛУЧАЕМ ТЕКУЩУЮ ПОЗИЦИЮ ПРОКРУТКИ
    // ==========================================
    // scrollY - сколько пикселей прокручено сверху страницы
    const scrollY = window.scrollY;

    // ВЫСОТА ОКНА БРАУЗЕРА (видимая область)
    const windowHeight = window.innerHeight;

    // ==========================================
    // 8. ВЫЧИСЛЯЕМ ОТНОСИТЕЛЬНУЮ ПРОКРУТКУ
    // ==========================================
    // Это сколько пикселей прокручено с МОМЕНТА появления элемента
    // Например: элемент появился при прокрутке 500px, сейчас прокрутка 700px
    // relativeScroll = 700 - 500 = 200px (прокрутили на 200px после появления)
    const relativeScroll = scrollY - startScrollPosition;

    // ==========================================
    // 9. ПРИМЕНЯЕМ ПАРАЛЛАКС ТОЛЬКО ПРИ ПРОКРУТКЕ ВНИЗ
    // ==========================================
    if (relativeScroll > 0) {
      // РАССЧИТЫВАЕМ смещение для параллакса
      // Формула: offset = прокрутка * (1 - скорость)
      // Например: прокрутка = 100px, скорость = 0.3
      // offset = 100 * (1 - 0.3) = 100 * 0.7 = 70px
      // То есть при прокрутке 100px, элемент сместится только на 70px
      // Создается эффект "отставания" - элемент движется медленнее
      let offset = relativeScroll * (1 - settings.speed);

      // ==========================================
      // 10. ДИНАМИЧЕСКОЕ ОГРАНИЧЕНИЕ (САМАЯ ВАЖНАЯ ЧАСТЬ!)
      // ==========================================
      // Получаем текущую позицию box1 с учетом примененной трансформации
      const rect = box1.getBoundingClientRect();

      // box1CurrentBottom - текущая позиция нижней границы box1 относительно окна браузера
      // Например: если box1 сместился вверх, его нижняя граница будет выше
      const box1CurrentBottom = rect.bottom;

      // КРИТЕРИЙ ОСТАНОВКИ: когда нижняя часть box1 почти достигла верха окна
      // 100px - это порог, который можно регулировать
      // Если нижняя граница box1 находится выше 100px от верха окна - значит
      // элемент почти полностью скрылся за верхней границей экрана
      if (box1CurrentBottom > 100) {
        // Элемент все еще виден или почти виден - ПРОДОЛЖАЕМ параллакс
        // Применяем трансформацию с рассчитанным смещением
        box1.style.transform = `translateY(${offset}px)`;
      } else {
        // Элемент почти полностью скрылся за верхней границей экрана
        // ОСТАНАВЛИВАЕМ параллакс - не меняем трансформацию дальше

        // Небольшое пояснение:
        // Когда box1 почти не виден, дальнейшее применение параллакса может вызвать
        // рывки и "залипание". Вместо этого мы просто перестаем обновлять трансформацию,
        // позволяя элементу двигаться стандартно вместе с прокруткой.
        // Это создает плавный переход от параллакса к обычному движению.
        return; // Выходим из функции, не применяя новую трансформацию
      }
    } else {
      // Если прокрутка НЕ вниз (то есть мы выше точки появления элемента)
      // Возвращаем элемент в исходное положение
      box1.style.transform = "translateY(0px)";
    }
  }

  // ==========================================
  // 11. ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ
  // ==========================================
  // Без этой оптимизации параллакс может тормозить на слабых устройствах

  let rafId = null; // Храним ID запроса анимации

  // Функция-обработчик события scroll
  function onScroll() {
    // Если уже есть запрос на анимацию - не создаем новый
    // Это называется "throttling" (ограничение частоты вызовов)
    // Без этого при каждом пикселе прокрутки вызывалась бы updateParallax()
    // что создает огромную нагрузку на браузер
    if (rafId) return;

    // requestAnimationFrame - просим браузер выполнить функцию ПЕРЕД следующим перерисовыванием
    // Это самый оптимальный момент для изменений, влияющих на визуальное отображение
    // Браузер сам решит, когда лучше всего выполнить наш код (обычно 60 раз в секунду)
    rafId = requestAnimationFrame(() => {
      // Вызываем функцию параллакса
      updateParallax();
      // Сбрасываем ID, чтобы можно было создать новый запрос
      rafId = null;
    });
  }

  // ==========================================
  // 12. ПОДПИСЫВАЕМСЯ НА СОБЫТИЕ ПРОКРУТКИ
  // ==========================================
  // { passive: true } - подсказка браузеру, что мы не вызываем preventDefault()
  // Это улучшает производительность скролла, особенно на мобильных устройствах
  window.addEventListener("scroll", onScroll, { passive: true });

  // ==========================================
  // 13. ПЕРВОНАЧАЛЬНЫЙ ЗАПУСК
  // ==========================================
  // Вызываем параллакс при загрузке страницы, чтобы установить начальное состояние
  // (трансформация = 0, если элемент еще не виден)
  updateParallax();

  // ==========================================
  // 14. ДОПОЛНИТЕЛЬНО: ОБРАБОТКА ИЗМЕНЕНИЯ РАЗМЕРА ОКНА
  // ==========================================
  // При изменении размера окна может измениться видимость элементов
  // Поэтому пересчитываем параллакс
  window.addEventListener("resize", () => {
    // При изменении размера окна сбрасываем флаг видимости
    // Наблюдатель заново определит, виден ли элемент
    hasBeenVisible = false;
    // Запускаем обновление
    updateParallax();
  });

  // ==========================================
  // КОММЕНТАРИЙ О ПОВЕДЕНИИ ЭЛЕМЕНТОВ
  // ==========================================
  // box2 (второй элемент) не имеет никаких дополнительных трансформаций
  // Он будет двигаться со стандартной скоростью прокрутки,
  // что создаст эффект "наезжания" на box1, который:
  //   1. Изначально движется медленнее (параллакс)
  //   2. Когда box1 почти скрывается - перестает применять параллакс
  //   3. Дальше движется стандартно вместе с box2
  // Это создает плавный, естественный переход между режимами движения
})();

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

// Функция, которая выполнится после полной загрузки страницы
function onPageLoad(callback) {
  // Проверяем тип callback, чтобы убедиться, что передана функция
  if (typeof callback !== "function") {
    console.error("onPageLoad: callback должен быть функцией");
    return;
  }

  if (document.readyState === "complete") {
    callback();
  } else {
    window.addEventListener("load", callback);
  }
}

function fadeOut(element, duration = 300) {
  if (!element) return;
  element.style.transition = `opacity ${duration}ms`;
  element.style.opacity = "0";
  setTimeout(function () {
    element.style.display = "none";
  }, duration);
}

// Использование:
onPageLoad(() => {
  console.log("Страница полностью загружена!");
  var preloader = document.querySelector(".preloader");
  if (preloader) {
    fadeOut(preloader, 1500);
  }
});

$(function () {
  let asasa = "start app";
  console.log(asasa);

  $(".xOverlay").on("click", function () {
    $(".cartArea").removeClass("active");
    $(".catalog__left").removeClass("active");
    $(".xOverlay").removeClass("active");
    $("body").removeClass("stop");
    $(".catalog__left").css("z-index", 200);
    $(".cartArea").css("z-index", 200);
  });

  $(".menuButton").on("click", function (e) {
    toggleMenu(this);
  });

  let ticking = false;

  $(window).on("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        const scrollTop = $(window).scrollTop();
        const fast = 0.82;
        const faster = -0.15;

        $(".first__text").css("transform", `translateY(${scrollTop * fast}px)`);
        $(".first__img").css("transform", `translateY(${scrollTop * faster}px)`);

        ticking = false;
      });
      ticking = true;
    }
  });

  // Инициализация при загрузке
  $(window).trigger("scroll");
});

function toggleMenu(clickedElement) {
  var $this = $(clickedElement);
  var topMenu = $(".topMenu__outer");

  if ($this.hasClass("open")) {
    $this.removeClass("open");
    topMenu.slideUp();
  } else {
    $this.addClass("open");
    topMenu.slideDown();
  }
}

function resetMenuStateDesktop() {
  $(".menuButton").hide();
  $(".menuButton").removeClass("open");
  $(".topMenu__outer").show();
}
function resetMenuStateMobile() {
  $(".menuButton").show();
  $(".menuButton").removeClass("open");
  $(".topMenu__outer").hide();
}

function cartToggler() {
  // var overlay = $(".cartArea__overlay");
  var overlay = $(".xOverlay");
  var cartSummary = $(".cartArea");

  if (cartSummary.hasClass("active")) {
    cartSummary.removeClass("active");
    overlay.removeClass("active");
    $("body").removeClass("stop");
    $(".catalog__left").css("z-index", 200);
  } else {
    $(".catalog__left").css("z-index", 100);
    cartSummary.addClass("active");
    overlay.addClass("active");
    $("body").addClass("stop");
  }
}

function leftMenuToggler() {
  // var catOverlay = $(".catalog__overlay");
  var catOverlay = $(".xOverlay");
  var leftEl = $(".catalog__left");

  if (leftEl.hasClass("active")) {
    leftEl.removeClass("active");
    catOverlay.removeClass("active");
    $("body").removeClass("stop");
    $(".cartArea").css("z-index", 200);
  } else {
    $(".cartArea").css("z-index", 100);
    leftEl.addClass("active");
    catOverlay.addClass("active");
    $("body").addClass("stop");
  }
}

//# sourceMappingURL=app.js.map
