/**
 * THERMOS Geospatial Platform — Atmospheric Wind Particle Streamline Layer
 * 
 * Integrates with `@sakitam-gis/mapbox-wind` and MapLibre GL.
 * Renders dynamic animated wind particle streamlines over the urban landscape
 * driven by live WeatherAPI atmospheric wind speed and direction telemetry.
 */
import type { Map as MapLibreMap } from 'maplibre-gl';
import { Layer as MapboxWindLayer } from '@sakitam-gis/mapbox-wind';
import { ImageSource, RenderType, RenderFrom } from 'wind-gl-core';

export interface WindVectorConfig {
  windSpeedKmh: number;
  windDirectionDeg: number;
  opacity?: number;
  numParticles?: number;
}

export class WindParticleLayer {
  private map: MapLibreMap | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private particles: Array<{ x: number; y: number; age: number; maxAge: number; speed: number }> = [];
  private visible: boolean = false;
  private opacity: number = 0.75;
  private windSpeedKmh: number = 14;
  private windDirectionDeg: number = 115;
  private mapboxWindInstance: any = null;

  constructor() {
    // Initialized in detached state
  }

  /**
   * Generates an encoded RG wind field Data URL from meteorological vector components.
   */
  private generateUVDataUrl(speedKmh: number, directionDeg: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Convert meteorological wind direction (direction wind blows FROM)
    // to vector velocity angle (direction wind blows TO)
    const rad = ((directionDeg + 180) % 360) * (Math.PI / 180);
    const speedMs = speedKmh / 3.6;
    const maxSpeed = 35.0; // [-35 m/s, +35 m/s]

    const imgData = ctx.createImageData(64, 64);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const idx = (y * 64 + x) * 4;
        // Introduce microscale urban friction / coastal turbulence
        const perturb = Math.sin((x + y) * 0.1) * 0.5;
        const u = speedMs * Math.sin(rad) + perturb;
        const v = speedMs * Math.cos(rad) + perturb;

        // Map [-maxSpeed, +maxSpeed] to [0, 255]
        const rNorm = Math.min(255, Math.max(0, Math.round(((u + maxSpeed) / (maxSpeed * 2)) * 255)));
        const gNorm = Math.min(255, Math.max(0, Math.round(((v + maxSpeed) / (maxSpeed * 2)) * 255)));

        imgData.data[idx] = rNorm;     // U component
        imgData.data[idx + 1] = gNorm; // V component
        imgData.data[idx + 2] = 0;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  /**
   * Attach layer to MapLibre GL map container and attempt @sakitam-gis/mapbox-wind integration.
   */
  public attach(map: MapLibreMap): void {
    this.map = map;

    // Create synchronized overlay canvas for particle streamlines
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.className = 'thermos-wind-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '5';
    canvas.style.display = this.visible ? 'block' : 'none';
    canvas.style.opacity = this.opacity.toString();

    container.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.resizeCanvas();
    map.on('resize', this.handleMapResize);
    map.on('move', this.handleMapMove);

    // Initialize @sakitam-gis/mapbox-wind custom layer adapter
    this.initMapboxWindLayer();

    if (this.visible) {
      this.startParticleAnimation();
    }
  }

  /**
   * Initializes @sakitam-gis/mapbox-wind WebGL Layer using generated UV field.
   */
  private initMapboxWindLayer(): void {
    if (!this.map) return;

    try {
      const uvUrl = this.generateUVDataUrl(this.windSpeedKmh, this.windDirectionDeg);
      if (!uvUrl) return;

      const source = new ImageSource('wind-gfs-image-source', {
        url: uvUrl,
        coordinates: [
          [80.10, 13.25], // top-left
          [80.35, 13.25], // top-right
          [80.35, 12.90], // bottom-right
          [80.10, 12.90], // bottom-left
        ],
        dataRange: [-35, 35],
      });

      const windLayer = new MapboxWindLayer('wind-particle-gl-layer', source, {
        renderType: RenderType.particles,
        renderFrom: RenderFrom.rg,
        styleSpec: {
          'opacity': this.opacity,
          numParticles: 2048,
          speedFactor: 1.2,
          fadeOpacity: 0.94,
          dropRate: 0.003,
          'fill-color': [
            'interpolate',
            ['step', 1],
            ['get', 'value'],
            0, '#38bdf8',
            10, '#60a5fa',
            25, '#f59e0b',
            40, '#ef4444',
          ],
        },
      });

      // Register with MapLibre custom layer interface if style is loaded
      if (this.map.isStyleLoaded() && !this.map.getLayer('wind-particle-gl-layer')) {
        this.map.addLayer(windLayer as any);
        this.mapboxWindInstance = windLayer;
      }
    } catch (err) {
      // Graceful fallback to high-performance streamline canvas
      console.warn('@sakitam-gis/mapbox-wind direct GL registration noted; running synchronized particle engine.', err);
    }
  }

  public detach(): void {
    this.stopParticleAnimation();

    if (this.map) {
      this.map.off('resize', this.handleMapResize);
      this.map.off('move', this.handleMapMove);
      if (this.mapboxWindInstance && this.map.getLayer('wind-particle-gl-layer')) {
        try {
          this.map.removeLayer('wind-particle-gl-layer');
        } catch {}
      }
      this.map = null;
    }

    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
      this.canvas = null;
      this.ctx = null;
    }
  }

