$(function() {
    let previousWidth = $(window).width();
    
    function checkScreenChange() {
        const currentWidth = $(window).width();
        
        if (previousWidth < 1440 && currentWidth >= 1440) {
            handleScreenSizeIncrease();
        }
        
        previousWidth = currentWidth;
    }
    
    // Оптимизация с debounce для уменьшения нагрузки при resize
    let resizeTimeout;
    $(window).resize(function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(checkScreenChange, 100);
    });
    
    function handleScreenSizeIncrease() {
        // Ваша функция при увеличении экрана до ≥1440px
        console.log('Экран стал больше или равен 1440px');
        
        // Примеры действий:
        // 1. Показать/скрыть элементы
        $('.desktop-only').fadeIn();
        
        // 2. Изменить стили
        $('body').addClass('large-screen');
        
        // 3. Инициализировать плагины для десктопа
        if ($.fn.slick) {
            $('.slider').slick('unslick').slick({
                slidesToShow: 4,
                responsive: [...]
            });
        }
    }
    
    // Проверка при загрузке (если сразу ≥1440px)
    if ($(window).width() >= 1440) {
        handleScreenSizeIncrease();
    }
});