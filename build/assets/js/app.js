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

// ========== ЦВЕТА ДЛЯ КАТЕГОРИЙ ==========
const categoryStyle = {
  mag: {
    name: "Магазин",
    icon: "🛍️",
    originalFill: "rgba(103, 248, 103, .7)",
    hoverFill: "rgba(103, 248, 103, .9)",
    filterFill: "rgba(103, 248, 103, .9)",
    highlightFill: "rgba(103, 248, 103, 1)",
  },
  serv: {
    name: "Услуги и сервис",
    icon: "🏢",
    originalFill: "rgba(255, 167, 2, 0.7)",
    hoverFill: "rgba(255, 167, 2, 0.9)",
    filterFill: "rgba(255, 167, 2, 0.9)",
    highlightFill: "rgba(255, 167, 2, 1)",
  },
  rest: {
    name: "Ресторан",
    icon: "🍽️",
    originalFill: "rgba(2, 225, 255, 0.7)",
    hoverFill: "rgba(2, 225, 255, 0.9)",
    filterFill: "rgba(2, 225, 255, 0.9)",
    highlightFill: "rgba(2, 225, 255, 1)",
  },
  baz: {
    name: "Оранжевый базар",
    icon: "🛒",
    originalFill: "rgba(225, 2, 255, 0.7)",
    hoverFill: "rgba(225, 2, 255, 0.9)",
    filterFill: "rgba(225, 2, 255, 0.9)",
    highlightFill: "rgba(225, 2, 255, 1)",
  },
  pav: {
    name: "Павильон",
    icon: "🏪",
    originalFill: "rgba(2, 255, 213, 0.7)",
    hoverFill: "rgba(2, 255, 213, 0.9)",
    filterFill: "rgba(2, 255, 213, 0.9)",
    highlightFill: "rgba(2, 255, 213, 1)",
  },
};

