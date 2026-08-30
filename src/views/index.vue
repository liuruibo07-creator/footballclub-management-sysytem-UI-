<template>
  <main class="match-home">
    <section class="match-hero" aria-labelledby="next-match-title" v-loading="nextMatchLoading">
      <div class="hero-heading">
        <span id="next-match-title">下一场比赛</span>
      </div>

      <div v-if="nextMatch" class="match-stage">
        <div class="team">
          <img v-if="getTeamLogo(nextMatch.homeTeam)" :src="getTeamLogo(nextMatch.homeTeam)" :alt="`${nextMatch.homeTeam}队徽`" @error="handleLogoError(nextMatch.homeTeam)" />
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
          <img v-if="getTeamLogo(nextMatch.awayTeam)" :src="getTeamLogo(nextMatch.awayTeam)" :alt="`${nextMatch.awayTeam}队徽`" @error="handleLogoError(nextMatch.awayTeam)" />
          <span v-else class="team-logo-fallback" aria-hidden="true">{{ getTeamAbbr(nextMatch.awayTeam) }}</span>
          <strong>{{ nextMatch.awayTeam }}</strong>
        </div>
      </div>

      <div v-else-if="!nextMatchLoading" class="next-match-empty">暂无待进行比赛</div>
    </section>

    <div class="dashboard-grid">
      <section class="panel season-panel" aria-labelledby="season-title" v-loading="seasonLoading">
        <header class="panel-header"><h2 id="season-title">赛季表现</h2></header>
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
        <div class="season-summary">
          <span>本赛季数据概览</span>
          <strong>{{ seasonOverview.points }}<small> 当前积分</small></strong>
        </div>
        <button class="text-link season-link" type="button" @click="viewAllMatches">
          查看全部比赛 <el-icon><Right /></el-icon>
        </button>
      </section>

      <section class="panel recent-panel" aria-labelledby="recent-title" v-loading="seasonLoading">
        <header class="panel-header"><h2 id="recent-title">近期状态</h2></header>
        <div v-if="recentMatches.length > 0" class="form-list">
          <div v-for="match in recentMatches" :key="`${match.roundNo}-${match.matchDate}`" class="form-item">
            <span class="result-chip" :class="getResultTone(match.result)">{{ getResultLabel(match.result) }}</span>
            <strong>{{ match.teamScore }}-{{ match.opponentScore }}</strong>
            <small>第{{ match.roundNo }}轮</small>
          </div>
        </div>
        <div v-else-if="!seasonLoading" class="season-empty">暂无已完成比赛</div>
      </section>

      <article class="panel overview-card health-card">
        <header class="panel-header"><h2>球队状态</h2></header>
        <div class="health-stats">
          <div v-for="item in teamHealthStats" :key="item.label" class="health-stat" :class="item.tone">
            <span class="health-dot" aria-hidden="true" />
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}<small> 人</small></strong>
          </div>
        </div>
        <button class="card-link" type="button" @click="viewInjuries">
          查看伤病情况 <el-icon><Right /></el-icon>
        </button>
      </article>

      <article class="panel overview-card training-card" v-loading="trainingLoading">
        <header class="panel-header">
          <h2>今日训练</h2>
          <span class="sample-badge" v-if="todayTrainings.length">{{ todayTrainings.length }} 项</span>
          <span class="sample-badge" v-else>暂无安排</span>
        </header>
        <template v-if="todayTrainings.length">
          <div v-for="item in todayTrainings" :key="item.id" class="training-item">
            <strong class="training-subject">{{ item.title }}</strong>
            <div class="training-meta">
              <span><el-icon><Clock /></el-icon>{{ formatTrainingTime(item.startTime) }}—{{ formatTrainingTime(item.endTime) }}</span>
              <span v-if="item.venue"><el-icon><OfficeBuilding /></el-icon>{{ item.venue }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="panel-empty">今日暂无训练安排</div>
        </template>
        <button class="card-link" type="button" @click="viewTraining">
          查看训练计划 <el-icon><Right /></el-icon>
        </button>
      </article>

      <section class="panel todo-panel" aria-labelledby="todo-title">
        <header class="panel-header">
          <h2 id="todo-title">待办日程</h2>
          <span v-if="pendingTotal > 0" class="count-badge warning">{{ pendingTotal }}</span>
        </header>
        <div class="todo-section schedule-todo-section" v-loading="pendingLoading">
          <div v-if="!pendingLoading && pendingSchedules.length === 0" class="todo-empty">暂无已安排的日程</div>
          <ul v-else>
            <li v-for="item in pendingSchedules" :key="item.id" class="schedule-todo-item">
              <el-icon class="status-icon"><Calendar /></el-icon>
              <div class="item-main">
                <strong>{{ item.title }}</strong>
                <span>{{ getScheduleType(item.eventType) }} · {{ item.location || '地点待定' }}</span>
              </div>
              <div class="item-side">
                <small>{{ formatScheduleTime(item.startTime) }}</small>
                <span>已安排</span>
              </div>
            </li>
          </ul>
          <div class="todo-summary-row">
            <div v-if="pendingRemaining > 0" class="remaining-tip">还有 <strong>{{ pendingRemaining }}</strong> 条待办日程</div>
            <button class="text-link todo-link" type="button" @click="viewAllSchedules">
              查看全部日程 <el-icon><Right /></el-icon>
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
import { getNextMatch, getSeasonOverview } from '@/api/match/match'
import { listTeamLogo } from '@/api/match/teamLogo'
import { listTraining } from '@/api/system/training'

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

// 队名 -> OSS队徽URL映射,由loadTeamLogos()从后端football_team_logo表加载
const logoMap = ref({})
const failedLogoTeams = ref(new Set())

function loadNextMatch() {
  nextMatchLoading.value = true
  getNextMatch().then(response => {
    nextMatch.value = response.data || null
  }).finally(() => {
    nextMatchLoading.value = false
  })
}

function getTeamLogo(teamName) {
  return failedLogoTeams.value.has(teamName) ? '' : (logoMap.value[teamName] || '')
}

/** OSS 对象不存在、无读取权限或网络失败时，切换为球队简称占位。 */
function handleLogoError(teamName) {
  failedLogoTeams.value = new Set([...failedLogoTeams.value, teamName])
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

/** 加载球队队徽映射(队名 -> OSS完整URL) */
function loadTeamLogos() {
  listTeamLogo().then(response => {
    const map = {}
    ;(response.data || []).forEach(item => {
      if (item.logoUrl) map[item.teamName] = item.logoUrl
    })
    logoMap.value = map
    failedLogoTeams.value = new Set()
  }).catch(() => {})
}

function loadHomeData() {
  loadNextMatch()
  loadSeasonOverview()
  loadPendingSchedules()
  loadTodayTrainings()
  loadTeamLogos()
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

<style lang="scss" scoped>
.match-home {
  --surface: #101b29;
  --surface-raised: #142131;
  --border: #223044;
  --border-soft: rgba(145, 166, 195, .14);
  --text: #f3f6fa;
  --text-secondary: #a9b4c5;
  --muted: #738095;
  --primary: #2f7dff;
  --success: #22b573;
  --warning: #ff9b31;
  --danger: #f14d5c;
  min-height: calc(100vh - 106px);
  padding: 18px 20px 26px;
  background: #08111f;
  color: var(--text);
}

.match-hero {
  height: 194px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: none;
}

.hero-shade { display: none; }

.hero-heading {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: block;
  padding: 18px 22px;
  color: #e8eef7;
  font-size: 17px;
}

.match-stage {
  grid-template-columns: minmax(190px, 1fr) 250px minmax(190px, 1fr);
  width: min(850px, 78%);
  height: 100%;
  margin: 0 auto;
}

.team { gap: 9px; }

.team img {
  width: 82px;
  height: 82px;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, .3));
}

.team strong {
  color: var(--text);
  font-size: 20px;
  text-shadow: none;
}

.team-logo-fallback {
  width: 82px;
  height: 82px;
  border-color: #52647c;
  background: #17283e;
  box-shadow: none;
}

.match-meta {
  gap: 8px;
  color: var(--text-secondary);
}

.match-meta > strong {
  margin-bottom: 2px;
  color: #e7edf6;
  font-size: 17px;
}

.match-meta b {
  margin: 0;
  color: #f8fafc;
  font-size: 35px;
  font-weight: 700;
}

.match-meta span {
  color: var(--text-secondary);
  font-size: 13px;
}

.next-match-empty {
  height: 100%;
  color: var(--text-secondary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.panel {
  min-height: 0;
  padding: 0 20px 18px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: none;
  color: var(--text-secondary);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  border-bottom: 1px solid var(--border-soft);
}

.panel-header h2 {
  padding: 0;
  color: var(--text);
  font-size: 17px;
  font-weight: 650;
  line-height: 48px;
}

.season-panel {
  grid-column: span 8;
  min-height: 306px;
}

.recent-panel {
  grid-column: span 4;
  min-height: 306px;
}

.season-stats {
  grid-template-columns: 1fr .82fr 1.45fr;
  padding: 25px 0 22px;
  border-bottom: 1px solid var(--border-soft);
}

.stat-item {
  min-height: 67px;
  padding: 0 20px;
  border-color: var(--border);
}

.stat-item:first-child { padding-left: 8px; }
.stat-item span { color: var(--text-secondary); font-size: 13px; }
.stat-item strong { color: #3f86ff; font-size: 34px; font-variant-numeric: tabular-nums; }
.stat-item small { color: #8794a8; font-size: 14px; }
.record-stat strong { color: var(--text-secondary); font-size: 17px; }
.record-stat strong em { color: #3f86ff; font-size: 29px; }
.record-stat strong em:last-of-type { color: var(--danger); }

.season-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 92px;
  margin-top: 17px;
  padding: 0 18px;
  border: 1px solid rgba(58, 104, 167, .2);
  border-radius: 6px;
  background: #0d1826;
  color: var(--muted);
  font-size: 13px;
}

.season-summary strong {
  color: #3f86ff;
  font-size: 30px;
  font-variant-numeric: tabular-nums;
}

.season-summary small { color: var(--text-secondary); font-size: 12px; font-weight: 400; }

.season-link { right: 20px; bottom: 15px; }

.recent-panel .form-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  height: calc(100% - 48px);
  padding-top: 48px;
}

.form-item { gap: 10px; }
.form-item strong { color: var(--text); font-size: 17px; font-variant-numeric: tabular-nums; }
.form-item small { color: var(--muted); font-size: 11px; }

.result-chip {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  font-size: 16px;
}

.result-chip.win { background: rgba(34, 181, 115, .18); color: #46d495; }
.result-chip.draw { background: rgba(115, 128, 149, .24); color: #bdc6d2; }
.result-chip.loss { background: rgba(241, 77, 92, .19); color: #ff6876; }

.season-empty,
.panel-empty,
.todo-empty {
  color: var(--muted);
}

.overview-card {
  min-height: 248px;
  padding: 0 20px 50px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
}

.health-card { grid-column: span 3; }
.training-card { grid-column: span 4; }
.todo-panel { grid-column: span 5; min-height: 248px; }

.health-stats {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 7px;
}

.health-stat {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  min-height: 39px;
  padding: 0;
  border-bottom: 1px solid var(--border-soft);
  border-radius: 0;
  background: transparent !important;
  color: var(--text-secondary);
}

.health-stat > span:not(.health-dot) { font-size: 13px; }
.health-stat strong { color: var(--text); font-size: 17px; font-variant-numeric: tabular-nums; }
.health-stat strong small { color: var(--muted); font-size: 11px; font-weight: 400; }

.health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #718096;
}

.health-stat.normal .health-dot { background: var(--success); }
.health-stat.injured .health-dot { background: var(--danger); }
.health-stat.recovering .health-dot { background: var(--warning); }
.health-stat.absent .health-dot { background: #ef596b; }

.sample-badge {
  border: 1px solid rgba(47, 125, 255, .2);
  background: rgba(47, 125, 255, .1);
  color: #68a1ff;
  font-size: 10px;
}

.training-item {
  padding: 13px 2px;
  border-bottom: 1px solid var(--border-soft);
}

.training-subject {
  margin: 0 0 7px;
  color: var(--text);
  font-size: 13px;
}

.training-meta { color: var(--muted); font-size: 11px; }
.panel-empty { display: flex; align-items: center; justify-content: center; min-height: 120px; font-size: 13px; }

.count-badge {
  width: 21px;
  height: 21px;
  font-size: 11px;
}

.count-badge.warning { background: var(--warning); }

.schedule-todo-section { min-height: 0; }
.todo-section ul { max-height: 142px; overflow: hidden; }

.todo-section li {
  grid-template-columns: 25px minmax(120px, 1fr) auto;
  min-height: 66px;
  border-color: var(--border-soft);
}

.status-icon { color: var(--warning); font-size: 19px; }
.item-main strong { color: var(--text); font-size: 13px; }
.item-main span { color: var(--muted); font-size: 11px; }
.item-side { align-items: flex-end; }
.item-side small { color: var(--warning); font-size: 11px; }
.item-side span { color: var(--muted); font-size: 10px; }

.todo-summary-row {
  min-height: 39px;
  padding: 7px 0 0;
}

.remaining-tip { color: var(--muted); }
.remaining-tip strong { color: #5b95f7; }

.text-link,
.card-link {
  color: #4087ff;
}

.text-link:hover,
.card-link:hover { color: #6ca3ff; }

.card-link {
  right: 18px;
  bottom: 16px;
  font-size: 11px;
}

@media (max-width: 1280px) {
  .match-stage { width: 82%; }
  .season-panel { grid-column: span 7; }
  .recent-panel { grid-column: span 5; }
  .health-card { grid-column: span 4; }
  .training-card { grid-column: span 4; }
  .todo-panel { grid-column: span 4; }
  .todo-section li { grid-template-columns: 24px 1fr; padding: 8px 0; }
  .item-side { grid-column: 2; align-items: flex-start; }
}

@media (max-width: 980px) {
  .match-home { padding: 14px; }
  .match-stage { grid-template-columns: 1fr 190px 1fr; width: 94%; }
  .season-panel,
  .recent-panel { grid-column: span 12; }
  .health-card,
  .training-card,
  .todo-panel { grid-column: span 6; }
}

@media (max-width: 700px) {
  .match-hero { height: 300px; }
  .match-stage { grid-template-columns: 1fr 100px 1fr; padding-top: 34px; }
  .team img,
  .team-logo-fallback { width: 62px; height: 62px; }
  .team strong { font-size: 14px; }
  .match-meta > strong { font-size: 13px; }
  .match-meta b { font-size: 28px; }
  .match-meta span { font-size: 10px; }
  .health-card,
  .training-card,
  .todo-panel { grid-column: span 12; }
  .season-stats { grid-template-columns: 1fr 1fr; }
  .record-stat { grid-column: 1 / -1; margin-top: 18px; border-right: 0; }
}
</style>
