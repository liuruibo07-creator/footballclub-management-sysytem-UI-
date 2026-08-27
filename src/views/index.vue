<template>
  <main class="match-home">
    <section class="match-hero" aria-labelledby="next-match-title">
      <div class="hero-shade" />
      <div class="hero-heading">
        <span id="next-match-title">下一场比赛</span>
      </div>

      <div class="match-stage">
        <div class="team">
          <img :src="tianjinLogo" alt="天津津门虎队徽" />
          <strong>天津津门虎</strong>
        </div>
        <div class="match-meta">
          <span class="league-info">中超联赛 第25轮</span>
          <b>VS</b>
          <span><el-icon><Clock /></el-icon>2026-08-29&nbsp; 19:00</span>
          <span><el-icon><OfficeBuilding /></el-icon>天津泰达足球场</span>
        </div>
        <div class="team">
          <img :src="qingdaoLogo" alt="青岛西海岸队徽" />
          <strong>青岛西海岸</strong>
        </div>
      </div>

      <button class="prepare-button" type="button" @click="startPreparation">
        进入赛前准备 <el-icon><Right /></el-icon>
      </button>
    </section>

    <div class="dashboard-grid">
      <section class="panel season-panel" aria-labelledby="season-title">
        <header class="panel-header"><h2 id="season-title">赛季概览</h2></header>
        <div class="season-stats">
          <div class="stat-item">
            <span>联赛排名</span>
            <strong>14<small>/16</small></strong>
          </div>
          <div class="stat-item">
            <span>积分</span>
            <strong>18</strong>
          </div>
          <div class="stat-item record-stat">
            <span>战绩</span>
            <strong><em>7</em>胜 <em>7</em>平 <em>9</em>负</strong>
          </div>
        </div>
        <div class="recent-block">
          <h3>近期状态</h3>
          <div class="form-list">
            <div v-for="match in recentMatches" :key="match.round" class="form-item">
              <span class="result-chip" :class="match.tone">{{ match.result }}</span>
              <strong>{{ match.score }}</strong>
              <small>{{ match.round }}</small>
            </div>
          </div>
        </div>
        <button class="text-link season-link" type="button" @click="showMessage('赛季数据')">
          查看全部 <el-icon><Right /></el-icon>
        </button>
      </section>

      <section class="panel todo-panel" aria-labelledby="todo-title">
        <header class="panel-header"><h2 id="todo-title">待处理事项</h2></header>
        <div class="todo-section injury-section">
          <div class="todo-heading">
            <h3>赛前动态</h3>
            <span class="count-badge danger">3</span>
          </div>
          <ul>
            <li v-for="item in matchUpdates" :key="item.title">
              <el-icon class="status-icon"><WarningFilled /></el-icon>
              <div class="item-main">
                <strong>{{ item.title }}</strong>
                <span>{{ item.subtitle }}</span>
              </div>
              <div class="item-side">
                <span>{{ item.detail }}</span>
                <small>{{ item.updatedAt }}</small>
              </div>
            </li>
          </ul>
        </div>
        <div class="todo-section task-section">
          <div class="todo-heading">
            <h3>后续赛程</h3>
            <span class="count-badge warning">2</span>
          </div>
          <ul>
            <li v-for="task in fixtures" :key="task.title" class="task-item">
              <el-icon class="task-icon"><Tickets /></el-icon>
              <div class="item-main">
                <strong>{{ task.title }}</strong>
                <span>{{ task.description }}</span>
              </div>
              <time :datetime="task.datetime">开球：{{ task.kickoff }}</time>
            </li>
          </ul>
        </div>
        <button class="text-link todo-link" type="button" @click="showMessage('后续赛程')">
          查看全部赛程 <el-icon><Right /></el-icon>
        </button>
      </section>
    </div>
  </main>
</template>

