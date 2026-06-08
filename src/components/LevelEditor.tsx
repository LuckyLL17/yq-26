import { useRef, useEffect, useState, useCallback } from 'react';
import { useLevelEditorStore, getDefaultLevel } from '@/game/levelEditor';
import { LevelEditorRenderer } from '@/game/levelEditorRenderer';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@/game/config';
import type { Position } from '@/game/types';

interface LevelEditorProps {
  onBack: () => void;
  onPlay: (levelId: string) => void;
}

export default function LevelEditor({ onBack, onPlay }: LevelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<LevelEditorRenderer | null>(null);
  const [mousePosition, setMousePosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null);
  const [saveAsName, setSaveAsName] = useState('');
  const [activePanel, setActivePanel] = useState<'properties' | 'waves' | 'tools'>('tools');

  const {
    level,
    selectedTool,
    selectedPathIndex,
    isDirty,
    savedLevels,
    showSaveDialog,
    showLoadDialog,
    setTool,
    setLevelName,
    setLevelDescription,
    setInitialGold,
    setInitialLives,
    handleGridClick,
    handlePathPointClick,
    movePathPoint,
    insertPathPoint,
    deletePathPoint,
    generateBuildablePositions,
    clearBuildablePositions,
    addWave,
    removeWave,
    updateWave,
    newLevel,
    loadLevel,
    saveLevel,
    saveLevelAs,
    deleteSavedLevel,
    setShowSaveDialog,
    setShowLoadDialog,
    validateLevel,
  } = useLevelEditorStore();

  const canvasWidth = MAP_WIDTH * TILE_SIZE;
  const canvasHeight = MAP_HEIGHT * TILE_SIZE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new LevelEditorRenderer(ctx, canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.render(
      level.path,
      level.buildablePositions,
      selectedTool,
      selectedPathIndex,
      mousePosition,
      isDragging
    );
  }, [level, selectedTool, selectedPathIndex, mousePosition, isDragging]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    setMousePosition(pos);

    if (isDragging && dragPointIndex !== null && selectedTool === 'path') {
      const gridX = Math.round(pos.x / TILE_SIZE - 0.5);
      const gridY = Math.round(pos.y / TILE_SIZE - 0.5);
      
      const clampedX = Math.max(-1, Math.min(MAP_WIDTH, gridX));
      const clampedY = Math.max(-1, Math.min(MAP_HEIGHT, gridY));
      
      movePathPoint(dragPointIndex, { x: clampedX, y: clampedY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    const renderer = rendererRef.current;

    if (!renderer) return;

    if (selectedTool === 'path') {
      const pointIndex = renderer.getPathPointAt(pos, level.path);
      if (pointIndex !== null) {
        setIsDragging(true);
        setDragPointIndex(pointIndex);
        handlePathPointClick(pointIndex);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragPointIndex(null);
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setIsDragging(false);
    setDragPointIndex(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const pos = getCanvasCoords(e);
    const renderer = rendererRef.current;
    if (!renderer) return;

    const gridPos = renderer.getGridPosition(pos);

    if (selectedTool === 'path') {
      const pointIndex = renderer.getPathPointAt(pos, level.path);
      if (pointIndex !== null) {
        handlePathPointClick(pointIndex);
      } else {
        const segmentInfo = renderer.getPathSegmentAt(pos, level.path);
        if (segmentInfo) {
          insertPathPoint(segmentInfo.segmentIndex, segmentInfo.point);
        }
      }
    } else if (selectedTool === 'erase') {
      const pointIndex = renderer.getPathPointAt(pos, level.path);
      if (pointIndex !== null) {
        if (pointIndex !== 0 && pointIndex !== level.path.length - 1) {
          deletePathPoint(pointIndex);
        }
      } else {
        handleGridClick(gridPos);
      }
    } else {
      handleGridClick(gridPos);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (selectedTool === 'path') {
      const pointIndex = renderer.getPathPointAt(pos, level.path);
      if (pointIndex !== null && pointIndex !== 0 && pointIndex !== level.path.length - 1) {
        deletePathPoint(pointIndex);
      }
    }
  };

  const { valid, errors } = validateLevel();

  const handlePlay = () => {
    if (!valid) return;
    saveLevel();
    onPlay(level.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#0a0a1a] text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-game-dark/50 hover:bg-game-dark rounded-lg border border-game-magic/30 hover:border-game-magic/50 transition-all"
            >
              ← 返回
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-game-gold to-game-magic bg-clip-text text-transparent">
              关卡编辑器
            </h1>
            {isDirty && (
              <span className="text-yellow-400 text-sm">● 未保存</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => newLevel()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
            >
              新建
            </button>
            <button
              onClick={() => setShowLoadDialog(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              加载
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
            >
              保存
            </button>
            <button
              onClick={handlePlay}
              disabled={!valid}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                valid
                  ? 'bg-gradient-to-r from-game-gold to-yellow-500 hover:from-yellow-400 hover:to-game-gold text-game-dark'
                  : 'bg-gray-600 cursor-not-allowed text-gray-400'
              }`}
            >
              开始游戏
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative bg-game-darker rounded-xl p-4 border border-game-magic/20">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="rounded-lg cursor-crosshair mx-auto block"
                style={{ maxWidth: '100%', height: 'auto' }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
              />
              
              <div className="mt-3 text-sm text-gray-400 text-center">
                {selectedTool === 'path' && (
                  <span>点击路径添加新点 | 拖拽路径点移动位置 | 双击中间点删除</span>
                )}
                {selectedTool === 'build' && (
                  <span>点击格子添加可建造位置 | 再次点击取消</span>
                )}
                {selectedTool === 'erase' && (
                  <span>点击路径点或建造位进行删除（起点/终点不可删）</span>
                )}
              </div>
            </div>

            {!valid && errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <h3 className="text-red-400 font-bold mb-2">⚠ 关卡验证失败</h3>
                <ul className="text-red-300 text-sm space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="w-72 space-y-4">
            <div className="bg-game-darker/80 rounded-xl border border-game-magic/20 overflow-hidden">
              <div className="flex border-b border-game-magic/20">
                {(['tools', 'properties', 'waves'] as const).map((panel) => (
                  <button
                    key={panel}
                    onClick={() => setActivePanel(panel)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      activePanel === panel
                        ? 'bg-game-magic/20 text-game-gold'
                        : 'text-gray-400 hover:text-white hover:bg-game-magic/10'
                    }`}
                  >
                    {panel === 'tools' ? '工具' : panel === 'properties' ? '属性' : '波次'}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activePanel === 'tools' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-game-gold">编辑工具</h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTool('path')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTool === 'path'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                            : 'bg-game-dark/50 border-game-magic/20 hover:border-game-magic/40'
                        }`}
                      >
                        <div className="text-2xl mb-1">🛤️</div>
                        <div className="text-xs">路径</div>
                      </button>
                      <button
                        onClick={() => setTool('build')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTool === 'build'
                            ? 'bg-green-600/30 border-green-500 text-green-300'
                            : 'bg-game-dark/50 border-game-magic/20 hover:border-game-magic/40'
                        }`}
                      >
                        <div className="text-2xl mb-1">➕</div>
                        <div className="text-xs">添加</div>
                      </button>
                      <button
                        onClick={() => setTool('erase')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTool === 'erase'
                            ? 'bg-red-600/30 border-red-500 text-red-300'
                            : 'bg-game-dark/50 border-game-magic/20 hover:border-game-magic/40'
                        }`}
                      >
                        <div className="text-2xl mb-1">🗑️</div>
                        <div className="text-xs">擦除</div>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-game-magic/20">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">快速操作</h4>
                      <div className="space-y-2">
                        <button
                          onClick={generateBuildablePositions}
                          className="w-full py-2 text-sm bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 rounded-lg transition-colors"
                        >
                          自动填充所有空位
                        </button>
                        <button
                          onClick={clearBuildablePositions}
                          className="w-full py-2 text-sm bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 rounded-lg transition-colors"
                        >
                          清空所有建造位
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-game-magic/20">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">统计信息</h4>
                      <div className="text-sm space-y-1 text-gray-400">
                        <div className="flex justify-between">
                          <span>路径点数:</span>
                          <span className="text-white">{level.path.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>建造位置:</span>
                          <span className="text-white">{level.buildablePositions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>波次数量:</span>
                          <span className="text-white">{level.waves.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePanel === 'properties' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        关卡名称
                      </label>
                      <input
                        type="text"
                        value={level.name}
                        onChange={(e) => setLevelName(e.target.value)}
                        className="w-full px-3 py-2 bg-white text-black border border-game-magic/30 rounded-lg focus:outline-none focus:border-game-magic/60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        关卡描述
                      </label>
                      <textarea
                        value={level.description}
                        onChange={(e) => setLevelDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white text-black border border-game-magic/30 rounded-lg focus:outline-none focus:border-game-magic/60 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        初始金币: {level.initialGold}
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={level.initialGold}
                        onChange={(e) => setInitialGold(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        初始生命: {level.initialLives}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={level.initialLives}
                        onChange={(e) => setInitialLives(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {activePanel === 'waves' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-game-gold">波次设置</h3>
                      <button
                        onClick={addWave}
                        className="px-3 py-1 text-sm bg-green-600/50 hover:bg-green-600/70 rounded transition-colors"
                      >
                        + 添加
                      </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {level.waves.map((wave, waveIndex) => (
                        <div
                          key={waveIndex}
                          className="p-3 bg-game-dark/50 rounded-lg border border-game-magic/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">第 {waveIndex + 1} 波</span>
                            <button
                              onClick={() => removeWave(waveIndex)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              删除
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {wave.enemies.map((enemy, enemyIndex) => (
                              <div
                                key={enemyIndex}
                                className="flex items-center gap-2 text-xs"
                              >
                                <select
                                  value={enemy.type}
                                  onChange={(e) => {
                                    const newWave = { ...wave };
                                    newWave.enemies = [...newWave.enemies];
                                    newWave.enemies[enemyIndex] = {
                                      ...enemy,
                                      type: e.target.value as any,
                                    };
                                    updateWave(waveIndex, newWave);
                                  }}
                                  className="flex-1 px-2 py-1 bg-white text-black border border-game-magic/20 rounded text-xs"
                                >
                                  <option value="normal">普通怪</option>
                                  <option value="fast">快速怪</option>
                                  <option value="tank">坦克怪</option>
                                  <option value="boss">Boss</option>
                                </select>
                                <input
                                  type="number"
                                  value={enemy.count}
                                  onChange={(e) => {
                                    const newWave = { ...wave };
                                    newWave.enemies = [...newWave.enemies];
                                    newWave.enemies[enemyIndex] = {
                                      ...enemy,
                                      count: Math.max(1, Number(e.target.value)),
                                    };
                                    updateWave(waveIndex, newWave);
                                  }}
                                  className="w-14 px-2 py-1 bg-white text-black border border-game-magic/20 rounded text-xs"
                                  min="1"
                                />
                                <span className="text-gray-400">只</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-game-darker rounded-xl p-6 border border-game-magic/30 w-96">
            <h2 className="text-xl font-bold mb-4 text-game-gold">保存关卡</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">关卡名称</label>
                <input
                  type="text"
                  value={saveAsName || level.name}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black border border-game-magic/30 rounded-lg focus:outline-none focus:border-game-magic/60"
                  placeholder="输入关卡名称"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    saveLevel();
                    setSaveAsName('');
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  覆盖保存
                </button>
                <button
                  onClick={() => {
                    saveLevelAs(saveAsName || level.name);
                    setSaveAsName('');
                  }}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                >
                  另存为新关卡
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveAsName('');
                }}
                className="w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-game-darker rounded-xl p-6 border border-game-magic/30 w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-game-gold">加载关卡</h2>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              <div
                className="p-4 bg-game-dark/50 rounded-lg border border-game-magic/20 cursor-pointer hover:border-game-magic/50 transition-colors"
                onClick={() => {
                  const defaultLevel = getDefaultLevel();
                  loadLevel(defaultLevel);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-game-gold">默认关卡</h3>
                    <p className="text-sm text-gray-400">游戏内置的默认关卡</p>
                  </div>
                  <span className="text-xs bg-purple-600/30 px-2 py-1 rounded">内置</span>
                </div>
              </div>

              {savedLevels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无保存的自定义关卡
                </div>
              ) : (
                savedLevels.map((savedLevel) => (
                  <div
                    key={savedLevel.id}
                    className="p-4 bg-game-dark/50 rounded-lg border border-game-magic/20 hover:border-game-magic/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => loadLevel(savedLevel)}
                      >
                        <h3 className="font-bold">{savedLevel.name}</h3>
                        <p className="text-sm text-gray-400">
                          {savedLevel.description || '无描述'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {savedLevel.waves.length} 波 | {savedLevel.buildablePositions.length} 建造位
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedLevel(savedLevel.id);
                        }}
                        className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowLoadDialog(false)}
              className="w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
