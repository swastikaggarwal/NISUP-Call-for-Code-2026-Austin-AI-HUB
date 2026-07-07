"use client";

import { useEffect, useRef } from "react";

// The exact WebGL voice-orb shader from the Stitch "the_voice_assistant" screen
// (ANIMATION_17): deep-teal core with animated concentric pulse rings.
// Ported verbatim into React with a canvas ref + requestAnimationFrame loop.
export function ShaderOrb({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 288;
      const h = canvas.clientHeight || 288;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(syncSize);
      ro.observe(canvas);
    }
    syncSize();

    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord - 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    float d = length(uv);

    // Core orb
    float core = smoothstep(0.2, 0.18, d);
    vec3 color = vec3(0.0588, 0.4314, 0.3373); // #0F6E56

    // Pulse rings
    float pulse1 = sin(u_time * 2.0 - d * 20.0) * 0.5 + 0.5;
    float ring1 = smoothstep(0.25, 0.24, d) * smoothstep(0.22, 0.23, d) * pulse1;

    float pulse2 = sin(u_time * 1.5 - d * 15.0 + 1.0) * 0.5 + 0.5;
    float ring2 = smoothstep(0.32, 0.31, d) * smoothstep(0.28, 0.29, d) * pulse2;

    color = mix(color, vec3(0.1137, 0.6196, 0.4588), ring1 * 0.5); // #1D9E75
    color = mix(color, vec3(0.8824, 0.9608, 0.9333), ring2 * 0.3); // #E1F5EE

    float alpha = core + ring1 + ring2;
    gl_FragColor = vec4(color, alpha * smoothstep(0.45, 0.3, d));
}`;

    function cs(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // Transparent background so the orb blends into the page.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");

    let raf = 0;
    function render(t: number) {
      if (typeof ResizeObserver === "undefined") syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
