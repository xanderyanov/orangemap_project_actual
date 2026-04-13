// проверка

function validateNonEmpty(selector, title, text) {
  var elem = typeof selector === "string" ? $(selector) : selector;
  var value = elem.val();
  if (value === '') {
    swal({
      title: title,
      text: text,
      //type: 'error',
      confirmButtonText: 'ок',
      cancelButtonColor: '#534764',
      confirmButtonColor: '#534764',
    });
    elem.addClass('error');
    setTimeout(function () {
      elem.removeClass('error');
    }, 3000);
    return false;
  }

  elem.removeClass('error');
  return value;
}

function validateName(selector, data) {
  var value = validateNonEmpty(selector, 'Укажите, пожалуйста, ваше имя', '');
  if (value === false) return false;
  data.name = value;
  return true;
}

function validatePhone(selector, data) {
  var value = validateNonEmpty(
    selector,
    'Укажите, пожалуйста, ваш телефон',
    ''
  );
  if (value === false) return false;
  data.phone = value;
  return true;
}

function validateMessage(selector, data) {
  var value = validateNonEmpty(
    selector,
    'Заполните, пожалуйста, текст сообщения',
    ''
  );
  if (value === false) return false;
  data.message = value;
  return true;
}

function validateSelect(selector, data) {
  const index = selector.prop('selectedIndex');
  console.log(index);
  if (index == 0) {
    swal({
      title: 'Укажите клинику',
      text: '',
      //type: 'error',
      confirmButtonText: 'ок',
      cancelButtonColor: '#534764',
      confirmButtonColor: '#534764',
    });
    selector.addClass('error');
    setTimeout(function () {
      selector.removeClass('error');
    }, 3000);
    return false;
  }

  selector.removeClass('error');
  data.clinic = selector.val();
  return true;
}

var emailRegex = /^[\w.\d-_]+@[\w.\d-_]+\.\w{2,4}$/i;

function validateEmail(selector, data) {
  var elem = $(selector);
  var value = elem.val();

  if (value === '') {
    swal({
      title: 'Укажите, пожалуйста, Email',
      text: '',
      //type: 'error',
      cancelButtonColor: '#534764',
      confirmButtonColor: '#534764',
      confirmButtonText: 'ок',
    });
    elem.addClass('error');
    setTimeout(function () {
      elem.removeClass('error');
    }, 3000);
    return false;
  }

  if (!emailRegex.test(value)) {
    swal({
      title: 'Корректно заполните поле e-mail',
      text: '',
      cancelButtonColor: '#534764',
      confirmButtonColor: '#534764',
      //type: 'error',
      confirmButtonText: 'ок',
    });
    elem.addClass('error');
    setTimeout(function () {
      elem.removeClass('error');
    }, 3000);
    return false;
  }

  elem.removeClass('error');
  data.email = value;
  return true;
}

function validateWorkEmail(selector) {
  var elem = $(selector);
  var value = elem.val();
  if (value !== '') {
    swal({
      title: 'Ах ты жулик',
      text: 'Уберите робота от компьютера',
      cancelButtonColor: '#534764',
      confirmButtonColor: '#534764',
      //type: 'error',
      confirmButtonText: 'ок',
    });
    return false;
  }
  return true;
}

function validateCheckbox(selector) {
  var elem = $(selector);
  if (!elem.is(':checked')) {
    swal({
      title: 'Дайте, пожалуйста, свое согласие на обработку данных',
      text: '',
      cancelButtonColor: '#534764',
      confirmButtonColor: '#534764',
      //type: 'error',
      confirmButtonText: 'ок',
    });
    return false;
  }
  return true;
}

var mailUrl = '/sendmail';

function rvt(subj)
{
    return { 
        subj: subj,
        __RequestVerificationToken: $("input[name='__RequestVerificationToken']").val()
    };
}

