#version 300 es
precision mediump float;

layout(location = 0) in vec4 data;
layout(location = 1) in vec4 initial;

uniform vec4 sphere;

out vec4 updated;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

vec3 noise3d(vec3 s) {
  float s0  = snoise(vec3(s));
  float s1 = snoise(vec3(s.y + 31.416, s.z - 47.853, s.x + 12.793));
  float s2 = snoise(vec3(s.z - 233.145, s.x - 113.408, s.y - 185.31));
  return vec3(s0, s1, s2);
}

float ramp(float r) {
  if (r > 1.0) return 1.0;
  if (r < -1.0) return -1.0;

  return 1.875 * r - 1.25 * r * r * r + 0.375 * r * r * r * r * r;
}

float SampleDistance(vec3 p) {
  vec3 SphereCenter = sphere.xyz;
  float SphereRadius = sphere.w;
  vec3 u = p - SphereCenter;
  float d = length(u);
  return d - SphereRadius;
}

vec3 ComputeGradient(vec3 p) {
  const float e = 0.01;
  vec3 dx = vec3(e, 0, 0);
  vec3 dy = vec3(0, e, 0);
  vec3 dz = vec3(0, 0, e);

  float d = SampleDistance(p);
  float dfdx = SampleDistance(p + dx) - d;
  float dfdy = SampleDistance(p + dy) - d;
  float dfdz = SampleDistance(p + dz) - d;

  return normalize(vec3(dfdx, dfdy, dfdz));
}

vec3 BlendVectors(vec3 potential, float alpha, vec3 distanceGradient) {
  float dp = dot(potential, distanceGradient);
  return alpha * potential + (1.0 - alpha) * dp * distanceGradient;
}

vec3 SamplePotential(vec3 p) {
  vec3 gradient = ComputeGradient(p);
  float obstacleDistance = SampleDistance(p);
  float d = abs(ramp(obstacleDistance / 1.0));

  vec3 risingForce = vec3(0.0) - p;
  risingForce = vec3(-risingForce.z, 0.0, risingForce.x);
  vec3 rpsi = 2.0 * risingForce;

  vec3 psi = BlendVectors(noise3d(p) + rpsi, d, gradient);

  return psi;
}

vec3 ComputeCurl(vec3 p){
  const float e = 0.0001;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  float x = SamplePotential(p + dy).z - SamplePotential(p - dy).z - SamplePotential(p + dz).y + SamplePotential(p - dz).y;

  float y = SamplePotential(p + dz).x - SamplePotential(p - dz).x - SamplePotential(p + dx).z + SamplePotential(p - dx).z;

  float z = SamplePotential(p + dx).y - SamplePotential(p - dx).y - SamplePotential(p + dy).x + SamplePotential(p - dy).x;

  const float divisor = 1.0 / (2.0 * e);
  return normalize(vec3(x, y, z) * divisor);
}

void main() {
  float lifetime = data.a;

  if (lifetime < 0.0) {
    updated = initial;
  } else {
    vec3 speed = ComputeCurl(data.xyz);
    updated.xyz = data.xyz + speed * 1.0 / 20.0;
    updated.a = data.a - 0.002;
  }

  gl_Position = updated;
}