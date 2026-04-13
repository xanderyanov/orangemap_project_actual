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
