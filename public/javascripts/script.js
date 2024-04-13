const sidebarToggle = document.querySelector("#sidebar-toggle");
sidebarToggle.addEventListener("click", function () {
  document.querySelector("#sidebar").classList.toggle("collapsed");
});

document.querySelector(".theme-toggle").addEventListener("click", () => {
  toggleLocalStorage();
  toggleRootClass();
});

function toggleRootClass() {
  const current = document.documentElement.getAttribute("data-bs-theme");
  const inverted = current == "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", inverted);
}

function toggleLocalStorage() {
  if (isLight()) {
    localStorage.removeItem("light");
  } else {
    localStorage.setItem("light", "set");
  }
}

function isLight() {
  return localStorage.getItem("light");
}

if (isLight()) {
  toggleRootClass();
}

// function checkError() {
//   var checkIn = new Date(document.getElementById("checkIn").value);
//   var checkOut = new Date(document.getElementById("checkOut").value);
//   var today = new Date();
//   today.setHours(0, 0, 0, 0); // Reset time to 00:00:00.000
//   if (checkIn < today) {
//     alert("Check-in date cannot be in the past.");
//     return false;
//   } else if (checkIn.getTime() === checkOut.getTime()) {
//     alert("Same-day reservations are not possible.");
//     return false;
//   }
//   return true;
// }
