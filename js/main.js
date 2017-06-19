var canvas = document.querySelector('#fluid')
var gl
var firstRender = true
var camera = {}
var shaders = {}
var sphere = {
  renderSphere: false,
  posX: 0.0,
  posY: 0.0,
  posZ: 0.0,
  radius: 3.0,
}
var particles = {
  num: 1<<16,
  size: 1.0,
  speed: 2,
}
var stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

var gui = new dat.GUI();
gui.add(particles, 'speed', 1, 4);
gui.add(particles, 'size', 1, 3);
gui.add(sphere, 'renderSphere');
var radiusController = gui.add(sphere, 'radius', 1, 4);
var posXController = gui.add(sphere, 'posX', -5, 5);
var posYController = gui.add(sphere, 'posY', 0, 5);
posXController.onChange(initSphere)
posYController.onChange(initSphere)
radiusController.onChange(initSphere)

initGL()
initCamera()
initShaders()
initParticles()
initSphere()
renderLoop()

function renderLoop() {
  stats.begin()
  renderParticles()
  if (sphere.renderSphere)
    renderSphere()
  stats.end()
  requestAnimationFrame(renderLoop)
}

function initShaders() {
  
  /*
   * See ./glsl.js for original shader codes
   */
  var snoise = "  \n    vec3 mod289(vec3 x) {\n      return x - floor(x * (1.0 / 289.0)) * 289.0;\n    }\n\n    vec4 mod289(vec4 x) {\n      return x - floor(x * (1.0 / 289.0)) * 289.0;\n    }\n\n    vec4 permute(vec4 x) {\n        return mod289(((x*34.0)+1.0)*x);\n    }\n\n    vec4 taylorInvSqrt(vec4 r)\n    {\n      return 1.79284291400159 - 0.85373472095314 * r;\n    }\n\n    float snoise(vec3 v)\n    { \n      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n    // First corner\n      vec3 i  = floor(v + dot(v, C.yyy) );\n      vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n    // Other corners\n      vec3 g = step(x0.yzx, x0.xyz);\n      vec3 l = 1.0 - g;\n      vec3 i1 = min( g.xyz, l.zxy );\n      vec3 i2 = max( g.xyz, l.zxy );\n\n      //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n      //   x1 = x0 - i1  + 1.0 * C.xxx;\n      //   x2 = x0 - i2  + 2.0 * C.xxx;\n      //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n      vec3 x1 = x0 - i1 + C.xxx;\n      vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n      vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\n    // Permutations\n      i = mod289(i); \n      vec4 p = permute( permute( permute( \n                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) \n              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n    // Gradients: 7x7 points over a square, mapped onto an octahedron.\n    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n      float n_ = 0.142857142857; // 1.0/7.0\n      vec3  ns = n_ * D.wyz - D.xzx;\n\n      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\n      vec4 x_ = floor(j * ns.z);\n      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n      vec4 x = x_ *ns.x + ns.yyyy;\n      vec4 y = y_ *ns.x + ns.yyyy;\n      vec4 h = 1.0 - abs(x) - abs(y);\n\n      vec4 b0 = vec4( x.xy, y.xy );\n      vec4 b1 = vec4( x.zw, y.zw );\n\n      //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n      //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n      vec4 s0 = floor(b0)*2.0 + 1.0;\n      vec4 s1 = floor(b1)*2.0 + 1.0;\n      vec4 sh = -step(h, vec4(0.0));\n\n      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n      vec3 p0 = vec3(a0.xy,h.x);\n      vec3 p1 = vec3(a0.zw,h.y);\n      vec3 p2 = vec3(a1.xy,h.z);\n      vec3 p3 = vec3(a1.zw,h.w);\n\n    //Normalise gradients\n      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n      p0 *= norm.x;\n      p1 *= norm.y;\n      p2 *= norm.z;\n      p3 *= norm.w;\n\n    // Mix final noise value\n      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n      m = m * m;\n      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), \n                                    dot(p2,x2), dot(p3,x3) ) );\n    }\n  ";

  var positionVS = "\n    precision mediump float;\n\n    attribute vec4 a_position;\n\n    void main(void) {\n      gl_PointSize = 1.0;\n      gl_Position = a_position;\n    }\n  ";

  var positionFS = "\n    precision mediump float;\n\n    uniform sampler2D u_positionTexture;\n    uniform sampler2D u_spawnTexture;\n    uniform vec2 u_resolution;\n    uniform vec4 u_sphereData;\n    uniform float u_speed;\n    \n    " + snoise + "\n\n    float noise0(vec3 s) {\n      return snoise(vec3(s.x, s.y, s.z)); \n    }\n\n    float noise1(vec3 s) {\n      return snoise(vec3(s.y + 31.416, s.z - 47.853, s.x + 12.793)); \n    }\n\n    float noise2(vec3 s) {\n      return snoise(vec3(s.z - 233.145, s.x - 113.408, s.y - 185.31)); \n    }\n    \n    vec3 noise3d(vec3 s) \n    {\n      return vec3(noise0(s), noise1(s), noise2(s));\n    }\n\n    float ramp(float r)\n    {\n      if (r > 1.0) return 1.0;\n      if (r < -1.0) return -1.0;\n\n      return 1.875*r-1.25*r*r*r+0.375*r*r*r*r*r;\n    }\n\n    float SampleDistance(vec3 p)\n    {\n      vec3 SphereCenter = u_sphereData.xyz;\n      float SphereRadius = u_sphereData.w;\n      vec3 u = p - SphereCenter;\n      float d = length(u);\n      return d - SphereRadius;\n    }\n\n    vec3 ComputeGradient(vec3 p)\n    {\n      const float e = 0.01;\n      vec3 dx = vec3(e, 0, 0);\n      vec3 dy = vec3(0, e, 0);\n      vec3 dz = vec3(0, 0, e);\n\n      float d =    SampleDistance(p);\n      float dfdx = SampleDistance(p + dx) - d;\n      float dfdy = SampleDistance(p + dy) - d;\n      float dfdz = SampleDistance(p + dz) - d;\n\n      return normalize(vec3(dfdx, dfdy, dfdz));\n    }\n\n    vec3 BlendVectors(vec3 potential, float alpha, vec3 distanceGradient)\n    {\n      float dp = dot(potential, distanceGradient);\n      return alpha * potential + (1.0-alpha) * dp * distanceGradient;\n    }\n\n    vec3 SamplePotential(vec3 p)\n    {\n      vec3 gradient = ComputeGradient(p);\n      float obstacleDistance = SampleDistance(p);\n      float d = abs(ramp(obstacleDistance / 1.0));\n\n      vec3 risingForce = vec3(0.0) - p;\n      risingForce = vec3(-risingForce.z, 0.0, risingForce.x);\n      \n      vec3 rpsi = 2.0 * risingForce;\n      vec3 psi = BlendVectors(noise3d(p)+rpsi, d, gradient);\n\n      return psi;\n    }\n\n    vec3 ComputeCurl(vec3 p)\n    {\n      const float e = 0.0001;\n      vec3 dx = vec3(e, 0, 0);\n      vec3 dy = vec3(0, e, 0);\n      vec3 dz = vec3(0, 0, e);\n\n      float x = SamplePotential(p + dy).z - SamplePotential(p - dy).z - SamplePotential(p + dz).y + SamplePotential(p - dz).y;\n\n      float y = SamplePotential(p + dz).x - SamplePotential(p - dz).x - SamplePotential(p + dx).z + SamplePotential(p - dx).z;\n\n      float z = SamplePotential(p + dx).y - SamplePotential(p - dx).y - SamplePotential(p + dy).x + SamplePotential(p - dy).x;\n\n      return vec3(x, y, z) / (2.0*e);\n    }\n\n    void main(void) {\n      vec2 texCoords = gl_FragCoord.xy / u_resolution;\n      vec4 data = texture2D(u_positionTexture, texCoords);\n      vec3 oldPos = data.rgb;\n\n      vec3 newPos;\n\n      float oldLifetime = data.a;\n      float newLifetime = oldLifetime - 0.002;\n\n      if (newLifetime < 0.0) {\n        vec4 spawnData = texture2D(u_spawnTexture, texCoords);\n        newPos = spawnData.rgb;\n        newLifetime = spawnData.a + newLifetime;\n      } else {\n        newPos = oldPos + ComputeCurl(oldPos) * u_speed;\n      }\n\n      gl_FragColor = vec4(newPos, newLifetime);\n    }\n  ";

  var renderVS = "\n    precision mediump float;\n  \n    attribute vec2 a_texCoord;\n    uniform mat4 u_mMatrix;\n    uniform mat4 u_cameraMatrix;\n    uniform sampler2D u_positionTexture;\n    uniform float u_size;\n\n    void main(void) {\n      vec3 pos = texture2D(u_positionTexture, a_texCoord).rgb;\n      gl_PointSize = u_size;\n      gl_Position = u_cameraMatrix * u_mMatrix * vec4(pos, 1.0);\n    }\n  ";

  var renderFS = "\n    precision mediump float;\n\n    void main(void) {\n      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n    }\n  ";

  var sphereVS = "\n    attribute vec3 a_position;\n    uniform mat4 u_mMatrix;\n    uniform mat4 u_cameraMatrix;\n\n    void main(void) {\n      gl_Position = u_cameraMatrix * u_mMatrix * vec4(a_position, 1.0);      \n    }\n  ";

  var sphereFS = "  \n    precision mediump float;\n\n    void main(void) {\n      gl_FragColor = vec4(0.0 ,1.0, 1.0, 1.0);\n    }\n  ";

  var vertexShader = createShader(positionVS, 'vertex');
  var fragmentShader = createShader(positionFS, 'fragment');
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  var positionShader = {
    program: shaderProgram,
    attributes: {
      position: gl.getAttribLocation(shaderProgram, "a_position"),
    },
    uniforms: {
      resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
      sphereData: gl.getUniformLocation(shaderProgram, 'u_sphereData'),
      positionTexture: gl.getUniformLocation(shaderProgram, 'u_positionTexture'),
      spawnTexture: gl.getUniformLocation(shaderProgram, 'u_spawnTexture'),
      speed: gl.getUniformLocation(shaderProgram, 'u_speed'),
    },
  }
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  vertexShader = createShader(renderVS, 'vertex');
  fragmentShader = createShader(renderFS, 'fragment');
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  var renderShader = {
    program: shaderProgram,
    attributes: {
      texCoord: gl.getAttribLocation(shaderProgram, "a_texCoord"),      
    },
    uniforms: {
      mMatrix: gl.getUniformLocation(shaderProgram, "u_mMatrix"),
      cameraMatrix: gl.getUniformLocation(shaderProgram, "u_cameraMatrix"),
      positionTexture: gl.getUniformLocation(shaderProgram, 'u_positionTexture'),
      size: gl.getUniformLocation(shaderProgram, 'u_size'),
    },
  }
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  vertexShader = createShader(sphereVS, 'vertex');
  fragmentShader = createShader(sphereFS, 'fragment');
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  var sphereShader = {
    program: shaderProgram,
    attributes: {
      position: gl.getAttribLocation(shaderProgram, "a_position"),
    },
    uniforms: {
      mMatrix: gl.getUniformLocation(shaderProgram, 'u_mMatrix'),
      cameraMatrix: gl.getUniformLocation(shaderProgram, 'u_cameraMatrix'),
    },
  }
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  shaders = {
    positionShader,
    renderShader,
    sphereShader,
  }
}

