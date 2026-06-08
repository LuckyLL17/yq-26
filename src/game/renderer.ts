import type { Tower, Enemy, Projectile, Effect, Position } from './types';
import { TOWER_CONFIGS, ENEMY_CONFIGS, CARD_CONFIGS, PATH, BUILDABLE_POSITIONS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, getTowerLevelConfig } from './config';
import { getDefaultLevel } from './levelEditor';

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
    selectedTowerId: string | null,
    selectedCardType: string | null,
    mousePosition: Position | null,
    deltaTime: number,
    path?: Position[],
    buildablePositions?: Position[]
  ) {
    const currentPath = path || getDefaultLevel().path;
    const currentBuildablePositions = buildablePositions || getDefaultLevel().buildablePositions;

    this.updateParticles(deltaTime);
    this.drawBackground();
    this.drawPath(currentPath);
    this.drawBuildablePositions(towers, selectedTowerType, currentBuildablePositions);
    this.drawTowers(towers, selectedTowerId);
    this.drawSelectedTowerRange(towers, selectedTowerId);
    this.drawEnemies(enemies);
    this.drawProjectiles(projectiles);
    this.drawEffects(effects);
    this.drawParticles();
    this.drawLevelUpTexts(effects);
    this.drawSelectionIndicator(selectedTowerType, selectedCardType, mousePosition, towers, currentBuildablePositions);
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

  private drawPath(path: Position[]) {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.moveTo(path[0].x * TILE_SIZE + TILE_SIZE / 2, path[0].y * TILE_SIZE + TILE_SIZE / 2);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * TILE_SIZE + TILE_SIZE / 2, path[i].y * TILE_SIZE + TILE_SIZE / 2);
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

    const start = path[0];
    const end = path[path.length - 1];

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

  private drawBuildablePositions(towers: Tower[], selectedTowerType: string | null, buildablePositions: Position[]) {
    const ctx = this.ctx;

    buildablePositions.forEach((pos) => {
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

  private drawTowers(towers: Tower[], selectedTowerId: string | null) {
    const ctx = this.ctx;

    towers.forEach((tower) => {
      const config = TOWER_CONFIGS[tower.type];
      const isSelected = tower.id === selectedTowerId;
      const x = tower.position.x * TILE_SIZE + TILE_SIZE / 2;
      const y = tower.position.y * TILE_SIZE + TILE_SIZE / 2;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, TILE_SIZE * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

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

      const starSize = 8;
      const starSpacing = 4;
      const totalStars = tower.level;
      const starsWidth = totalStars * starSize + (totalStars - 1) * starSpacing;
      const starStartX = x - starsWidth / 2 + starSize / 2;

      for (let i = 0; i < totalStars; i++) {
        const starX = starStartX + i * (starSize + starSpacing);
        const starY = y - TILE_SIZE * 0.35 - 6;

        ctx.font = `${starSize + 4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★', starX, starY);
      }
    });
  }

  private drawSelectedTowerRange(towers: Tower[], selectedTowerId: string | null) {
    if (!selectedTowerId) return;

    const tower = towers.find((t) => t.id === selectedTowerId);
    if (!tower) return;

    const ctx = this.ctx;
    const levelConfig = getTowerLevelConfig(tower.type, tower.level);
    const x = tower.position.x * TILE_SIZE + TILE_SIZE / 2;
    const y = tower.position.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.beginPath();
    ctx.arc(x, y, levelConfig.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
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
      } else if (enemy.poisonDuration > 0) {
        bodyColor = '#86efac';
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

      if (enemy.poisonDuration > 0) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, config.size + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        const bubbleCount = 3;
        for (let i = 0; i < bubbleCount; i++) {
          const bubbleY = y - config.size - 5 - Math.sin(Date.now() / 300 + i) * 5;
          const bubbleX = x + Math.cos(Date.now() / 400 + i * 2) * (config.size * 0.5);
          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
          ctx.fill();
        }
      }
    });
  }

  private drawProjectiles(projectiles: Projectile[]) {
    const ctx = this.ctx;

    projectiles.forEach((proj) => {
      const config = TOWER_CONFIGS[proj.type];

      if (proj.type === 'sniper') {
        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = config.projectileColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = `${config.projectileColor}30`;
        ctx.fill();

        if (proj.isSniper) {
          ctx.beginPath();
          ctx.arc(proj.position.x, proj.position.y, 16, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.fill();
        }
      } else if (proj.type === 'lightning') {
        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = config.projectileColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = `${config.projectileColor}40`;
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 200, 0.6)`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 * i) / 3 + Date.now() / 200;
          ctx.beginPath();
          ctx.moveTo(proj.position.x, proj.position.y);
          ctx.lineTo(
            proj.position.x + Math.cos(angle) * 10,
            proj.position.y + Math.sin(angle) * 10
          );
          ctx.stroke();
        }
      } else if (proj.type === 'poison') {
        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = config.projectileColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = `${config.projectileColor}30`;
        ctx.fill();

        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * 8;
          const offsetY = (Math.random() - 0.5) * 8;
          ctx.beginPath();
          ctx.arc(proj.position.x + offsetX, proj.position.y + offsetY, 2, 0, Math.PI * 2);
          ctx.fillStyle = `${config.projectileColor}60`;
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = config.projectileColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = `${config.projectileColor}40`;
        ctx.fill();
      }
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
        case 'upgrade': {
          const radius = (effect.radius || 40) * (0.5 + progress * 1);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * 0.7})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        }
        case 'chain_lightning': {
          if (effect.chainTargets && effect.chainTargets.length >= 2) {
            ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;

            for (let i = 0; i < effect.chainTargets.length - 1; i++) {
              const start = effect.chainTargets[i];
              const end = effect.chainTargets[i + 1];
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);

              const segments = 5;
              for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 20;
                const y = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 20;
                ctx.lineTo(x, y);
              }
              ctx.stroke();
            }

            ctx.shadowBlur = 0;
          }
          break;
        }
        case 'sniper': {
          const radius = (effect.radius || 30) * (0.5 + progress * 1.5);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(effect.position.x - 20, effect.position.y);
          ctx.lineTo(effect.position.x + 20, effect.position.y);
          ctx.moveTo(effect.position.x, effect.position.y - 20);
          ctx.lineTo(effect.position.x, effect.position.y + 20);
          ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, 15, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        }
        case 'meteor': {
          const radius = (effect.radius || 80) * (0.3 + progress * 0.7);
          const gradient = ctx.createRadialGradient(
            effect.position.x,
            effect.position.y,
            0,
            effect.position.x,
            effect.position.y,
            radius
          );
          gradient.addColorStop(0, `rgba(255, 100, 0, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(255, 50, 0, ${alpha * 0.8})`);
          gradient.addColorStop(1, `rgba(100, 0, 0, 0)`);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          const trailY = effect.position.y - 150 * (1 - progress);
          const trailGradient = ctx.createLinearGradient(
            effect.position.x,
            effect.position.y,
            effect.position.x,
            trailY
          );
          trailGradient.addColorStop(0, `rgba(255, 150, 0, ${alpha * 0.8})`);
          trailGradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
          ctx.beginPath();
          ctx.moveTo(effect.position.x - 10, effect.position.y);
          ctx.lineTo(effect.position.x + 10, effect.position.y);
          ctx.lineTo(effect.position.x + 5, trailY);
          ctx.lineTo(effect.position.x - 5, trailY);
          ctx.closePath();
          ctx.fillStyle = trailGradient;
          ctx.fill();
          break;
        }
        case 'summon': {
          const radius = (effect.radius || 100) * (0.5 + progress * 0.5);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(147, 51, 234, ${alpha * 0.2})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(147, 51, 234, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          const runeCount = 6;
          for (let i = 0; i < runeCount; i++) {
            const angle = (Math.PI * 2 * i) / runeCount + progress * Math.PI;
            const runeX = effect.position.x + Math.cos(angle) * radius * 0.8;
            const runeY = effect.position.y + Math.sin(angle) * radius * 0.8;
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = `rgba(216, 180, 254, ${alpha})`;
            ctx.fillText('✦', runeX, runeY);
          }
          break;
        }
        case 'mana_surge': {
          const radius = (effect.radius || 80) * (0.5 + progress * 0.5);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.3})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();

          const particleCount = 12;
          for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + progress * Math.PI * 2;
            const dist = radius * (0.3 + progress * 0.7);
            const px = effect.position.x + Math.cos(angle) * dist;
            const py = effect.position.y + Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(147, 197, 253, ${alpha})`;
            ctx.fill();
          }
          break;
        }
        case 'time_warp': {
          const radius = (effect.radius || 150) * (0.8 + progress * 0.2);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(236, 72, 153, ${alpha * 0.15})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(244, 114, 182, ${alpha * 0.6})`;
          ctx.lineWidth = 3;
          ctx.setLineDash([12, 6]);
          ctx.stroke();
          ctx.setLineDash([]);

          for (let ring = 0; ring < 3; ring++) {
            const ringRadius = radius * (0.4 + ring * 0.25);
            const rotation = progress * Math.PI * (ring % 2 === 0 ? 2 : -2);
            ctx.beginPath();
            ctx.arc(effect.position.x, effect.position.y, ringRadius, rotation, rotation + Math.PI * 1.5);
            ctx.strokeStyle = `rgba(251, 207, 232, ${alpha * (1 - ring * 0.25)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          break;
        }
        case 'divine_shield': {
          const radius = (effect.radius || 100) * (0.6 + progress * 0.4);
          const gradient = ctx.createRadialGradient(
            effect.position.x,
            effect.position.y,
            0,
            effect.position.x,
            effect.position.y,
            radius
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.4})`);
          gradient.addColorStop(0.5, `rgba(255, 215, 0, ${alpha * 0.3})`);
          gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.font = '40px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.fillText('🛡️', effect.position.x, effect.position.y);
          break;
        }
        case 'poison': {
          const radius = (effect.radius || 40) * (0.5 + progress * 0.5);
          ctx.beginPath();
          ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.3})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        }
      }
    });
  }

  private drawLevelUpTexts(effects: Effect[]) {
    const ctx = this.ctx;

    effects.forEach((effect) => {
      if (effect.type !== 'level_up') return;

      const progress = 1 - effect.duration / effect.maxDuration;
      const alpha = 1 - progress * 0.8;
      const offsetY = -30 - progress * 50;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ff8c00';
      ctx.shadowBlur = 10;
      ctx.fillText('⬆ 升级!', effect.position.x, effect.position.y + offsetY);

      ctx.shadowBlur = 0;
      ctx.restore();
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
    selectedCardType: string | null,
    mousePosition: Position | null,
    towers: Tower[],
    buildablePositions: Position[]
  ) {
    if (!mousePosition) return;

    const ctx = this.ctx;
    const gridX = Math.floor(mousePosition.x / TILE_SIZE);
    const gridY = Math.floor(mousePosition.y / TILE_SIZE);

    if (selectedTowerType) {
      const config = TOWER_CONFIGS[selectedTowerType];
      const levelConfig = getTowerLevelConfig(selectedTowerType, 1);
      const canBuild = buildablePositions.some((p) => p.x === gridX && p.y === gridY) &&
        !towers.some((t) => t.position.x === gridX && t.position.y === gridY);

      ctx.strokeStyle = canBuild ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(gridX * TILE_SIZE + 2, gridY * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      if (canBuild) {
        ctx.beginPath();
        ctx.arc(
          gridX * TILE_SIZE + TILE_SIZE / 2,
          gridY * TILE_SIZE + TILE_SIZE / 2,
          levelConfig.range,
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

    if (selectedCardType) {
      const cardConfig = CARD_CONFIGS[selectedCardType];
      const radius = cardConfig.radius || 60;

      let fillColor = 'rgba(255, 100, 50, 0.2)';
      let strokeColor = 'rgba(255, 100, 50, 0.6)';

      if (selectedCardType === 'freeze') {
        fillColor = 'rgba(0, 217, 255, 0.2)';
        strokeColor = 'rgba(0, 217, 255, 0.6)';
      } else if (selectedCardType === 'fireball') {
        fillColor = 'rgba(255, 100, 50, 0.2)';
        strokeColor = 'rgba(255, 100, 50, 0.6)';
      } else if (selectedCardType === 'meteor') {
        fillColor = 'rgba(255, 50, 0, 0.3)';
        strokeColor = 'rgba(255, 100, 0, 0.8)';
      }

      ctx.beginPath();
      ctx.arc(mousePosition.x, mousePosition.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
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