const shopData = {
  mag_example: {
    // Основные настройки
    name: "Название магазина",
    namesize: 14, // Размер шрифта
    desc: "Описание магазина.",
    category: "mag", // Категория
    link: "/ru/shops/example", // Ссылка
    zoom: 1.5, // Зум при центрировании

    // Цвета заливки
    originalFill: "#ff0000", // Оригинальный цвет
    hoverFill: "#00ff00", // Цвет при наведении
    filterFill: "#0000ff", // Цвет при фильтрации
    highlightFill: "#ffff00", // Цвет при подсветке

    // Цвета текста (НОВЫЕ ОПЦИИ!)
    textColor: "#ffffff", // Цвет текста названия
    textBgColor: "rgba(0,0,0,0.7)", // Цвет фона текста (опционально)
    textBgOpacity: 0.9, // Прозрачность фона (по умолчанию 0.92)
    textOffsetY: 10, // Смещение текста по Y (пиксели)
  },
  // ========== ПАВИЛЬОНЫ ==========
  pav_korvetavto: {
    name: "Корвет Авто",
    namesize: 12,
    desc: "Автосервис и автомойка.",
    category: "pav",
    link: "/ru/pavilions/korvetavto",
    zoom: 1.8,
  },
  pav_reloud: {
    name: "Reloud",
    namesize: 12,
    desc: "Магазин одежды и аксессуаров.",
    category: "pav",
    link: "/ru/pavilions/reloud",
    zoom: 1.8,
  },
  pav_sayuri: {
    name: "Sāyūri",
    namesize: 12,
    desc: "Японская кухня.",
    category: "pav",
    link: "/ru/pavilions/sayuri",
    zoom: 1.8,
  },
  pav_cvetopt24: {
    name: "ЦветОпт24",
    namesize: 12,
    desc: "Магазин цветов.",
    category: "pav",
    link: "/ru/pavilions/cvetopt24",
    zoom: 1.8,
  },

  // ========== БАЗАР (Оранжевый базар) ==========
  baz_mjasbery: {
    name: "Мясной ряд",
    namesize: 12,
    desc: "Свежее мясо и колбасы.",
    category: "baz",
    link: "/ru/bazar/mjasbery",
    zoom: 1.5,
  },
  baz_fanagoria: {
    name: "Фанагория",
    namesize: 12,
    desc: "Вина и напитки.",
    category: "baz",
    link: "/ru/bazar/fanagoria",
    zoom: 1.5,
  },
  baz_dombyta: {
    name: "Дом быта",
    namesize: 14,
    desc: "Ремонт обуви, ключи, часы.",
    category: "baz",
    link: "/ru/bazar/dombyta",
    zoom: 1.5,
  },
  baz_fabrikakachestva: {
    name: "Фабрика качества",
    namesize: 11,
    desc: "Продукты питания.",
    category: "baz",
    link: "/ru/bazar/fabrikakachestva",
    zoom: 1.5,
  },
  baz_frukti: {
    name: "Фрукты",
    namesize: 12,
    desc: "Свежие фрукты и овощи.",
    category: "baz",
    link: "/ru/bazar/frukti",
    zoom: 1.5,
  },
  baz_prodrynok: {
    name: "Продуктовый рынок",
    namesize: 12,
    desc: "Продукты питания.",
    category: "baz",
    link: "/ru/bazar/prodrynok",
    zoom: 1.5,
  },
  baz_kovry: {
    name: "Ковры",
    namesize: 14,
    desc: "Магазин ковров.",
    category: "baz",
    link: "/ru/bazar/kovry",
    zoom: 1.5,
  },
  baz_lapotok: {
    name: "Лапоток",
    namesize: 12,
    desc: "Обувной магазин.",
    category: "baz",
    link: "/ru/bazar/lapotok",
    zoom: 1.5,
  },
  baz_rio: {
    name: "Рио",
    namesize: 16,
    desc: "Торговый центр.",
    category: "baz",
    link: "/ru/bazar/rio",
    zoom: 1.5,
  },
  baz_neprospi: {
    name: "Не проспи",
    namesize: 11,
    desc: "Магазин постельного белья.",
    category: "baz",
    link: "/ru/bazar/neprospi",
    zoom: 1.5,
  },
  baz_moyakniga: {
    name: "Моя книга",
    namesize: 12,
    desc: "Книжный магазин.",
    category: "baz",
    link: "/ru/bazar/moyakniga",
    zoom: 1.5,
  },
  baz_bonifatsiy: {
    name: "Бонифаций",
    namesize: 12,
    desc: "Зоотовары.",
    category: "baz",
    link: "/ru/bazar/bonifatsiy",
    zoom: 1.5,
  },
  baz_fish: {
    name: "Fish Market",
    namesize: 12,
    desc: "Рыбный рынок.",
    category: "baz",
    link: "/ru/bazar/fish",
    zoom: 1.5,
  },
  baz_milkmir: {
    name: "Молокомир",
    namesize: 12,
    desc: "Молочные продукты.",
    category: "baz",
    link: "/ru/bazar/milkmir",
    zoom: 1.5,
  },
  baz_meat: {
    name: "Мясной двор",
    namesize: 12,
    desc: "Мясные продукты.",
    category: "baz",
    link: "/ru/bazar/meat",
    zoom: 1.5,
  },

  // ========== МАГАЗИНЫ ==========
  mag_ashan: {
    name: "Ашан",
    namesize: 60,
    desc: "Гипермаркет.",
    category: "mag",
    link: "/ru/shops/ashan",
    zoom: 1.2,
    // Индивидуальные цвета (все опциональны)
    originalFill: "rgba(50, 153, 64, 0.7)",
    hoverFill: "rgba(50, 153, 64, 0.9)",
    filterFill: "rgba(50, 153, 64, 1)",
    // Цвет текста названия (опционально)
    textColor: "#ffffff", // белый текст на зеленом фоне
    // Цвет фона текста (опционально)
    // textBgColor: "rgba(0, 0, 0, 0.7)",
  },
  mag_moscowloh: {
    name: "Московские баранки",
    namesize: 10,
    desc: "Хлебобулочные изделия.",
    category: "mag",
    link: "/ru/shops/moscowloh",
    zoom: 1.5,
  },
  mag_tobacconist: {
    name: "Tobacconist",
    namesize: 10,
    desc: "Табачные изделия.",
    category: "mag",
    link: "/ru/shops/tobacconist",
    zoom: 1.5,
  },
  mag_zolotoysoblazn: {
    name: "Золотой соблазн",
    namesize: 11,
    desc: "Ювелирный магазин.",
    category: "mag",
    link: "/ru/shops/zolotoysoblazn",
    zoom: 1.5,
  },
  mag_luxurystore: {
    name: "Luxury Store",
    namesize: 12,
    desc: "Магазин люксовых товаров.",
    category: "mag",
    link: "/ru/shops/luxurystore",
    zoom: 1.5,
  },
  mag_chainka: {
    name: "Чайнка",
    namesize: 12,
    desc: "Чай и кофе.",
    category: "mag",
    link: "/ru/shops/chainka",
    zoom: 1.5,
  },
  mag_4podarka: {
    name: "4 подарка",
    namesize: 12,
    desc: "Подарки и сувениры.",
    category: "mag",
    link: "/ru/shops/4podarka",
    zoom: 1.5,
  },
  mag_hlebnydvorik: {
    name: "Хлебный дворик",
    namesize: 11,
    desc: "Хлебобулочные изделия.",
    category: "mag",
    link: "/ru/shops/hlebnydvorik",
    zoom: 1.5,
  },
  mag_karnelia: {
    name: "Карнелия",
    namesize: 12,
    desc: "Магазин украшений.",
    category: "mag",
    link: "/ru/shops/karnelia",
    zoom: 1.5,
  },
  mag_dns: {
    name: "DNS",
    namesize: 18,
    desc: "Цифровая техника.",
    category: "mag",
    link: "/ru/shops/dns",
    zoom: 1.5,
  },
  mag_zolotti: {
    name: "Золотти",
    namesize: 12,
    desc: "Ювелирный магазин.",
    category: "mag",
    link: "/ru/shops/zolotti",
    zoom: 1.5,
  },
  mag_lero: {
    name: "Леро",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/lero",
    zoom: 1.5,
  },
  mag_ambrex: {
    name: "Ambrex",
    namesize: 12,
    desc: "Парфюмерия.",
    category: "mag",
    link: "/ru/shops/ambrex",
    zoom: 1.5,
  },
  mag_iqos: {
    name: "IQOS",
    namesize: 14,
    desc: "Электронные сигареты.",
    category: "mag",
    link: "/ru/shops/iqos",
    zoom: 1.5,
  },
  mag_lemoor: {
    name: "Lemoor",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/lemoor",
    zoom: 1.5,
  },
  mag_lauf: {
    name: "Lauf",
    namesize: 14,
    desc: "Магазин обуви.",
    category: "mag",
    link: "/ru/shops/lauf",
    zoom: 1.5,
  },
  mag_baden: {
    name: "Baden",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/baden",
    zoom: 1.5,
  },
  mag_makfine: {
    name: "Makfine",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/makfine",
    zoom: 1.5,
  },
  mag_vensi: {
    name: "Vensi",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/vensi",
    zoom: 1.5,
  },
  mag_textyleshop: {
    name: "Textile Shop",
    namesize: 12,
    desc: "Текстиль и домашний декор.",
    category: "mag",
    link: "/ru/shops/textyleshop",
    zoom: 1.5,
  },
  mag_kari: {
    name: "Кари",
    namesize: 18,
    desc: "Магазин обуви.",
    category: "mag",
    link: "/ru/shops/kari",
    zoom: 1.5,
  },
  mag_tabak: {
    name: "Табак",
    namesize: 14,
    desc: "Табачные изделия.",
    category: "mag",
    link: "/ru/shops/tabak",
    zoom: 1.5,
  },
  mag_officemag: {
    name: "OfficeMag",
    namesize: 12,
    desc: "Канцелярские товары.",
    category: "mag",
    link: "/ru/shops/officemag",
    zoom: 1.5,
  },
  mag_milavitsa: {
    name: "Милавица",
    namesize: 14,
    desc: "Женское бельё.",
    category: "mag",
    link: "/ru/shops/milavitsa",
    zoom: 1.5,
  },
  mag_modnayatochka: {
    name: "Модная точка",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/modnayatochka",
    zoom: 1.5,
  },
  mag_fitnessformula: {
    name: "Fitness Formula",
    namesize: 12,
    desc: "Спортивное питание и одежда.",
    category: "mag",
    link: "/ru/shops/fitnessformula",
    zoom: 1.5,
  },
  mag_letuale: {
    name: "Летуаль",
    namesize: 14,
    desc: "Парфюмерия и косметика.",
    category: "mag",
    link: "/ru/shops/letuale",
    zoom: 1.5,
  },
  mag_tvoe: {
    name: "Твоё",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/tvoe",
    zoom: 1.5,
  },
  mag_lenta: {
    name: "Лента",
    namesize: 60,
    desc: "Гипермаркет.",
    category: "mag",
    link: "/ru/shops/lenta",
    zoom: 1.2,
    // Индивидуальные цвета (все опциональны)
    originalFill: "#0ec514", // свой оригинальный цвет
    hoverFill: "#0ec514", // свой цвет при наведении
    filterFill: "#0ec514", // свой цвет при фильтрации
    textColor: "#ffffff",
  },
  mag_acoola: {
    name: "Акула",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/acoola",
    zoom: 1.5,
  },
  mag_fresh: {
    name: "Fresh",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/fresh",
    zoom: 1.5,
  },
  mag_berloga: {
    name: "Берлога",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/berloga",
    zoom: 1.5,
  },
  mag_koreyanka: {
    name: "Кореянка",
    namesize: 12,
    desc: "Корейская косметика.",
    category: "mag",
    link: "/ru/shops/koreyanka",
    zoom: 1.5,
  },
  mag_lone: {
    name: "Lone",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/lone",
    zoom: 1.5,
  },
  mag_loyeshop: {
    name: "Loye Shop",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/loyeshop",
    zoom: 1.5,
  },
  mag_sportmaster: {
    name: "Спортмастер",
    namesize: 14,
    desc: "Спортивные товары.",
    category: "mag",
    link: "/ru/shops/sportmaster",
    zoom: 1.5,
  },
  mag_bretelka: {
    name: "Бретелка",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/bretelka",
    zoom: 1.5,
  },
  mag_moko: {
    name: "Moko",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/moko",
    zoom: 1.5,
  },
  mag_ostin: {
    name: "Ostin",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/ostin",
    zoom: 1.5,
  },
  mag_jarastu: {
    name: "Jarastu",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/jarastu",
    zoom: 1.5,
  },
  mag_jarastu2: {
    name: "Jarastu",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/jarastu",
    zoom: 1.5,
  },
  mag_novijvzglad: {
    name: "Новый взгляд",
    namesize: 12,
    desc: "Оптика.",
    category: "mag",
    link: "/ru/shops/novijvzglad",
    zoom: 1.5,
  },
  mag_plintushall: {
    name: "Плинтусхолл",
    namesize: 11,
    desc: "Строительные материалы.",
    category: "mag",
    link: "/ru/shops/plintushall",
    zoom: 1.5,
  },
  mag_apelsinchik: {
    name: "Апельсинчик",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/apelsinchik",
    zoom: 1.5,
  },
  mag_apelsinchikobuv: {
    name: "Апельсинчик",
    namesize: 12,
    desc: "Магазин обуви.",
    category: "mag",
    link: "/ru/shops/apelsinchikobuv",
    zoom: 1.5,
  },
  mag_myseason: {
    name: "My Season",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/myseason",
    zoom: 1.5,
  },
  mag_podruzhka: {
    name: "Подружка",
    namesize: 14,
    desc: "Косметика и аксессуары.",
    category: "mag",
    link: "/ru/shops/podruzhka",
    zoom: 1.5,
  },
  mag_serge: {
    name: "Serge",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/serge",
    zoom: 1.5,
  },
  mag_ptrv: {
    name: "PTRV",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/ptrv",
    zoom: 1.5,
  },
  mag_astore: {
    name: "AStore",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/astore",
    zoom: 1.5,
  },
  mag_perfumer: {
    name: "Perfumer",
    namesize: 12,
    desc: "Парфюмерия.",
    category: "mag",
    link: "/ru/shops/perfumer",
    zoom: 1.5,
  },
  mag_eyfel: {
    name: "Эйфель",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/eyfel",
    zoom: 1.5,
  },
  mag_symfonykrasoty: {
    name: "Симфония красоты",
    namesize: 11,
    desc: "Косметика и парфюмерия.",
    category: "mag",
    link: "/ru/shops/symfonykrasoty",
    zoom: 1.5,
  },
  mag_mtc: {
    name: "МТС",
    namesize: 18,
    desc: "Салон связи.",
    category: "mag",
    link: "/ru/shops/mtc",
    zoom: 1.5,
  },
  mag_yablonka: {
    name: "Яблонька",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/yablonka",
    zoom: 1.5,
  },
  mag_yablonka2: {
    name: "Яблонька",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/yablonka",
    zoom: 1.5,
  },
  mag_glorya: {
    name: "Glorya Jeans",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/glorya",
    zoom: 1.5,
  },
  mag_fishkafish: {
    name: "Fishka Fish",
    namesize: 11,
    desc: "Рыбный магазин.",
    category: "mag",
    link: "/ru/shops/fishkafish",
    zoom: 1.5,
  },
  mag_pinacolada: {
    name: "Pina Colada",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/pinacolada",
    zoom: 1.5,
  },
  mag_purpur: {
    name: "Purpur",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/purpur",
    zoom: 1.5,
  },
  mag_ortos: {
    name: "Ортос",
    namesize: 14,
    desc: "Ортопедические товары.",
    category: "mag",
    link: "/ru/shops/ortos",
    zoom: 1.5,
  },
  mag_mvideo: {
    name: "М.Видео",
    namesize: 16,
    desc: "Цифровая и бытовая техника.",
    category: "mag",
    link: "/ru/shops/mvideo",
    zoom: 1.5,
  },
  mag_bogatto: {
    name: "Bogatto",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/bogatto",
    zoom: 1.5,
  },
  mag_oodji: {
    name: "Oodji",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/oodji",
    zoom: 1.5,
  },
  mag_zolla: {
    name: "Zolla",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/zolla",
    zoom: 1.5,
  },
  mag_ivroshe: {
    name: "Ив Роше",
    namesize: 14,
    desc: "Косметика и уход.",
    category: "mag",
    link: "/ru/shops/ivroshe",
    zoom: 1.5,
  },
  mag_orient: {
    name: "Orient",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/orient",
    zoom: 1.5,
  },
  mag_mirch: {
    name: "Mirch",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/mirch",
    zoom: 1.5,
  },
  mag_casio: {
    name: "Casio",
    namesize: 16,
    desc: "Часы и калькуляторы.",
    category: "mag",
    link: "/ru/shops/casio",
    zoom: 1.5,
  },
  mag_donedevaro: {
    name: "Done De Varo",
    namesize: 11,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/donedevaro",
    zoom: 1.5,
  },
  mag_donedevaro2: {
    name: "Done De Varo",
    namesize: 11,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/donedevaro",
    zoom: 1.5,
  },
  mag_pedant: {
    name: "Pedant",
    namesize: 14,
    desc: "Ювелирный магазин.",
    category: "mag",
    link: "/ru/shops/pedant",
    zoom: 1.5,
  },
  mag_ogawa: {
    name: "Ogawa",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/ogawa",
    zoom: 1.5,
  },
  mag_shaplandia: {
    name: "Shaplandia",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/shaplandia",
    zoom: 1.5,
  },
  mag_colorme: {
    name: "Color Me",
    namesize: 14,
    desc: "Косметика.",
    category: "mag",
    link: "/ru/shops/colorme",
    zoom: 1.5,
  },
  mag_milazlata: {
    name: "Мила Злата",
    namesize: 12,
    desc: "Ювелирный магазин.",
    category: "mag",
    link: "/ru/shops/milazlata",
    zoom: 1.5,
  },
  mag_belvest: {
    name: "Belvest",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/belvest",
    zoom: 1.5,
  },
  mag_imperiasumok: {
    name: "Империя сумок",
    namesize: 12,
    desc: "Магазин сумок и аксессуаров.",
    category: "mag",
    link: "/ru/shops/imperiasumok",
    zoom: 1.5,
  },
  mag_brosko: {
    name: "Броско",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/brosko",
    zoom: 1.5,
  },
  mag_businessline: {
    name: "Business Line",
    namesize: 12,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/businessline",
    zoom: 1.5,
  },
  mag_momento: {
    name: "Momento",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/momento",
    zoom: 1.5,
  },
  mag_afrodita: {
    name: "Афродита",
    namesize: 12,
    desc: "Магазин косметики и парфюмерии.",
    category: "mag",
    link: "/ru/shops/afrodita",
    zoom: 1.8,
  },
  mag_rafam: {
    name: "Rafam",
    namesize: 14,
    desc: "Магазин одежды.",
    category: "mag",
    link: "/ru/shops/rafam",
    zoom: 1.5,
  },
  mag_secondhand: {
    name: "Second Hand",
    namesize: 14,
    desc: "Магазин одежды из Европы.",
    category: "mag",
    link: "/ru/shops/secondhand",
    zoom: 1.8,
  },
  mag_domashny: {
    name: "Домашний",
    namesize: 12,
    desc: "Товары для дома.",
    category: "mag",
    link: "/ru/shops/domashny",
    zoom: 1.5,
  },

  // ========== РЕСТОРАНЫ И КАФЕ ==========
  rest_juju: {
    name: "Juju",
    namesize: 16,
    desc: "Ресторан.",
    category: "rest",
    link: "/ru/restaurants/juju",
    zoom: 1.8,
  },
  rest_cofeeshokolad: {
    name: "Кофе и шоколад",
    namesize: 12,
    desc: "Кафе.",
    category: "rest",
    link: "/ru/restaurants/cofeeshokolad",
    zoom: 1.5,
  },
  rest_marmelad: {
    name: "Мармелад",
    namesize: 14,
    desc: "Кафе.",
    category: "rest",
    link: "/ru/restaurants/marmelad",
    zoom: 1.8,
  },
  rest_coffee: {
    name: "Coffee",
    namesize: 14,
    desc: "Кофейня.",
    category: "rest",
    link: "/ru/restaurants/coffee",
    zoom: 1.8,
  },
  rest_phobo: {
    name: "Phobo",
    namesize: 16,
    desc: "Ресторан.",
    category: "rest",
    link: "/ru/restaurants/phobo",
    zoom: 1.8,
  },
  rest_adana: {
    name: "Adana",
    namesize: 16,
    desc: "Турецкая кухня.",
    category: "rest",
    link: "/ru/restaurants/adana",
    zoom: 1.8,
  },
  rest_cactus: {
    name: "Кактус",
    namesize: 14,
    desc: "Ресторан.",
    category: "rest",
    link: "/ru/restaurants/cactus",
    zoom: 1.8,
  },
  rest_blinnaya: {
    name: "Блинная",
    namesize: 14,
    desc: "Блинная.",
    category: "rest",
    link: "/ru/restaurants/blinnaya",
    zoom: 1.8,
  },
  rest_shashlykdvorik: {
    name: "Шашлык дворик",
    namesize: 11,
    desc: "Шашлычная.",
    category: "rest",
    link: "/ru/restaurants/shashlykdvorik",
    zoom: 1.8,
  },
  rest_miapizza: {
    name: "Mia Pizza",
    namesize: 14,
    desc: "Пиццерия.",
    category: "rest",
    link: "/ru/restaurants/miapizza",
    zoom: 1.8,
  },
  rest_vkusnoitochka: {
    name: "Вкусно и точка",
    namesize: 12,
    desc: "Фастфуд.",
    category: "rest",
    link: "/ru/restaurants/vkusnoitochka",
    zoom: 1.8,
  },
  rest_rostics: {
    name: "Ростик's",
    namesize: 14,
    desc: "Фастфуд.",
    category: "rest",
    link: "/ru/restaurants/rostics",
    zoom: 1.8,
  },
  rest_vkustydomik: {
    name: "Вкусы домик",
    namesize: 11,
    desc: "Кафе.",
    category: "rest",
    link: "/ru/restaurants/vkustydomik",
    zoom: 1.5,
  },

  // ========== УСЛУГИ И ОФИСЫ ==========
  serv_coraltravel: {
    name: "Coral Travel",
    namesize: 12,
    desc: "Туристическое агентство.",
    category: "serv",
    link: "/ru/services/coraltravel",
    zoom: 1.8,
  },
  serv_lego: {
    name: "Lego",
    namesize: 12,
    desc: "Детский центр.",
    category: "serv",
    link: "/ru/services/lego",
    zoom: 1.8,
  },
  serv_otrovsharov: {
    name: "Остров шаров",
    namesize: 12,
    desc: "Праздничное оформление.",
    category: "serv",
    link: "/ru/services/otrovsharov",
    zoom: 1.8,
  },
  serv_8dkino: {
    name: "8D кино",
    namesize: 14,
    desc: "Кинотеатр.",
    category: "serv",
    link: "/ru/services/8dkino",
    zoom: 1.8,
  },
  serv_mamaboss: {
    name: "Mama Boss",
    namesize: 14,
    desc: "Детский центр.",
    category: "serv",
    link: "/ru/services/mamaboss",
    zoom: 1.8,
  },
  serv_fotoburo: {
    name: "Фотобюро",
    namesize: 14,
    desc: "Фотоуслуги.",
    category: "serv",
    link: "/ru/services/fotoburo",
    zoom: 1.5,
  },
  serv_centrjuvelir: {
    name: "Центр ювелир",
    namesize: 12,
    desc: "Ремонт ювелирных изделий.",
    category: "serv",
    link: "/ru/services/centrjuvelir",
    zoom: 1.5,
  },
  serv_horoshayasvyaz: {
    name: "Хорошая связь",
    namesize: 11,
    desc: "Ремонт телефонов.",
    category: "serv",
    link: "/ru/services/horoshayasvyaz",
    zoom: 1.5,
  },
  serv_tele2: {
    name: "Tele2",
    namesize: 16,
    desc: "Салон связи.",
    category: "serv",
    link: "/ru/services/tele2",
    zoom: 1.5,
  },
  serv_yota: {
    name: "Yota",
    namesize: 16,
    desc: "Салон связи.",
    category: "serv",
    link: "/ru/services/yota",
    zoom: 1.5,
  },
  serv_sogaz: {
    name: "Согаз",
    namesize: 16,
    desc: "Страховая компания.",
    category: "serv",
    link: "/ru/services/sogaz",
    zoom: 1.5,
  },
  serv_bankomats: {
    name: "Банкоматы",
    namesize: 12,
    desc: "Банкоматы.",
    category: "serv",
    link: "/ru/services/bankomats",
    zoom: 1.5,
  },
  serv_sber: {
    name: "Сбербанк",
    namesize: 16,
    desc: "Банк.",
    category: "serv",
    link: "/ru/services/sber",
    zoom: 1.5,
  },
  serv_rosselhozbank: {
    name: "Россельхозбанк",
    namesize: 12,
    desc: "Банк.",
    category: "serv",
    link: "/ru/services/rosselhozbank",
    zoom: 1.5,
  },
  serv_bankavangard: {
    name: "Банк Авангард",
    namesize: 12,
    desc: "Банк.",
    category: "serv",
    link: "/ru/services/bankavangard",
    zoom: 1.5,
  },
  serv_beeline: {
    name: "Билайн",
    namesize: 16,
    desc: "Салон связи.",
    category: "serv",
    link: "/ru/services/beeline",
    zoom: 1.5,
  },
  serv_megafon: {
    name: "Мегафон",
    namesize: 16,
    desc: "Салон связи.",
    category: "serv",
    link: "/ru/services/megafon",
    zoom: 1.5,
  },
  serv_mts2: {
    name: "МТС",
    namesize: 16,
    desc: "Салон связи.",
    category: "serv",
    link: "/ru/services/mts",
    zoom: 1.5,
  },
  serv_viking: {
    name: "Викинг",
    namesize: 16,
    desc: "Спортивный клуб.",
    category: "serv",
    link: "/ru/services/viking",
    zoom: 1.5,
  },
  serv_fightclub: {
    name: "Fight Club",
    namesize: 14,
    desc: "Спортивный клуб.",
    category: "serv",
    link: "/ru/services/fightclub",
    zoom: 1.5,
  },
  serv_dnaceacademy: {
    name: "Dance Academy",
    namesize: 12,
    desc: "Танцевальная школа.",
    category: "serv",
    link: "/ru/services/dnaceacademy",
    zoom: 1.5,
  },
  serv_poligonarean: {
    name: "Полигон Ариан",
    namesize: 11,
    desc: "Страйкбол/пейнтбол.",
    category: "serv",
    link: "/ru/services/poligonarean",
    zoom: 1.5,
  },
  serv_mfc: {
    name: "МФЦ",
    namesize: 18,
    desc: "Многофункциональный центр услуг.",
    category: "serv",
    link: "/ru/services/mfc",
    zoom: 1.5,
  },
  serv_burouslug: {
    name: "Бюро услуг",
    namesize: 12,
    desc: "Услуги населению.",
    category: "serv",
    link: "/ru/services/burouslug",
    zoom: 1.5,
  },
  serv_avtoshkola: {
    name: "Автошкола",
    namesize: 12,
    desc: "Обучение вождению.",
    category: "serv",
    link: "/ru/services/avtoshkola",
    zoom: 1.8,
  },
  serv_maksyuta: {
    name: "Максюта",
    namesize: 14,
    desc: "Стоматология.",
    category: "serv",
    link: "/ru/services/maksyuta",
    zoom: 1.5,
  },
};

