#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_pixelRatio;
out vec4 outColor;

float hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p.x + p.y) * 43758.5453123);
}

vec2 cellPoint(vec2 cell) {
  float seed = hash(cell);
  vec2 jitter = vec2(hash(cell + 17.0), hash(cell + 43.0));
  float drift = u_time * 0.12 + seed * 6.28318;
  return cell * 1.0 + 0.18 + jitter * 0.64 + vec2(sin(drift), cos(drift * 0.83)) * 0.025;
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  float cellSize = 112.0 * u_pixelRatio;
  vec2 point = pixel / cellSize;
  vec2 baseCell = floor(point);
  float nearest = 10.0;
  float secondNearest = 10.0;
  vec2 closestPoint = vec2(0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = baseCell + vec2(float(x), float(y));
      vec2 candidate = cellPoint(cell);
      float distanceToNode = length(point - candidate);
      if (distanceToNode < nearest) {
        secondNearest = nearest;
        nearest = distanceToNode;
        closestPoint = candidate;
      } else if (distanceToNode < secondNearest) {
        secondNearest = distanceToNode;
      }
    }
  }

  float edge = 1.0 - smoothstep(0.018, 0.052, secondNearest - nearest);
  float node = 1.0 - smoothstep(0.018, 0.052, nearest);
  float edgeFade = 1.0 - smoothstep(0.85, 1.5, nearest);
  float mouseDistance = length(pixel - u_mouse);
  float influence = u_mouse.x < 0.0 ? 0.0 : (1.0 - smoothstep(0.0, 210.0 * u_pixelRatio, mouseDistance));
  float pulse = 0.72 + 0.28 * sin(u_time * 0.65 + hash(floor(closestPoint)) * 6.28318);

  vec3 background = vec3(0.050, 0.067, 0.090);
  vec3 lineColor = vec3(0.23, 0.27, 0.72);
  vec3 nodeColor = vec3(0.43, 0.51, 0.84);
  vec3 color = background;
  color += lineColor * edge * edgeFade * (0.045 + influence * 0.11);
  color += nodeColor * node * pulse * (0.16 + influence * 0.36);
  float mouseGlow = exp(-mouseDistance / (170.0 * u_pixelRatio)) * influence;
  color += vec3(0.015, 0.19, 0.22) * mouseGlow * 0.12;
  outColor = vec4(color, 1.0);
}
