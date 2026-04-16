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

const categoryStyle = {
  mag: {
    name: "Магазины",
    originalFill: "#FCF2EB",
    hoverFill: "#ffc49b",
    filterFill: "#ffc49b",
  },
  serv: {
    name: "Услуги",
    originalFill: "#FCF2EB",
    hoverFill: "#ffc49b",
    filterFill: "#ffc49b",
  },
  rest: {
    name: "Рестораны и кафе",
    originalFill: "#FCF2EB",
    hoverFill: "#ffc49b",
    filterFill: "#ffc49b",
  },
  floor3: {
    name: "3 этаж",
    originalFill: "#FCF2EB",
    hoverFill: "#ffc49b",
    filterFill: "#ffc49b",
  },
  baz: {
    name: "Оранжевый базар",
    originalFill: "#FCF2EB",
    hoverFill: "#ffc49b",
    filterFill: "#ffc49b",
  },
  pav: {
    name: "Оранжевый павильон",
    originalFill: "#FCF2EB",
    hoverFill: "#ffc49b",
    filterFill: "#ffc49b",
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
  baden: {
    name: "Baden",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/baden.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_05_08/baden%20180%20140.jpg",
    textOffsetY: 5,
  },
  yablonka: {
    name: "Яблонька",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/yablonka.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/09.17/180-yabl.jpg",
    textOffsetY: 5,
  },
  bankavangard: {
    name: "Банк «Авангард»",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/bank-avangard.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/avan_logo.jpg",
    textOffsetY: 5,
  },
  mjasbery: {
    name: "МясБерри",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/myasberri.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/06-2014/2020-11-18_15-54-06.Nuqgd.png",
    textOffsetY: 5,
  },
  ashan: {
    name: "Ашан",
    namesize: 60,
    desc: "",
    category: "mag",
    link: "shops/ashan.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/pic.jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Химчистка «Карнелия»",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/himchistka-karneliya.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/logo(4).png",
    textOffsetY: 5,
  },
  cvetopt24: {
    name: "ЦветОпт24",
    namesize: 14,
    desc: "",
    category: "pav",
    link: "orange-pavilion/cvetopt24.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B4%D0%B5%D0%BA%D0%B0%D0%B1%D1%80%D1%8C/pic-(1)(1).jpg",
    textOffsetY: 5,
  },
  cofeeshokolad: {
    name: "Кофе и Шоколад",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/kofe-i-shokolad.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/resize-image-online.com_1737705708_logo-kis-cernyi-fon-_NfGfiKun.jpg",
    textOffsetY: 5,
  },
  dombyta: {
    name: "Дом Быта",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/dom-bita.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B4%D0%B5%D0%BA%D0%B0%D0%B1%D1%80%D1%8C/%D0%B4%D0%BE%D0%BC.jpg",
    textOffsetY: 5,
  },
  korvetavto: {
    name: "Korvetavto",
    namesize: 14,
    desc: "",
    category: "pav",
    link: "orange-pavilion/korvetavto.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/01.17/png_black.tAfmF.png",
    textOffsetY: 5,
  },
  moko: {
    name: "Шоурум МОКО",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/shourum-moko.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/2026-02-04_14-18-27%20-%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20(1).png",
    textOffsetY: 5,
  },
  vkusnoitochka: {
    name: "Вкусно - и точка",
    namesize: 20,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/vkusno-i-tochka.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/jrnz%2Chm/image-18-08-22-03-37.swVlp.png",
    textOffsetY: 5,
  },
  apelsinchik: {
    name: "Апельсинчики",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/apelsinchiki.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_09_12/image%D1%83634645645645.jpg",
    textOffsetY: 5,
  },
  reloud: {
    name: "Re.Loud",
    namesize: 14,
    desc: "",
    category: "pav",
    link: "orange-pavilion/magazin-avtozvuka-i-shumoizolyacii-re.loud.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%B2%D0%B3%D1%83%D1%81%D1%82/resize-image-online.com_1723541897_reloud11-rqzmfafu_c7fpyi4s.png",
    textOffsetY: 5,
  },
  dnaceacademy: {
    name: "Академия Танца и Музыки ",
    namesize: 25,
    desc: "",
    category: "floor3",
    link: "floor-3/akademiya-tanca.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/09.17/%D0%BB%D0%BE%D0%B3%D0%BE_%D1%81_%D0%BF%D0%BE%D0%B4%D0%BF%D0%B8%D1%81%D1%8C%D1%8E-01.fFKYe.png",
    textOffsetY: 5,
  },
  mvideo: {
    name: "М.Видео",
    namesize: 50,
    desc: "",
    category: "mag",
    link: "shops/m.video.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B8%D1%8E%D0%BB%D1%8C/2022-03-23_13-07-21.BjGG6.png",
    textOffsetY: 5,
  },
  xxx: {
    name: "Центр Фото",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/centrfoto.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/jrnz%2Chm/1.jpg",
    textOffsetY: 5,
  },
  miapizza: {
    name: "Mia Pizza",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/pizza-mia.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D1%8F%D0%BD%D0%B2%D0%B0%D1%80%D1%8C/%D0%9B%D0%9E%D0%93%D0%9E%D0%A2%D0%98%D0%9F-%D0%BC%D0%B8%D0%B0.jpg",
    textOffsetY: 5,
  },
  lenta: {
    name: "Дом Лента",
    namesize: 60,
    desc: "",
    category: "mag",
    link: "shops/dom-lenta-ranee-obi.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF%20%D1%80%D1%8B%D0%B6%D0%B8%D0%B9.png",
    textOffsetY: 5,
  },
  shashlykdvorik: {
    name: "Шашлычный Дворик",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/shashlychnyj-dvorik.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D1%8F%D0%BD%D0%B2%D0%B0%D1%80%D1%8C/%D0%A8%D0%94---%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF.jpg",
    textOffsetY: 5,
  },
  afrodita: {
    name: "Афродита Интим",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/afrodita-intim.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/55.jpg",
    textOffsetY: -10,
  },
  sushivesla: {
    name: "СушиВёсла",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/sushivesla.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D0%BC%D0%B0%D0%B9/logosvrgb.X2RMg.png",
    textOffsetY: 5,
  },
  lauf: {
    name: "LAUF!",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/lauf.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D0%BC%D0%B0%D0%B9/LAUF_LOGO_blue%20(1).png",
    textOffsetY: 5,
  },
  ivroshe: {
    name: "Ив Роше",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/iv-roshe.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B4%D0%B5%D0%BA%D0%B0%D0%B1%D1%80%D1%8C/Logo-France-vert.jpg",
    textOffsetY: 5,
  },
  kino8d: {
    name: "8D кинотеатр",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/8d-kinoteatr.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/03.17/pic-(1).jpg",
    textOffsetY: 10,
  },
  sber: {
    name: "Сбербанк",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/sberbank.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/sberbank_logo.jpg",
    textOffsetY: 5,
  },
  makfine: {
    name: "MakFine",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/makfine.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_05_08/image546465.jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Мясо с мясом",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/myaso-s-myasom.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%BC%D0%B0%D0%B9/%D0%9C%D0%A1%D0%9C-%D0%B3%D0%BE%D1%80%D0%B8%D0%B7%D0%BE%D0%BD%D1%82%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9-%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF-%D1%81-%D0%B3%D1%80%D0%B0%D0%B4%D0%B8%D0%B5%D0%BD%D1%82%D0%B0%D0%BC%D0%B8.jpg",
    textOffsetY: 5,
  },
  juju: {
    name: "ЖуЖу",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/juju.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/05.17/pic-(2)(2).jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Банк Открытие",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/bank-open.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/jrnz%2Chm/%D0%B0%D0%B3%D0%B0.jpg",
    textOffsetY: 5,
  },
  phobo: {
    name: "PhoBo Ханой ",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/phobo-hanoj.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/Pho-Bo_%D0%A5%D0%B0%D0%BD%D0%BE%D0%B9_Logo%20(1).jpg",
    textOffsetY: 5,
  },
  tobacconist: {
    name: "Tobacconist",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/tobacconist.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2018_05_07/Tobacconist-180.png",
    textOffsetY: 5,
  },
  pinacolada: {
    name: "Пинаколада",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/pinacolada.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/resize-image-online.com_1727939703_image-02-10-24-10-32_M0Mm7NZU.jpg",
    textOffsetY: 5,
  },
  adana: {
    name: "АданаКебаб",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/adanakebab.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D0%BC%D0%B0%D0%B9/resize-image-online.com_20240131110322png_qfhsevjs.png",
    textOffsetY: 5,
  },
  rosselhozbank: {
    name: "Россельхозбанк",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/rosselhosbank.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/pic(3).jpg",
    textOffsetY: -10,
  },
  mfc: {
    name: 'МФЦ "Мои документы"',
    namesize: 25,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/mfc-moi-dokumenty.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D0%BC%D0%B0%D0%B9/logo.png",
    textOffsetY: 5,
  },
  beeline: {
    name: "Билайн",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/bilajn.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/big/resize-image-online.com_1695884274_20230928105652png_P2REeR06.png",
    textOffsetY: -5,
  },
  rostics: {
    name: "Rostic's  Авто",
    namesize: 30,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/rostics.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/jrnz%2Chm/resize-image-online.com_1699435817_20231108132414png_NUg8hYau.png",
    textOffsetY: 5,
  },
  neprospi: {
    name: "Непроспи",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/neprospi.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/09.16/%D0%BE%D0%BD.jpg",
    textOffsetY: 5,
  },
  cactus: {
    name: "Кактус",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/kaktus.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/small/imgonline-com-ua-Resize-vOVvmlyq6R.jpg",
    textOffsetY: 5,
  },
  burouslug: {
    name: "Бюро услуг",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/byuro-uslug.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/09.16/%D0%91%D1%8E%D1%80%D0%BE-%D1%83%D1%81%D0%BB%D1%83%D0%B3-4.jpg",
    textOffsetY: 5,
  },
  milazlata: {
    name: "Mila Zlata",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/mila-zlata.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BF%D1%80%D0%B5%D0%BB%D1%8C/%D0%BB%D0%BE%D0%B3%D0%BE_%D0%BD%D0%B0_%D1%81%D0%B0%D0%B9%D1%82_%D0%BE%D1%80%D0%B0%D0%BD%D0%B6%D0%B5%D0%B2%D1%8B%D0%B9.D4tbA.jpg",
    textOffsetY: 5,
  },
  sogaz: {
    name: "Согаз-Мед",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/obyazatelnoe-medicinskoe-strahovanie-sogaz-med.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BF%D1%80%D0%B5%D0%BB%D1%8C/resize-image-online.com_1721903376_%D0%9B%D0%BE%D0%B3%D0%BE%D0%A1%D0%9E%D0%93%D0%90%D0%97%D0%9E%D0%9C%D0%A13%D0%9C%D0%BE%D0%BD%D1%82%D0%B0%D0%B6%D0%BD_j1u0Su4V.jpg",
    textOffsetY: 5,
  },
  zolotti: {
    name: "Zolotti",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/zolotti.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/03.17/ramdisk-crop_168358928_ndMbxXc.jpg",
    textOffsetY: 5,
  },
  tele2: {
    name: "Теле2 ",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/tele-2.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B8%D1%8E%D0%BD%D1%8C/515a905cc6609-e1427106746182(1).jpeg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Росбанк",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/rosbank.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B8%D1%8E%D0%BD%D1%8C/11.jpg",
    textOffsetY: 5,
  },
  imperiasumok: {
    name: "Империя сумок",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/imperiya-sumok.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/imperiya_logo.jpg",
    textOffsetY: 5,
  },
  odjuvy: {
    name: "O'juvi ",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/ojuvi.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/logo.png",
    textOffsetY: 5,
  },
  blinnaya: {
    name: "Блинная",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/blinberi.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/small/resize-image-online.com_1701673133_cedab123547b458c91f5_6cenHZin.jpg",
    textOffsetY: 5,
  },
  kari: {
    name: "Каri",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/kari.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_09_12/%D0%BB%D0%BE%D0%B3%D0%BE%20%D0%BA%D0%B0%D1%80%D0%B8%20180%20140.jpg",
    textOffsetY: 5,
  },
  secondhand: {
    name: "Планета Секонд Хенд",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/planeta-sekond-hend.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/01.17/pic-(4).jpg",
    textOffsetY: 5,
  },
  behappy: {
    name: "Кофе рядом",
    namesize: 14,
    desc: "",
    category: "rest",
    link: "restorany-i-kafe/kofe-ryadom.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B4%D0%B5%D0%BA%D0%B0%D0%B1%D1%80%D1%8C/_5354963794888693093_121.jpg",
    textOffsetY: 5,
  },
  colorme: {
    name: "COLOR ME",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/color-me.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/color_me_logo_black.GHbcQ.png",
    textOffsetY: 5,
  },
  xxx: {
    name: "Альфабанк",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/alfabank.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B8%D1%8E%D0%BD%D1%8C/5026075f0d57f8bcda3b9091e51c14ef.jpg",
    textOffsetY: 5,
  },
  lapotok: {
    name: "Лапоток",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/skoro-otkrytie-lapotok.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/01.17/%D0%BC%D0%B0%D0%BB.jpg",
    textOffsetY: 5,
  },
  lemoor: {
    name: "Ле'Муррр™",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/lemurrr.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/small/resize-image-online.com_1701673426_20231204110231png_NBJhRqL3.png",
    textOffsetY: 5,
  },
  xxx: {
    name: "Промсвязьбанк",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/promsvyazbank.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B8%D1%8E%D0%BD%D1%8C/pronsvyazbank_origin2.jpg",
    textOffsetY: 5,
  },
  centrjuvelir: {
    name: "ЦентроЮвелир",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/centryuvelir.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/09.16/%D0%9B%D0%BE%D0%B3%D0%BE-%D0%A6%D0%B5%D0%BD%D1%82%D1%80%D0%BE%D1%8E%D0%B2%D0%B5%D0%BB%D0%B8%D1%80.jpg",
    textOffsetY: 5,
  },
  fanagoria: {
    name: "Fanagoria",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/fanagoria.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2018_01_02/fanagoria_180.jpg",
    textOffsetY: 5,
  },
  orient: {
    name: "Orient",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/orient.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/1(8).jpg",
    textOffsetY: 5,
  },
  prodrynok: {
    name: "Продовольственный рынок",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/produktovyj-rynok.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/05.17/pic(5).jpg",
    textOffsetY: 5,
  },
  fishkafish: {
    name: "Фишка fish",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/fishka-fish.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2018_09_12/%D1%84%D0%B8%D1%88%D0%BA%D0%B0-%D1%84%D0%B8%D1%88-180.jpg",
    textOffsetY: 5,
  },
  coraltravel: {
    name: "Coraltravel",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/coral-travel.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/jrnz%2Chm/1-(2).jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Постамат PickPoint",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/postamat-pickpoint.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/11.16/pic-(2).jpg",
    textOffsetY: 5,
  },
  symfonykrasoty: {
    name: "Симфония красоты",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/simfoniya-krasoty.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/11-12.17/%D1%81%D0%B8%D0%BC%D1%84-180-140.jpg",
    textOffsetY: 5,
  },
  bonifatsiy: {
    name: "Бонифаций",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/bonifacij.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/small/big/PHOTO-2025-10-27-10-01-12%20(1).jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "ВТБ 24",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/vtb-24.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/medium/b-logo.jpg",
    textOffsetY: 5,
  },
  domashny: {
    name: "Домашний Маг",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/domashnij-mag.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/05.17/pic(8).jpg",
    textOffsetY: 5,
  },
  glorya: {
    name: "Gloria Jeans",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/gloriya-dzhins.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D0%BC%D0%B0%D0%B9/resize-image-online.com_1694415584_LogoGJblackjpg_hhX0PtKP.jpg",
    textOffsetY: 5,
  },
  yota: {
    name: "Yota",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/yota.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/01.17/YOTA_logo_H120px.jpg",
    textOffsetY: 5,
  },
  zinger: {
    name: "Zinger",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/zinger.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/09.17/180.jpg",
    textOffsetY: 5,
  },
  ostin: {
    name: "OSTIN",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/ostin.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/resize-image-online.com_1750065808_logo-ostin-rusp15to_6LZ1U4ex.png",
    textOffsetY: 5,
  },
  xxx: {
    name: "Русский стандарт",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/russkij-standart.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/big/866_5e21b06cee1fe_x2.12SRz.jpg",
    textOffsetY: 5,
  },
  rio: {
    name: "Rio",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/rio.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/11-12.17/%D0%A0%D0%98%D0%9E-%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8-%E2%80%94-180.jpg",
    textOffsetY: 5,
  },
  zolla: {
    name: "Zolla",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/zolla.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_01_04/zolla_logo-180(2).jpg",
    textOffsetY: 5,
  },
  moyakniga: {
    name: "Моя Книга",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/moya-kniga.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2018_05_07/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF-%D0%A1%D0%B8%D0%BD%D0%B8%D0%B9-180.jpg",
    textOffsetY: 5,
  },
  letuale: {
    name: "Лэтуаль",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/letual.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D0%BC%D0%B0%D0%B9/resize-image-online.com_1694415877_LogoLETUALRGB1692png_TMNzJkKw.png",
    textOffsetY: 5,
  },
  mts: {
    name: "МТС",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/mts.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/logo-mts.jpg",
    textOffsetY: 5,
  },
  mts2: {
    name: "МТС",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/mts1.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/logo-mts.jpg",
    textOffsetY: 5,
  },
  eclida: {
    name: "Eclida",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/eclida.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/pic(9)(1).jpg",
    textOffsetY: 5,
  },
  rafam: {
    name: "Парфюмерные масла Rafam",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/parfyumernye-masla-rafam.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/pic.jpg",
    textOffsetY: 5,
  },
  fresh: {
    name: "Fresh",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/fresh.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_01_04/LOGO%20TK%20new%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F.jpg",
    textOffsetY: 5,
  },
  avtoshkola: {
    name: "Автошкола «Мегаполис»",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/avtoshkola-megapolis.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_01_04/2019-03-29_09-32-180-%D0%BD%D0%B0-140.png",
    textOffsetY: 5,
  },
  milavitsa: {
    name: "Milavitsa",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/milavitsa.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/Milavitsa_logo.jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Тинькофф Банк",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/tinkoff-bank.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/11-12.17/%D1%82%D0%B8%D0%BD%D1%8C%D0%BA%D0%BE%D1%843.jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Модная точка G-Point",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/g-point.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/gipoint_logo.jpg",
    textOffsetY: 5,
  },
  viking: {
    name: "Клуб Единоборств Viking",
    namesize: 20,
    desc: "",
    category: "floor3",
    link: "floor-3/klub-edinoborstv-viking.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/11-12.17/%D0%B2%D0%B8%D0%BA%D0%B8%D0%BD%D0%B3180.jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Всероссийский банк развития регионов (ВБРР)",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/1430.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2018_05_07/vbrr-180.jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Почтомат",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/pochtomat.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/medium/465629.7MHb2.jpg",
    textOffsetY: 5,
  },
  fitnessformula: {
    name: "Fitness Formula ",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/fitness-formula.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/resize-image-online.com_1747207021_c8e3a7yrrjw-9fxnj9bl_dU6L6WJp.jpg",
    textOffsetY: 5,
  },
  poligonarean: {
    name: "Полигон-Арена",
    namesize: 25,
    desc: "",
    category: "floor3",
    link: "floor-3/poligon-arena.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2018_03_04/logotip_poligon_ARENA_180.png",
    textOffsetY: 5,
  },
  xxx: {
    name: "Реванш",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/revansh.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BF%D1%80%D0%B5%D0%BB%D1%8C/%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D1%80%D0%B5%D0%B2%D0%B0%D0%BD%D1%88_%D0%BD%D0%B0_%D1%81%D0%B8%D0%BD%D0%B5%D0%BC__new_.yt8RC.png",
    textOffsetY: 5,
  },
  novijvzglad: {
    name: "Новый взгляд",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/noviy.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%B2%D0%B3%D1%83%D1%81%D1%82/pic-(2).jpg",
    textOffsetY: 5,
  },
  fightclub: {
    name: "Бойцовский клуб",
    namesize: 25,
    desc: "",
    category: "floor3",
    link: "floor-3/bojcovskij-klub.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2018_05_07/%D0%91%D0%9A-180.jpg",
    textOffsetY: 5,
  },
  lego: {
    name: "LEGO-остров",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/lego.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_01_04/fullsize-lego-%E2%80%94-%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F.jpg",
    textOffsetY: 5,
  },
  tvoe: {
    name: "ТВОЕ",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/tvoe.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/resize-image-online.com_1721631976_%D0%BF%D1%80%D0%B5%D0%B2%D1%8C%D1%8Ejpeg_FB6mjEUZ.jpg",
    textOffsetY: 5,
  },
  maksyuta: {
    name: "Спортивный клуб Максюта Юнион",
    namesize: 14,
    desc: "",
    category: "baz",
    link: "oranzhevyj-bazar/sportivnyj-klub-maksyuta-yunion.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B8%D1%8E%D0%BB%D1%8C/RUS%20-%20%D0%A1%D0%9A%20%D0%9C%D0%B0%D0%BA%D1%81%D1%8E%D1%82%D0%B0%20%D0%AE%D0%BD%D0%B8%D0%BE%D0%BD%20-%20%D0%9A%D1%80%D0%B0%D1%81%D0%BD%D0%BE%20%D1%87%D1%91%D1%80%D0%BD%D1%8B%D0%B9%20-%20RGB%20(1).png",
    textOffsetY: 5,
  },
  momento: {
    name: "Momento",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/momento.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/01.17/%D0%BE.jpg",
    textOffsetY: 5,
  },
  pedant: {
    name: "Сервисный центр Pedant.ru",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/servisnyj-centr-pedant.ru.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/09.16/mkgjaigu4lk.N1wwv.jpg",
    textOffsetY: 5,
  },
  belvest: {
    name: "Belwest",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/belwest.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/1_270b.n4LmM.jpg",
    textOffsetY: 5,
  },
  vensi: {
    name: "VENSI",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/vensi.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/resize-image-online.com_1712645978_20240408155022png_GAK3jB8P.png",
    textOffsetY: 5,
  },
  xxx: {
    name: "JoyeShop",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/joyeshop1.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/small/imgonline-com-ua-Resize-uphOEqtUXaeXYjff.jpg",
    textOffsetY: 5,
  },
  serge: {
    name: "Serge",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/serge.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/serge_logo.jpg",
    textOffsetY: 5,
  },
  plintushall: {
    name: "Плинтус Холл",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/plintus-holl.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/medium/imgonline-com-ua-Resize-SQVViCb7avZBFQ.jpg",
    textOffsetY: 5,
  },
  acoola: {
    name: "Acoola",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/acoola.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%BC%D0%B0%D0%B9/logo_2015.kBadC.png",
    textOffsetY: 5,
  },
  zolotoysoblazn: {
    name: "Золотой соблазн",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/zolotoj-soblazn.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/01.17/pic-(1)(5).jpg",
    textOffsetY: -5,
  },
  luxurystore: {
    name: "Luxury store",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/luxury-store.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BF%D1%80%D0%B5%D0%BB%D1%8C/resize-image-online.com_1704965982_20231107113004png_srhxXZjf.png",
    textOffsetY: 5,
  },
  megafon: {
    name: "Мегафон",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/megafon.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/megafon_logo.jpg",
    textOffsetY: 5,
  },
  chainka: {
    name: "Чаинка",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/chainka.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/chainka_logo.jpg",
    textOffsetY: 5,
  },
  rigla: {
    name: "Ригла",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/rigla1.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/rigla_log.jpg",
    textOffsetY: 5,
  },
  casio: {
    name: "Casio",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/casio.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/Casio_logo.png",
    textOffsetY: 5,
  },
  xxx: {
    name: "Конфаэль",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/konfael.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/map/confael_logo.png",
    textOffsetY: 5,
  },
  purpur: {
    name: "Pur Pur",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/pur-pur.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/%D0%BF%D1%83%D1%80-%D0%BF%D1%83%D1%80.jpg",
    textOffsetY: 5,
  },
  mirch: {
    name: "Мир часов",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/mir-clock.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/%D0%BC%D0%B8%D1%80.jpg",
    textOffsetY: 5,
  },
  ptrv: {
    name: "PTRV",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/ptrv.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%B2%D0%B3%D1%83%D1%81%D1%82/resize-image-online.com_1713953350_IMG1525png_fqNHFlgM.png",
    textOffsetY: 5,
  },
  perfumer: {
    name: "Perfumer",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/perfumer.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/11.16/resize-image-online.com_1727690849_2024-09-30-14-06-33-_tHR0HNbl.png",
    textOffsetY: 5,
  },
  brosko: {
    name: "Brosko",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/brosko.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2020_01_04/%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF%20%E2%80%94%20180.jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "DOVE IL DENARO",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/dove-il-denaro.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/01.jpg",
    textOffsetY: 5,
  },
  myseason: {
    name: "МОЙ СЕЗОН",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/your-sezon.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/image-04-03-26-12-56%20(1).jpeg",
    textOffsetY: 5,
  },
  xxx: {
    name: "JoyeShop",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/joyeshop.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/small/imgonline-com-ua-Resize-uphOEqtUXaeXYjff.jpg",
    textOffsetY: 5,
  },
  dns: {
    name: "DNS Smart",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/dns-smart.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/medium/DNS.jpg",
    textOffsetY: 5,
  },
  businessline: {
    name: "BUSINESS LINE",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/business-line.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/small/logo_1.jpg",
    textOffsetY: 5,
  },
  berloga: {
    name: "Берлога",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/berloga.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%BC%D0%B0%D0%B9/logo.png",
    textOffsetY: 5,
  },
  ortos: {
    name: "Орто-С",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/orto-s.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D0%BC%D0%B0%D0%B9/%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D0%BE%D1%80%D1%82%D0%BE-%D1%81.Pwyef.jpg",
    textOffsetY: 5,
  },
  lone: {
    name: "Лонэ",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/lone.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/12.16/IMG_2451.JPG",
    textOffsetY: 5,
  },
  lero: {
    name: "LERO",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/lero.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/small/resize-image-online.com_1701772826_Lerologob5225e142a34_SHGdva3s.png",
    textOffsetY: 5,
  },
  mamaboss: {
    name: "Студия красоты Mamaboss",
    namesize: 14,
    desc: "",
    category: "serv",
    link: "uslugi/studiya-krasoty-i-zagara-mamaboss.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_05_08/mamaboss_logo%20180.jpg",
    textOffsetY: -10,
  },
  shaplandia: {
    name: "Шапландия",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/shaplandiya.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_01_04/%D1%88%D0%B0%D0%BF%D0%BB%D0%B0%D0%BD%D0%B4%D0%B8%D1%8F-180.jpg",
    textOffsetY: 5,
  },
  podarka4: {
    name: "4 Подарка",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/4gifts.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D0%BC%D0%B0%D0%B9/2026-03-03_13-58-16%20(1).png",
    textOffsetY: -10,
  },
  bogatto: {
    name: "Богатто",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/filomoda.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/resize-image-online.com_1747207377_vyveska-slaahkuu_Xgy4StzA.jpg",
    textOffsetY: 5,
  },
  textyleshop: {
    name: "Textil shop",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/textil-shop.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/medium/medium/658013878b966769339513%20(2).jpg",
    textOffsetY: 5,
  },
  sportmaster: {
    name: "Спортмастер",
    namesize: 40,
    desc: "",
    category: "mag",
    link: "shops/sportmaster.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/small/sportmaster_1.mFylV.png",
    textOffsetY: 5,
  },
  koreyanka: {
    name: "Кореянка",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/koreyanka.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_01_04/IMG_6671-26-04-19-12-37%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F.PNG",
    textOffsetY: 5,
  },
  ambrex: {
    name: "Ambrex",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/ambrex.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/2019_05_08/image%20180%20140.jpg",
    textOffsetY: 5,
  },
  jarastu: {
    name: "Я расту",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/ya-rastu.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/%D0%B8%D1%8E%D0%BB%D1%8C/d6e0c71ca3722c71ddd73a242718257f_xl.1zAmg.jpg",
    textOffsetY: 5,
  },
  xxx: {
    name: "Столото",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/stoloto.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/news/06-2014/af00a5d65811d22b7e61c0c63c0f2688.DoJ0o.png",
    textOffsetY: 5,
  },
  podruzhka: {
    name: "Подружка",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/podruzhka.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/big/resize-image-online.com_1735199827_logo-main-ver-gray4-_W8qHIQjw.png",
    textOffsetY: 5,
  },
  horoshayasvyaz: {
    name: "Хорошая связь",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/horoshaya-svyaz.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/shop/small/medium/resize-image-online.com_1696931322_%D0%94%D0%B8%D0%B7%D0%B0%D0%B9%D0%BD%D0%B1%D0%B5%D0%B7%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D1%8Fpng_PxadATO7.png",
    textOffsetY: 5,
  },
  oodji: {
    name: "Oodji",
    namesize: 14,
    desc: "",
    category: "mag",
    link: "shops/oodji.html",
    zoom: 1.5,
    originalFill: "#FCF2EB",
    hoverFill: "",
    filterFill: "",
    textColor: "#120C07",
    textHoverColor: "#ff6600",
    logo: "assets/images/reklama/05.17/pic(6).jpg",
    textOffsetY: 5,
  },
};

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
  window.panZoomInstance = null;

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
          window.panZoomInstance = panZoomInstance;
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
      floor3: "3 этаж",
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

  window.highlightShop = highlightShop;

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
  window.centerOnShop = centerOnShop;

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

// Добавьте в конец вашего main.js (после всех инициализаций)
window.addEventListener("pageshow", function () {
  // При возврате на страницу закрываем попап
  const popup = document.getElementById("shop-popup");
  if (popup) {
    popup.style.display = "none";
  }
});

window.addEventListener("popstate", function () {
  // При навигации назад/вперёд закрываем попап
  const popup = document.getElementById("shop-popup");
  if (popup) {
    popup.style.display = "none";
  }
});

// ========== УНИВЕРСАЛЬНОЕ ЦЕНТРИРОВАНИЕ ПО БЛОКУ #current-shop ==========
(function () {
  function centerMapOnShop(shopId, zoomLevel, offsetY = 0) {
    if (!window.panZoomInstance) {
      console.warn("PanZoom не инициализирован");
      return false;
    }

    var shop = document.getElementById(shopId);
    if (!shop) {
      console.warn("Элемент с id=" + shopId + " не найден");
      return false;
    }

    // Получаем позицию элемента на странице
    var shopRect = shop.getBoundingClientRect();
    var svgRect = document.querySelector("#map-container svg").getBoundingClientRect();

    // Вычисляем центр элемента относительно SVG с учётом сдвига по Y
    var centerX = shopRect.left + shopRect.width / 2 - svgRect.left;
    var centerY = shopRect.top + shopRect.height / 2 - svgRect.top + offsetY;

    console.log("Центр элемента (отладка):", centerX, centerY);
    console.log("Сдвиг по Y:", offsetY);

    // Сбрасываем и устанавливаем зум
    window.panZoomInstance.reset();
    window.panZoomInstance.zoom(zoomLevel);

    setTimeout(function () {
      var sizes = window.panZoomInstance.getSizes();
      var currentZoom = window.panZoomInstance.getZoom();

      var panX = sizes.width / 2 - centerX * currentZoom;
      var panY = sizes.height / 2 - centerY * currentZoom;

      console.log("Панорамирование:", panX, panY);

      window.panZoomInstance.pan({
        x: panX,
        y: panY,
      });
    }, 100);

    if (typeof window.highlightShop === "function") {
      window.highlightShop(shopId);
    }

    return true;
  }

  setTimeout(function () {
    var block = document.getElementById("current-shop");
    if (!block) return;

    var shopId = block.getAttribute("data-shop-id");
    var zoom = parseFloat(block.getAttribute("data-zoom"));
    var offsetY = parseFloat(block.getAttribute("data-offset-y")) || 0;

    if (!shopId) return;
    var finalZoom = !isNaN(zoom) && zoom > 0 ? zoom : 2.0;

    console.log("Центрирование по #current-shop: " + shopId + ", zoom=" + finalZoom + ", offsetY=" + offsetY);

    var checkInterval = setInterval(function () {
      if (window.panZoomInstance && document.getElementById(shopId)) {
        clearInterval(checkInterval);
        setTimeout(function () {
          centerMapOnShop(shopId, finalZoom, offsetY);
        }, 300);
      }
    }, 200);
  }, 500);
})();

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