// main.js
document.addEventListener("DOMContentLoaded", function () {
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
    if (shopInfo && shopInfo.hoverFill) {
      return shopInfo.hoverFill;
    }
    return categoryStyle[category]?.hoverFill || "#f5f5f5";
  }

  // Получает цвет при фильтрации для магазина
  function getFilterFillForShop(shopId, category) {
    const shopInfo = shopData[shopId];
    if (shopInfo && shopInfo.filterFill) {
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

      // Пропускаем статичные элементы и элементы без данных
      if (isStaticElement(shop) || !shopInfo) return;

      const shopCategoryAttr = shop.getAttribute("data-category");
      const firstCategory = getFirstCategory(shopCategoryAttr);
      const shapes = getAllShapes(shop);

      // Получаем все цвета из данных магазина или категории
      const originalColor = getOriginalFillForShop(shopId, firstCategory);
      const hoverColor = getHoverFillForShop(shopId, firstCategory);
      const filterColor = getFilterFillForShop(shopId, firstCategory);
      const highlightColor = getHighlightFillForShop(shopId, firstCategory);

      // Сохраняем цвета в атрибуты группы для быстрого доступа
      shop.setAttribute("data-original-color", originalColor);
      shop.setAttribute("data-hover-color", hoverColor);
      shop.setAttribute("data-filter-color", filterColor);
      shop.setAttribute("data-highlight-color", highlightColor);

      // Принудительно устанавливаем оригинальный цвет всем элементам
      shapes.forEach(shape => {
        // Удаляем атрибут fill, чтобы он не мешал
        if (shape.hasAttribute("fill")) {
          shape.removeAttribute("fill");
        }
        // Устанавливаем цвет через style
        shape.style.fill = originalColor;
        shape.setAttribute("data-original-fill", originalColor);
      });

      console.log(
        `✓ Цвета установлены для ${shopId}: original=${originalColor}, hover=${hoverColor}, filter=${filterColor}`,
      );
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
      const isStatic = isStaticElement(shop);

      // Статичные элементы не меняются
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
      const texts = shop.querySelectorAll("text");
      const isMatching = matchesCategory(shopCategoryAttr, category);

      // Получаем цвета из атрибутов группы
      const originalColor = shop.getAttribute("data-original-color");
      const filterColor = shop.getAttribute("data-filter-color");
      const highlightColor = shop.getAttribute("data-highlight-color");

      // Получаем информацию о цвете текста из данных магазина
      const shopInfo = shopData[shopId];
      const textColor = shopInfo?.textColor || "#164680";
      const textBgColor = shopInfo?.textBgColor || null;

      if (category === "all") {
        shapes.forEach(shape => {
          if (shop.id === highlightedShopId) {
            shape.style.fill = highlightColor;
          } else {
            shape.style.fill = originalColor;
          }
        });
        texts.forEach(text => {
          text.style.opacity = "1";
          text.style.fill = textColor; // Применяем цвет текста
          text.style.visibility = "visible";
        });
        shop.style.opacity = "1";
        shop.style.filter = "none";
      } else if (isMatching) {
        shapes.forEach(shape => {
          shape.style.fill = filterColor;
        });
        texts.forEach(text => {
          text.style.opacity = "1";
          text.style.fill = textColor; // Применяем цвет текста
          text.style.visibility = "visible";
        });
        shop.style.opacity = "1";
        shop.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.2))";
      } else {
        shapes.forEach(shape => {
          shape.style.fill = originalColor;
        });
        texts.forEach(text => {
          text.style.opacity = "0.4";
          text.style.fill = textColor; // Сохраняем цвет текста, но делаем полупрозрачным
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

      // Получаем цвет текста из данных магазина или используем стандартный
      const textColor = shopInfo.textColor || "#164680";
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

      // Если задано смещение текста
      if (shopInfo.textOffsetY) {
        centerY += shopInfo.textOffsetY;
      }

      const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      textGroup.setAttribute("class", "shop-label");
      textGroup.setAttribute("data-shop-id", shopId);

      const textWidth = shopName.length * (shopNameSize * 0.6);
      const textHeight = shopNameSize;

      // Создаем фон для текста (если указан цвет фона)
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
        // Стандартный фон
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

      // Создаём сам текст
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

      // Добавляем текст в группу
      textGroup.appendChild(text);
      labelsLayer.appendChild(textGroup);

      // Для отладки
      if (shopInfo.textColor) {
        console.log(`Для ${shopId} установлен цвет текста: ${textColor}`);
      }
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

      // Обработчик mouseenter - используем цвет из атрибута группы
      shop.addEventListener("mouseenter", () => {
        const shopCategoryAttr = shop.getAttribute("data-category");
        const isInactive = currentFilter !== "all" && !matchesCategory(shopCategoryAttr, currentFilter);
        if (isInactive) return;

        const shapes = getAllShapes(shop);
        const hoverColor = shop.getAttribute("data-hover-color");

        shapes.forEach(shape => {
          shape.style.fill = hoverColor;
        });
      });

      // Обработчик mouseleave - восстанавливаем цвет из атрибута группы
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
    forceSetOriginalColors(); // ПРИНУДИТЕЛЬНАЯ УСТАНОВКА ЦВЕТОВ
    initPanZoom();
    addSVGLabels();
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