<script setup>
import { Clock, OfficeBuilding, Right, Tickets, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import tianjinLogo from '@/assets/images/tianjin-jinmen-tiger.png'
import qingdaoLogo from '@/assets/images/qingdao-west-coast.png'

defineOptions({ name: 'Index' })

const recentMatches = [
  { result: '平', score: '0-0', round: '第24轮', tone: 'draw' },
  { result: '负', score: '2-4', round: '第23轮', tone: 'loss' },
  { result: '负', score: '1-2', round: '第22轮', tone: 'loss' },
  { result: '胜', score: '3-2', round: '第21轮', tone: 'win' },
  { result: '胜', score: '2-0', round: '第20轮', tone: 'win' }
]

const matchUpdates = [
  { title: '近期走势', subtitle: '联赛第22–24轮', detail: '连续3场不胜', updatedAt: '更新：2026-08-22' },
  { title: '主场回归', subtitle: '中超第25轮', detail: '重返泰达足球场', updatedAt: '比赛：2026-08-29' },
  { title: '票务进展', subtitle: '80元档已售罄', detail: '120元档即将售罄', updatedAt: '截至：2026-08-26' }
]

const fixtures = [
  { title: '第25轮 · 青岛西海岸', description: '主场 · 天津泰达足球场', kickoff: '08-29 19:00', datetime: '2026-08-29T19:00' },
  { title: '第26轮 · 浙江俱乐部绿城', description: '主场 · 中超联赛', kickoff: '09-06 20:00', datetime: '2026-09-06T20:00' }
]

function startPreparation() {
  ElMessage.success('已进入青岛西海岸赛前准备流程')
}

function showMessage(target) {
  ElMessage.info(`${target}功能正在准备中`)
}
</script>

<style lang="scss" scoped>
.match-home {
  --navy: #102a51;
  --blue: #1264d7;
  --muted: #66758c;
  min-height: calc(100vh - 84px);
  padding: 18px;
  background: #f5f7fb;
  color: var(--navy);
}

.match-hero {
  position: relative;
  min-height: 190px;
  aspect-ratio: 3.35 / 1;
  overflow: hidden;
  border-radius: 7px;
  background: #06295f url('@/assets/images/home-stadium.png') center 48% / cover no-repeat;
  box-shadow: 0 2px 9px rgba(15, 47, 89, 0.14);
  color: #fff;
}

.hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(3, 30, 73, 0.72), rgba(3, 39, 91, 0.24) 50%, rgba(3, 30, 73, 0.72));
}

.hero-heading {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 27px 35px 0;
  font-size: 18px;
  font-weight: 700;

  strong {
    grid-column: 2;
    font-size: 19px;
  }
}

.match-stage {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px minmax(0, 1fr);
  align-items: center;
  width: 60%;
  margin: 8px 0 0 8%;
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  img {
    width: clamp(72px, 6.5vw, 88px);
    height: clamp(72px, 6.5vw, 88px);
    object-fit: contain;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.22));
  }

  strong {
    white-space: nowrap;
    font-size: 18px;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  }
}

.match-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  color: rgba(255, 255, 255, 0.9);

  .league-info {
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    margin-bottom: 4px;
  }

  b {
    margin-bottom: 3px;
    color: #fff;
    font-size: 42px;
    line-height: 1;
  }

  span {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 14px;
  }
}