function initParticles() {
  gl.enable(gl.DEPTH_TEST);
  
  particles.quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  particles.texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.texCoordBuffer);

  particles.proxyFrameBuffer = gl.createFramebuffer();
  particles.mMatrix = mat4.create();
  mat4.translate(particles.mMatrix, particles.mMatrix, [0.0, 0.0, 0.0])

  var n = Math.pow(2, Math.ceil(Math.log2(particles.num)));
  var sqn = Math.sqrt(n);
  particles.textureWidth = Math.pow(2, Math.ceil(Math.log2(sqn)));
  particles.textureHeight = Math.pow(2, Math.floor(Math.log2(sqn)));

  var positions = new Float32Array(particles.textureWidth * particles.textureHeight * 4);
  var texCoords = new Float32Array(particles.textureWidth * particles.textureHeight * 2);

  for (var i = 0; i < particles.num; i++) {
    var j = i * 2;
    texCoords[j] = (i % particles.textureWidth) / particles.textureWidth;
    texCoords[j + 1] = (i / particles.textureWidth | 0) / particles.textureWidth;
    var k = i * 4;
    var lifetime = 0.5 + Math.random() * 0.5;

    positions[k] = 0.2*Math.random() - 0.1;
    positions[k + 1] = -6*Math.random() - 6;
    positions[k + 2] = 0.2*Math.random() - 0.1;
    positions[k + 3] = lifetime;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, particles.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);


  particles.positionTexture = createTexture(0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, particles.textureWidth, particles.textureHeight, 0, gl.RGBA, gl.FLOAT, positions);

  particles.positionTextureProxy = createTexture(1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, particles.textureWidth, particles.textureHeight, 0, gl.RGBA, gl.FLOAT, null);
  
  // particles.spawnTexture = createTexture(2);
  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, particles.textureWidth, particles.textureHeight, 0, gl.RGBA, gl.FLOAT, positions);
}

