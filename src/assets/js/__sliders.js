$(function () {
  var xoptions = {
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    slidesPerView: 3,
    spaceBetween: 30,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  };

  var swiper = new Swiper(".mySwiper", xoptions);

  var slider1 = {};
  if ($(".slider1-container .slider1-slide").length) {
    slider1Options = {
      slidesPerView: 2,
      loop: true,
      spaceBetween: 88,
      centeredSlides: true,
      speed: 600,
      autoplay: {
        delay: 15000,
        disableOnInteraction: true,
      },
      navigation: {
        nextEl: ".slider1__right",
        prevEl: ".slider1__left",
      },
      keyboard: true,
      watchOverflow: true,
      pagination: {
        el: ".slider1__pagination",
        type: "bullets",
        dynamicBullets: true,
        clickable: true,
      },
      breakpoints: {
        0: {
          slidesPerView: 2,
          spaceBetween: 5,
        },
        360: {
          slidesPerView: 2,
          spaceBetween: 10,
        },
        480: {
          slidesPerView: 2,
          spaceBetween: 30,
        },
        600: {
          slidesPerView: 2,
          spaceBetween: 50,
        },
        920: {
          slidesPerView: 2,
          spaceBetween: 88,
        },
      },
    };
  }
  var swiper = new Swiper(".slider1-container", slider1Options);
});
