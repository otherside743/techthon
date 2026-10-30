import vertexSource from './shaders/background.vert.glsl?raw';
import fragmentSource from './shaders/background.frag.glsl?raw';

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
};

const createProgram = (gl: WebGL2RenderingContext): WebGLProgram => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create WebGL program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown shader link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
};

/** GPU-rendered ambient node field. All per-pixel geometry and animation runs in GLSL. */
export function initBackgroundCanvas(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#bgCanvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  if (!gl) {
    canvas.classList.add('canvas-fallback');
    return;
  }

  try {
    const program = createProgram(gl);
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    if (!vao || !buffer) throw new Error('Unable to allocate WebGL buffers.');

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, 'u_resolution');
    const mouseUniform = gl.getUniformLocation(program, 'u_mouse');
    const timeUniform = gl.getUniformLocation(program, 'u_time');
    const ratioUniform = gl.getUniformLocation(program, 'u_pixelRatio');
    const pointer = { x: -1, y: -1 };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let start = performance.now();
    let viewportWidth = 0;
    let viewportHeight = 0;

    const resize = (): void => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      canvas.width = Math.round(viewportWidth * ratio);
      canvas.height = Math.round(viewportHeight * ratio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(ratioUniform, ratio);
    };

    const draw = (now: number): void => {
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(timeUniform, reduceMotion.matches ? 0 : (now - start) / 1000);
      gl.uniform2f(mouseUniform, pointer.x < 0 ? -1 : pointer.x * canvas.width / viewportWidth,
        pointer.y < 0 ? -1 : (viewportHeight - pointer.y) * canvas.height / viewportHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduceMotion.matches) frame = window.requestAnimationFrame(draw);
    };

    const animate = (): void => {
      window.cancelAnimationFrame(frame);
      start = performance.now();
      frame = window.requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });
    reduceMotion.addEventListener('change', animate);
    resize();
    animate();
  } catch (error) {
    console.warn('[Techthon] GPU background unavailable; using CSS fallback.', error);
    canvas.classList.add('canvas-fallback');
  }
}
