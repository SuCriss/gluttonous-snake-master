'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export default function Home() {
  // 游戏区域大小
  const gridSize = 20;
  const cellSize = 20;
  const gridWidth = gridSize * cellSize;
  const gridHeight = gridSize * cellSize;

  // 游戏状态
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(150); // 移动速度，数值越小越快
  const [isPaused, setIsPaused] = useState(false);

  // 使用useRef来存储当前方向，避免闭包问题
  const directionRef = useRef(direction);
  
  // 更新方向引用
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // 生成随机食物位置
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
    
    // 确保食物不会出现在蛇身上
    const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    if (isOnSnake) {
      return generateFood();
    }
    
    return newFood;
  }, [snake]);

  // 处理键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // 防止按键导致页面滚动
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      // 暂停/继续游戏
      if (e.key === ' ') {
        setIsPaused(prev => !prev);
        return;
      }
      
      // 如果游戏结束或暂停，不处理方向键
      if (gameOver || isPaused) return;
      
      // 根据当前方向，限制不能直接反向移动
      switch(e.key) {
        case 'ArrowUp':
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isPaused]);

  // 游戏主循环
  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        // 获取蛇头位置
        const head = {...prevSnake[0]};
        
        // 根据方向移动蛇头
        switch(directionRef.current) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
          setGameOver(true);
          return prevSnake;
        }
        
        // 检查是否撞到自己
        if (prevSnake.some((segment, index) => index !== 0 && segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          return prevSnake;
        }
        
        // 创建新的蛇身
        const newSnake = [head, ...prevSnake];
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
          // 吃到食物，增加分数
          setScore(prev => prev + 10);
          // 增加速度
          setSpeed(prev => Math.max(50, prev - 5));
          // 生成新食物
          setFood(generateFood());
        } else {
          // 没吃到食物，移除尾部
          newSnake.pop();
        }
        
        return newSnake;
      });
    };

    // 设置游戏循环定时器
    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [food, gameOver, generateFood, isPaused, speed]);

  // 重新开始游戏
  const restartGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setSpeed(150);
    setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-4 text-center">贪吃蛇游戏</h1>
      
      <div className="mb-4 flex gap-4">
        <div className="text-xl">分数: {score}</div>
        {!gameOver && <button 
          onClick={() => setIsPaused(prev => !prev)} 
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isPaused ? '继续' : '暂停'}
        </button>}
      </div>
      
      <div 
        className="relative border-2 border-gray-800 dark:border-gray-200" 
        style={{ width: `${gridWidth}px`, height: `${gridHeight}px` }}
      >
        {/* 渲染蛇 */}
        {snake.map((segment, index) => (
          <div 
            key={index}
            className="absolute bg-green-500"
            style={{
              left: `${segment.x * cellSize}px`,
              top: `${segment.y * cellSize}px`,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              // 蛇头使用不同颜色
              backgroundColor: index === 0 ? '#22c55e' : '#4ade80'
            }}
          />
        ))}
        
        {/* 渲染食物 */}
        <div 
          className="absolute bg-red-500 rounded-full"
          style={{
            left: `${food.x * cellSize}px`,
            top: `${food.y * cellSize}px`,
            width: `${cellSize}px`,
            height: `${cellSize}px`,
          }}
        />
        
        {/* 游戏结束提示 */}
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <div className="text-white text-2xl font-bold mb-4">游戏结束!</div>
            <button 
              onClick={restartGame}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重新开始
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center">
        <p className="mb-2">操作说明:</p>
        <p>使用方向键控制蛇的移动方向</p>
        <p>空格键暂停/继续游戏</p>
      </div>
    </div>
  );
}
