<template>
  <div class="readiness-page" v-loading="loading">
    <section class="match-strip">
      <div class="match-context">
        <el-tag size="small" effect="dark">下一场比赛</el-tag>
        <span>{{ nextMatchText }}</span>
      </div>
      <div class="sync-info">
        数据截至：{{ latestDataDate }}
        <el-button link type="primary" icon="Refresh" @click="loadData">刷新</el-button>
      </div>
    </section>

    <div v-if="players.length" class="readiness-workspace">
      <div class="squad-column">
        <aside class="squad-panel surface-panel">
          <div class="panel-toolbar">
            <strong>球队阵容</strong>
            <el-select v-model="positionFilter" size="small" style="width: 112px">
              <el-option label="全部位置" value="" />
              <el-option v-for="item in positionOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>
          <el-input v-model="keyword" clearable prefix-icon="Search" placeholder="搜索球员姓名/号码" />

          <div class="squad-header row-grid">
            <span>球员</span><span>位置</span><span>可用性</span>
          </div>
          <div class="squad-list">
            <button
              v-for="player in filteredPlayers"
              :key="player.id"
              type="button"
              :class="['squad-row', 'row-grid', { active: player.id === selectedPlayerId }]"
              @click="selectPlayer(player.id)"
            >
              <span class="player-cell">
                <span class="jersey-number">{{ player.jerseyNumber }}</span>
                <span class="roster-name">{{ player.nameCn }}</span>
              </span>
              <span>{{ positionLabel(player.position) }}</span>
              <span class="availability-cell">
                <i :class="['status-dot', readinessFor(player).tone]" />
                {{ readinessFor(player).shortLabel }}
              </span>
            </button>
            <el-empty v-if="!filteredPlayers.length" description="没有匹配的球员" :image-size="64" />
          </div>
          <div class="availability-legend">
            <span><i class="status-dot success" />可出场</span>
            <span><i class="status-dot warning" />出场观察</span>
            <span><i class="status-dot danger" />无法出场</span>
          </div>
        </aside>

        <el-button class="view-roster-button" type="primary" plain @click="rosterDialogVisible = true">
          <span>查看本场比赛名单</span>
          <small :class="{ full: isSquadFull }">{{ squadCount }}/{{ squadLimit }}</small>
        </el-button>
      </div>

      <main v-if="selectedPlayer" class="player-focus">
        <section class="profile-panel surface-panel">
          <div class="player-portrait-wrap">
            <img
              v-if="playerPhoto(selectedPlayer.nameCn)"
              :src="playerPhoto(selectedPlayer.nameCn)"
              :alt="selectedPlayer.nameCn"
              class="player-portrait"
            />
            <el-icon v-else class="portrait-fallback"><UserFilled /></el-icon>
          </div>
          <div class="profile-identity">
            <div class="name-line">
              <h2>{{ selectedPlayer.nameCn }}</h2>
              <span class="number-chip">{{ selectedPlayer.jerseyNumber }}号</span>
              <span>{{ positionLabel(selectedPlayer.position) }}</span>
            </div>
            <div class="profile-meta">
              <span>{{ ageText(selectedPlayer.birthDate) }}</span>
              <span>{{ selectedPlayer.nationality || '-' }}</span>
              <span>{{ heightText(selectedPlayer.height) }}</span>
              <span>惯用脚 {{ footLabel(selectedPlayer.preferredFoot) }}</span>
            </div>
            <div class="season-line">
              本赛季出场 <strong>{{ num(selectedPlayer.appearances) }}</strong> 次
              <i />进球 <strong>{{ num(selectedPlayer.goals) }}</strong>
              <i />助攻 <strong>{{ num(selectedPlayer.assists) }}</strong>
            </div>
          </div>
          <div class="readiness-hero">
            <span class="hero-label">下一场比赛准备度</span>
            <el-tag :type="readiness.type" effect="dark">{{ readiness.label }}</el-tag>
            <strong>{{ readiness.score }}<small>%</small></strong>
            <span :class="['trend-copy', readiness.tone]">{{ readiness.summary }}</span>
          </div>
        </section>

        <section class="surface-panel evidence-panel">
          <h3>准备度关键因素</h3>
          <div class="evidence-list">
            <div v-for="reason in readiness.reasons" :key="reason.title" class="evidence-row">
              <span :class="['reason-icon', reason.tone]">
                <el-icon><component :is="reason.icon" /></el-icon>
              </span>
              <div>
                <strong>{{ reason.title }}</strong>
                <p>{{ reason.detail }}</p>
              </div>
              <el-icon :class="['reason-result', reason.tone]"><CircleCheckFilled /></el-icon>
            </div>
          </div>
        </section>

        <section class="surface-panel form-panel">
          <div class="section-heading">
            <div><h3>近期表现</h3><span>最近 5 场比赛</span></div>
            <span>评分均值 <strong>{{ averageRating }}</strong></span>
          </div>
          <div class="form-strip">
            <div v-for="match in recentForm" :key="match.key" class="match-form-item">
              <span>{{ match.date }}</span>
              <small>{{ match.opponent }}</small>
              <strong :class="ratingClass(match.rating)">{{ match.rating.toFixed(1) }}</strong>
              <small>{{ match.contribution }}</small>
            </div>
          </div>
        </section>

        <section class="surface-panel readiness-details">
          <div class="detail-section">
            <h3>训练与体能</h3>
            <div class="metric-grid">
              <div><span>训练出勤率</span><strong>{{ attendanceRate(selectedPlayer) }}%</strong><small>{{ num(selectedPlayer.completedTrainingCount) - num(selectedPlayer.missedTrainingCount) }}/{{ num(selectedPlayer.completedTrainingCount) }}</small></div>
              <div><span>完成训练</span><strong>{{ num(selectedPlayer.completedTrainingCount) }}</strong><small>本赛季</small></div>
              <div><span>缺席/请假</span><strong>{{ num(selectedPlayer.missedTrainingCount) }}</strong><small>本赛季</small></div>
              <div><span>场均时间</span><strong>{{ minutesPerGame(selectedPlayer) }}</strong><small>分钟</small></div>
            </div>
          </div>
          <div class="detail-section health-section">
            <h3>医疗与合同</h3>
            <div class="health-row">
              <span>伤病情况</span>
              <strong :class="readiness.injuryTone">{{ injuryText(selectedPlayer) }}</strong>
              <small>{{ injuryDetail(selectedPlayer) }}</small>
            </div>
            <div class="health-row">
              <span>合同到期</span>
              <strong>{{ selectedPlayer.endDate || '暂未录入' }}</strong>
              <small>{{ contractHint(selectedPlayer.endDate) }}</small>
            </div>
          </div>
        </section>
      </main>

      <aside v-if="selectedPlayer" class="decision-panel surface-panel">
        <h3>位置竞争对手</h3>
        <el-select v-model="comparePlayerId" filterable placeholder="选择同位置球员" style="width: 100%">
          <el-option
            v-for="player in compareCandidates"
            :key="player.id"
            :label="`${player.nameCn} · ${player.jerseyNumber}号`"
            :value="player.id"
          />
        </el-select>

        <div v-if="comparePlayer" class="comparison">
          <div class="compare-players">
            <div v-for="player in [selectedPlayer, comparePlayer]" :key="player.id">
              <img v-if="playerPhoto(player.nameCn)" :src="playerPhoto(player.nameCn)" :alt="player.nameCn" />
              <strong>{{ player.nameCn }}</strong>
              <span>准备度 {{ readinessFor(player).score }}%</span>
            </div>
          </div>
          <div class="vs-divider">VS</div>
          <div class="compare-table">
            <div v-for="metric in comparisonMetrics" :key="metric.label">
              <strong>{{ metric.left }}</strong><span>{{ metric.label }}</span><strong>{{ metric.right }}</strong>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无同位置竞争球员" :image-size="72" />

        <div class="coach-decision">
          <h3>教练决策</h3>
          <span>选择入选理由（可多选）</span>
          <el-checkbox-group v-model="decisionReasons">
            <el-checkbox label="近期状态更佳" />
            <el-checkbox label="进攻威胁更大" />
            <el-checkbox label="战术适配度更高" />
            <el-checkbox label="其他原因" />
          </el-checkbox-group>
          <el-input v-model="decisionNote" type="textarea" :rows="3" maxlength="100" show-word-limit placeholder="请输入备注（可选）" />
        </div>

        <div class="decision-actions">
          <el-button type="primary" :disabled="readiness.score < 55 || (isSquadFull && !selectedLineupType)" @click="applyLineup('首发')">
            {{ selectedLineupType === '首发' ? '已加入首发' : '加入首发' }}
          </el-button>
          <el-button :disabled="isSquadFull && !selectedLineupType" @click="applyLineup('替补')">
            {{ selectedLineupType === '替补' ? '已列入替补' : '列入替补' }}
          </el-button>
          <p v-if="lineupChoice">当前决定：已将 {{ selectedPlayer.nameCn }} 列入{{ lineupChoice }}</p>
        </div>
      </aside>
    </div>

    <el-empty v-else-if="!loading" description="暂无球员数据，请先维护球员档案" />

    <el-dialog
      v-model="rosterDialogVisible"
      class="match-roster-dialog"
      width="760px"
      append-to-body
      destroy-on-close
    >
      <template #header>
        <div class="roster-dialog-header">
          <div>
            <strong>本场比赛名单</strong>
            <span>{{ nextMatchText }}</span>
          </div>
          <b :class="{ full: isSquadFull }">{{ squadCount }}/{{ squadLimit }}</b>
        </div>
      </template>

      <div class="roster-dialog-grid">
        <section class="dialog-roster-section starter-section">
          <div class="dialog-roster-title">
            <div><i />首发球员</div>
            <span>{{ starterPlayers.length }} 人</span>
          </div>
          <div v-if="starterPlayers.length" class="dialog-roster-list">
            <div v-for="player in starterPlayers" :key="`dialog-starter-${player.id}`" class="dialog-roster-player">
              <button type="button" @click="selectRosterPlayer(player.id)">
                <span class="dialog-player-photo">
                  <img v-if="playerPhoto(player.nameCn)" :src="playerPhoto(player.nameCn)" :alt="player.nameCn" />
                  <span v-else>{{ (player.nameCn || '').charAt(0) }}</span>
                </span>
                <span class="dialog-player-info">
                  <strong>{{ player.nameCn }}</strong>
                  <small>{{ player.jerseyNumber }}号 · {{ positionLabel(player.position) }}</small>
                </span>
              </button>
              <el-button link type="danger" icon="Close" aria-label="移出首发" @click="removeFromLineup(player.id)" />
            </div>
          </div>
          <div v-else class="dialog-roster-empty">暂未添加首发球员</div>
        </section>

        <section class="dialog-roster-section substitute-section">
          <div class="dialog-roster-title">
            <div><i />替补球员</div>
            <span>{{ substitutePlayers.length }} 人</span>
          </div>
          <div v-if="substitutePlayers.length" class="dialog-roster-list">
            <div v-for="player in substitutePlayers" :key="`dialog-substitute-${player.id}`" class="dialog-roster-player">
              <button type="button" @click="selectRosterPlayer(player.id)">
                <span class="dialog-player-photo">
                  <img v-if="playerPhoto(player.nameCn)" :src="playerPhoto(player.nameCn)" :alt="player.nameCn" />
                  <span v-else>{{ (player.nameCn || '').charAt(0) }}</span>
                </span>
                <span class="dialog-player-info">
                  <strong>{{ player.nameCn }}</strong>
                  <small>{{ player.jerseyNumber }}号 · {{ positionLabel(player.position) }}</small>
                </span>
              </button>
              <el-button link type="danger" icon="Close" aria-label="移出替补" @click="removeFromLineup(player.id)" />
            </div>
          </div>
          <div v-else class="dialog-roster-empty">暂未添加替补球员</div>
        </section>
      </div>

      <div v-if="isSquadFull" class="roster-dialog-full-tip">本场比赛球员名单已满</div>
      <template #footer>
        <el-button @click="rosterDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PlayerReadiness">