.prepare-button {
  position: absolute;
  z-index: 2;
  right: 48px;
  bottom: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-width: 160px;
  height: 42px;
  padding: 0 24px;
  border: 0;
  border-radius: 6px;
  background: #1767ee;
  box-shadow: 0 8px 22px rgba(0, 61, 181, 0.35);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover { transform: translateY(-2px); background: #2877fa; }
  &:focus-visible { outline: 3px solid rgba(255, 255, 255, 0.75); outline-offset: 2px; }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
  gap: 18px;
  margin-top: 18px;
}

.panel {
  position: relative;
  min-height: clamp(310px, 28vw, 410px);
  padding: 0 20px 20px;
  overflow: hidden;
  border: 1px solid #e7ebf1;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 9px rgba(29, 61, 104, 0.06);
}

.panel-header {
  height: 44px;
  border-bottom: 1px solid #e5e9ef;

  h2 {
    margin: 0;
    padding-top: 14px;
    font-size: 16px;
    line-height: 1;
  }
}

.season-stats {
  display: grid;
  grid-template-columns: 1fr 0.78fr 1.45fr;
  padding: 23px 0 22px;
}

.stat-item {
  min-height: 54px;
  padding: 0 13px;
  border-right: 1px solid #e7ebf0;

  &:first-child { padding-left: 8px; }
  &:last-child { border-right: 0; }
  span { display: block; margin-bottom: 11px; color: var(--muted); font-size: 12px; white-space: nowrap; }
  strong { color: #1258b8; font-size: 30px; line-height: 1; }
  small { margin-left: 4px; color: #46566d; font-size: 16px; font-weight: 500; }
}

.record-stat strong {
  white-space: nowrap;
  font-size: 18px;
  font-weight: 500;

  em { font-size: 27px; font-style: normal; font-weight: 700; }
}

.recent-block {
  padding: 17px 8px 0;
  border-top: 1px solid #e5e9ef;

  h3 { margin: 0 0 14px; font-size: 13px; }
}

.form-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;

  strong { font-size: 16px; }
  small { color: #7b8798; font-size: 10px; white-space: nowrap; }
}

.result-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 700;

  &.win { background: #dff7e9; color: #18a55b; }
  &.draw { background: #edf0f4; color: #657084; }
  &.loss { background: #ffeaed; color: #e94c5c; }
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #1764c1;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover { color: #0b7be8; }
  &:focus-visible { outline: 2px solid #69a7f4; outline-offset: 3px; border-radius: 2px; }
}

.season-link { position: absolute; right: 16px; bottom: 10px; }

.todo-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0 2px;
  border-bottom: 1px solid #edf0f4;

  h3 { margin: 0; font-size: 14px; }
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 700;

  &.danger { background: #f24c5d; }
  &.warning { background: #ff850f; }
}

.todo-section ul { margin: 0; padding: 0; list-style: none; }

.todo-section li {
  display: grid;
  grid-template-columns: 24px minmax(130px, 0.85fr) minmax(180px, 1.15fr);
  align-items: center;
  min-height: 40px;
  border-bottom: 1px solid #edf0f4;
}

.status-icon { color: #f04a5b; font-size: 19px; }

.item-main,
.item-side {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong { color: #324259; font-size: 13px; }
  span { color: #7a8698; font-size: 12px; }
}

.item-side small { color: #ef5061; font-size: 12px; }
.task-section { margin-top: 2px; }
.todo-section li.task-item { grid-template-columns: 27px minmax(0, 1fr) 135px; min-height: 40px; }
.task-icon { color: #ff8619; font-size: 21px; }
.task-item time { color: #ff7910; font-size: 10px; white-space: nowrap; }
.todo-link { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); }

@media (max-width: 900px) {
  .prepare-button { right: 28px; bottom: 26px; }
}

@media (max-width: 620px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .match-home { padding: 10px; }
  .match-hero { min-height: 410px; aspect-ratio: auto; }
  .hero-heading {
    grid-template-columns: 1fr;
    gap: 7px;
    padding: 20px;
    text-align: center;

    strong { grid-column: auto; grid-row: 1; }
  }
  .match-stage { grid-template-columns: 1fr 105px 1fr; width: calc(100% - 24px); margin-top: 26px; }
  .team img { width: 68px; height: 68px; }
  .team strong { font-size: 15px; }
  .match-meta b { font-size: 30px; }
  .match-meta span { font-size: 11px; }
  .prepare-button {
    right: 50%;
    bottom: 28px;
    transform: translateX(50%);

    &:hover { transform: translate(50%, -2px); }
  }
  .panel { min-height: auto; padding: 0 15px 68px; }
  .season-stats { grid-template-columns: 1fr 0.8fr 1.5fr; }
  .stat-item { padding: 0 9px; }
  .stat-item strong { font-size: 24px; }
  .record-stat strong,
  .record-stat strong em { font-size: 16px; }
  .form-list { gap: 4px; }
  .todo-section li,
  .todo-section li.task-item {
    grid-template-columns: 24px 1fr;
    gap: 0 4px;
    padding: 10px 0;
  }
  .item-side,
  .task-item time { grid-column: 2; margin-top: 7px; }
}
</style>
