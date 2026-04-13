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
