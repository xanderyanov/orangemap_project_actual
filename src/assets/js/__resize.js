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
