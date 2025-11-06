/*
 * Stripe WebGl Gradient Animation
 * All Credits to https://whatamesh.vercel.app/
 */

class Gradient {
  constructor(...args) {
    this.el = args[0];
    this.cssVarRetries = 0;
    this.maxCssVarRetries = 200;
    this.angle = 0;
    this.isLoadedClass = false;
    this.isScrolling = false;
    /*
    *   @property Seed {Number}
    */
    this.seed = 5;
    /*
    *   @property Vertical Spacing {Number}
    */
    this.freqX = 14e-5;
    /*
    *   @property Horizontal Spacing {Number}
    */
    this.freqY = 29e-5;
    /*
    *   @property Color 1 {String}
    */
    this.colors = ["rgb(169, 96, 238)", "rgb(255, 51, 61)", "rgb(144, 224, 255)", "rgb(255, 203, 87)"];
    this.minRefresh = 10;
    /*
    *   @property Animation Speed {Number}
    */
    this.speed = 2;
    this.playing = true;
  }

  connect() {
    this.canvas = this.el;
    this.gl = this.canvas.getContext("webgl", { antialias: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.initShaders();
    this.initGradient();
    requestAnimationFrame(this.animate.bind(this));
  }

  initGradient() {
    this.initMesh();
    this.resize();
    requestAnimationFrame(this.animate.bind(this));
    window.addEventListener("resize", this.resize.bind(this));
  }

  initMesh() {
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
    this.positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW);
    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `);
    this.gl.compileShader(vertexShader);
    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragmentShader, `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      uniform vec3 u_color4;
      uniform float u_freqX;
      uniform float u_freqY;
      uniform float u_seed;

      // Noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

      float cnoise(vec3 P) {
        vec3 Pi0 = floor(P);
        vec3 Pi1 = Pi0 + vec3(1.0);
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;
        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);
        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);
        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;
        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);
        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float noise1 = cnoise(vec3(uv * u_freqX * 1000.0, u_time * 0.0001 + u_seed));
        float noise2 = cnoise(vec3(uv * u_freqY * 1000.0, u_time * 0.0001 + u_seed + 100.0));
        
        vec3 color1 = u_color1 * (0.5 + 0.5 * noise1);
        vec3 color2 = u_color2 * (0.5 + 0.5 * noise2);
        vec3 color3 = u_color3 * (0.5 + 0.5 * cnoise(vec3(uv * u_freqX * 500.0, u_time * 0.0001 + u_seed + 200.0)));
        vec3 color4 = u_color4 * (0.5 + 0.5 * cnoise(vec3(uv * u_freqY * 500.0, u_time * 0.0001 + u_seed + 300.0)));
        
        vec3 finalColor = mix(mix(color1, color2, uv.x), mix(color3, color4, uv.x), uv.y);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `);
    this.gl.compileShader(fragmentShader);
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    this.gl.useProgram(this.program);
    const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.uniforms = {
      time: this.gl.getUniformLocation(this.program, "u_time"),
      resolution: this.gl.getUniformLocation(this.program, "u_resolution"),
      color1: this.gl.getUniformLocation(this.program, "u_color1"),
      color2: this.gl.getUniformLocation(this.program, "u_color2"),
      color3: this.gl.getUniformLocation(this.program, "u_color3"),
      color4: this.gl.getUniformLocation(this.program, "u_color4"),
      freqX: this.gl.getUniformLocation(this.program, "u_freqX"),
      freqY: this.gl.getUniformLocation(this.program, "u_freqY"),
      seed: this.gl.getUniformLocation(this.program, "u_seed")
    };
    this.t = 0;
  }

  initShaders() {
    // This method is kept for compatibility but the shaders are initialized in initMesh
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.gl.viewport(0, 0, this.width, this.height);
  }

  animate() {
    if (!this.playing) return;
    this.t += this.speed;
    this.gl.uniform1f(this.uniforms.time, this.t);
    this.gl.uniform2f(this.uniforms.resolution, this.width, this.height);
    
    // Parse colors
    const parseColor = (colorString) => {
      const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return [parseFloat(match[1]) / 255, parseFloat(match[2]) / 255, parseFloat(match[3]) / 255];
      }
      return [1, 1, 1];
    };
    
    this.gl.uniform3fv(this.uniforms.color1, parseColor(this.colors[0]));
    this.gl.uniform3fv(this.uniforms.color2, parseColor(this.colors[1]));
    this.gl.uniform3fv(this.uniforms.color3, parseColor(this.colors[2]));
    this.gl.uniform3fv(this.uniforms.color4, parseColor(this.colors[3]));
    this.gl.uniform1f(this.uniforms.freqX, this.freqX);
    this.gl.uniform1f(this.uniforms.freqY, this.freqY);
    this.gl.uniform1f(this.uniforms.seed, this.seed);
    
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(this.animate.bind(this));
  }

  pause() {
    this.playing = false;
  }

  play() {
    this.playing = true;
    requestAnimationFrame(this.animate.bind(this));
  }
}