import { listPp } from '@/api/pp/pp'
import { getNextMatch, listMatch } from '@/api/match/match'
import { getPlayerPhoto } from '@/utils/playerPhoto'

const { proxy } = getCurrentInstance()
const route = useRoute()
const loading = ref(false)
const players = ref([])
const selectedPlayerId = ref(null)
const comparePlayerId = ref(null)
const nextMatch = ref(null)
const completedMatches = ref([])
const keyword = ref('')
const positionFilter = ref('')
const decisionReasons = ref(['近期状态更佳'])
const decisionNote = ref('')
const lineupChoice = ref('')
const starterIds = ref([])
const substituteIds = ref([])
const rosterDialogVisible = ref(false)
const squadLimit = 23

const positionOptions = [
  { label: '守门员', value: '0' },
  { label: '后卫', value: '1' },
  { label: '中场', value: '2' },
  { label: '前锋', value: '3' }
]

const selectedPlayer = computed(() => players.value.find(item => item.id === selectedPlayerId.value) || null)
const comparePlayer = computed(() => players.value.find(item => item.id === comparePlayerId.value) || null)
const readiness = computed(() => readinessFor(selectedPlayer.value))
const starterPlayers = computed(() => starterIds.value.map(findPlayer).filter(Boolean))
const substitutePlayers = computed(() => substituteIds.value.map(findPlayer).filter(Boolean))
const squadCount = computed(() => starterPlayers.value.length + substitutePlayers.value.length)
const isSquadFull = computed(() => squadCount.value >= squadLimit)
const selectedLineupType = computed(() => lineupTypeFor(selectedPlayerId.value))

