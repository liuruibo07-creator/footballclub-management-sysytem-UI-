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
          <strong>中超联赛 第25轮</strong>
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
      <section class="panel season-panel" aria-labelledby="season-title" v-loading="seasonLoading">
        <header class="panel-header"><h2 id="season-title">赛季概览</h2></header>
        <div class="season-stats">
          <div class="stat-item">
            <span>联赛排名</span>
            <strong>{{ seasonOverview.rank || '--' }}<small>/{{ seasonOverview.totalTeams || '--' }}</small></strong>
          </div>
          <div class="stat-item">
            <span>积分</span>
            <strong>{{ seasonOverview.points }}</strong>
          </div>
          <div class="stat-item record-stat">
            <span>战绩</span>
            <strong><em>{{ seasonOverview.wins }}</em>胜 <em>{{ seasonOverview.draws }}</em>平 <em>{{ seasonOverview.losses }}</em>负</strong>
          </div>
        </div>
        <div class="recent-block">
          <h3>近期状态</h3>
          <div v-if="recentMatches.length > 0" class="form-list">
            <div v-for="match in recentMatches" :key="`${match.roundNo}-${match.matchDate}`" class="form-item">
              <span class="result-chip" :class="getResultTone(match.result)">{{ getResultLabel(match.result) }}</span>
              <strong>{{ match.teamScore }}-{{ match.opponentScore }}</strong>
              <small>第{{ match.roundNo }}轮</small>
            </div>
          </div>
          <div v-else-if="!seasonLoading" class="season-empty">暂无已完成比赛</div>
        </div>
        <button class="text-link season-link" type="button" @click="viewAllMatches">
          查看全部 <el-icon><Right /></el-icon>
        </button>
      </section>

      <section class="panel todo-panel" aria-labelledby="todo-title">
        <header class="panel-header"><h2 id="todo-title">待处理事项</h2></header>
        <div class="todo-section schedule-todo-section" v-loading="pendingLoading">
          <div class="todo-heading">
            <h3>待办日程</h3>
            <span v-if="pendingTotal > 0" class="count-badge danger">{{ pendingTotal }}</span>
          </div>
          <div v-if="!pendingLoading && pendingSchedules.length === 0" class="todo-empty">
            暂无已安排的日程
          </div>
          <ul v-else>
            <li v-for="item in pendingSchedules" :key="item.id" class="schedule-todo-item">
              <el-icon class="status-icon"><Calendar /></el-icon>
              <div class="item-main">
                <strong>{{ item.title }}</strong>
                <span>{{ getScheduleType(item.eventType) }} · {{ item.location || '地点待定' }}</span>
              </div>
              <div class="item-side">
                <span>{{ formatScheduleTime(item.startTime) }}</span>
                <small>已安排</small>
              </div>
            </li>
          </ul>
          <div class="todo-summary-row">
            <div v-if="pendingRemaining > 0" class="remaining-tip">
              还有 <strong>{{ pendingRemaining }}</strong> 条待办日程
            </div>
            <button class="text-link todo-link" type="button" @click="viewAllSchedules">
              查看全部 <el-icon><Right /></el-icon>
            </button>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { Calendar, Clock, OfficeBuilding, Right } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getPendingEventSummary } from '@/api/system/event'
import { getSeasonOverview } from '@/api/match/match'
import tianjinLogo from '@/assets/images/tianjin-jinmen-tiger.png'
import qingdaoLogo from '@/assets/images/qingdao-west-coast.png'

defineOptions({ name: 'Index' })

const router = useRouter()
const pendingLoading = ref(false)
const pendingSchedules = ref([])
const pendingTotal = ref(0)
const pendingRemaining = ref(0)
const seasonLoading = ref(false)
const seasonOverview = ref({
  rank: 0,
  totalTeams: 0,
  points: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  recentMatches: []
})
const recentMatches = computed(() => seasonOverview.value.recentMatches || [])

function startPreparation() {
  ElMessage.success('已进入青岛西海岸赛前准备流程')
}

function loadPendingSchedules() {
  pendingLoading.value = true
  getPendingEventSummary().then(response => {
    const summary = response.data || {}
    pendingSchedules.value = summary.events || []
    pendingTotal.value = Number(summary.total || 0)
    pendingRemaining.value = Number(summary.remaining || 0)
  }).finally(() => {
    pendingLoading.value = false
  })
}

function loadSeasonOverview() {
  seasonLoading.value = true
  getSeasonOverview().then(response => {
    seasonOverview.value = { ...seasonOverview.value, ...(response.data || {}) }
  }).finally(() => {
    seasonLoading.value = false
  })
}

function getResultLabel(result) {
  return ({ W: '胜', D: '平', L: '负' })[result] || '-'
}

function getResultTone(result) {
  return ({ W: 'win', D: 'draw', L: 'loss' })[result] || 'draw'
}

function getScheduleType(eventType) {
  return ({ '0': '比赛', '1': '训练', '2': '会议' })[eventType] || '日程'
}

function formatScheduleTime(dateTime) {
  if (!dateTime) return '时间待定'
  const date = new Date(dateTime.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '时间待定'
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

function viewAllSchedules() {
  router.push({ path: '/cm/event', query: { status: '0' } })
}

function viewAllMatches() {
  router.push({ path: '/cm/match', query: { status: '1' } })
}

function loadHomeData() {
  loadSeasonOverview()
  loadPendingSchedules()
}

onActivated(loadHomeData)

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
  height: clamp(240px, 22vw, 330px);
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

  > strong {
    color: #fff;
    font-size: 19px;
    white-space: nowrap;
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

.season-empty {
  padding: 34px 0;
  text-align: center;
  color: #98a2b3;
  font-size: 13px;
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

.schedule-todo-section { min-height: 190px; }

.todo-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: #98a2b3;
  font-size: 13px;
}

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

.remaining-tip {
  color: #7a8698;
  font-size: 12px;

  strong { color: #1764c1; }
}

.todo-summary-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  min-height: 42px;
  padding: 6px 4px 0;
}

.todo-link { flex: none; }

@media (max-width: 900px) {
  .prepare-button { right: 28px; bottom: 26px; }
}

@media (max-width: 620px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .match-home { padding: 10px; }
  .match-hero { height: 410px; }
  .hero-heading {
    grid-template-columns: 1fr;
    gap: 7px;
    padding: 20px;
    text-align: center;
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
  .todo-section li.schedule-todo-item {
    grid-template-columns: 24px 1fr;
    gap: 0 4px;
    padding: 10px 0;
  }
  .item-side,
  .schedule-todo-item time { grid-column: 2; margin-top: 7px; }
}
</style>