function initSphere() {
  var latitudeBands = 20;
  var longitudeBands = 20;

  var vertexPositionBuffer;
  var vertexIndexBuffer;
  var vertexPositionData = [];
  var mMatrix = mat4.create()
  mat4.translate(mMatrix, mMatrix, [sphere.posX, sphere.posY, sphere.posZ])

  for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
    var theta = latNumber * Math.PI / latitudeBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
      var phi = longNumber * 2 * Math.PI / longitudeBands;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);
      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;
      vertexPositionData.push(sphere.radius * x);
      vertexPositionData.push(sphere.radius * y);
      vertexPositionData.push(sphere.radius * z);
    }
  }

  var indexData = [];
  for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
    for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
      var first = (latNumber * (longitudeBands + 1)) + longNumber;
      var second = first + longitudeBands + 1;
      indexData.push(first);
      indexData.push(second);
      indexData.push(first + 1);
      indexData.push(second);
      indexData.push(second + 1);
      indexData.push(first + 1);
    }
  }

  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numItems = vertexPositionData.length / 3;

  vertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
  vertexIndexBuffer.itemSize = 1;
  vertexIndexBuffer.numItems = indexData.length;

  sphere.mMatrix = mMatrix
  sphere.vertexPositionBuffer = vertexPositionBuffer
  sphere.vertexIndexBuffer = vertexIndexBuffer
}

