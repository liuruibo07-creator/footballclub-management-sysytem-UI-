<template>
  <main class="match-home">
    <section class="match-hero" aria-labelledby="next-match-title" v-loading="nextMatchLoading">
      <div class="hero-shade" />
      <div class="hero-heading">
        <span id="next-match-title">下一场比赛</span>
      </div>

      <div v-if="nextMatch" class="match-stage">
        <div class="team">
          <img v-if="getTeamLogo(nextMatch.homeTeam)" :src="getTeamLogo(nextMatch.homeTeam)" :alt="`${nextMatch.homeTeam}队徽`" />
          <span v-else class="team-logo-fallback" aria-hidden="true">{{ getTeamAbbr(nextMatch.homeTeam) }}</span>
          <strong>{{ nextMatch.homeTeam }}</strong>
        </div>
        <div class="match-meta">
          <strong>{{ getCompetitionLabel(nextMatch) }}</strong>
          <b>VS</b>
          <span><el-icon><Clock /></el-icon>{{ formatMatchTime(nextMatch.matchDate) }}</span>
          <span><el-icon><OfficeBuilding /></el-icon>{{ nextMatch.venue || '场地待定' }}</span>
        </div>
        <div class="team">
          <img v-if="getTeamLogo(nextMatch.awayTeam)" :src="getTeamLogo(nextMatch.awayTeam)" :alt="`${nextMatch.awayTeam}队徽`" />
          <span v-else class="team-logo-fallback" aria-hidden="true">{{ getTeamAbbr(nextMatch.awayTeam) }}</span>
          <strong>{{ nextMatch.awayTeam }}</strong>
        </div>
      </div>

      <div v-else-if="!nextMatchLoading" class="next-match-empty">暂无待进行比赛</div>

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

        <div class="team-overview-grid" aria-label="今日训练与球队状态">
          <article class="overview-card training-card" v-loading="trainingLoading">
            <div class="overview-card-header">
              <div>
                <span class="overview-kicker">TODAY</span>
                <h3>今日训练</h3>
              </div>
              <span class="sample-badge" v-if="todayTrainings.length">{{ todayTrainings.length }} 项训练</span>
              <span class="sample-badge" v-else>暂无安排</span>
            </div>
            <template v-if="todayTrainings.length">
              <div v-for="item in todayTrainings" :key="item.id" style="margin-bottom: 10px;">
                <strong class="training-subject">{{ item.title }}</strong>
                <div class="training-meta">
                  <span><el-icon><Clock /></el-icon>{{ formatTrainingTime(item.startTime) }}—{{ formatTrainingTime(item.endTime) }}</span>
                  <span v-if="item.venue"><el-icon><OfficeBuilding /></el-icon>{{ item.venue }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <strong class="training-subject" style="color: #909399;">今日暂无训练安排</strong>
            </template>
            <button class="card-link" type="button" @click="viewTraining">
              查看训练计划 <el-icon><Right /></el-icon>
            </button>
          </article>

          <article class="overview-card health-card">
            <div class="overview-card-header">
              <div>
                <span class="overview-kicker">TEAM</span>
                <h3>球队状态</h3>
              </div>

            </div>
            <div class="health-stats">
              <div v-for="item in teamHealthStats" :key="item.label" class="health-stat" :class="item.tone">
                <strong>{{ item.value }}</strong>
                <span>{{ item.label }}</span>
              </div>
            </div>
            <button class="card-link" type="button" @click="viewInjuries">
              查看伤病情况 <el-icon><Right /></el-icon>
            </button>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { Calendar, Clock, OfficeBuilding, Right } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getPendingEventSummary } from '@/api/system/event'
import { getNextMatch, getSeasonOverview } from '@/api/match/match'
import { listTraining } from '@/api/system/training'
import tianjinLogo from '@/assets/images/tianjin-jinmen-tiger.png'
import qingdaoLogo from '@/assets/images/qingdao-west-coast.png'
import shandongLogo from '@/assets/images/shandong-taishan.png'
import zhejiangLogo from '@/assets/images/zhejiang-professional.png'

defineOptions({ name: 'Index' })

const router = useRouter()
const nextMatch = ref(null)
const nextMatchLoading = ref(false)
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
const teamHealthStats = [
  { label: '正常训练', value: 24, tone: 'normal' },
  { label: '伤病', value: 3, tone: 'injured' },
  { label: '康复中', value: 2, tone: 'recovering' },
  { label: '缺席', value: 1, tone: 'absent' }
]

