/* ============================================================
   LIQUID ORB
   A small, dependency-free WebGL glass orb used in the About
   triptych and the Contact section. It keeps the language of the
   reference orb (flowing glass interior, rim light, thinking
   state) but uses the site's sage / cream / coral palette.
   ============================================================ */

(function () {
  "use strict";

  var VERT = [
    "attribute vec2 aPos;",
    "void main() {",
    "  gl_Position = vec4(aPos, 0.0, 1.0);",
    "}"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uTime;",
    "uniform float uState;",
    "uniform vec2 uPointer;",
    "",
    "float hash(vec2 p) {",
    "  p = fract(p * vec2(123.34, 345.45));",
    "  p += dot(p, p + 34.345);",
    "  return fract(p.x * p.y);",
    "}",
    "",
    "float noise(vec2 p) {",
    "  vec2 i = floor(p);",
    "  vec2 f = fract(p);",
    "  f = f * f * (3.0 - 2.0 * f);",
    "  float a = hash(i);",
    "  float b = hash(i + vec2(1.0, 0.0));",
    "  float c = hash(i + vec2(0.0, 1.0));",
    "  float d = hash(i + vec2(1.0, 1.0));",
    "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
    "}",
    "",
    "float fbm(vec2 p) {",
    "  float value = 0.0;",
    "  float amp = 0.55;",
    "  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);",
    "  for (int i = 0; i < 4; i++) {",
    "    value += amp * noise(p);",
    "    p = rot * p * 2.03 + 11.7;",
    "    amp *= 0.5;",
    "  }",
    "  return value / 1.03125;",
    "}",
    "",
    "void main() {",
    "  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y);",
    "  float R = 0.82;",
    "  float r = length(uv);",
    "  float aa = 1.6 / min(uRes.x, uRes.y);",
    "  float body = smoothstep(R + aa, R - aa, r);",
    "  if (body <= 0.001) {",
    "    gl_FragColor = vec4(0.0);",
    "    return;",
    "  }",
    "",
    "  float z = sqrt(max(1.0 - (r * r) / (R * R), 0.0));",
    "  vec3 normal = normalize(vec3(uv / R, z));",
    "",
    "  float t = uTime * (0.11 + 0.5 * uState);",
    "  vec2 p = uv / R;",
    "  vec2 warp = vec2(",
    "    fbm(p * 1.55 + vec2(t * 0.72, -t * 0.34)),",
    "    fbm(p * 1.55 + vec2(4.7 - t * 0.23, t * 0.47))",
    "  );",
    "  p += (warp - 0.5) * (0.42 + 0.22 * uState);",
    "",
    "  float f1 = fbm(p * 2.05 + vec2(t * 0.65, -t * 0.44));",
    "  float f2 = fbm(p * 3.35 + f1 * 1.35 + vec2(-t * 0.36, t * 0.31));",
    "  float flow = clamp(f1 * 0.68 + f2 * 0.5 - 0.12, 0.0, 1.0);",
    "",
    "  vec3 deep = vec3(0.012, 0.030, 0.036);",
    "  vec3 teal = vec3(0.075, 0.255, 0.245);",
    "  vec3 sage = vec3(0.46, 0.60, 0.51);",
    "  vec3 cream = vec3(0.96, 0.94, 0.87);",
    "  vec3 coral = vec3(0.87, 0.34, 0.24);",
    "",
    "  vec3 color = mix(deep, teal, smoothstep(0.12, 0.78, flow));",
    "  color = mix(color, sage, smoothstep(0.52, 0.92, f2) * 0.62);",
    "  color = mix(color, cream, smoothstep(0.78, 1.0, f1) * 0.34);",
    "  color = mix(color, coral, smoothstep(0.86, 1.0, f2) * 0.22);",
    "",
    "  vec3 lightDir = normalize(vec3(",
    "    -0.46 + uPointer.x * 0.22,",
    "    0.56 - uPointer.y * 0.2,",
    "    0.78",
    "  ));",
    "  vec3 viewDir = vec3(0.0, 0.0, 1.0);",
    "  vec3 halfDir = normalize(lightDir + viewDir);",
    "  float diffuse = max(dot(normal, lightDir), 0.0);",
    "  float specular = pow(max(dot(normal, halfDir), 0.0), 90.0);",
    "  float fresnel = pow(1.0 - max(normal.z, 0.0), 2.7);",
    "",
    "  color += cream * diffuse * 0.14;",
    "  color += cream * specular * 0.52;",
    "  color += mix(sage, cream, fresnel) * fresnel * 0.9;",
    "",
    "  float ring = smoothstep(0.010, 0.0, abs(r - R * 0.985));",
    "  color += cream * ring * 0.4;",
    "  float outerRim = smoothstep(0.012, 0.0, abs(r - R + 0.006));",
    "  color = mix(color, mix(sage, cream, 0.72), outerRim * 0.55);",
    "",
    "  float vein = smoothstep(0.72, 1.0, f1) * (0.4 + 0.6 * smoothstep(0.2, 0.9, f2));",
    "  color = mix(color, cream, vein * 0.2);",
    "  float caustic = pow(0.5 + 0.5 * sin(f2 * 13.0 + r * 9.0 - uTime * 0.65), 6.0);",
    "  color += sage * caustic * 0.10;",
    "",
    "  float thinkWave = 0.5 + 0.5 * sin(uTime * 2.2 - r * 14.0 + f1 * 4.0);",
    "  color += mix(coral, cream, 0.4) * thinkWave * 0.065 * uState;",
    "",
    "  float edgeShade = smoothstep(R * 0.74, R, r);",
    "  color *= mix(1.0, 0.35, edgeShade);",
    "  color *= 1.0 - smoothstep(R * 0.9, R, r) * 0.18;",
    "",
    "  float highlight = pow(max(dot(normal, normalize(vec3(-0.55, 0.72, 0.7))), 0.0), 32.0);",
    "  color += cream * highlight * 0.22;",
    "  float warmBounce = pow(max(dot(normal, normalize(vec3(0.55, -0.65, 0.6))), 0.0), 20.0);",
    "  color += coral * warmBounce * 0.08;",
    "",
    "  float grain = hash(gl_FragCoord.xy + uTime * 31.0) - 0.5;",
    "  color += grain * 0.018;",
    "",
    "  color = pow(clamp(color, 0.0, 1.0), vec3(0.94));",
    "  float alpha = body * 0.97;",
    "  gl_FragColor = vec4(color, alpha);",
    "}"
  ].join("\n");

  function createOrb(canvas, options) {
    var settings = options || {};
    var gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "low-power"
    }) || canvas.getContext("experimental-webgl", { alpha: true, antialias: true });

    if (!gl) {
      canvas.classList.add("is-fallback");
      canvas.setAttribute("data-fallback", "true");
      return null;
    }

    function compile(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("[LiquidOrb] shader error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vsh = compile(gl.VERTEX_SHADER, VERT);
    var fsh = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vsh || !fsh) {
      canvas.classList.add("is-fallback");
      return null;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vsh);
    gl.attachShader(program, fsh);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[LiquidOrb] link error:", gl.getProgramInfoLog(program));
      canvas.classList.add("is-fallback");
      return null;
    }
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(program, "uRes");
    var uTime = gl.getUniformLocation(program, "uTime");
    var uState = gl.getUniformLocation(program, "uState");
    var uPointer = gl.getUniformLocation(program, "uPointer");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var state = 0;
    var targetState = reduced ? 0 : 0;
    var time = 0;
    var last = 0;
    var pointer = { x: 0, y: 0 };
    var targetPointer = { x: 0, y: 0 };
    var running = true;
    var visible = true;
    var raf = 0;
    var stateTimer = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      var width = Math.max(1, Math.round(rect.width * dpr));
      var height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    }

    function draw(now) {
      if (!running || !visible) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      time += dt * (1.0 + (targetState - state) * 0.25);
      state += (targetState - state) * Math.min(1, dt * 6);
      pointer.x += (targetPointer.x - pointer.x) * 0.07;
      pointer.y += (targetPointer.y - pointer.y) * 0.07;

      resize();
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 1.8 : time);
      gl.uniform1f(uState, state);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = window.requestAnimationFrame(draw);
    }

    function start() {
      if (running && visible) {
        running = false;
        last = 0;
        raf = window.requestAnimationFrame(function (now) {
          running = true;
          draw(now);
        });
      }
    }

    function stop() {
      running = false;
      window.cancelAnimationFrame(raf);
    }

    canvas.addEventListener("pointermove", function (event) {
      var rect = canvas.getBoundingClientRect();
      targetPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      targetPointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    });

    canvas.addEventListener("pointerleave", function () {
      targetPointer.x = 0;
      targetPointer.y = 0;
    });

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      }, { threshold: 0.05 }).observe(canvas);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    resize();
    start();

    var instance = {
      canvas: canvas,
      setState: function (next, duration) {
        targetState = next === "thinking" ? 1 : 0;
        window.clearTimeout(stateTimer);
        if (duration) {
          stateTimer = window.setTimeout(function () {
            targetState = 0;
          }, duration);
        }
        canvas.setAttribute("data-state", next || "idle");
      },
      pulse: function (duration) {
        this.setState("thinking", duration || 2200);
      },
      start: start,
      stop: stop,
      destroy: function () {
        stop();
        gl.useProgram(null);
        gl.deleteProgram(program);
        gl.deleteBuffer(buffer);
      }
    };

    if (settings.autoThink) {
      window.setTimeout(function () {
        instance.pulse(1600);
      }, 1800);
    }

    return instance;
  }

  var instances = {};

  /* The user-provided WebGPU orb is preferred. It is the original animated
     liquid glass shader; the small WebGL orb above is only a fallback for
     browsers without WebGPU. */
  function createWebGPUOrb(canvas) {
    if (!navigator.gpu || typeof window.createLiquidOrbWebGPU !== "function") return null;
    var original = null;
    try {
      original = window.createLiquidOrbWebGPU(canvas, {});
    } catch (error) {
      console.warn("[LiquidOrb] WebGPU init failed:", error);
      return null;
    }
    if (!original) return null;

    var timer = 0;
    var instance = {
      canvas: canvas,
      ready: original.ready,
      setState: function (next, duration) {
        window.clearTimeout(timer);
        original.setState(next === "thinking" ? "thinking" : "idle");
        canvas.setAttribute("data-state", next || "idle");
        if (duration) {
          timer = window.setTimeout(function () {
            original.setState("idle");
            canvas.setAttribute("data-state", "idle");
          }, duration);
        }
      },
      pulse: function (duration) {
        this.setState("thinking", duration || 2200);
      },
      stop: function () {
        if (original.stop) original.stop();
      },
      destroy: function () {
        window.clearTimeout(timer);
        if (original.stop) original.stop();
      }
    };

    if ("IntersectionObserver" in window && original.pause && original.resume) {
      original.pause();
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) original.resume();
        else original.pause();
      }, { threshold: 0.05 }).observe(canvas);
    }

    return instance;
  }

  async function init() {
    var nodes = document.querySelectorAll("[data-orb]");
    for (var i = 0; i < nodes.length; i += 1) {
      var canvas = nodes[i];
      var name = canvas.getAttribute("data-orb") || "orb";
      var instance = null;

      if (navigator.gpu && typeof window.createLiquidOrbWebGPU === "function") {
        try {
          var adapter = await navigator.gpu.requestAdapter();
          if (adapter) instance = createWebGPUOrb(canvas);
        } catch (error) {
          instance = null;
        }
      }

      if (!instance) {
        instance = createOrb(canvas, { autoThink: canvas.hasAttribute("data-orb-auto") });
      }

      if (instance) {
        instances[name] = instance;
        canvas.setAttribute("data-orb-ready", "true");
      }
    }
  }

  window.LiquidOrb = {
    instances: instances,
    init: init,
    get: function (name) {
      return instances[name] || null;
    },
    setState: function (name, state, duration) {
      if (instances[name]) instances[name].setState(state, duration);
    },
    pulse: function (name, duration) {
      if (instances[name]) instances[name].pulse(duration);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
