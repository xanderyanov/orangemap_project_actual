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
