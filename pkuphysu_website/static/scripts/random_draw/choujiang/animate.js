/* eslint-disable */

function init() {
  var a = document.querySelector(".ip-slideshow");
  (canvas = document.createElement("canvas")),
    (canvas.width = innerWidth),
    (canvas.height = 700),
    a.appendChild(canvas),
    (context = canvas.getContext("2d")),
    randomOrder(reOrder, 0, mainNum),
    createParticles(),
    (showLoop = setInterval("showPic()", 1800)),
    createText(word);
}

function createParticles() {
  for (var a = 0, b = mainNum; b > a; a++) {
    var c,
      d,
      e = (2 * Math.PI * a) / b;
    (c = 0.5 * canvas.width + 10 * Math.cos(e)), (d = 180 + 10 * Math.sin(e));
    var f = randomBetween(0, 12),
      g = !(f > 0 || 12 > f),
      h = colors[10][Math.floor(Math.random() * colors[10].length)];
    particles.push({
      x: c,
      y: d,
      hasBorn: g,
      ease: 0.04 + 0.06 * Math.random(),
      bornSpeed: 0.03 + 0.1 * Math.random(),
      alpha: 0,
      maxAlpha: 0.5 + 0.5 * Math.random(),
      radius: f,
      maxRadius: 12,
      color: h,
      angle: 0,
      steps: e
    });
  }
  loop();
}

function createTextParticles(a) {
  for (var b = 0, c = a; c > b; b++) {
    var d = randomBetween(0, 12),
      e = !(d > 0 || 12 > d),
      f = "#FFFFFF";
    text.push({
      x: 0.5 * canvas.width,
      y: canvas.height - 100,
      hasBorn: e,
      ease: 0.04 + 0.06 * Math.random(),
      bornSpeed: 0.07 + 0.07 * Math.random(),
      alpha: 0,
      maxAlpha: 0.4 + 0.7 * Math.random(),
      radius: d,
      maxRadius: 12,
      color: f,
      interactive: !1
    });
  }
}

function createTextFrame(a) {
  for (var b, c, d = a / 5.236, e = 1.618 * d, f = 0, g = a; g > f; f++)
    d > f
      ? ((b = canvas.width / 2 - halfX),
        (c = canvas.height / 2 - halfY + (2 * f * halfY) / d))
      : d + e > f
      ? ((c = canvas.height / 2 + halfY),
        (b = canvas.width / 2 - halfX + (2 * (f - d) * halfX) / e))
      : 2 * d + e > f
      ? ((b = canvas.width / 2 + halfX),
        (c = canvas.height / 2 - halfY + (2 * (f - d - e) * halfY) / d))
      : ((c = canvas.height / 2 - halfY),
        (b = canvas.width / 2 - halfX + (2 * (f - 2 * d - e) * halfX) / e)),
      textReOrder.push(f),
      nextText[1].push({
        x: b,
        y: c,
        orbit: randomBetween(15, 25),
        angle: 0
      });
}

function createText(a) {
  (context.font = "150px Lato, Arial, sans-serif"),
    (context.fillStyle = textColor),
    (context.textAlign = "center");
  var b = a.split("").join(String.fromCharCode(8202));
  context.fillText(b, 0.5 * canvas.width, canvas.height - 50);
  for (
    var c = context.getImageData(0, canvas.height - 250, canvas.width, 250),
      d = 0;
    d < c.width;
    d += 8
  )
    for (var e = 0; e < c.height; e += 4) {
      var f = c.data[e * c.width * 4 + 4 * d - 1];
      255 === f &&
        nextText[0].push({
          x: d,
          y: e + canvas.height - 250,
          orbit: randomBetween(1, 3),
          angle: 0
        });
    }
  clearWord();
  var g = nextText[0].length;
  (textSeed = g), createTextParticles(g), createTextFrame(g);
}

function loop() {
  clear(), update(), render(), setTimeout(loop, 1e3 / FPS);
}

function clear() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function clearWord() {
  context.clearRect(0, canvas.height - 250, canvas.width, 250);
}

function updataTransition() {
  [].forEach.call(particles, function(a, b) {
    switch (currentLayout) {
      case 1:
        (shape.x = 0.5 * canvas.width + 100 * -Math.sin(reOrder[b])),
          (shape.y =
            0.5 * canvas.height +
            60 * Math.sin(reOrder[b]) * Math.cos(reOrder[b]));
        break;
      case 2:
        (shape.x = 0.5 * canvas.width + 140 * Math.sin(a.steps)),
          (shape.y = 180 + 140 * Math.cos(a.steps));
        break;
      case 3:
        var g, f;
        (g = 0.5 * mainNum - 1),
          (f = (2 * Math.PI * reOrder[b]) / g),
          reOrder[b] < [].slice.call(particles, 0, g).length
            ? ((shape.x = 0.5 * canvas.width + 80 * Math.cos(f)),
              (shape.y = 180 + 140 * Math.sin(f)))
            : ((g = 0.5 * particles.length),
              (shape.x = 0.5 * canvas.width + 140 * Math.cos(f)),
              (shape.y = 180 + 80 * Math.sin(f)));
        break;
      case 4:
        (shape.x =
          0.5 * canvas.width +
          90 * (1 - Math.sin(reOrder[b])) * Math.cos(reOrder[b])),
          (shape.y = 320 + 140 * (-Math.sin(reOrder[b]) - 1));
        break;
      case 5:
        (shape.x =
          0.5 * canvas.width +
          90 * Math.sin(reOrder[b]) * Math.cos(reOrder[b])),
          (shape.y = 320 + 140 * (-Math.sin(reOrder[b]) - 1));
    }
    (a.x += 0.08 * (shape.x + 5 * Math.cos(a.angle) - a.x)),
      (a.y += 0.08 * (shape.y + 5 * Math.sin(a.angle) - a.y)),
      (a.angle += 0.08);
  }),
    [].forEach.call(nextText[isTextOpen], function(a, b) {
      (text[textReOrder[b]].x +=
        0.15 *
        (a.x + Math.cos(a.angle + b) * a.orbit - text[textReOrder[b]].x)),
        (text[textReOrder[b]].y +=
          0.15 *
          (a.y + Math.sin(a.angle + b) * a.orbit - text[textReOrder[b]].y)),
        (a.angle += 0.08);
    });
}

