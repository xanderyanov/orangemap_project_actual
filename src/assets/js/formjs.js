/**
 * Модуль валидации и отправки форм на чистом JavaScript
 * Заменяет jQuery-зависимый код
 */

// Конфигурация
const CONFIG = {
  mailUrl: "mail.php", // URL для отправки формы
  overlayClass: undefined, // Класс оверлея (если используется)
};

ButterPop.configure({ theme: "material" });

// Регулярное выражение для валидации email
const emailRegex = /^[\w.\d-_]+@[\w.\d-_]+\.\w{2,4}$/i;

/**
 * Базовая функция валидации на пустоту
 * @param {string|HTMLElement} selector - селектор или элемент
 * @param {string} title - заголовок сообщения об ошибке
 * @param {string} text - текст сообщения (не используется)
 * @returns {string|boolean} - значение поля или false
 */
function validateNonEmpty(selector, title, text) {
  // Получаем элемент, если передан селектор
  const elem = typeof selector === "string" ? document.querySelector(selector) : selector;

  if (!elem) {
    console.error("Элемент не найден:", selector);
    return false;
  }

  const value = elem.value.trim();

  if (value === "") {
    // Показываем ошибку
    ButterPop.error(title);

    // Добавляем класс ошибки
    elem.classList.add("error");

    // Убираем класс ошибки через 3 секунды
    setTimeout(function () {
      elem.classList.remove("error");
    }, 3000);

    return false;
  }

  // Убираем класс ошибки, если поле заполнено
  elem.classList.remove("error");
  return value;
}

/**
 * Валидация имени
 * @param {string|HTMLElement} selector - селектор или элемент
 * @param {Object} data - объект для сбора данных
 * @returns {boolean}
 */
function validateName(selector, data) {
  const value = validateNonEmpty(selector, "Укажите, пожалуйста, ваше имя", "");
  if (value === false) return false;
  data.name = value;
  return true;
}

/**
 * Валидация телефона
 * @param {string|HTMLElement} selector - селектор или элемент
 * @param {Object} data - объект для сбора данных
 * @returns {boolean}
 */
function validatePhone(selector, data) {
  const value = validateNonEmpty(selector, "Укажите, пожалуйста, ваш телефон", "");
  if (value === false) return false;
  data.phone = value;
  return true;
}

/**
 * Валидация сообщения
 * @param {string|HTMLElement} selector - селектор или элемент
 * @param {Object} data - объект для сбора данных
 * @returns {boolean}
 */
function validateMessage(selector, data) {
  const value = validateNonEmpty(
    selector,
    "Заполните, пожалуйста, cылку на сайт компании-работодателя или учебного заведения",
    "",
  );
  if (value === false) return false;
  data.message = value;
  return true;
}

/**
 * Валидация select (выпадающего списка)
 * @param {string|HTMLElement} selector - селектор или элемент
 * @param {Object} data - объект для сбора данных
 * @returns {boolean}
 */
function validateSelect(selector, data) {
  const elem = typeof selector === "string" ? document.querySelector(selector) : selector;

  if (!elem) {
    console.error("Элемент не найден:", selector);
    return false;
  }

  const index = elem.selectedIndex;
  console.log("Выбранный индекс:", index);

  if (index === 0) {
    // Первый пункт обычно "Выберите..."
    ButterPop.warning("Внимание: это действие нельзя отменить! ⚠️");

    elem.classList.add("error");
    setTimeout(function () {
      elem.classList.remove("error");
    }, 3000);

    return false;
  }

  elem.classList.remove("error");
  data.clinic = elem.value;
  return true;
}

/**
 * Валидация email
 * @param {string|HTMLElement} selector - селектор или элемент
 * @param {Object} data - объект для сбора данных
 * @returns {boolean}
 */
function validateEmail(selector, data) {
  const elem = typeof selector === "string" ? document.querySelector(selector) : selector;

  if (!elem) {
    console.error("Элемент не найден:", selector);
    return false;
  }

  const value = elem.value.trim();

  if (value === "") {
    ButterPop.warning("Укажите, пожалуйста, Email");

    elem.classList.add("error");
    setTimeout(function () {
      elem.classList.remove("error");
    }, 3000);
    return false;
  }

  if (!emailRegex.test(value)) {
    ButterPop.warning("Корректно заполните поле e-mail");
    elem.classList.add("error");
    setTimeout(function () {
      elem.classList.remove("error");
    }, 3000);
    return false;
  }

  elem.classList.remove("error");
  data.email = value;
  return true;
}

/**
 * Проверка скрытого поля для защиты от роботов (поле должно быть пустым)
 * @param {string|HTMLElement} selector - селектор или элемент
 * @returns {boolean}
 */
function validateWorkEmail(selector) {
  const elem = typeof selector === "string" ? document.querySelector(selector) : selector;

  if (!elem) return true; // Если элемента нет, считаем проверку пройденной

  const value = elem.value.trim();

  if (value !== "") {
    ButterPop.warning("Робот проверку не прошел)");
    return false;
  }
  return true;
}

/**
 * Проверка чекбокса (должен быть отмечен)
 * @param {string|HTMLElement} selector - селектор или элемент
 * @returns {boolean}
 */
function validateCheckbox(selector) {
  const elem = typeof selector === "string" ? document.querySelector(selector) : selector;

  if (!elem) {
    console.error("Чекбокс не найден:", selector);
    return false;
  }

  if (!elem.checked) {
    ButterPop.warning("Дайте, пожалуйста, свое согласие на обработку данных");
    return false;
  }
  return true;
}