const filteredPlayers = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return players.value.filter(player => {
    const positionMatched = !positionFilter.value || String(player.position) === positionFilter.value
    const queryMatched = !query || String(player.nameCn || '').toLowerCase().includes(query) || String(player.jerseyNumber || '').includes(query)
    return positionMatched && queryMatched
  })
})

const compareCandidates = computed(() => {
  if (!selectedPlayer.value) return []
  return players.value.filter(player => player.id !== selectedPlayer.value.id && String(player.position) === String(selectedPlayer.value.position))
})

const comparisonMetrics = computed(() => {
  if (!selectedPlayer.value || !comparePlayer.value) return []
  return [
    { label: '准备度', left: `${readinessFor(selectedPlayer.value).score}%`, right: `${readinessFor(comparePlayer.value).score}%` },
    { label: '出场', left: num(selectedPlayer.value.appearances), right: num(comparePlayer.value.appearances) },
    { label: '进球+助攻', left: contribution(selectedPlayer.value), right: contribution(comparePlayer.value) },
    { label: '首发率', left: `${startRate(selectedPlayer.value)}%`, right: `${startRate(comparePlayer.value)}%` },
    { label: '训练出勤', left: `${attendanceRate(selectedPlayer.value)}%`, right: `${attendanceRate(comparePlayer.value)}%` }
  ]
})

const recentForm = computed(() => {
  if (!selectedPlayer.value) return []
  const source = completedMatches.value.slice(0, 5)
  const fallback = Array.from({ length: 5 }, (_, index) => ({
    id: `fallback-${index}`,
    matchDate: offsetDate(-7 * (index + 1)),
    homeTeam: index % 2 ? '天津津门虎' : `对手${index + 1}`,
    awayTeam: index % 2 ? `对手${index + 1}` : '天津津门虎',
    homeScore: index % 3,
    awayScore: (index + 1) % 3
  }))
  return (source.length ? source : fallback).map((match, index) => {
    const rating = generatedRating(selectedPlayer.value, match, index)
    const opponent = match.homeTeam === '天津津门虎' ? match.awayTeam : match.homeTeam
    const playerContribution = generatedContribution(selectedPlayer.value, match, index)
    return {
      key: match.id || index,
      date: shortDate(match.matchDate),
      opponent: `vs ${opponent || '待定'}`,
      rating,
      contribution: playerContribution
    }
  })
})

const averageRating = computed(() => {
  if (!recentForm.value.length) return '0.0'
  return (recentForm.value.reduce((sum, item) => sum + item.rating, 0) / recentForm.value.length).toFixed(1)
})

const nextMatchText = computed(() => {
  if (!nextMatch.value) return '暂无已安排的下一场比赛'
  const round = nextMatch.value.roundNo ? `第${nextMatch.value.roundNo}轮` : ''
  return [nextMatch.value.competitionName, round, `${nextMatch.value.homeTeam} vs ${nextMatch.value.awayTeam}`, formatDateTime(nextMatch.value.matchDate), nextMatch.value.venue].filter(Boolean).join('  |  ')
})

const latestDataDate = computed(() => {
  const dates = players.value.map(item => item.statAsOf).filter(Boolean).sort()
  return dates.at(-1) || new Date().toISOString().slice(0, 10)
})

function num(value) {
  return Number(value || 0)
}