function renderParticles() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, particles.positionTexture)

  var positions = new Float32Array(particles.textureWidth * particles.textureHeight * 4);  
  for (var i = 0; i < particles.num; i++) {
    var k = i * 4;
    var lifetime = 0.5 + Math.random() * 0.5;

    positions[k] = 0.2*Math.random() - 0.1;
    positions[k + 1] = -6*Math.random() - 6;
    positions[k + 2] = 0.2*Math.random() - 0.1;
    positions[k + 3] = lifetime;
  }
  particles.spawnTexture = createTexture(2);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, particles.textureWidth, particles.textureHeight, 0, gl.RGBA, gl.FLOAT, positions);
  
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, particles.spawnTexture)

  var shaderProgram = shaders.positionShader
  gl.enableVertexAttribArray(shaderProgram.attributes.position)
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.quadBuffer)
  gl.vertexAttribPointer(shaderProgram.attributes.position, 2, gl.FLOAT, false, 0, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, particles.proxyFrameBuffer)

  gl.useProgram(shaderProgram.program)
  gl.uniform1i(shaderProgram.uniforms.positionTexture, 0)
  gl.uniform1i(shaderProgram.uniforms.spawnTexture, 1)
  gl.uniform1f(shaderProgram.uniforms.speed, particles.speed / 200)
  gl.uniform2f(shaderProgram.uniforms.resolution, particles.textureWidth, particles.textureHeight)
  gl.uniform4f(shaderProgram.uniforms.sphereData, sphere.posX, sphere.posY, sphere.posZ, sphere.radius)
  gl.viewport(0, 0, particles.textureWidth, particles.textureHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particles.positionTextureProxy, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  
  var tmp = particles.positionTextureProxy
  particles.positionTextureProxy = particles.positionTexture
  particles.positionTexture = tmp
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, particles.positionTexture)

  gl.disableVertexAttribArray(shaderProgram.attributes.position);
  gl.enable(gl.DEPTH_TEST)

  shaderProgram = shaders.renderShader
  gl.useProgram(shaderProgram.program)
  gl.enableVertexAttribArray(shaderProgram.attributes.texCoord)
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.texCoordBuffer)
  gl.vertexAttribPointer(shaderProgram.attributes.texCoord, 2, gl.FLOAT, false, 0, 0)
  gl.uniform1i(shaderProgram.uniforms.positionTexture, 0)
  gl.uniform1f(shaderProgram.uniforms.size, particles.size)
  gl.uniformMatrix4fv(shaderProgram.uniforms.mMatrix, false, particles.mMatrix)
  gl.uniformMatrix4fv(shaderProgram.uniforms.cameraMatrix, false, camera.matrix)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.drawArrays(gl.POINTS, 0, particles.num)

  gl.disableVertexAttribArray(shaderProgram.attributes.texCoord);
}