/**
 * Отправка данных на сервер через fetch
 * @param {string} url - URL для отправки
 * @param {Object} data - данные для отправки
 * @returns {Promise}
 */
function postData(url, data) {
  // Преобразуем объект в URL-кодированную строку
  const formData = new URLSearchParams();
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      formData.append(key, data[key]);
    }
  }

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });
}

/**
 * Сброс полей формы
 * @param {HTMLElement} form - элемент формы
 */
function resetForm(form) {
  // Очищаем текстовые поля
  const textInputs = form.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea',
  );
  textInputs.forEach(input => {
    input.value = "";
  });

  // Сбрасываем select на первый пункт
  const selects = form.querySelectorAll("select");
  selects.forEach(select => {
    select.selectedIndex = 0;
  });

  // Снимаем отметки с чекбоксов
  const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });

  // Очищаем текстовые поля
  const buttonSubmit = form.querySelectorAll('button[type="submit"], input[type="submit"]');
  buttonSubmit.forEach(button => {
    button.disabled = true;
  });
}

/**
 * Функция для метрик (Yandex Metrika)
 */
function ymAction() {
  if (typeof ym === "function") {
    ym(56122573, "reachGoal", "formInAction");
  }
}

function ymORDER() {
  if (typeof ym === "function") {
    ym(56122573, "reachGoal", "ORDER");
  }
}

/**
 * Маска для телефона (замена jQuery Mask)
 * @param {string} selector - селектор полей телефона
 */
function applyPhoneMask(selector) {
  const phoneInputs = document.querySelectorAll(selector);

  phoneInputs.forEach(input => {
    input.addEventListener("input", function (e) {
      let value = this.value.replace(/\D/g, ""); // Удаляем всё кроме цифр

      if (value.length > 0) {
        // Форматируем: +7 (999) 999-9999
        let formattedValue = "+7";

        if (value.length > 1) {
          formattedValue += " (" + value.substring(1, 4);
        }
        if (value.length >= 4) {
          formattedValue += ") " + value.substring(4, 7);
        }
        if (value.length >= 7) {
          formattedValue += "-" + value.substring(7, 9);
        }
        if (value.length >= 9) {
          formattedValue += "-" + value.substring(9, 11);
        }

        this.value = formattedValue;
      }
    });
  });
}

/**
 * Основная функция инициализации формы
 * @param {string} formClass - класс формы
 * @param {string} subj - тема письма (не используется в текущей версии)
 * @param {boolean} needEmail - нужна ли валидация email
 * @param {boolean} needMessage - нужно ли поле сообщения
 */
function statForm(formClass, subj, needEmail, needMessage) {
  const form = document.querySelector(formClass);

  if (!form) {
    console.error("Форма с классом", formClass, "не найдена");
    return;
  }

  // Находим кнопку отправки внутри формы
  const submitButton = form.querySelector('button[type="submit"]');

  if (!submitButton) {
    console.error("Кнопка отправки не найдена в форме", formClass);
    return;
  }

  // Вешаем обработчик на кнопку
  submitButton.addEventListener("click", function (e) {
    e.preventDefault();

    // Объект для сбора данных
    const data = {};

    // Находим поля внутри формы
    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const messageInput = form.querySelector('[name="message"]');
    const workEmailInput = form.querySelector('[name="work_email"]');
    const checkboxInput = form.querySelector('[name="checkbox"]');
    const clinicSelect = form.querySelector('[name="clinic"]');

    // Валидация всех полей
    const isNameValid = validateName(nameInput, data);
    const isEmailValid = !needEmail || validateEmail(emailInput, data);
    const isMessageValid = !needMessage || validateMessage(messageInput, data);
    const isPhoneValid = validatePhone(phoneInput, data);
    const isWorkEmailValid = validateWorkEmail(workEmailInput);
    const isCheckboxValid = validateCheckbox(checkboxInput);

    // Дополнительная валидация select, если он есть
    let isSelectValid = true;
    if (clinicSelect) {
      isSelectValid = validateSelect(clinicSelect, data);
    }

    // Если все проверки пройдены, отправляем форму
    if (
      isNameValid &&
      isEmailValid &&
      isMessageValid &&
      isPhoneValid &&
      isWorkEmailValid &&
      isCheckboxValid &&
      isSelectValid
    ) {
      // Отправляем данные
      postData(CONFIG.mailUrl, data)
        .then(response => {
          if (response.ok) {
            ButterPop.success("Операция выполнена успешно!");

            // Очищаем форму
            resetForm(form);

            // Скрываем оверлей, если он есть
            if (CONFIG.overlayClass) {
              const overlay = document.querySelector(CONFIG.overlayClass);
              if (overlay) {
                overlay.style.display = "none";
                document.body.classList.remove("stop");

                setTimeout(() => {
                  const flyBtn = document.querySelector(".fly24btn__outer");
                  if (flyBtn) {
                    flyBtn.classList.remove("hideInRight");
                  }
                }, 400);
              }
            }

            // Вызываем метрики
            ymAction();
          } else {
            ButterPop.error("Ошибка отправки. Попробуйте позже.");
          }
        })
        .catch(error => {
          console.error("Ошибка:", error);
          ButterPop.error("Ошибка соединения. Проверьте интернет.");
        });
    }
  });
}

// Инициализация формы при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  // Запускаем валидацию для формы .form1
  statForm(".application__form", "Заявка", false, true);

  // Применяем маску телефона ко всем полям с name="phone"
  applyPhoneMask('input[name="phone"]');

  // Для совместимости с Яндекс.Метрикой
  window.ymAction = ymAction;
  window.ymORDER = ymORDER;
});