function staticForm(formClass, subj, swalTitle, swalText, needEmail, needMessage, needClinic, overlayClass, ymScript) {

    var sForm = $(formClass)

    sForm.on('click', "button[type=\"submit\"]", function (e) {
        e.preventDefault();

        var data = rvt(subj);
        if (swalTitle === undefined) { swalTitle = ''; }
        if (swalText === undefined) { swalText = ''; }

        if ((!needClinic || validateSelect(sForm.find('[name="clinic"]'), data)) &&
            validateName(sForm.find('[name="name"]'), data) &&
            (!needEmail || validateEmail(sForm.find('[name="email"]'), data)) &&
            (!needMessage || validateMessage(sForm.find('[name="message"]'), data)) &&
            validatePhone(sForm.find('[name="phone"]'), data) &&
            validateWorkEmail(sForm.find('[name="work_email"]')) &&
            validateCheckbox(sForm.find('[name="checkbox"]'))
        ) {
            $.post(mailUrl, data, function () {
            swal({
                title: swalTitle,
                text: swalText,
                //type: 'success',
                confirmButtonText: 'ок',
                cancelButtonColor: '#534764',
                confirmButtonColor: '#534764',
            });
                $('[name="name"], [name="phone"], [name="email"], [name="message"]').val('');
                $('[name="clinic"]').prop('selectedIndex', 0);
                $('[name="checkbox"]:checked').prop('checked', false);
                if (overlayClass !== undefined) {
                  $(overlayClass).fadeOut(300);
                  $('body').removeClass('stop');
              
                  setTimeout(() => {
                    $('.fly24btn__outer').removeClass('hideInRight');
                  }, 400);
                }
                ymScript();
            });
        }
    });
}

function ymAction() { ym(56122573, 'reachGoal', 'formInAction'); }
function ymORDER() { ym(56122573,'reachGoal','ORDER'); }

function popupForm(containerClass, formClass, subjClass, subjPrefix, swalTitle, swalText, needEmail, needMessage, needClinic, ymScript) {

    $(formClass).on('click', "button[type=\"submit\"]", function (e) {
        e.preventDefault();

        var index = $(this).closest(containerClass).data('overlay');
        //var dContainer = $("\"" + containerClass + "[data-overlay='" + index + "']\"");
        var dContainer = $(this).closest(containerClass);

        //var dForm = $(formClass + "[data-index='" + index + "']");
        var dForm = $(this).closest(formClass);


        var subjText = subjPrefix + dContainer.find(subjClass).text();

        var data = rvt(subjText);
        if (swalTitle === undefined) { swalTitle = ''; }
        if (swalText === undefined) { swalText = ''; }

        if ((!needClinic || validateSelect(dForm.find('[name="clinic"]'), data)) &&
            validateName(dForm.find('[name="name"]'), data) &&
            (!needEmail || validateEmail(dForm.find('[name="email"]'), data)) &&
            (!needMessage || validateMessage(dForm.find('[name="message"]'), data)) &&
            validatePhone(dForm.find('[name="phone"]'), data) &&
            validateWorkEmail(dForm.find('[name="work_email"]')) &&
            validateCheckbox(dForm.find('[name="checkbox"]'))
        )
         {
            $.post(mailUrl, data, function () {
                swal({
                    title: swalTitle,
                    text: swalText,
                    //type: 'success',
                    confirmButtonText: 'ок',
                    cancelButtonColor: '#534764',
                    confirmButtonColor: '#534764',
                });
                $('[name="name"], [name="phone"], [name="email"], [name="message"]').val('');
                $('[name="clinic"]').prop('selectedIndex', 0);
                $('[name="checkbox"]:checked').prop('checked', false);
                dContainer.fadeOut();
                $('body').removeClass('stop');
                ymScript();
            });
        }
    });
}


