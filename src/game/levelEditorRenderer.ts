import type { Position, EditorTool } from './types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './config';

export class LevelEditorRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  render(
    path: Position[],
    buildablePositions: Position[],
    selectedTool: EditorTool,
    selectedPathIndex: number | null,
    mousePosition: Position | null,
    isDragging: boolean
  ) {
    this.drawBackground();
    this.drawGrid();
    this.drawBuildablePositions(buildablePositions, selectedTool);
    this.drawPath(path, selectedPathIndex);
    this.drawMouseIndicator(mousePosition, selectedTool, path, buildablePositions);
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
  }

  private drawGrid() {
    const ctx = this.ctx;

    ctx.strokeStyle = 'rgba(124, 58, 237, 0.15)';
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
  }

  private drawPath(path: Position[], selectedIndex: number | null) {
    const ctx = this.ctx;

    if (path.length < 2) return;

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

    ctx.strokeStyle = 'rgba(160, 82, 45, 0.9)';
    ctx.lineWidth = TILE_SIZE * 0.6;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(210, 180, 140, 0.5)';
    ctx.lineWidth = TILE_SIZE * 0.4;
    ctx.setLineDash([5, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    path.forEach((point, index) => {
      const x = point.x * TILE_SIZE + TILE_SIZE / 2;
      const y = point.y * TILE_SIZE + TILE_SIZE / 2;
      const isSelected = index === selectedIndex;
      const isStart = index === 0;
      const isEnd = index === path.length - 1;

      let radius = 12;
      let color = '#7c3aed';
      let borderColor = '#a78bfa';

      if (isStart) {
        color = '#22c55e';
        borderColor = '#86efac';
      } else if (isEnd) {
        color = '#ef4444';
        borderColor = '#fca5a5';
      }

      if (isSelected) {
        radius = 16;
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (isStart) {
        ctx.fillText('入', x, y);
      } else if (isEnd) {
        ctx.fillText('出', x, y);
      } else {
        ctx.fillText(String(index), x, y);
      }
    });
  }

  private drawBuildablePositions(positions: Position[], selectedTool: EditorTool) {
    const ctx = this.ctx;

    positions.forEach((pos) => {
      const x = pos.x * TILE_SIZE;
      const y = pos.y * TILE_SIZE;

      if (selectedTool === 'build' || selectedTool === 'erase') {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
      } else {
        ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
      }

      ctx.lineWidth = 2;
      ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
      ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);

      ctx.fillStyle = selectedTool === 'build' || selectedTool === 'erase'
        ? 'rgba(34, 197, 94, 0.6)'
        : 'rgba(124, 58, 237, 0.5)';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    });
  }

  private drawMouseIndicator(
    mousePosition: Position | null,
    selectedTool: EditorTool,
    path: Position[],
    buildablePositions: Position[]
  ) {
    if (!mousePosition) return;

    const ctx = this.ctx;
    const gridX = Math.floor(mousePosition.x / TILE_SIZE);
    const gridY = Math.floor(mousePosition.y / TILE_SIZE);

    if (gridX < 0 || gridX >= MAP_WIDTH || gridY < 0 || gridY >= MAP_HEIGHT) {
      return;
    }

    const isOnPath = this.isGridPositionOnPath({ x: gridX, y: gridY }, path);
    const isBuildable = buildablePositions.some(
      (p) => p.x === gridX && p.y === gridY
    );

    if (selectedTool === 'path') {
      const hoveredPointIndex = this.getPathPointAt(mousePosition, path);
      
      if (hoveredPointIndex !== null) {
        const point = path[hoveredPointIndex];
        const x = point.x * TILE_SIZE + TILE_SIZE / 2;
        const y = point.y * TILE_SIZE + TILE_SIZE / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fill();
      }
    } else if (selectedTool === 'build') {
      let canBuild = !isOnPath && !isBuildable;
      
      ctx.strokeStyle = canBuild ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
      ctx.fillStyle = canBuild ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 2;
      ctx.fillRect(gridX * TILE_SIZE + 2, gridY * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.strokeRect(gridX * TILE_SIZE + 2, gridY * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      ctx.fillStyle = canBuild ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', gridX * TILE_SIZE + TILE_SIZE / 2, gridY * TILE_SIZE + TILE_SIZE / 2);
    } else if (selectedTool === 'erase') {
      let canErase = isBuildable;
      
      ctx.strokeStyle = canErase ? 'rgba(239, 68, 68, 0.9)' : 'rgba(156, 163, 175, 0.9)';
      ctx.fillStyle = canErase ? 'rgba(239, 68, 68, 0.2)' : 'rgba(156, 163, 175, 0.2)';
      ctx.lineWidth = 2;
      ctx.fillRect(gridX * TILE_SIZE + 2, gridY * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.strokeRect(gridX * TILE_SIZE + 2, gridY * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      ctx.fillStyle = canErase ? 'rgba(239, 68, 68, 0.8)' : 'rgba(156, 163, 175, 0.8)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('−', gridX * TILE_SIZE + TILE_SIZE / 2, gridY * TILE_SIZE + TILE_SIZE / 2);
    }
  }

  private isGridPositionOnPath(pos: Position, path: Position[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];

      if (start.x === end.x) {
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        if (pos.x === start.x && pos.y >= minY && pos.y <= maxY) {
          return true;
        }
      } else if (start.y === end.y) {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        if (pos.y === start.y && pos.x >= minX && pos.x <= maxX) {
          return true;
        }
      }
    }
    return false;
  }

  getPathPointAt(mousePos: Position, path: Position[]): number | null {
    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      const px = point.x * TILE_SIZE + TILE_SIZE / 2;
      const py = point.y * TILE_SIZE + TILE_SIZE / 2;
      const dist = Math.sqrt((mousePos.x - px) ** 2 + (mousePos.y - py) ** 2);
      
      if (dist < 20) {
        return i;
      }
    }
    return null;
  }

  getGridPosition(mousePos: Position): Position {
    return {
      x: Math.floor(mousePos.x / TILE_SIZE),
      y: Math.floor(mousePos.y / TILE_SIZE),
    };
  }
}
