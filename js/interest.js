(function () {
  var dlg = document.getElementById("interest");
  if (!dlg) return;
  var form = document.getElementById("int-form"), msg = document.getElementById("int-msg");
  var WA = "971522675335";

  function say(text, kind) { msg.textContent = text; msg.className = "int-msg " + kind; }
  function open() {
    say("", "");
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    setTimeout(function () { form.elements.name.focus(); }, 50);
  }
  function close() { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }

  document.querySelectorAll("[data-interest]").forEach(function (b) { b.addEventListener("click", open); });
  dlg.querySelector("[data-close]").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  if (location.hash === "#interested") open();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements, name = f.name.value.trim(), phone = f.phone.value.trim(), email = f.email.value.trim(), note = f.note.value.trim();
    if (name.length < 2) { say("Please enter your name.", "bad"); f.name.focus(); return; }
    if (phone.replace(/\D/g, "").length < 7) { say("Please enter a phone or WhatsApp number we can reach.", "bad"); f.phone.focus(); return; }
    var text = "Hello, I am interested in AI.ngel.\nName: " + name + "\nPhone: " + phone + (email ? "\nEmail: " + email : "") +
      "\nI am a: " + f.who.value + (note ? "\nNote: " + note : "");
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    say("WhatsApp is opening. Press Send there and we will contact you soon.", "ok");
  });
})();
