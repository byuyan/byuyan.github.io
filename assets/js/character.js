/* ============================================================
   CLAY CHARACTER — a hand-built 3D clay boy rendered with
   Three.js (r128, vendored). No external assets.

   Hero behaviour : head + gaze follow the pointer.
   Scroll behavior: a 3-act "loop" of head turns driven by the
                    scroll progress through the story section.
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("character-canvas");
  if (!canvas) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, value) {
    var x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  }

  function supportsWebGL() {
    try {
      var probe = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (probe.getContext("webgl2") || probe.getContext("webgl") || probe.getContext("experimental-webgl"))
      );
    } catch (error) {
      return false;
    }
  }

  if (!window.THREE || !supportsWebGL()) {
    document.documentElement.classList.add("no-webgl");
    return;
  }

  var THREE = window.THREE;

  /* ---------------------------------------------------------- */
  /*  Utilities                                                  */
  /* ---------------------------------------------------------- */

  function makeCanvas(size) {
    var c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    return c;
  }

  function noiseTexture(size, strength) {
    var c = makeCanvas(size);
    var ctx = c.getContext("2d");
    var image = ctx.createImageData(size, size);
    for (var i = 0; i < image.data.length; i += 4) {
      var v = 128 + (Math.random() - 0.5) * strength;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    var soft = makeCanvas(size);
    var sctx = soft.getContext("2d");
    sctx.filter = "blur(1.1px)";
    sctx.drawImage(c, 0, 0);
    var tex = new THREE.CanvasTexture(soft);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }

  var bumpMap = noiseTexture(256, 38);

  function srgbColor(value) {
    return new THREE.Color(value).convertSRGBToLinear();
  }

  function clay(color, roughness, metalness, extra) {
    var options = {
      color: srgbColor(color),
      roughness: roughness === undefined ? 0.78 : roughness,
      metalness: metalness || 0,
      bumpMap: bumpMap,
      bumpScale: 0.01,
      envMapIntensity: 0.38
    };
    if (extra) Object.keys(extra).forEach(function (key) { options[key] = extra[key]; });
    return new THREE.MeshStandardMaterial(options);
  }

  function ellipsoid(rx, ry, rz, material, segments) {
    var seg = segments || 40;
    var geometry = new THREE.SphereGeometry(1, seg, Math.max(16, Math.round(seg * 0.7)));
    geometry.scale(rx, ry, rz);
    return new THREE.Mesh(geometry, material);
  }

  function radialTexture(inner, outer) {
    var c = makeCanvas(256);
    var ctx = c.getContext("2d");
    var gradient = ctx.createRadialGradient(128, 128, 6, 128, 128, 126);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, outer);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    var texture = new THREE.CanvasTexture(c);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function stickerTexture(kind) {
    var size = 256;
    var c = makeCanvas(size);
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.lineJoin = "round";

    function roundedRect(x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }
    }

    if (kind === "star") {
      ctx.save();
      ctx.translate(128, 128);
      ctx.rotate(-0.1);
      ctx.beginPath();
      for (var i = 0; i < 10; i++) {
        var angle = (Math.PI / 5) * i - Math.PI / 2;
        var radius = i % 2 === 0 ? 94 : 41;
        var x = Math.cos(angle) * radius;
        var y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "#f4cd62";
      ctx.fill();
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#1d1e18";
      ctx.stroke();
      ctx.restore();
    } else if (kind === "ok") {
      ctx.save();
      ctx.translate(128, 128);
      ctx.rotate(0.12);
      roundedRect(-104, -74, 208, 148, 40);
      ctx.fillStyle = "#fbf9f4";
      ctx.fill();
      ctx.lineWidth = 11;
      ctx.strokeStyle = "#1d1e18";
      ctx.stroke();
      ctx.fillStyle = "#df6249";
      ctx.font = '700 82px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("OK", 0, 4);
      ctx.restore();
    } else if (kind === "patch01") {
      ctx.save();
      ctx.translate(128, 128);
      roundedRect(-104, -78, 208, 156, 30);
      ctx.fillStyle = "#85967a";
      ctx.fill();
      ctx.lineWidth = 9;
      ctx.strokeStyle = "#f3efe6";
      ctx.stroke();
      ctx.fillStyle = "#fbf9f4";
      ctx.font = '700 94px "Noto Serif SC", "Songti SC", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("01", 0, 5);
      ctx.restore();
    }

    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  /* ---------------------------------------------------------- */
  /*  Renderer / scene                                           */
  /* ---------------------------------------------------------- */

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    document.documentElement.classList.add("no-webgl");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.18, 11.2);
  camera.lookAt(0, 0.18, 0);

  /* Soft studio environment for gentle clay reflections. */
  (function buildEnvironment() {
    var c = makeCanvas(512);
    c.height = 256;
    var ctx = c.getContext("2d");
    var gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#fff4e2");
    gradient.addColorStop(0.42, "#e6e1d0");
    gradient.addColorStop(0.7, "#9caa90");
    gradient.addColorStop(1, "#59634f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    var glow = ctx.createRadialGradient(350, 80, 8, 350, 80, 150);
    glow.addColorStop(0, "rgba(255,242,214,0.95)");
    glow.addColorStop(1, "rgba(255,242,214,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 256);
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    pmrem.dispose();
  })();

  scene.add(new THREE.HemisphereLight(0xfff1da, 0x59634f, 0.42));

  var keyLight = new THREE.DirectionalLight(0xffeccf, 1.5);
  keyLight.position.set(4.2, 5.4, 6.4);
  scene.add(keyLight);

  var fillLight = new THREE.DirectionalLight(0xb9d7db, 0.38);
  fillLight.position.set(-5.4, 1.1, 5);
  scene.add(fillLight);

  var rimLight = new THREE.DirectionalLight(0xffc9a0, 0.95);
  rimLight.position.set(-3.4, 4.2, -4.8);
  scene.add(rimLight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.1));

  /* ---------------------------------------------------------- */
  /*  Materials                                                  */
  /* ---------------------------------------------------------- */

  /* Visual direction for the real-person likeness. Toggle these if you
     want to bring back the original glasses / sticker styling. */
  var LOOK = {
    glasses: true,
    stickers: true,
    blush: true
  };

  var skinMat = clay(0xe6b497, 0.66);
  var skinWarmMat = clay(0xd6a084, 0.72);
  var earInnerMat = clay(0xc98f78, 0.8);
  var hairMat = clay(0x171614, 0.78);
  var hairSoftMat = clay(0x201e1c, 0.82);
  var shirtMat = clay(0x1c1b19, 0.9);
  var shirtShadeMat = clay(0x111110, 0.9);
  var collarMat = clay(0x2b2b27, 0.82);
  var frameMat = new THREE.MeshStandardMaterial({
    color: srgbColor(0x161715),
    roughness: 0.3,
    metalness: 0.32,
    envMapIntensity: 0.55
  });
  var lensMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf1f8f6),
    transparent: true,
    opacity: 0.12,
    roughness: 0.05,
    metalness: 0,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  var eyeWhiteMat = clay(0xf4eee2, 0.34);
  var irisMat = clay(0x2f241b, 0.4);
  var pupilMat = new THREE.MeshStandardMaterial({
    color: srgbColor(0x0b0908),
    roughness: 0.22
  });
  var glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var browMat = clay(0x1d1713, 0.55);
  var mouthMat = clay(0x8b4c44, 0.6);
  var lipMat = clay(0x9c5a52, 0.62);
  var freckleMat = clay(0xbb7c63, 0.6);
  var blushMat = new THREE.MeshBasicMaterial({
    map: radialTexture("rgba(199,86,72,0.52)", "rgba(199,86,72,0)"),
    transparent: true,
    depthWrite: false,
    opacity: 0.5
  });

  /* ---------------------------------------------------------- */
  /*  Character                                                  */
  /* ---------------------------------------------------------- */

  var character = new THREE.Group();
  character.scale.setScalar(1);
  character.position.y = 0;
  scene.add(character);

  /* ---- torso: a single lathed bust, so shoulders and chest read as one ---- */
  var torsoProfile = [
    [1.15, -2.62],
    [1.3, -2.2],
    [1.38, -1.8],
    [1.42, -1.4],
    [1.4, -1.0],
    [1.28, -0.7],
    [1.0, -0.5],
    [0.62, -0.33],
    [0.42, -0.24],
    [0.4, -0.17]
  ].map(function (p) {
    return new THREE.Vector2(p[0], p[1]);
  });
  var torsoGeometry = new THREE.LatheGeometry(torsoProfile, 80);
  var chest = new THREE.Mesh(torsoGeometry, shirtMat);
  chest.scale.z = 0.62;
  character.add(chest);

  /* neck */
  var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.36, 48), skinWarmMat);
  neck.position.set(0, -0.1, 0);
  character.add(neck);

  /* collar — sits just above the shirt line so the neckline reads */
  var collar = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.075, 18, 56), collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, -0.18, 0);
  collar.scale.set(1.04, 0.92, 1);
  character.add(collar);

  /* chest patch */
  var patchMaterial = new THREE.MeshBasicMaterial({
    map: stickerTexture("patch01"),
    transparent: true,
    depthWrite: false,
    toneMapped: false
  });
  var patch = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), patchMaterial);
  patch.position.set(0.47, -1.25, 0.89);
  patch.rotation.set(-0.18, -0.34, -0.05);
  patch.renderOrder = 3;
  character.add(patch);

  /* ---- head pivot ---- */
  var headPivot = new THREE.Group();
  headPivot.position.set(0, 0.6, 0);
  character.add(headPivot);

  var head = new THREE.Group();
  head.position.set(0, 0.55, 0);
  headPivot.add(head);

  var headGeometry = new THREE.SphereGeometry(1, 96, 96);
  (function shapeHead() {
    var position = headGeometry.attributes.position;
    for (var i = 0; i < position.count; i++) {
      var x = position.getX(i);
      var y = position.getY(i);
      var z = position.getZ(i);
      if (y < 0) {
        var t = Math.pow(-y, 1.2);
        x *= 1 - 0.22 * t;
        z *= 1 - 0.15 * t;
      }
      if (z < 0) z *= 0.95;
      position.setXYZ(i, x, y, z);
    }
    headGeometry.computeVertexNormals();
  })();

  var headMesh = new THREE.Mesh(headGeometry, skinMat);
  headMesh.scale.set(0.99, 1.1, 0.99);
  head.add(headMesh);

  /* ears */
  [-1, 1].forEach(function (side) {
    var ear = ellipsoid(0.13, 0.24, 0.11, skinMat, 32);
    ear.position.set(side * 0.93, 0.03, 0.02);
    ear.rotation.z = side * 0.1;
    head.add(ear);

    var inner = ellipsoid(0.06, 0.12, 0.04, earInnerMat, 24);
    inner.position.set(side * 0.94, 0.02, 0.09);
    head.add(inner);
  });

  /* ---- hair ---- */
  var hair = new THREE.Group();
  hair.position.y = 0.05;
  hair.rotation.z = -0.04;
  head.add(hair);

  var cap = new THREE.Mesh(
    new THREE.SphereGeometry(1.04, 80, 56, 0, Math.PI * 2, 0, Math.PI * 0.38),
    hairMat
  );
  cap.scale.set(1, 1.06, 1);
  hair.add(cap);

  var backHair = ellipsoid(0.99, 0.82, 0.62, hairMat, 48);
  backHair.position.set(0, 0.04, -0.48);
  hair.add(backHair);

  var nape = ellipsoid(0.6, 0.3, 0.34, hairMat, 32);
  nape.position.set(0, -0.44, -0.6);
  hair.add(nape);

  [-1, 1].forEach(function (side) {
    var sideHair = ellipsoid(0.2, 0.46, 0.42, hairSoftMat, 32);
    sideHair.position.set(side * 0.89, 0.2, -0.14);
    sideHair.rotation.z = side * -0.14;
    hair.add(sideHair);

    var sideburn = ellipsoid(0.085, 0.22, 0.1, hairMat, 24);
    sideburn.position.set(side * 0.94, -0.02, 0.2);
    hair.add(sideburn);
  });

  /* A soft swept fringe built from a few large overlapping locks. */
  var locks = [
    [-0.78, 0.55, 0.58, 0.33, 0.24, 0.2, 0.52],
    [-0.52, 0.53, 0.71, 0.37, 0.25, 0.22, 0.36],
    [-0.24, 0.56, 0.79, 0.4, 0.22, 0.23, 0.18],
    [0.04, 0.53, 0.81, 0.42, 0.24, 0.24, 0.02],
    [0.32, 0.56, 0.78, 0.39, 0.22, 0.23, -0.18],
    [0.58, 0.54, 0.68, 0.35, 0.24, 0.21, -0.36],
    [0.8, 0.56, 0.55, 0.3, 0.21, 0.2, -0.52]
  ];
  locks.forEach(function (d) {
    var lock = ellipsoid(d[3], d[4], d[5], hairMat, 40);
    lock.position.set(d[0], d[1], d[2]);
    lock.rotation.set(0.08, 0.02, d[6]);
    hair.add(lock);
  });

  /* Pointed tips break the clean edge of the fringe. */
  function strand(rx, ry, rz, mat) {
    var geometry = new THREE.SphereGeometry(1, 32, 24);
    var position = geometry.attributes.position;
    for (var i = 0; i < position.count; i++) {
      var y = position.getY(i);
      var taper = 0.35 + 0.65 * ((y + 1) / 2);
      position.setX(i, position.getX(i) * taper);
      position.setZ(i, position.getZ(i) * taper);
    }
    geometry.scale(rx, ry, rz);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, mat);
  }

  [
    [-0.7, 0.34, 0.72, 0.1, 0.2, 0.1, 0.6],
    [-0.45, 0.32, 0.79, 0.11, 0.21, 0.1, 0.4],
    [-0.16, 0.34, 0.83, 0.1, 0.22, 0.1, 0.2],
    [0.14, 0.31, 0.83, 0.11, 0.21, 0.1, -0.1],
    [0.42, 0.34, 0.78, 0.1, 0.2, 0.1, -0.32],
    [0.66, 0.35, 0.7, 0.1, 0.19, 0.1, -0.5]
  ].forEach(function (d) {
    var tip = strand(d[3], d[4], d[5], hairSoftMat);
    tip.position.set(d[0], d[1], d[2]);
    tip.rotation.z = d[6];
    hair.add(tip);
  });

  /* ---- face ---- */
  /* almond-shaped eyes, closer to the reference than the old doll eyes */
  function almondShape(width, height) {
    var shape = new THREE.Shape();
    shape.moveTo(-width, 0);
    shape.quadraticCurveTo(0, height * 1.35, width, 0);
    shape.quadraticCurveTo(0, -height * 1.35, -width, 0);
    return shape;
  }

  var eyes = [];
  [-1, 1].forEach(function (side) {
    var eye = new THREE.Group();
    eye.position.set(side * 0.38, 0.12, 0.995);
    eye.rotation.y = side * -0.12;

    var white = new THREE.Mesh(new THREE.ShapeGeometry(almondShape(0.18, 0.062), 24), eyeWhiteMat);
    eye.add(white);

    var irisGroup = new THREE.Group();
    irisGroup.position.z = 0.008;

    var iris = ellipsoid(0.082, 0.088, 0.018, irisMat, 32);
    irisGroup.add(iris);

    var pupil = ellipsoid(0.04, 0.046, 0.012, pupilMat, 24);
    pupil.position.z = 0.012;
    irisGroup.add(pupil);

    var glint = ellipsoid(0.016, 0.018, 0.008, glintMat, 16);
    glint.position.set(0.022, 0.032, 0.02);
    irisGroup.add(glint);

    eye.add(irisGroup);
    eye.userData.iris = irisGroup;
    head.add(eye);
    eyes.push(eye);
  });

  /* thick, straight brows like the reference */
  [-1, 1].forEach(function (side) {
    var inner = ellipsoid(0.115, 0.047, 0.052, browMat, 24);
    inner.position.set(side * 0.29, 0.378, 0.99);
    inner.rotation.set(0.08, 0, side * -0.03);
    head.add(inner);

    var outer = ellipsoid(0.13, 0.04, 0.048, browMat, 24);
    outer.position.set(side * 0.5, 0.37, 0.96);
    outer.rotation.set(0.08, 0, side * -0.1);
    head.add(outer);
  });

  /* straight nose bridge + a defined tip */
  var noseBridge = ellipsoid(0.07, 0.17, 0.09, skinWarmMat, 32);
  noseBridge.position.set(0, 0.02, 0.94);
  head.add(noseBridge);

  var noseTip = ellipsoid(0.09, 0.07, 0.078, skinWarmMat, 24);
  noseTip.position.set(0, -0.085, 1.02);
  head.add(noseTip);

  /* full lips with a cupid's bow */
  var upperLeft = ellipsoid(0.075, 0.03, 0.04, lipMat, 24);
  upperLeft.position.set(-0.045, -0.33, 0.958);
  upperLeft.rotation.z = 0.18;
  head.add(upperLeft);

  var upperRight = ellipsoid(0.075, 0.03, 0.04, lipMat, 24);
  upperRight.position.set(0.045, -0.33, 0.958);
  upperRight.rotation.z = -0.18;
  head.add(upperRight);

  var mouthLine = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.009, 10, 28, Math.PI), mouthMat);
  mouthLine.rotation.z = Math.PI;
  mouthLine.rotation.x = -0.12;
  mouthLine.position.set(0, -0.342, 0.978);
  head.add(mouthLine);

  var lowerLip = ellipsoid(0.105, 0.045, 0.038, lipMat, 22);
  lowerLip.position.set(0, -0.392, 0.955);
  head.add(lowerLip);

  if (LOOK.blush) {
    [-1, 1].forEach(function (side) {
      var blush = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.3), blushMat);
      blush.position.set(side * 0.53, -0.25, 0.86);
      blush.rotation.y = side * -0.42;
      blush.rotation.z = side * 0.06;
      head.add(blush);
    });
  }

  /* ---- glasses (kept behind a flag for the original styling) ---- */
  if (LOOK.glasses) {
    function roundedRectShape(width, height, radius) {
    var shape = new THREE.Shape();
    var x = -width / 2;
    var y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }

  function glassesFrameGeometry(width, height, radius, thickness) {
    var outer = roundedRectShape(width, height, radius);
    var inner = roundedRectShape(width - thickness * 2, height - thickness * 2, Math.max(0.02, radius - thickness));
    outer.holes.push(new THREE.Path(inner.getPoints(24)));
    var geometry = new THREE.ExtrudeGeometry(outer, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      bevelSegments: 2,
      curveSegments: 20
    });
    geometry.center();
    return geometry;
  }

  var glasses = new THREE.Group();
  glasses.position.set(0, 0.1, 1.035);
  head.add(glasses);

  [-1, 1].forEach(function (side) {
    var lensGroup = new THREE.Group();
    lensGroup.position.x = side * 0.38;
    lensGroup.rotation.y = side * -0.15;

    var frame = new THREE.Mesh(glassesFrameGeometry(0.7, 0.5, 0.17, 0.052), frameMat);
    lensGroup.add(frame);

    var lens = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(0.6, 0.4, 0.13), 20), lensMat);
    lens.position.z = 0.003;
    lensGroup.add(lens);

    glasses.add(lensGroup);

    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.92, 12), frameMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(side * 0.73, 0.02, -0.4);
    glasses.add(arm);
  });

  var bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.18, 12), frameMat);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.06, 0.1);
  glasses.add(bridge);
  }

  /* ---- stickers (kept behind a flag for the original styling) ---- */
  if (LOOK.stickers) {
    function addSticker(texture, width, height, position, rotation) {
    var material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false
    });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.copy(position);
    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    mesh.renderOrder = 4;
    head.add(mesh);
    return mesh;
  }

  addSticker(
    stickerTexture("star"),
    0.22,
    0.22,
    new THREE.Vector3(-0.58, -0.33, 0.80),
    { x: 0, y: -0.42, z: 0.2 }
  );

  addSticker(
    stickerTexture("ok"),
    0.26,
    0.2,
    new THREE.Vector3(0.56, -0.34, 0.78),
    { x: 0, y: 0.42, z: -0.06 }
  );
  }

  /* ---------------------------------------------------------- */
  /*  Motion state                                               */
  /* ---------------------------------------------------------- */

  var pointer = { x: 0, y: 0 };
  var smoothPointer = { x: 0, y: 0 };
  var storyProgress = 0;
  var storyActive = false;
  var running = true;
  var lastTime = 0;
  var elapsed = 0;
  var baseDistance = 11.2;
  var baseFov = 28;

  var blink = { next: 2.4, until: 0, start: 0 };

  var POSES = [
    { p: 0.0, yaw: 0.0, pitch: 0.0, body: 0.0, z: 0.0, y: 0.0 },
    { p: 0.16, yaw: 0.5, pitch: -0.06, body: 0.1, z: -0.18, y: 0.02 },
    { p: 0.4, yaw: 0.08, pitch: -0.28, body: 0.03, z: -0.08, y: -0.04 },
    { p: 0.64, yaw: -0.5, pitch: -0.02, body: -0.1, z: -0.16, y: 0.01 },
    { p: 0.84, yaw: -0.06, pitch: 0.24, body: -0.02, z: 0.02, y: 0.03 },
    { p: 1.0, yaw: 0.0, pitch: 0.0, body: 0.0, z: 0.0, y: 0.0 }
  ];

  function samplePoses(progress) {
    var p = clamp(progress, 0, 1);
    for (var i = 0; i < POSES.length - 1; i++) {
      var a = POSES[i];
      var b = POSES[i + 1];
      if (p >= a.p && p <= b.p) {
        var t = smoothstep(a.p, b.p, p);
        return {
          yaw: lerp(a.yaw, b.yaw, t),
          pitch: lerp(a.pitch, b.pitch, t),
          body: lerp(a.body, b.body, t),
          z: lerp(a.z, b.z, t),
          y: lerp(a.y, b.y, t)
        };
      }
    }
    return POSES[POSES.length - 1];
  }

  function updateEyes(lookX, lookY) {
    eyes.forEach(function (eye) {
      eye.userData.iris.position.x = lookX * 0.04;
      eye.userData.iris.position.y = lookY * 0.03;
    });
  }

  function updateBlink(time) {
    if (time > blink.next) {
      blink.start = time;
      blink.until = time + 0.15;
      blink.next = time + 2.8 + Math.random() * 4.2;
    }
    var scale = 1;
    if (time < blink.until) {
      var t = (time - blink.start) / 0.15;
      scale = 1 - Math.sin(t * Math.PI) * 0.9;
    }
    eyes.forEach(function (eye) {
      eye.scale.y = scale;
      eye.position.z = 0.865 + (1 - scale) * 0.012;
    });
  }

  function tick(time) {
    if (!running) {
      lastTime = time;
      return;
    }
    var delta = Math.min((time - lastTime) / 1000 || 0.016, 0.05);
    lastTime = time;
    elapsed += delta;

    smoothPointer.x += (pointer.x - smoothPointer.x) * 0.08;
    smoothPointer.y += (pointer.y - smoothPointer.y) * 0.08;

    var pose = samplePoses(storyProgress);
    var pointerWeight = 1 - smoothstep(0.005, 0.12, storyProgress);
    var idleLookX = Math.sin(elapsed * 0.37) * 0.1 * (1 - pointerWeight);
    var idleLookY = Math.cos(elapsed * 0.29) * 0.07 * (1 - pointerWeight);

    var targetYaw = pose.yaw + (smoothPointer.x * 0.32 + idleLookX) * pointerWeight;
    var targetPitch = pose.pitch + (-smoothPointer.y * 0.2 + idleLookY) * pointerWeight;

    if (!storyActive) {
      targetYaw = smoothPointer.x * 0.33 + Math.sin(elapsed * 0.32) * 0.045;
      targetPitch = -smoothPointer.y * 0.21 + Math.cos(elapsed * 0.27) * 0.025;
    }

    var breath = Math.sin(elapsed * 1.25) * 0.012;
    headPivot.rotation.y += (targetYaw - headPivot.rotation.y) * 0.07;
    headPivot.rotation.x += (targetPitch - headPivot.rotation.x) * 0.07;
    headPivot.rotation.z += (-smoothPointer.x * 0.018 - headPivot.rotation.z) * 0.06;
    headPivot.position.y = 0.6 + breath;
    head.position.y = 0.55 + Math.sin(elapsed * 1.25 + 0.2) * 0.005;

    character.rotation.y += (pose.body - character.rotation.y) * 0.05;
    character.position.y = Math.sin(elapsed * 1.15) * 0.008;

    camera.position.z += (baseDistance + pose.z - camera.position.z) * 0.045;
    camera.position.y += (0.18 + pose.y - camera.position.y) * 0.045;
    camera.lookAt(0, 0.16, 0);

    updateEyes(smoothPointer.x, -smoothPointer.y);
    updateBlink(elapsed);

    keyLight.position.x = 4.2 + Math.sin(elapsed * 0.22) * 0.3;
    rimLight.intensity = 0.95 + Math.sin(elapsed * 0.4) * 0.06;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------- */
  /*  Sizing                                                     */
  /* ---------------------------------------------------------- */

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(1, rect.width);
    var height = Math.max(1, rect.height);
    var aspect = width / height;
    var mobile = window.innerWidth <= 860;
    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    baseDistance = mobile ? 9.4 : 11.2;
    baseFov = mobile ? 30 : 28;
    camera.fov = baseFov;
    character.scale.setScalar(mobile ? 0.96 : 1);
    camera.updateProjectionMatrix();
    if (!running) {
      camera.position.z = baseDistance;
      camera.position.y = 0.18;
      renderer.render(scene, camera);
    }
  }

  var resizeObserver = null;
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
  }
  window.addEventListener("resize", resize);

  window.addEventListener(
    "pointermove",
    function (event) {
      if (event.pointerType === "touch") return;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", function () {
    pointer.x = 0;
    pointer.y = 0;
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      lastTime = performance.now();
      window.requestAnimationFrame(tick);
    }
  });

  /* Public API used by site.js */
  window.ClayCharacter = {
    setStory: function (progress, active) {
      storyProgress = clamp(progress, 0, 1);
      storyActive = !!active;
    },
    setRunning: function (value) {
      if (reduceMotion) return;
      var next = !!value;
      if (next === running) return;
      running = next;
      if (running) {
        lastTime = performance.now();
        window.requestAnimationFrame(tick);
      }
    },
    resize: resize
  };

  resize();
  if (reduceMotion) {
    running = false;
    storyProgress = 0;
    renderer.render(scene, camera);
    lastTime = performance.now();
    return;
  }
  window.requestAnimationFrame(function (time) {
    lastTime = time;
    tick(time);
  });
})();