  public setVisibility(visible: boolean): void {
    this.visible = visible;
    if (this.canvas) {
      this.canvas.style.display = visible ? 'block' : 'none';
    }

    if (visible) {
      this.startParticleAnimation();
    } else {
      this.stopParticleAnimation();
    }
  }

  public setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
    if (this.canvas) {
      this.canvas.style.opacity = this.opacity.toString();
    }
    if (this.mapboxWindInstance && typeof this.mapboxWindInstance.updateOptions === 'function') {
      try {
        this.mapboxWindInstance.updateOptions({
          styleSpec: { opacity: this.opacity },
        });
      } catch {}
    }
  }

  public updateWindTelemetry(speedKmh: number, directionDeg: number): void {
    this.windSpeedKmh = speedKmh;
    this.windDirectionDeg = directionDeg;
    this.initParticles();
  }

  private handleMapResize = (): void => {
    this.resizeCanvas();
  };

  private handleMapMove = (): void => {
    // Reposition/refresh on map interaction
    if (this.visible && this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  };

  private resizeCanvas(): void {
    if (!this.canvas || !this.map) return;
    const container = this.map.getContainer();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = container.clientWidth * dpr;
    this.canvas.height = container.clientHeight * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
    this.initParticles();
  }

  private initParticles(): void {
    if (!this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const count = 180; // optimal particle density for performance
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        age: Math.floor(Math.random() * 80),
        maxAge: 70 + Math.floor(Math.random() * 50),
        speed: (this.windSpeedKmh / 10) * (0.8 + Math.random() * 0.4),
      });
    }
  }

  private startParticleAnimation(): void {
    if (this.animFrameId !== null) return;
    this.initParticles();

    const render = () => {
      this.renderFrame();
      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  private stopParticleAnimation(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private renderFrame(): void {
    if (!this.ctx || !this.canvas || !this.visible) return;

    // Fade trail effect for sleek meteorological streamlines
    this.ctx.fillStyle = 'rgba(11, 15, 25, 0.08)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const rad = ((this.windDirectionDeg + 180) % 360) * (Math.PI / 180);
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad); // Canvas Y coordinates point downward

    this.ctx.lineWidth = 1.6;
    this.ctx.lineCap = 'round';

    for (const p of this.particles) {
      p.age++;
      if (p.age > p.maxAge) {
        p.x = Math.random() * this.canvas.width;
        p.y = Math.random() * this.canvas.height;
        p.age = 0;
        p.speed = (this.windSpeedKmh / 10) * (0.8 + Math.random() * 0.4);
      }

      const nextX = p.x + dx * p.speed * 2.2;
      const nextY = p.y + dy * p.speed * 2.2;

      // Particle stroke with gradient cyan/azure styling
      const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.85;
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;

      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(nextX, nextY);
      this.ctx.stroke();

      p.x = nextX;
      p.y = nextY;
    }
  }
}

export const windParticleLayer = new WindParticleLayer();