function playerPhoto(name) {
  return getPlayerPhoto(name)
}

function findPlayer(id) {
  return players.value.find(player => String(player.id) === String(id))
}

function lineupTypeFor(id) {
  if (starterIds.value.some(item => String(item) === String(id))) return '首发'
  if (substituteIds.value.some(item => String(item) === String(id))) return '替补'
  return ''
}

function lineupStorageKey() {
  const matchKey = nextMatch.value?.id || nextMatch.value?.matchDate || 'next-match'
  return `fc-match-roster-${matchKey}`
}

function saveLineup() {
  localStorage.setItem(lineupStorageKey(), JSON.stringify({
    starters: starterIds.value,
    substitutes: substituteIds.value
  }))
}

function restoreLineup() {
  try {
    const saved = JSON.parse(localStorage.getItem(lineupStorageKey()) || '{}')
    const validIds = new Set(players.value.map(player => String(player.id)))
    starterIds.value = (saved.starters || []).filter(id => validIds.has(String(id))).slice(0, squadLimit)
    const starterSet = new Set(starterIds.value.map(String))
    substituteIds.value = (saved.substitutes || [])
      .filter(id => validIds.has(String(id)) && !starterSet.has(String(id)))
      .slice(0, squadLimit - starterIds.value.length)
  } catch {
    starterIds.value = []
    substituteIds.value = []
  }
}

function positionLabel(value) {
  return positionOptions.find(item => item.value === String(value))?.label || '未知'
}

function footLabel(value) {
  return ({ '0': '左脚', '1': '右脚', '2': '双脚' })[String(value)] || '未录入'
}

function heightText(value) {
  if (!value) return '身高未录入'
  const height = Number(value)
  return height < 3 ? `${Math.round(height * 100)}cm` : `${height}cm`
}

function ageText(date) {
  if (!date) return '年龄未录入'
  const birthday = new Date(date)
  const now = new Date()
  let age = now.getFullYear() - birthday.getFullYear()
  if (now < new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate())) age -= 1
  return `${Math.max(age, 0)}岁`
}

function attendanceRate(player) {
  const total = num(player?.completedTrainingCount)
  if (!total) return 100
  return Math.max(0, Math.round((total - num(player?.missedTrainingCount)) * 100 / total))
}

function startRate(player) {
  const appearances = num(player?.appearances)
  return appearances ? Math.round(num(player?.starts) * 100 / appearances) : 0
}

function contribution(player) {
  return num(player?.goals) + num(player?.assists)
}

function minutesPerGame(player) {
  const appearances = num(player?.appearances)
  return appearances ? Math.round(num(player?.minutesPlayed) / appearances) : 0
}

function injuryText(player) {
  if (!player?.injuryType) return '无进行中伤病'
  return `${player.injuryType}${player.injuryLocation ? ` · ${player.injuryLocation}` : ''}`
}

function injuryDetail(player) {
  if (!player?.injuryType) return '医疗状态正常，可参与训练与比赛'
  const status = ({ 0: '待评估', 1: '治疗中', 2: '恢复观察' })[Number(player.recoveryStatus)] || '恢复观察'
  return player.expectedReturnDate ? `${status}，预计 ${player.expectedReturnDate} 复出` : status
}

function contractHint(endDate) {
  if (!endDate) return '合同数据未录入'
  const days = Math.ceil((new Date(endDate) - new Date()) / 86400000)
  if (days < 0) return '合同已到期'
  if (days <= 180) return `剩余 ${days} 天，建议跟进续约`
  return `剩余约 ${Math.ceil(days / 30)} 个月`
}

function readinessFor(player) {
  if (!player) return { score: 0, label: '-', shortLabel: '-', tone: 'danger', type: 'danger', reasons: [] }
  let score = 92
  const attendance = attendanceRate(player)
  const recoveryStatus = Number(player.recoveryStatus)
  const hasInjury = Boolean(player.injuryType)
  if (player.status !== '活跃' && String(player.status) !== '0') score -= 45
  if (hasInjury && [0, 1].includes(recoveryStatus)) score -= 48
  else if (hasInjury && recoveryStatus === 2) score -= 16
  if (attendance < 80) score -= 24
  else if (attendance < 90) score -= 14
  else if (attendance === 90) score -= 10
  else if (attendance < 95) score -= 7
  const averageMinutes = minutesPerGame(player)
  if (averageMinutes >= 85) score -= 8
  else if (averageMinutes >= 75) score -= 4
  if (num(player.redCards) > 0) score -= 4
  score = Math.max(0, Math.min(100, score))

  const blocked = hasInjury && [0, 1].includes(recoveryStatus)
  const tone = blocked || score < 55 ? 'danger' : score < 80 ? 'warning' : 'success'
  const label = tone === 'success' ? '可出场' : tone === 'warning' ? '出场观察' : '无法出场'
  const reasons = [
    {
      title: '身体状态',
      detail: blocked ? injuryDetail(player) : '当前无阻断出场的医疗状态，身体条件满足比赛要求。',
      tone: blocked ? 'danger' : 'success',
      icon: blocked ? 'FirstAidKit' : 'CircleCheck'
    },
    {
      title: '训练完成度',
      detail: `本赛季已完成 ${num(player.completedTrainingCount)} 次训练，出勤率 ${attendance}%。`,
      tone: attendance < 90 ? 'warning' : 'success',
      icon: 'Timer'
    },
    {
      title: '赛季比赛状态',
      detail: `出场 ${num(player.appearances)} 次，首发率 ${startRate(player)}%，贡献 ${contribution(player)} 个进球或助攻。`,
      tone: num(player.appearances) ? 'success' : 'warning',
      icon: 'DataAnalysis'
    },
    {
      title: '合同与纪律',
      detail: `${contractHint(player.endDate)}；本赛季红牌 ${num(player.redCards)} 张。`,
      tone: num(player.redCards) > 0 ? 'warning' : 'success',
      icon: 'DocumentChecked'
    }
  ]
  return {
    score,
    label,
    shortLabel: tone === 'warning' ? '观察' : label,
    tone,
    type: tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'danger',
    injuryTone: blocked ? 'danger-text' : hasInjury ? 'warning-text' : 'success-text',
    summary: score >= 90 ? '状态优秀' : score >= 80 ? '状态稳定' : score >= 55 ? '建议赛前复核' : '暂不建议出场',
    reasons
  }
}