$(function () {

    $("input[name='phone']").each(function () {
        $(this).mask('+7 (999) 999-9999');
    });

    //staticForm(formClass, subj, swalTitle, swalText, needEmail, needMessage, needClinic, overlayClass)
    staticForm(".form_fly24", 'Форма связи сквозная', "Мы перезвоним вам в ближайшее время", null, false, false, true, ".fly24box__overlay", ymORDER);  // форма на всплывашке Fly24

    staticForm(".form_m3", "Форма главной страницы", "Мы перезвоним вам в ближайшее время", null, false, false, true, ymORDER);  // форма на главной
    staticForm(".form13", $('.subj13').text(), "Мы перезвоним вам в ближайшее время", null, false, false, true, ymORDER);  // форма на странице
    staticForm(".form3", "Сообщение со страницы контактов", "Спасибо", "Ваше сообщение отправлено", true, true, true, ymORDER);  // форма в контактах
    
    popupForm(".action__infoBoxOverlay", ".formInAction", ".formInAction__subj", "Страница акции: ", "Мы перезвоним вам в ближайшее время", null, false, false, true, ymORDER);  // Форма на всплывашке на странице акций
    
    staticForm(".mf3", $('.mf3_subj').text(), "Мы перезвоним вам в ближайшее время", null, false, false, true, ymORDER);  // форма на странице мастера десктоп
    staticForm(".mf3_popup", $('.mf3_subj_popup').text(), "Мы перезвоним вам в ближайшее время", null, false, false, true, ".masterWindowForm__overlay", ymORDER);  // форма на странице мастера мобил
    
    //popupForm(containerClass, formClass, subjClass, subjPrefix, swalTitle, swalText, needEmail, needMessage, needClinic, ymScript) {
    
    popupForm(".dropperInfoBox__overlay", ".formInDropper", ".dropperInfoBox__topInfoTitle h2", "Страница капельницы: ", "Мы перезвоним вам в ближайшее время", false, false, true, ymAction);  // Форма на всплывашке на капельниц
    popupForm(".callBack__overlay", ".callback", "", "Подарочный сертификат", "Мы перезвоним вам в ближайшее время", null, false, false, ymAction);  // Форма на всплывашке на странице сертификата
      
  //Форма на всплывашке позвонить (заказать звонок)
  //$('.callback').on('click', '.submit_callback', function (e) {
  //  e.preventDefault();
  //  e.stopPropagation();

  //  var data = rvt('Форма заказа обратного звонка');

  //  if (
  //    validateName('.name_callback', data) &&
  //    validatePhone('.phone_callback', data) &&
  //    validateWorkEmail('.work_email_callback') &&
  //    validateCheckbox('.checkbox_callback')
  //  ) {
  //    $.post(mailUrl, data, function () {
  //      swal({
  //        title: 'Мы перезвоним вам в ближайшее время',
  //        text: '',
  //        //type: 'success',
  //        confirmButtonText: 'ок',
  //        cancelButtonColor: '#534764',
  //        confirmButtonColor: '#534764',
  //      });
  //      $('.name_callback, .phone_callback').val('');
  //      $('.checkbox_callback:checked').prop('checked', false);
  //      $('.callBackBtn_js').removeClass('active');
  //      $('.callBack__form')
  //        .addClass('bounceOutUp')
  //        .removeClass('bounceInDown')
  //        .fadeOut(600);
  //      setTimeout(function () {
  //        $('.callBack__overlay').fadeOut();
  //        $('.menuBottom1').removeClass('menuBottom1_active');
  //        $('.menuBottom1__overlay').fadeOut();
  //        $('.menuBottom1__hideArea').slideUp();
  //        $('.menuBottom1__openBtn_js').removeClass('open');
  //        $('.menuBottom1__openBtn_js').find('span').text('Больше');
  //        $('body').removeClass('stop');
  //      }, 800);
  //    });
  //  }
  //});  

  //Форма на странице налогового вычета
  $('.formTD').on('click', '.submitTD', function (e) {
    e.preventDefault();

    var data = rvt('Налоговый вычет');

    if (
      validateName('.nameTD', data) &&
      validatePhone('.phoneTD', data) &&
      validateWorkEmail('.work_emailTD') &&
      validateCheckbox('.checkDT1')
    ) {
      data.name += ' ' + $('.nameTD').val();
      $.post(mailUrl, data, function () {
        swal({
          title: 'Спасибо',
          text: 'Ваша заявка отправлена',
          //type: 'success',
          confirmButtonText: 'ок',
          cancelButtonColor: '#534764',
          confirmButtonColor: '#534764',
        });
        $(
          '.nameTD, .phoneTD, .dateTD, .innTD, .periodStartTD, .periodEndTD'
        ).val('');
        $('.checkDT1:checked').prop('checked', false);
      });
    }
  });
});