function update() {
  updataTransition(),
    [].forEach.call(particles, function(a, b) {
      if (((a.alpha += 0.05 * (a.maxAlpha - a.alpha)), a.hasBorn)) {
        if (
          ((a.radius += (0 - a.radius) * a.bornSpeed),
          0 === Math.round(a.radius))
        ) {
          var c = Math.floor((3 * b) / mainNum);
          (a.color =
            0 == currentLayout
              ? colors[randomNum[c]][
                  Math.floor(Math.random() * colors[currentLayout].length)
                ]
              : colors[currentLayout + 9][
                  Math.floor(Math.random() * colors[currentLayout].length)
                ]),
            (a.hasBorn = !1);
        }
      } else (a.radius += (a.maxRadius - a.radius) * a.bornSpeed), Math.round(a.radius) === a.maxRadius && (a.hasBorn = !0);
    }),
    [].forEach.call(text, function(a) {
      (a.alpha += 0.05 * (a.maxAlpha - a.alpha)),
        a.hasBorn &&
          ((a.radius += (0 - a.radius) * a.bornSpeed),
          0 === Math.round(a.radius) && (a.hasBorn = !1)),
        a.hasBorn ||
          ((a.radius += (a.maxRadius - a.radius) * a.bornSpeed),
          Math.round(a.radius) === a.maxRadius && (a.hasBorn = !0));
    });
}

function render() {
  // context.beginPath();
  // context.arc(
  //   canvas.width / 2 - avatarImg.width / 2,
  //   180 - avatarImg.height / 2,
  //   256, 0, 2*Math.PI, true
  //   );
  // context.closePath();
  // context.clip();
  // if (avatarImg.src != "") {
  //   context.globalAlpha = 0.8;
  //   context.drawImage(
  //     avatarImg,
  //     canvas.width / 2 - avatarImg.width / 2,
  //     180 - avatarImg.height / 2,
  //     avatarImg.width,
  //     avatarImg.height
  //   );
  //   context.globalAlpha = 1;
  //   context.restore();
  // }
  [].forEach.call(particles, function(a) {
    context.save(),
      (context.globalAlpha = a.alpha),
      (context.fillStyle = a.color),
      context.beginPath(),
      context.arc(a.x, a.y, a.radius, 0, 2 * Math.PI),
      context.fill(),
      context.restore();
  }),
    [].forEach.call(text, function(a) {
      context.save(),
        (context.globalAlpha = a.alpha),
        (context.fillStyle = textColor),
        context.beginPath(),
        context.arc(a.x, a.y, a.radius, 0, 2 * Math.PI),
        context.fill(),
        context.restore();
    });
}

function randomBetween(a, b) {
  return Math.floor(Math.random() * (b - a + 1) + a);
}

function randomOrder(a, b, c) {
  for (var d = 0, e = b; c > e; e++) a[e] = e;
  for (var e = c; e > b; e--) {
    d = randomBetween(b, e);
    var f = a[d];
    (a[d] = a[e - 1]), (a[e - 1] = f);
  }
}

function max(a, b) {
  return a > b ? a : b;
}

function showPic() {
  0 == status &&
    (currentLayout++,
    randomOrder(reOrder, 0, mainNum),
    2 > currentLayout && (currentLayout = 3),
    currentLayout > 5 && (currentLayout = 2));
}

function randomNumberArray() {
  var r = randomBetween(0, 180),
    s = parseInt(Math.floor(r / 10));
  randomNum[0] = parseInt(Math.floor(s / 10)) % 10;
  randomNum[1] = s % 10;
  randomNum[2] = parseInt(r % 10);
}

function showNum() {
  for (var a = 0; 3 > a; a++)
    randomOrder(reOrder, a * partNum, (a + 1) * partNum);
  randomNumberArray();
}
var self = window,
  halfX = 450,
  halfY = 250,
  isTextOpen = 0,
  textReOrder = [],
  textSeed,
  mainNum = 360,
  randomNum = [0, 0, 0],
  partNum = mainNum / 3,
  gap = 250,
  showLoop,
  numberLoop,
  canvas,
  context,
  particles = [],
  reOrder = [],
  maxHundredNum = 2,
  text = [],
  nextText = [[], []],
  shape = {},
  FPS = 60,
  type = ["circle", "ovals", "drop", "ribbon"],
  currentLayout = 3,
  status = 0,
  colors = [
    ["#e67e22", "#2c3e50"],
    ["#c0392b", "#ff7e15"],
    ["#1d75cf", "#3a5945"],
    ["#702744", "#f98d00"],
    ["#e67e22", "#2c3e50"],
    ["#c0392b", "#ff7e15"],
    ["#1d75cf", "#3a5945"],
    ["#702744", "#f98d00"],
    ["#e67e22", "#2c3e50"],
    ["#c0392b", "#ff7e15"],
    ["#e67e22", "#2c3e50"],
    ["#c0392b", "#ff7e15"],
    ["#1d75cf", "#3a5945"],
    ["#c0392b", "#ff7e15"],
    ["#702744", "#f98d00"]
  ];
window.onload = init;
