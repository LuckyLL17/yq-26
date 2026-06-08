import { useState } from 'react';
import { Settings, X, Palette, Sparkles, Volume2, Music, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '@/game/settingsStore';
import type { BackgroundTheme } from '@/game/renderer';

const themeOptions: { value: BackgroundTheme; label: string; icon: string; colors: string[] }[] = [
  { value: 'night', label: '暗夜星空', icon: '🌙', colors: ['#1a1a2e', '#7c3aed', '#a78bfa'] },
  { value: 'forest', label: '神秘森林', icon: '🌲', colors: ['#1a3a1a', '#22c55e', '#86efac'] },
  { value: 'desert', label: '沙漠遗迹', icon: '🏜️', colors: ['#3d2f1f', '#f59e0b', '#fde0ab'] },
  { value: 'ice', label: '冰雪世界', icon: '❄️', colors: ['#1a2a3a', '#38bdf8', '#bae6fd'] },
  { value: 'volcano', label: '火山熔岩', icon: '🌋', colors: ['#2a1515', '#ef4444', '#fca5a5'] },
  { value: 'ocean', label: '深海秘境', icon: '🌊', colors: ['#0f2a3a', '#0ea5e9', '#7dd3fc'] },
];

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    backgroundTheme,
    particleIntensity,
    trailEffect,
    glowEffect,
    screenShake,
    soundEnabled,
    musicEnabled,
    soundVolume,
    musicVolume,
    setBackgroundTheme,
    setParticleIntensity,
    setTrailEffect,
    setGlowEffect,
    setScreenShake,
    setSoundEnabled,
    setMusicEnabled,
    setSoundVolume,
    setMusicVolume,
    resetToDefaults,
  } = useSettingsStore();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-game-panel/90 backdrop-blur-sm border border-game-magic/30 text-gray-300 hover:text-white hover:border-game-magic/50 transition-all duration-200 hover:scale-105"
      >
        <Settings className="w-5 h-5" />
        <span className="hidden sm:inline">设置</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-game-panel/95 backdrop-blur-md rounded-2xl border border-game-magic/30 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-game-panel/95 backdrop-blur-md p-4 border-b border-game-magic/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-game-magic" />
                游戏设置
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-game-magic mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  场景主题
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setBackgroundTheme(theme.value)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        backgroundTheme === theme.value
                          ? 'border-game-magic bg-game-magic/20 scale-105'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      <div className="w-full h-8 rounded-lg mb-2 overflow-hidden">
                        <div
                          className="w-full h-full"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`,
                          }}
                        />
                      </div>
                      <div className="text-xs font-medium text-center text-gray-300">
                        {theme.icon} {theme.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-game-magic mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  视觉特效
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">弹道拖尾</p>
                      <p className="text-xs text-gray-400">投射物飞行轨迹效果</p>
                    </div>
                    <button
                      onClick={() => setTrailEffect(!trailEffect)}
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${
                        trailEffect ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          trailEffect ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">发光效果</p>
                      <p className="text-xs text-gray-400">粒子和特效的光晕</p>
                    </div>
                    <button
                      onClick={() => setGlowEffect(!glowEffect)}
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${
                        glowEffect ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          glowEffect ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">屏幕震动</p>
                      <p className="text-xs text-gray-400">爆炸和击杀时的震动反馈</p>
                    </div>
                    <button
                      onClick={() => setScreenShake(!screenShake)}
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${
                        screenShake ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          screenShake ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">粒子强度</p>
                        <p className="text-xs text-gray-400">特效粒子数量</p>
                      </div>
                      <span className="text-sm font-bold text-game-magic">
                        {Math.round(particleIntensity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2"
                      step="0.1"
                      value={particleIntensity}
                      onChange={(e) => setParticleIntensity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-game-magic"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>低</span>
                      <span>中</span>
                      <span>高</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-game-magic mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  音频设置
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">音效</span>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${
                        soundEnabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {soundEnabled && (
                    <div className="p-3 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">音效音量</span>
                        <span className="text-xs font-bold text-gray-300">
                          {Math.round(soundVolume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={soundVolume}
                        onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-game-magic"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">音乐</span>
                    </div>
                    <button
                      onClick={() => setMusicEnabled(!musicEnabled)}
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${
                        musicEnabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          musicEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {musicEnabled && (
                    <div className="p-3 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">音乐音量</span>
                        <span className="text-xs font-bold text-gray-300">
                          {Math.round(musicVolume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-game-magic"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={resetToDefaults}
                  className="w-full py-3 px-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  恢复默认设置
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-game-magic/20">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02]"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
