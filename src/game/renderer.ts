import type { Tower, Enemy, Projectile, Effect, Position } from './types';
import { TOWER_CONFIGS, ENEMY_CONFIGS, PATH, BUILDABLE_POSITIONS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './config';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[] = [];
  private bgParticles: { x: number; y: number; speed: number; size: number; opacity: number }[] = [];

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.initBgParticles();
  }

  private initBgParticles() {
    for (let i = 0; i < 50; i++) {
      this.bgParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 10 + Math.random() * 20,
        size: 1 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.4,
      });
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  updateParticles(deltaTime: number) {
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      return p.life > 0;
    });

    this.bgParticles.forEach((p) => {
      p.y -= p.speed * deltaTime * 0.3;
      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
    });
  }

  addExplosionParticles(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  render(
    towers: Tower[],
    enemies: Enemy[],
    projectiles: Projectile[],
    effects: Effect[],
    selectedTowerType: string | null,
    selectedCard: boolean,
    mousePosition: Position | null,
    deltaTime: number
  ) {
    this.updateParticles(deltaTime);
    this.drawBackground();
    this.drawPath();
    this.drawBuildablePositions(towers, selectedTowerType);
    this.drawTowers(towers);
    this.drawEnemies(enemies);
    this.drawProjectiles(projectiles);
    this.drawEffects(effects);
    this.drawParticles();
    this.drawSelectionIndicator(selectedTowerType, selectedCard, mousePosition, towers);
  }

  private drawBackground() {
    const ctx = this.ctx;

    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      this.width * 0.7
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0a0a1a');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(124, 58, 237, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= MAP_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE_SIZE, 0);
      ctx.lineTo(x * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
      ctx.stroke();
    }

    for (let y = 0; y <= MAP_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE_SIZE);
      ctx.lineTo(MAP_WIDTH * TILE_SIZE, y * TILE_SIZE);
      ctx.stroke();
    }

    this.bgParticles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`;
      ctx.fill();
    });
  }

  private drawPath() {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.moveTo(PATH[0].x * TILE_SIZE + TILE_SIZE / 2, PATH[0].y * TILE_SIZE + TILE_SIZE / 2);

    for (let i = 1; i < PATH.length; i++) {
      ctx.lineTo(PATH[i].x * TILE_SIZE + TILE_SIZE / 2, PATH[i].y * TILE_SIZE + TILE_SIZE / 2);
    }

    ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)';
    ctx.lineWidth = TILE_SIZE * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(160, 82, 45, 0.8)';
    ctx.lineWidth = TILE_SIZE * 0.6;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(210, 180, 140, 0.4)';
    ctx.lineWidth = TILE_SIZE * 0.4;
    ctx.setLineDash([5, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    const start = PATH[0];
    const end = PATH[PATH.length - 1];

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(start.x * TILE_SIZE + TILE_SIZE / 2, start.y * TILE_SIZE + TILE_SIZE / 2, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('入', start.x * TILE_SIZE + TILE_SIZE / 2, start.y * TILE_SIZE + TILE_SIZE / 2);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(end.x * TILE_SIZE + TILE_SIZE / 2, end.y * TILE_SIZE + TILE_SIZE / 2, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('出', end.x * TILE_SIZE + TILE_SIZE / 2, end.y * TILE_SIZE + TILE_SIZE / 2);
  }

  private drawBuildablePositions(towers: Tower[], selectedTowerType: string | null) {
    const ctx = this.ctx;

    BUILDABLE_POSITIONS.forEach((pos) => {
      const hasTower = towers.some((t) => t.position.x === pos.x && t.position.y === pos.y);
      if (hasTower) return;

      const x = pos.x * TILE_SIZE;
      const y = pos.y * TILE_SIZE;

      if (selectedTowerType) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      } else {
        ctx.fillStyle = 'rgba(124, 58, 237, 0.1)';
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)';
      }

      ctx.lineWidth = 2;
      ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    });
  }

  private drawTowers(towers: Tower[]) {
    const ctx = this.ctx;

    towers.forEach((tower) => {
      const config = TOWER_CONFIGS[tower.type];
      const x = tower.position.x * TILE_SIZE + TILE_SIZE / 2;
      const y = tower.position.y * TILE_SIZE + TILE_SIZE / 2;

      ctx.beginPath();
      ctx.arc(x, y, TILE_SIZE * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, TILE_SIZE * 0.3, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, TILE_SIZE * 0.3);
      gradient.addColorStop(0, this.lightenColor(config.color, 30));
      gradient.addColorStop(1, config.color);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = this.darkenColor(config.color, 30);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tower.angle);

      ctx.fillStyle = this.darkenColor(config.color, 20);
      ctx.fillRect(0, -4, TILE_SIZE * 0.35, 8);

      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.icon, x, y + 1);
    });
  }

  private drawEnemies(enemies: Enemy[]) {
    const ctx = this.ctx;

    enemies.forEach((enemy) => {
      const config = ENEMY_CONFIGS[enemy.type];
      const x = enemy.position.x;
      const y = enemy.position.y;

      ctx.beginPath();
      ctx.ellipse(x, y + config.size * 0.6, config.size * 0.8, config.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, config.size, 0, Math.PI * 2);
      let bodyColor = config.color;

      if (enemy.freezeDuration > 0) {
        bodyColor = '#7dd3fc';
      } else if (enemy.slowDuration > 0) {
        bodyColor = '#a5f3fc';
      }

      const gradient = ctx.createRadialGradient(x - config.size * 0.3, y - config.size * 0.3, 0, x, y, config.size);
      gradient.addColorStop(0, this.lightenColor(bodyColor, 40));
      gradient.addColorStop(1, bodyColor);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = this.darkenColor(bodyColor, 30);
      ctx.lineWidth = 2;
      ctx.stroke();

      const eyeOffset = config.size * 0.3;
      const eyeSize = config.size * 0.2;

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x - eyeOffset, y - eyeSize, eyeSize, 0, Math.PI * 2);
      ctx.arc(x + eyeOffset, y - eyeSize, eyeSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - eyeOffset + eyeSize * 0.2, y - eyeSize, eyeSize * 0.5, 0, Math.PI * 2);
      ctx.arc(x + eyeOffset + eyeSize * 0.2, y - eyeSize, eyeSize * 0.5, 0, Math.PI * 2);
      ctx.fill();

      const hpBarWidth = config.size * 2;
      const hpBarHeight = 4;
      const hpPercent = enemy.health / enemy.maxHealth;

      ctx.fillStyle = '#333';
      ctx.fillRect(x - hpBarWidth / 2, y - config.size - 10, hpBarWidth, hpBarHeight);

      let hpColor = '#22c55e';
      if (hpPercent < 0.3) {
        hpColor = '#ef4444';
      } else if (hpPercent < 0.6) {
        hpColor = '#f59e0b';
      }

      ctx.fillStyle = hpColor;
      ctx.fillRect(x - hpBarWidth / 2, y - config.size - 10, hpBarWidth * hpPercent, hpBarHeight);

      if (enemy.freezeDuration > 0) {
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, config.size + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  private drawProjectiles(projectiles: Projectile[]) {
    const ctx = this.ctx;

    projectiles.forEach((proj) => {
      const config = TOWER_CONFIGS[proj.type];

      ctx.beginPath();
      ctx.arc(proj.position.x, proj.position.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = config.projectileColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(proj.position.x, proj.position.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = `${config.projectileColor}40`;
      ctx.fill();
    });
  }

  private drawEffects(effects: Effect[]) {
    const ctx = this.ctx;

    effects.forEach((effect) => {
      const progress = 1 - effect.duration / effect.maxDuration;
      const alpha = 1 - progress;

      switch (effect.type) {
        case 'explosion': {
          const radius = (effect.radius || 50) * (0.5 + progress * 0.5);
          const gradient = ctx.createRadialGradient(
            effect.position.x,
            effect.position.y,
            0,
            effect.position.x,
            effect.position.y,
            radius
          );
          gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(255, 100, 50, ${alpha * 0.7})`);
          gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          break;
        }
        case 'freeze': {
          const radius = (effect.radius || 50) * (0.8 + progress * 0.2);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 217, 255, ${alpha * 0.3})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
          break;
        }
        case 'lightning': {
          ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(effect.position.x, effect.position.y - 80);
          let y = effect.position.y - 80;
          let x = effect.position.x;
          while (y < effect.position.y + 20) {
            y += 15;
            x += (Math.random() - 0.5) * 20;
            ctx.lineTo(x, y);
          }
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, 20 * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.5})`;
          ctx.fill();
          break;
        }
        case 'heal': {
          const radius = (effect.radius || 50) * (0.5 + progress * 0.5);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 222, 128, ${alpha * 0.3})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        }
        case 'gold': {
          const radius = (effect.radius || 50) * (0.5 + progress * 0.5);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.3})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        }
        case 'tower_boost': {
          const radius = (effect.radius || 100) * (0.8 + progress * 0.2);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 165, 0, ${alpha * 0.2})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * 0.6})`;
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case 'build': {
          const radius = (effect.radius || 30) * (1 - progress * 0.5);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
          break;
        }
      }
    });
  }

  private drawParticles() {
    const ctx = this.ctx;

    this.particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });
  }

  private drawSelectionIndicator(
    selectedTowerType: string | null,
    selectedCard: boolean,
    mousePosition: Position | null,
    towers: Tower[]
  ) {
    if (!mousePosition) return;

    const ctx = this.ctx;
    const gridX = Math.floor(mousePosition.x / TILE_SIZE);
    const gridY = Math.floor(mousePosition.y / TILE_SIZE);

    if (selectedTowerType) {
      const config = TOWER_CONFIGS[selectedTowerType];
      const canBuild = BUILDABLE_POSITIONS.some((p) => p.x === gridX && p.y === gridY) &&
        !towers.some((t) => t.position.x === gridX && t.position.y === gridY);

      ctx.strokeStyle = canBuild ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(gridX * TILE_SIZE + 2, gridY * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      if (canBuild) {
        ctx.beginPath();
        ctx.arc(
          gridX * TILE_SIZE + TILE_SIZE / 2,
          gridY * TILE_SIZE + TILE_SIZE / 2,
          config.range,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(124, 58, 237, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (selectedCard) {
      ctx.beginPath();
      ctx.arc(mousePosition.x, mousePosition.y, 60, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 100, 50, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 100, 50, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }
}