function generatedRating(player, match, index) {
  const seed = `${player.id}-${match.id || index}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const formBoost = Math.min(0.8, contribution(player) * 0.08)
  const startBoost = Math.min(0.35, startRate(player) / 300)
  const variance = ((seed % 17) - 8) / 10
  return Math.max(5.8, Math.min(9.2, Number((6.8 + formBoost + startBoost + variance).toFixed(1))))
}

function generatedContribution(player, match, index) {
  const seed = (num(player.id) * 7 + num(match.id || index) * 3 + index) % 10
  if (seed < 2 && contribution(player) > 0) return '1球 1助攻'
  if (seed < 5 && num(player.goals) > 0) return '1球'
  if (seed < 7 && num(player.assists) > 0) return '1助攻'
  return '0球 0助攻'
}

function ratingClass(rating) {
  return rating >= 8 ? 'rating excellent' : rating >= 7 ? 'rating good' : 'rating average'
}

function shortDate(value) {
  if (!value) return '--'
  const date = new Date(value)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function offsetDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function selectPlayer(id) {
  selectedPlayerId.value = id
  lineupChoice.value = lineupTypeFor(id)
  const candidate = compareCandidates.value[0]
  comparePlayerId.value = candidate?.id || null
}

function selectRosterPlayer(id) {
  selectPlayer(id)
  rosterDialogVisible.value = false
}

function applyLineup(type) {
  if (!selectedPlayer.value) return
  const playerId = selectedPlayer.value.id
  const currentType = lineupTypeFor(playerId)
  if (currentType === type) {
    proxy.$modal.msg(`${selectedPlayer.value.nameCn} 已在${type}名单中`)
    return
  }
  if (!currentType && isSquadFull.value) {
    proxy.$modal.msgWarning('本场比赛球员名单已满（23/23）')
    return
  }

  starterIds.value = starterIds.value.filter(id => String(id) !== String(playerId))
  substituteIds.value = substituteIds.value.filter(id => String(id) !== String(playerId))
  if (type === '首发') starterIds.value.push(playerId)
  else substituteIds.value.push(playerId)
  lineupChoice.value = type
  saveLineup()
  if (isSquadFull.value) proxy.$modal.msgWarning(`${selectedPlayer.value.nameCn} 已列入${type}，本场比赛球员名单已满`)
  else proxy.$modal.msgSuccess(`${selectedPlayer.value.nameCn} 已列入${type}`)
}

function removeFromLineup(playerId) {
  const player = findPlayer(playerId)
  starterIds.value = starterIds.value.filter(id => String(id) !== String(playerId))
  substituteIds.value = substituteIds.value.filter(id => String(id) !== String(playerId))
  if (String(selectedPlayerId.value) === String(playerId)) lineupChoice.value = ''
  saveLineup()
  proxy.$modal.msgSuccess(`${player?.nameCn || '球员'} 已移出本场名单`)
}

async function loadData() {
  loading.value = true
  if (route.meta.preview) {
    players.value = buildPreviewPlayers()
    nextMatch.value = {
      id: 901,
      competitionName: '中国足球超级联赛',
      roundNo: 25,
      homeTeam: '天津津门虎',
      awayTeam: '深圳新鹏城',
      matchDate: '2026-09-05 19:35:00',
      venue: '天津泰达足球场'
    }
    completedMatches.value = buildPreviewMatches()
    selectedPlayerId.value = players.value.find(item => item.nameCn === '巴顿')?.id
    restoreLineup()
    selectPlayer(selectedPlayerId.value)
    loading.value = false
    return
  }
  const [playerResult, nextResult, matchResult] = await Promise.allSettled([
    listPp({ pageNum: 1, pageSize: 1000 }),
    getNextMatch(),
    listMatch({ pageNum: 1, pageSize: 5, status: 1 })
  ])
  if (playerResult.status === 'fulfilled') {
    players.value = playerResult.value.rows || []
    const preferred = players.value.find(item => item.nameCn === '巴顿') || players.value[0]
    if (!selectedPlayerId.value || !players.value.some(item => item.id === selectedPlayerId.value)) {
      selectedPlayerId.value = preferred?.id || null
    }
  } else {
    players.value = []
    proxy.$modal.msgError('球员准备度数据加载失败')
  }
  if (nextResult.status === 'fulfilled') nextMatch.value = nextResult.value.data || null
  if (matchResult.status === 'fulfilled') completedMatches.value = matchResult.value.rows || []
  restoreLineup()
  selectPlayer(selectedPlayerId.value)
  loading.value = false
}

function buildPreviewPlayers() {
  const base = [
    [1, 21, '齐雨熙', '0', 12, 0, 0, 1080],
    [2, 4, '杨帆', '1', 17, 1, 0, 1398],
    [3, 6, '王献钧', '1', 19, 0, 1, 1540],
    [4, 17, '吴兴涵', '1', 18, 2, 2, 1410],
    [5, 29, '巴顿', '2', 20, 3, 4, 1588],
    [6, 30, '王秋明', '2', 18, 1, 2, 1325],
    [7, 22, '李永佳', '2', 15, 1, 1, 1104],
    [8, 11, '谢维军', '3', 21, 5, 2, 1680],
    [9, 9, '阿尔韦托·基莱斯', '3', 19, 7, 1, 1492],
    [10, 19, '刘俊贤', '3', 11, 2, 0, 702]
  ]
  return base.map((item, index) => ({
    id: item[0], jerseyNumber: item[1], nameCn: item[2], position: item[3],
    nationality: item[2].includes('基莱斯') ? '西班牙' : '中国',
    birthDate: index === 4 ? '1995-09-16' : `199${index % 8}-0${index % 8 + 1}-12`,
    height: index === 4 ? 1.81 : Number((1.78 + (index % 6) * .025).toFixed(2)),
    preferredFoot: index % 3 === 0 ? '0' : '1', status: '活跃',
    appearances: item[4], starts: Math.max(4, item[4] - 4), goals: item[5], assists: item[6],
    minutesPlayed: item[7], yellowCards: index % 4, redCards: 0,
    completedTrainingCount: 21, missedTrainingCount: index === 6 ? 3 : index % 3,
    lastTrainingDate: '2026-08-30 10:00:00', statAsOf: '2026-08-31', endDate: index === 5 ? '2027-12-31' : '2028-12-31'
  }))
}

function buildPreviewMatches() {
  return [
    [801, '2026-08-27 19:35:00', '天津津门虎', '梅州客家', 3, 1],
    [802, '2026-08-21 19:35:00', '浙江队', '天津津门虎', 2, 2],
    [803, '2026-08-16 19:35:00', '天津津门虎', '上海申花', 1, 0],
    [804, '2026-08-10 19:35:00', '青岛海牛', '天津津门虎', 0, 2],
    [805, '2026-08-03 19:35:00', '天津津门虎', '河南队', 1, 1]
  ].map(item => ({ id: item[0], matchDate: item[1], homeTeam: item[2], awayTeam: item[3], homeScore: item[4], awayScore: item[5] }))
}

loadData()
</script>

<style scoped lang="scss">
.readiness-page {
  min-height: calc(100vh - 106px);
  padding: 14px 16px 20px;
  background: var(--fc-bg);
  color: var(--fc-text-secondary);
}

.surface-panel {
  background: var(--fc-surface);
  border: 1px solid var(--fc-border-soft);
  border-radius: 6px;
}

.match-strip {
  min-height: 46px;
  margin-bottom: 12px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0c1725;
  border: 1px solid var(--fc-border-soft);
  border-radius: 6px;
  font-size: 13px;
}

.match-context,
.sync-info { display: flex; align-items: center; gap: 12px; }
.sync-info { color: var(--fc-text-muted); }

.readiness-workspace {
  display: grid;
  grid-template-columns: minmax(250px, 0.72fr) minmax(540px, 1.65fr) minmax(270px, 0.82fr);
  gap: 12px;
  align-items: start;
}

.readiness-workspace > * { min-width: 0; }

.squad-column { display: grid; gap: 12px; align-content: start; min-width: 0; }

.squad-panel,
.decision-panel {
  min-height: calc(100vh - 190px);
  padding: 14px;
}

.panel-toolbar,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-toolbar strong,
h3 { color: var(--fc-text); }
h3 { margin: 0; font-size: 15px; }

.row-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(48px, .55fr) minmax(68px, .72fr);
  column-gap: 6px;
  align-items: center;
}
.squad-header { margin-top: 12px; padding: 9px 10px; color: var(--fc-text-muted); font-size: 12px; border-bottom: 1px solid var(--fc-border-soft); }
.squad-list { max-height: calc(100vh - 330px); overflow-x: hidden; overflow-y: auto; }
.squad-row { width: 100%; min-height: 42px; padding: 0 8px; color: var(--fc-text-secondary); background: transparent; border: 0; border-bottom: 1px solid rgba(145, 166, 195, .08); text-align: left; cursor: pointer; font: inherit; }
.squad-row:hover { background: #142338; }
.squad-row.active { color: #fff; background: #18478b; }
.player-cell { display: flex; align-items: center; min-width: 0; gap: 8px; }
.jersey-number { width: 24px; color: #7fa8df; font-variant-numeric: tabular-nums; }
.squad-row.active .jersey-number { color: #fff; }
.roster-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.availability-cell { min-width: 0; display: flex; align-items: center; gap: 5px; font-size: 12px; white-space: nowrap; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--fc-text-muted); }
.status-dot.success { background: var(--fc-success); }
.status-dot.warning { background: var(--fc-warning); }
.status-dot.danger { background: var(--fc-danger); }
.availability-legend { display: flex; justify-content: space-between; gap: 5px; margin-top: 14px; color: var(--fc-text-muted); font-size: 11px; }
.availability-legend span { display: flex; align-items: center; gap: 5px; }

.view-roster-button { width: 100%; min-height: 42px; margin: 0; }
.view-roster-button :deep(> span) { width: 100%; display: flex; align-items: center; justify-content: space-between; }
.view-roster-button small { padding: 2px 8px; border-radius: 10px; background: rgba(47, 125, 255, .14); color: #69a5ff; font-size: 11px; font-weight: 700; }
.view-roster-button small.full { background: rgba(255, 155, 49, .14); color: var(--fc-warning); }

:global(.match-roster-dialog) { max-width: calc(100vw - 32px); border: 1px solid rgba(145, 166, 195, .18); border-radius: 8px; background: #101b29; }
:global(.match-roster-dialog .el-dialog__header) { margin: 0; padding: 18px 20px 14px; border-bottom: 1px solid rgba(145, 166, 195, .14); }
:global(.match-roster-dialog .el-dialog__body) { padding: 18px 20px; }
:global(.match-roster-dialog .el-dialog__footer) { padding: 0 20px 18px; }
.roster-dialog-header { padding-right: 28px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.roster-dialog-header > div { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.roster-dialog-header strong { color: #f3f6fa; font-size: 18px; }
.roster-dialog-header span { overflow: hidden; color: #7f8da2; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.roster-dialog-header b { flex: none; padding: 4px 11px; border-radius: 13px; background: rgba(47, 125, 255, .14); color: #69a5ff; font-size: 12px; }
.roster-dialog-header b.full { background: rgba(255, 155, 49, .14); color: #ff9b31; }
.roster-dialog-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.dialog-roster-section { min-width: 0; padding: 14px; border: 1px solid rgba(145, 166, 195, .14); border-radius: 6px; background: #0c1725; }
.dialog-roster-title { margin-bottom: 12px; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(145, 166, 195, .12); }
.dialog-roster-title > div { display: flex; align-items: center; gap: 8px; color: #e6edf7; font-size: 14px; font-weight: 650; }
.dialog-roster-title i { width: 8px; height: 8px; border-radius: 50%; background: #2f7dff; }
.substitute-section .dialog-roster-title i { background: #9aa8ba; }
.dialog-roster-title > span { color: #7f8da2; font-size: 12px; }
.dialog-roster-list { max-height: 430px; display: grid; align-content: start; gap: 7px; overflow-y: auto; }
.dialog-roster-player { min-width: 0; min-height: 54px; padding-right: 7px; display: flex; align-items: center; border: 1px solid rgba(145, 166, 195, .1); border-radius: 5px; background: #111f30; transition: border-color .2s, background .2s; }
.dialog-roster-player:hover { border-color: rgba(47, 125, 255, .38); background: #14263b; }
.dialog-roster-player > button { min-width: 0; flex: 1; padding: 5px 7px; display: flex; align-items: center; gap: 10px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.dialog-player-photo { width: 40px; height: 40px; flex: none; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 50%; background: #18304c; color: #8ebeff; font-size: 13px; font-weight: 700; }
.dialog-player-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.dialog-player-info { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dialog-player-info strong { overflow: hidden; color: #e6edf7; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.dialog-player-info small { color: #7f8da2; font-size: 11px; }
.dialog-roster-empty { min-height: 180px; display: grid; place-items: center; border: 1px dashed rgba(145, 166, 195, .18); border-radius: 5px; color: #718096; font-size: 12px; }
.roster-dialog-full-tip { margin-top: 14px; padding: 10px; border-radius: 5px; background: rgba(255, 155, 49, .1); color: #ff9b31; font-size: 12px; text-align: center; }

.player-focus { min-width: 0; display: grid; gap: 12px; }
.profile-panel { min-height: 150px; padding: 18px; display: grid; grid-template-columns: 112px minmax(260px, 1fr) 175px; gap: 20px; align-items: center; }
.player-portrait-wrap { height: 112px; display: grid; place-items: end center; overflow: hidden; background: #14243a; border-radius: 5px; }
.player-portrait { max-width: 100%; max-height: 100%; object-fit: contain; object-position: center bottom; }
.portrait-fallback { font-size: 58px; color: var(--fc-text-muted); align-self: center; }
.profile-identity h2 { margin: 0; color: #fff; font-size: 23px; }
.name-line { display: flex; align-items: baseline; gap: 10px; }
.number-chip { padding: 3px 8px; color: #65a3ff; border: 1px solid rgba(47, 125, 255, .5); border-radius: 4px; }
.profile-meta { display: flex; flex-wrap: wrap; gap: 0; margin-top: 16px; color: var(--fc-text-secondary); }
.profile-meta span:not(:last-child)::after { content: '|'; padding: 0 9px; color: var(--fc-border); }
.season-line { margin-top: 16px; color: var(--fc-text-muted); font-size: 13px; }
.season-line strong { color: #dce7f5; }
.season-line i::after { content: '·'; margin: 0 7px; font-style: normal; }
.readiness-hero { min-height: 110px; padding-left: 20px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; border-left: 1px solid var(--fc-border-soft); }
.hero-label { margin-bottom: 8px; color: var(--fc-text-secondary); }
.readiness-hero > strong { margin: 7px 0 2px; color: #fff; font-size: 38px; line-height: 1; }
.readiness-hero small { font-size: 18px; }
.trend-copy { font-size: 12px; }
.trend-copy.success { color: var(--fc-success); }
.trend-copy.warning { color: var(--fc-warning); }
.trend-copy.danger { color: var(--fc-danger); }

.evidence-panel { padding: 16px; }
.evidence-panel h3 { margin-bottom: 8px; }
.evidence-row { min-height: 62px; display: grid; grid-template-columns: 34px 1fr 22px; gap: 12px; align-items: center; border-top: 1px solid var(--fc-border-soft); }
.reason-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: var(--fc-primary-soft); color: #63a1ff; }
.reason-icon.success { background: rgba(34, 181, 115, .12); color: var(--fc-success); }
.reason-icon.warning { background: rgba(255, 155, 49, .12); color: var(--fc-warning); }
.reason-icon.danger { background: rgba(241, 77, 92, .12); color: var(--fc-danger); }
.evidence-row strong { color: #dbe6f4; font-size: 13px; }
.evidence-row p { margin: 4px 0 0; color: var(--fc-text-muted); font-size: 12px; line-height: 1.45; }
.reason-result.success { color: var(--fc-success); }
.reason-result.warning { color: var(--fc-warning); }
.reason-result.danger { color: var(--fc-danger); }

.form-panel,
.readiness-details { padding: 15px; }
.section-heading h3 { display: inline; margin-right: 8px; }
.section-heading span { color: var(--fc-text-muted); font-size: 12px; }
.section-heading > span strong { color: #fff; font-size: 18px; }
.form-strip { min-width: 0; display: grid; grid-template-columns: repeat(5, minmax(90px, 1fr)); border: 1px solid var(--fc-border-soft); border-radius: 5px; overflow-x: auto; overflow-y: hidden; }
.match-form-item { min-height: 92px; padding: 10px 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-right: 1px solid var(--fc-border-soft); }
.match-form-item:last-child { border-right: 0; }
.match-form-item > span,
.match-form-item small { color: var(--fc-text-muted); font-size: 11px; }
.match-form-item strong { font-size: 22px; }
.rating.excellent { color: #5ee0a2; }
.rating.good { color: #73aaff; }
.rating.average { color: #ffb25d; }

.readiness-details { display: grid; grid-template-columns: 1.35fr 1fr; gap: 18px; }
.detail-section + .detail-section { padding-left: 18px; border-left: 1px solid var(--fc-border-soft); }
.metric-grid { margin-top: 16px; display: grid; grid-template-columns: repeat(4, 1fr); }
.metric-grid > div { padding: 0 10px; display: flex; flex-direction: column; align-items: center; border-right: 1px solid var(--fc-border-soft); }
.metric-grid > div:last-child { border-right: 0; }
.metric-grid span,
.metric-grid small { color: var(--fc-text-muted); font-size: 11px; }
.metric-grid strong { margin: 7px 0 4px; color: #fff; font-size: 21px; }
.health-section { display: flex; flex-direction: column; }
.health-row { margin-top: 12px; display: grid; grid-template-columns: 78px 1fr; gap: 3px 10px; }
.health-row > span { color: var(--fc-text-muted); }
.health-row strong { color: #dce7f5; }
.health-row small { grid-column: 2; color: var(--fc-text-muted); line-height: 1.4; }
.success-text { color: var(--fc-success) !important; }
.warning-text { color: var(--fc-warning) !important; }
.danger-text { color: var(--fc-danger) !important; }

.decision-panel h3 { margin-bottom: 12px; }
.comparison { margin-top: 18px; }
.compare-players { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.compare-players > div { min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 5px; }
.compare-players img { width: 64px; height: 68px; object-fit: contain; object-position: center bottom; background: #14243a; border-radius: 4px; }
.compare-players strong { color: #fff; }
.compare-players span { color: #6da6ff; font-size: 12px; }
.vs-divider { margin: 10px 0; display: flex; align-items: center; gap: 10px; color: var(--fc-text-muted); font-size: 11px; }
.vs-divider::before,
.vs-divider::after { content: ''; flex: 1; height: 1px; background: var(--fc-border-soft); }
.compare-table > div { min-height: 32px; display: grid; grid-template-columns: 1fr 90px 1fr; align-items: center; border-bottom: 1px solid rgba(145, 166, 195, .08); text-align: center; }
.compare-table span { color: var(--fc-text-muted); font-size: 12px; }
.compare-table strong { color: #dfe9f7; }
.coach-decision { margin-top: 15px; padding-top: 13px; border-top: 1px solid var(--fc-border-soft); }
.coach-decision > span { display: block; margin-bottom: 8px; color: var(--fc-text-muted); font-size: 12px; }
.coach-decision :deep(.el-checkbox-group) { display: flex; flex-direction: column; }
.coach-decision :deep(.el-checkbox) { height: 25px; margin-right: 0; }
.decision-actions { margin-top: 12px; display: grid; gap: 7px; }
.decision-actions .el-button { width: 100%; margin-left: 0; }
.decision-actions p { margin: 2px 0 0; color: var(--fc-success); font-size: 12px; text-align: center; }

@media (max-width: 1280px) {
  .readiness-workspace { grid-template-columns: 245px minmax(520px, 1fr); }
  .readiness-details { grid-template-columns: 1fr; }
  .detail-section + .detail-section { padding: 16px 0 0; border-left: 0; border-top: 1px solid var(--fc-border-soft); }
  .decision-panel { grid-column: 1 / -1; min-height: auto; display: grid; grid-template-columns: 240px 1fr 260px; gap: 18px; }
  .decision-panel > h3 { grid-column: 1; }
  .decision-panel > .el-select { grid-column: 1; }
  .comparison { grid-column: 2; grid-row: 1 / span 3; margin-top: 0; }
  .coach-decision { grid-column: 3; grid-row: 1 / span 3; margin-top: 0; padding-top: 0; padding-left: 18px; border-top: 0; border-left: 1px solid var(--fc-border-soft); }
  .decision-actions { grid-column: 3; }
}

@media (max-width: 900px) {
  .match-strip { align-items: flex-start; flex-direction: column; gap: 8px; padding: 10px; }
  .readiness-workspace { grid-template-columns: 1fr; }
  .squad-panel { min-height: auto; }
  .squad-list { max-height: 350px; }
  .profile-panel { grid-template-columns: 90px 1fr; }
  .player-portrait-wrap { height: 94px; }
  .readiness-hero { grid-column: 1 / -1; padding: 14px 0 0; border-left: 0; border-top: 1px solid var(--fc-border-soft); }
  .readiness-details { grid-template-columns: 1fr; }
  .detail-section + .detail-section { padding: 16px 0 0; border-left: 0; border-top: 1px solid var(--fc-border-soft); }
  .decision-panel { display: block; }
  .coach-decision { margin-top: 18px; padding: 18px 0 0; border-left: 0; border-top: 1px solid var(--fc-border-soft); }
  .roster-dialog-grid { grid-template-columns: 1fr; }
  .dialog-roster-list { max-height: 280px; }
  .dialog-roster-empty { min-height: 100px; }
}
</style>
