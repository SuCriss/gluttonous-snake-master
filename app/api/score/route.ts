import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// 创建PostgreSQL连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

// 保存玩家分数
export async function POST(request: NextRequest) {
  try {
    const { playerName, score } = await request.json();
    
    // 验证数据
    if (!playerName || typeof score !== 'number') {
      return NextResponse.json({ error: '无效的数据' }, { status: 400 });
    }
    
    // 保存到数据库
    await pool.query(
      'INSERT INTO public.player_score (player_name, score) VALUES ($1, $2)',
      [playerName, score]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存分数失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

// 获取排行榜
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT player_name, score FROM public.player_score ORDER BY score DESC LIMIT 10'
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}