const todayTrainings = ref([])
const trainingLoading = ref(false)

const teamLogos = {
  '天津津门虎': tianjinLogo,
  '青岛西海岸': qingdaoLogo,
  '山东泰山': shandongLogo,
  '浙江俱乐部绿城': zhejiangLogo,
  '浙江职业足球俱乐部': zhejiangLogo,
  '浙江队': zhejiangLogo,
  '浙江FC': zhejiangLogo
}

function loadNextMatch() {
  nextMatchLoading.value = true
  getNextMatch().then(response => {
    nextMatch.value = response.data || null
  }).finally(() => {
    nextMatchLoading.value = false
  })
}

function getTeamLogo(teamName) {
  return teamLogos[teamName] || ''
}

function getTeamAbbr(teamName) {
  return (teamName || '待定').slice(0, 2)
}

function getCompetitionLabel(match) {
  const competition = match.competitionName === '中国足球超级联赛' ? '中超联赛' : (match.competitionName || '赛事待定')
  return match.roundNo ? `${competition} 第${match.roundNo}轮` : competition
}

function formatMatchTime(dateTime) {
  if (!dateTime) return '时间待定'
  const date = new Date(dateTime.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '时间待定'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/** 加载今日训练数据 */
function loadTodayTrainings() {
  trainingLoading.value = true
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  listTraining({ pageSize: 200 }).then(response => {
    const rows = response.rows || []
    todayTrainings.value = rows.filter(item => {
      if (!item.startTime) return false
      return item.startTime.startsWith(today)
    })
  }).finally(() => {
    trainingLoading.value = false
  })
}

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

function formatTrainingTime(dateTime) {
  if (!dateTime) return '--:--'
  const date = new Date(dateTime.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '--:--'
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

function viewAllSchedules() {
  router.push({ path: '/cm/competition/event', query: { status: '0' } })
}

function viewAllMatches() {
  router.push({ path: '/cm/competition/match', query: { status: '1' } })
}

function viewTraining() {
  router.push('/cm/competition/trainingmanagement')
}

function viewInjuries() {
  router.push('/cm/team/injury')
}

function loadHomeData() {
  loadNextMatch()
  loadSeasonOverview()
  loadPendingSchedules()
  loadTodayTrainings()
}

// 首次挂载时加载（transition+keep-alive 组合下 onActivated 首次不触发）
onMounted(loadHomeData)
// 每次从缓存重新激活时刷新
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

.team-logo-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(72px, 6.5vw, 88px);
  height: clamp(72px, 6.5vw, 88px);
  border: 2px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  background: rgba(8, 55, 116, 0.78);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.next-match-empty {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - 65px);
  color: rgba(255, 255, 255, 0.86);
  font-size: 18px;
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

.team-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e8edf3;
}

.overview-card {
  position: relative;
  min-height: 132px;
  padding: 13px 14px 34px;
  overflow: hidden;
  border: 1px solid #e6ecf4;
  border-radius: 7px;
  background: linear-gradient(135deg, #f8fbff 0%, #f3f7fd 100%);
}

.overview-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;

  h3 {
    margin: 2px 0 0;
    color: #263a55;
    font-size: 14px;
  }
}

.overview-kicker {
  color: #4d84c7;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.sample-badge {
  padding: 3px 7px;
  border-radius: 10px;
  background: #e8f2ff;
  color: #3d78bb;
  font-size: 9px;
  white-space: nowrap;
}

.training-subject {
  display: block;
  margin: 11px 0 7px;
  color: #17365d;
  font-size: 13px;
}

.training-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 14px;
  color: #6e7f95;
  font-size: 11px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
}

.health-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 11px;
}

.health-stat {
  display: flex;
  min-width: 0;
  padding: 7px 3px;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  border-radius: 5px;
  background: #edf3fa;

  strong { color: #315b8c; font-size: 16px; line-height: 1; }
  span { color: #728096; font-size: 9px; white-space: nowrap; }
  &.normal { background: #e7f7ef; }
  &.normal strong { color: #16a062; }
  &.injured { background: #ffebed; }
  &.injured strong { color: #e94c5c; }
  &.recovering { background: #fff4df; }
  &.recovering strong { color: #e59117; }
}

.card-link {
  position: absolute;
  right: 11px;
  bottom: 9px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1764c1;
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;

  &:hover { color: #0b7be8; }
}

@media (max-width: 900px) {
  .team-overview-grid { grid-template-columns: 1fr; }
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
  .health-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