function renderSphere() {
  var shaderProgram = shaders.sphereShader

  gl.useProgram(shaderProgram.program)
  gl.enableVertexAttribArray(shaderProgram.attributes.position)
  gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexPositionBuffer)
  gl.vertexAttribPointer(shaderProgram.attributes.position, sphere.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0)

  gl.uniformMatrix4fv(shaderProgram.uniforms.mMatrix, false, sphere.mMatrix)
  gl.uniformMatrix4fv(shaderProgram.uniforms.cameraMatrix, false, camera.matrix)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.vertexIndexBuffer);
  gl.drawElements(gl.TRIANGLES, sphere.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function initGL() {
  try {
    gl = canvas.getContext('experimental-webgl', {
      preserveDrawingBuffer: false,
      alpha: false
    })
  } catch (e) { }
  if (!gl) {
    window.alert('Could not initialise WebGL, sorry :-( ')
  }
  gl.getExtension('OES_texture_float')
  canvas.width = document.body.offsetWidth
  canvas.height = document.body.offsetHeight

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function initCamera() {
  var position = vec3.fromValues(0, 0, 20);
  var orientation = vec3.fromValues(0, 0, -0.5)
  var up = vec4.fromValues(0.0, 1.0, 0.0);
  var viewMatrix = mat4.create();
  var projectionMatrix = mat4.create();
  var matrix = mat4.create();

  camera = {
    position,
    orientation,
    up,
    viewMatrix,
    projectionMatrix,
    matrix
  };
  mat4.perspective(camera.projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
  mat4.lookAt(camera.viewMatrix, camera.position, camera.orientation, up)
  mat4.multiply(camera.matrix, camera.projectionMatrix, camera.viewMatrix)
}

function createShader(source, type) {
  var shader;
  if (type === 'fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (type === 'vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else throw new Error('Invalid shader type');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function createTexture(index) {
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + index);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return texture;
}


var mouseDown = false;
var lastMouseX = 0
var lastMouseY = 0

var CAMERA_SENSITIVITY = 0.002;

canvas.addEventListener('mousedown', function (event) {
  mouseDown = true;
  lastMouseX = event.x;
  lastMouseY = event.y;
});

document.addEventListener('mouseup', function (event) {
    mouseDown = false;
});

canvas.addEventListener('mousemove', function (event) {
  if (mouseDown) {
    var mouseX = event.x;
    var mouseY = event.y;

    var deltaAzimuth = (mouseX - lastMouseX) * CAMERA_SENSITIVITY;
    var deltaElevation = (mouseY - lastMouseY) * CAMERA_SENSITIVITY;

    mat4.rotateX(camera.viewMatrix, camera.viewMatrix, -deltaElevation)
    mat4.rotateY(camera.viewMatrix, camera.viewMatrix, deltaAzimuth)

    mat4.multiply(camera.matrix, camera.projectionMatrix, camera.viewMatrix)

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    canvas.style.cursor = '-webkit-grabbing';
    canvas.style.cursor = '-moz-grabbing';
    canvas.style.cursor = 'grabbing';
  } else {
    canvas.style.cursor = '-webkit-grab';
    canvas.style.cursor = '-moz-grab';
    canvas.style.cursor = 'grab';
  }
})

canvas.addEventListener('mousewheel', function (event) {
  delta = event.wheelDelta/120
  if (delta < 0)
    camera.position[2] -= -0.25;
  else
    camera.position[2] += -0.25;
  mat4.lookAt(camera.viewMatrix, camera.position, camera.orientation, camera.up)
  mat4.multiply(camera.matrix, camera.projectionMatrix, camera.viewMatrix)
})

