<template>
  <div class="app-container">
    <!-- 页面标题 + 全局筛选 -->
    <div class="page-header">
      <h3 class="page-title">球员数据统计</h3>
      <div class="page-filter">
        <span class="filter-label">赛季：</span>
        <el-select v-model="queryParams.season" style="width: 100px;" @change="handleQuery">
          <el-option label="2026" value="2026" />
          <el-option label="2025" value="2025" />
        </el-select>
        <span class="filter-label" style="margin-left: 12px;">赛事：</span>
        <el-select v-model="queryParams.competition" style="width: 180px;" clearable placeholder="全部赛事" @change="handleQuery">
          <el-option label="全部赛事" value="" />
          <el-option label="中国足球超级联赛" value="中国足球超级联赛" />
          <el-option label="中国足球协会杯" value="中国足球协会杯" />
        </el-select>
      </div>
    </div>

    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="5">
        <div class="stat-card">
          <div class="stat-title">赛季总进球</div>
          <div class="stat-value stat-blue">{{ teamStats.totalGoals || 0 }}</div>
          <div class="stat-sub">场均 {{ teamStats.totalAppearances > 0 ? (teamStats.totalGoals / Math.max(teamStats.playerCount || 1, 1)).toFixed(2) : '0' }} 球</div>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="stat-card">
          <div class="stat-title">赛季总助攻</div>
          <div class="stat-value stat-green">{{ teamStats.totalAssists || 0 }}</div>
          <div class="stat-sub">累计助攻次数</div>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="stat-card">
          <div class="stat-title">赛季总出场</div>
          <div class="stat-value">{{ teamStats.totalAppearances || 0 }}<span class="stat-unit">场</span></div>
          <div class="stat-sub">首发率 {{ teamStats.startRate || 0 }}%</div>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="stat-card">
          <div class="stat-title">黄牌总数</div>
          <div class="stat-value stat-orange">{{ teamStats.totalYellowCards || 0 }}</div>
          <div class="stat-sub">累计黄牌</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-title">红牌总数</div>
          <div class="stat-value stat-red">{{ teamStats.totalRedCards || 0 }}</div>
          <div class="stat-sub">{{ teamStats.totalRedCards == 0 ? '暂无红牌' : '累计红牌' }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="stat-tabs">
      <!-- ====== Tab1: 数据总览 ====== -->
      <el-tab-pane label="数据总览" name="overview">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
          <el-form-item label="球员姓名" prop="playerName">
            <el-input v-model="queryParams.playerName" placeholder="请输入球员姓名" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="位置" prop="position">
            <el-select v-model="queryParams.position" placeholder="全部位置" clearable>
              <el-option label="守门员" value="0" />
              <el-option label="后卫" value="1" />
              <el-option label="中场" value="2" />
              <el-option label="前锋" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['stat:stat:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="statList" border stripe :default-sort="{ prop: 'goals', order: 'descending' }">
          <el-table-column label="序号" align="center" width="60">
            <template #default="scope">
              {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="号码" align="center" prop="jerseyNumber" width="70" />
          <el-table-column label="照片" align="center" width="76">
            <template #default="scope">
              <span class="table-player-photo">
                <img v-if="playerPhoto(scope.row.playerName, scope.row.avatarUrl)" :src="playerPhoto(scope.row.playerName, scope.row.avatarUrl)" :alt="scope.row.playerName" />
                <span v-else>{{ (scope.row.playerName || '').charAt(0) }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="球员姓名" align="center" prop="playerName" min-width="120">
            <template #default="scope">
              <strong>{{ scope.row.playerName }}</strong>
              <el-tag v-if="scope.row.playerStatus === '非活跃'" type="info" size="small" style="margin-left: 4px;">非活跃</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="位置" align="center" prop="position" width="80">
            <template #default="scope">
              <el-tag :type="posTagType(scope.row.position)">{{ posLabel(scope.row.position) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="出场" align="center" prop="appearances" width="70" sortable />
          <el-table-column label="首发" align="center" prop="starts" width="70" />
          <el-table-column label="时间(分)" align="center" prop="minutesPlayed" width="90" sortable />
          <el-table-column label="进球" align="center" prop="goals" width="70" sortable>
            <template #default="scope">
              <span :class="{ 'num-gold': scope.row.goals > 0 }">{{ scope.row.goals }}</span>
            </template>
          </el-table-column>
          <el-table-column label="助攻" align="center" prop="assists" width="70" sortable />
          <el-table-column label="进球+助攻" align="center" width="100" sortable :sort-method="(a,b) => (a.goals+a.assists) - (b.goals+b.assists)">
            <template #default="scope">
              <strong>{{ (scope.row.goals || 0) + (scope.row.assists || 0) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="黄牌" align="center" prop="yellowCards" width="70" sortable />
          <el-table-column label="红牌" align="center" prop="redCards" width="70" />
          <el-table-column label="进球率" align="center" width="80" sortable :sort-method="(a,b) => goalRate(a) - goalRate(b)">
            <template #default="scope">
              {{ scope.row.appearances > 0 ? (scope.row.goals / scope.row.appearances).toFixed(2) : '0.00' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="View" @click="viewPlayerDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="total > 0"
          :total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </el-tab-pane>

      <!-- ====== Tab2: 排行榜单 ====== -->
      <el-tab-pane label="排行榜单" name="ranking">
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="card">
              <div class="card-title">&#9917; 射手榜 TOP5<span class="card-title-extra">{{ queryParams.season }}赛季</span></div>
              <div class="ranking-list">
                <div v-for="(item, idx) in goalRanking" :key="'g' + idx" class="ranking-item">
                  <span :class="['ranking-num', { top1: idx === 0, top2: idx === 1, top3: idx === 2 }]">{{ idx + 1 }}</span>
                  <span class="ranking-avatar">
                    <img v-if="playerPhoto(item.playerName, item.avatarUrl)" :src="playerPhoto(item.playerName, item.avatarUrl)" :alt="item.playerName" />
                    <span v-else>{{ (item.playerName || '').charAt(0) }}</span>
                  </span>
                  <div class="ranking-info">
                    <div class="ranking-name">{{ item.playerName }}
                      <el-tag :type="posTagType(item.position)" size="small" style="margin-left: 4px;">{{ posLabel(item.position) }}</el-tag>
                    </div>
                    <div class="ranking-sub">{{ item.jerseyNumber }}号 · 出场{{ item.appearances }}场 · 进球率 {{ item.appearances > 0 ? (item.goals / item.appearances).toFixed(2) : '0.00' }}</div>
                  </div>
                  <div class="ranking-value">{{ item.goals }}<small>球</small></div>
                </div>
                <el-empty v-if="goalRanking.length === 0" description="暂无数据" :image-size="60" />
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="card">
              <div class="card-title">&#127919; 助攻榜 TOP5<span class="card-title-extra">{{ queryParams.season }}赛季</span></div>
              <div class="ranking-list">
                <div v-for="(item, idx) in assistRanking" :key="'a' + idx" class="ranking-item">
                  <span :class="['ranking-num', { top1: idx === 0, top2: idx === 1, top3: idx === 2 }]">{{ idx + 1 }}</span>
                  <span class="ranking-avatar">
                    <img v-if="playerPhoto(item.playerName, item.avatarUrl)" :src="playerPhoto(item.playerName, item.avatarUrl)" :alt="item.playerName" />
                    <span v-else>{{ (item.playerName || '').charAt(0) }}</span>
                  </span>
                  <div class="ranking-info">
                    <div class="ranking-name">{{ item.playerName }}
                      <el-tag :type="posTagType(item.position)" size="small" style="margin-left: 4px;">{{ posLabel(item.position) }}</el-tag>
                    </div>
                    <div class="ranking-sub">{{ item.jerseyNumber }}号 · 出场{{ item.appearances }}场 · 场均 {{ item.appearances > 0 ? (item.assists / item.appearances).toFixed(2) : '0.00' }}</div>
                  </div>
                  <div class="ranking-value">{{ item.assists }}<small>次</small></div>
                </div>
                <el-empty v-if="assistRanking.length === 0" description="暂无数据" :image-size="60" />
              </div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" style="margin-top: 16px;">
          <el-col :span="12">
            <div class="card">
              <div class="card-title">&#9201; 出场时间 TOP5<span class="card-title-extra">累计分钟数</span></div>
              <div class="ranking-list">
                <div v-for="(item, idx) in minutesRanking" :key="'m' + idx" class="ranking-item">
                  <span :class="['ranking-num', { top1: idx === 0, top2: idx === 1, top3: idx === 2 }]">{{ idx + 1 }}</span>
                  <span class="ranking-avatar">
                    <img v-if="playerPhoto(item.playerName, item.avatarUrl)" :src="playerPhoto(item.playerName, item.avatarUrl)" :alt="item.playerName" />
                    <span v-else>{{ (item.playerName || '').charAt(0) }}</span>
                  </span>
                  <div class="ranking-info">
                    <div class="ranking-name">{{ item.playerName }}</div>
                    <div class="ranking-sub">{{ item.jerseyNumber }}号 · {{ item.starts }}首发/{{ item.appearances - item.starts }}替补</div>
                  </div>
                  <div class="ranking-value">{{ item.minutesPlayed }}<small>分钟</small></div>
                </div>
                <el-empty v-if="minutesRanking.length === 0" description="暂无数据" :image-size="60" />
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="card">
              <div class="card-title">&#128992; 纪律排行 (黄牌)<span class="card-title-extra">本赛季</span></div>
              <div class="ranking-list">
                <div v-for="(item, idx) in yellowRanking" :key="'y' + idx" class="ranking-item">
                  <span :class="['ranking-num', { top1: idx === 0, top2: idx === 1, top3: idx === 2 }]">{{ idx + 1 }}</span>
                  <span class="ranking-avatar">
                    <img v-if="playerPhoto(item.playerName, item.avatarUrl)" :src="playerPhoto(item.playerName, item.avatarUrl)" :alt="item.playerName" />
                    <span v-else>{{ (item.playerName || '').charAt(0) }}</span>
                  </span>
                  <div class="ranking-info">
                    <div class="ranking-name">{{ item.playerName }}</div>
                    <div class="ranking-sub">{{ item.jerseyNumber }}号 · {{ posLabel(item.position) }}</div>
                  </div>
                  <div class="ranking-value" style="color: #fa8c16;">{{ item.yellowCards }}<small>张</small></div>
                </div>
                <el-empty v-if="yellowRanking.length === 0" description="暂无数据" :image-size="60" />
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- ====== Tab3: 球员对比 ====== -->
      <el-tab-pane label="球员对比" name="compare">
        <div class="card">
          <div class="card-title">&#128200; 选择两名球员进行数据对比</div>
          <el-row :gutter="24" style="margin-bottom: 20px;">
            <el-col :span="10">
              <label style="display: block; font-size: 13px; color: #666; margin-bottom: 8px;">球员A：</label>
              <el-select v-model="compare.playerIdA" placeholder="选择球员A" filterable style="width: 100%;">
                <el-option
                  v-for="p in allPlayers"
                  :key="p.id"
                  :label="p.nameCn + ' (' + (p.jerseyNumber || '-') + '号 · ' + posLabel(p.position) + ')'"
                  :value="p.id"
                />
              </el-select>
            </el-col>
            <el-col :span="10">
              <label style="display: block; font-size: 13px; color: #666; margin-bottom: 8px;">球员B：</label>
              <el-select v-model="compare.playerIdB" placeholder="选择球员B" filterable style="width: 100%;">
                <el-option
                  v-for="p in allPlayers"
                  :key="p.id"
                  :label="p.nameCn + ' (' + (p.jerseyNumber || '-') + '号 · ' + posLabel(p.position) + ')'"
                  :value="p.id"
                />
              </el-select>
            </el-col>
            <el-col :span="4" style="display: flex; align-items: flex-end;">
              <el-button type="primary" @click="loadCompare" :loading="compare.loading">开始对比</el-button>
            </el-col>
          </el-row>

          <!-- 对比结果 -->
          <div v-if="compare.data.length === 2" class="compare-result">
            <div class="compare-header">
              <div class="compare-player">
                <div class="compare-avatar" style="background: #1a3a5c;">
                  <img v-if="playerPhoto(compare.data[0].playerName, compare.data[0].avatarUrl)" :src="playerPhoto(compare.data[0].playerName, compare.data[0].avatarUrl)" :alt="compare.data[0].playerName" />
                  <span v-else>{{ compare.data[0].playerName?.charAt(0) }}</span>
                </div>
                <div class="compare-player-name">{{ compare.data[0].playerName }}</div>
                <div class="compare-player-sub">{{ compare.data[0].jerseyNumber }}号 · {{ posLabel(compare.data[0].position) }}</div>
              </div>
              <div class="compare-vs">VS</div>
              <div class="compare-player">
                <div class="compare-avatar" style="background: #fa541c;">
                  <img v-if="playerPhoto(compare.data[1].playerName, compare.data[1].avatarUrl)" :src="playerPhoto(compare.data[1].playerName, compare.data[1].avatarUrl)" :alt="compare.data[1].playerName" />
                  <span v-else>{{ compare.data[1].playerName?.charAt(0) }}</span>
                </div>
                <div class="compare-player-name">{{ compare.data[1].playerName }}</div>
                <div class="compare-player-sub">{{ compare.data[1].jerseyNumber }}号 · {{ posLabel(compare.data[1].position) }}</div>
              </div>
            </div>

            <div class="compare-bars">
              <div v-for="metric in compareMetrics" :key="metric.key" class="compare-bar-row">
                <div class="compare-val left">{{ compare.data[0][metric.key] }}</div>
                <div class="compare-bar-left">
                  <div class="bar-fill-left" :style="{ width: compareBarWidth(compare.data[0][metric.key], compare.data[1][metric.key]) }"></div>
                </div>
                <div class="compare-label">{{ metric.label }}</div>
                <div class="compare-bar-right">
                  <div class="bar-fill-right" :style="{ width: compareBarWidth(compare.data[1][metric.key], compare.data[0][metric.key]) }"></div>
                </div>
                <div class="compare-val right">{{ compare.data[1][metric.key] }}</div>
              </div>
            </div>

            <div class="compare-summary">
              <strong>对比总结：</strong>
              {{ compare.data[0].playerName }}贡献了{{ compare.data[0].goals }}球{{ compare.data[0].assists }}助攻，
              {{ compare.data[1].playerName }}贡献了{{ compare.data[1].goals }}球{{ compare.data[1].assists }}助攻。
              {{ compare.data[0].goals > compare.data[1].goals ? compare.data[0].playerName + '在进球方面领先' :
                 compare.data[1].goals > compare.data[0].goals ? compare.data[1].playerName + '在进球方面领先' :
                 '两名球员进球数相同' }}。
            </div>
          </div>

          <el-empty v-else-if="!compare.loading" description="请选择两名球员后点击「开始对比」" :image-size="100" />
        </div>
      </el-tab-pane>

      <!-- ====== Tab4: 个人详情 ====== -->
      <el-tab-pane label="个人详情" name="detail">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="card detail-sidebar">
              <div class="card-title">选择球员</div>
              <el-input v-model="detailSearch" placeholder="搜索球员..." clearable style="margin-bottom: 12px;" />
              <div
                v-for="item in filteredDetailPlayers"
                :key="item.id"
                :class="['player-select-card', { selected: selectedDetailPlayer?.id === item.id }]"
                @click="selectDetailPlayer(item)"
              >
                <div class="psc-avatar" :style="{ background: avatarColor(item.position) }">
                  <img v-if="playerPhoto(item.playerName, item.avatarUrl)" :src="playerPhoto(item.playerName, item.avatarUrl)" :alt="item.playerName" />
                  <span v-else>{{ (item.playerName || '').charAt(0) }}</span>
                </div>
                <div class="psc-info">
                  <div class="psc-name">{{ item.playerName }}
                    <el-tag :type="posTagType(item.position)" size="small" style="margin-left: 4px;">{{ posLabel(item.position) }}</el-tag>
                  </div>
                  <div class="psc-sub">{{ item.jerseyNumber }}号 · {{ item.nationality || '' }}</div>
                </div>
                <div class="psc-goals">{{ item.goals }}球</div>
              </div>
            </div>
          </el-col>
          <el-col :span="16">
            <div class="card" v-if="selectedDetailPlayer">
              <div class="detail-player-header">
                <div class="detail-avatar" :style="{ background: avatarColor(selectedDetailPlayer.position) }">
                  <img v-if="playerPhoto(selectedDetailPlayer.playerName, selectedDetailPlayer.avatarUrl)" :src="playerPhoto(selectedDetailPlayer.playerName, selectedDetailPlayer.avatarUrl)" :alt="selectedDetailPlayer.playerName" />
                  <span v-else>{{ (selectedDetailPlayer.playerName || '').charAt(0) }}</span>
                </div>
                <div class="detail-basic">
                  <h3>{{ selectedDetailPlayer.playerName }}</h3>
                  <div class="detail-meta">
                    <span>{{ selectedDetailPlayer.jerseyNumber }}号</span>
                    <span>{{ posLabel(selectedDetailPlayer.position) }}</span>
                    <span>{{ selectedDetailPlayer.nationality || '' }}</span>
                  </div>
                </div>
              </div>
              <div class="detail-stat-grid">
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.appearances }}</div>
                  <div class="lbl">出场</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.starts }}</div>
                  <div class="lbl">首发</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.minutesPlayed }}</div>
                  <div class="lbl">出场时间</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num" style="color: #d48806;">{{ selectedDetailPlayer.goals }}</div>
                  <div class="lbl">进球</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.assists }}</div>
                  <div class="lbl">助攻</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.goals + selectedDetailPlayer.assists }}</div>
                  <div class="lbl">进球+助攻</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.yellowCards }}</div>
                  <div class="lbl">黄牌</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.redCards }}</div>
                  <div class="lbl">红牌</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.appearances > 0 ? (selectedDetailPlayer.goals / selectedDetailPlayer.appearances).toFixed(2) : '0.00' }}</div>
                  <div class="lbl">进球率(球/场)</div>
                </div>
                <div class="detail-stat-item">
                  <div class="num">{{ selectedDetailPlayer.appearances > 0 ? (selectedDetailPlayer.minutesPlayed / selectedDetailPlayer.appearances).toFixed(1) : '0' }}</div>
                  <div class="lbl">场均时间(分钟)</div>
                </div>
              </div>
            </div>
            <div class="card" v-else>
              <el-empty description="请从左侧选择一名球员查看详情" :image-size="120" />
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 球员详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="球员赛季数据详情" width="600px">
      <div v-if="dialogPlayer" class="dialog-detail">
        <div class="detail-player-header">
          <div class="detail-avatar" :style="{ background: avatarColor(dialogPlayer.position) }">
            <img v-if="playerPhoto(dialogPlayer.playerName, dialogPlayer.avatarUrl)" :src="playerPhoto(dialogPlayer.playerName, dialogPlayer.avatarUrl)" :alt="dialogPlayer.playerName" />
            <span v-else>{{ (dialogPlayer.playerName || '').charAt(0) }}</span>
          </div>
          <div class="detail-basic">
            <h3>{{ dialogPlayer.playerName }}</h3>
            <div class="detail-meta">
              <span>{{ dialogPlayer.jerseyNumber }}号 · {{ posLabel(dialogPlayer.position) }}</span>
              <span>{{ dialogPlayer.nationality || '' }}</span>
            </div>
          </div>
        </div>
        <div class="detail-stat-grid" style="grid-template-columns: repeat(5, 1fr);">
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.appearances }}</div><div class="lbl">出场</div></div>
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.starts }}</div><div class="lbl">首发</div></div>
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.minutesPlayed }}</div><div class="lbl">时间(分钟)</div></div>
          <div class="detail-stat-item"><div class="num" style="color: #d48806;">{{ dialogPlayer.goals }}</div><div class="lbl">进球</div></div>
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.assists }}</div><div class="lbl">助攻</div></div>
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.yellowCards }}</div><div class="lbl">黄牌</div></div>
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.redCards }}</div><div class="lbl">红牌</div></div>
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.appearances > 0 ? (dialogPlayer.goals / dialogPlayer.appearances).toFixed(2) : '0.00' }}</div><div class="lbl">进球率</div></div>
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.appearances > 0 ? (dialogPlayer.minutesPlayed / dialogPlayer.appearances).toFixed(1) : '0' }}</div><div class="lbl">场均时间</div></div>
          <div class="detail-stat-item"><div class="num">{{ dialogPlayer.appearances > 0 ? (dialogPlayer.starts * 100 / dialogPlayer.appearances).toFixed(0) : 0 }}%</div><div class="lbl">首发率</div></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Stat">
import { listStat, getTeamSummary, getStatRanking, getCompareStats, getPlayerOptions } from '@/api/stat/stat'
import { getPlayerPhoto } from '@/utils/playerPhoto'

const { proxy } = getCurrentInstance()

// ======================== 基础数据 ========================
const activeTab = ref('overview')
const loading = ref(false)
const showSearch = ref(true)
const statList = ref([])
const total = ref(0)
const allPlayers = ref([])

// ======================== 查询参数 ========================
const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    season: '2026',
    competition: '',
    playerName: null,
    position: null
  }
})
const { queryParams } = toRefs(data)

// ======================== 球队汇总 ========================
const teamStats = ref({})

function loadTeamStats() {
  getTeamSummary({
    season: queryParams.value.season,
    competition: queryParams.value.competition || undefined
  }).then(response => {
    const list = response.data || []
    const totalApps = list.reduce((s, i) => s + (i.appearances || 0), 0)
    const totalStarts = list.reduce((s, i) => s + (i.starts || 0), 0)
    teamStats.value = {
      totalGoals: list.reduce((s, i) => s + (i.goals || 0), 0),
      totalAssists: list.reduce((s, i) => s + (i.assists || 0), 0),
      totalAppearances: totalApps,
      totalYellowCards: list.reduce((s, i) => s + (i.yellowCards || 0), 0),
      totalRedCards: list.reduce((s, i) => s + (i.redCards || 0), 0),
      startRate: totalApps > 0 ? Math.round(totalStarts / totalApps * 100) : 0,
      playerCount: list.length
    }
  })
}

// ======================== Tab1: 数据总览 ========================
function getList() {
  loading.value = true
  listStat(queryParams.value).then(response => {
    statList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
  loadTeamStats()
  loadRankings()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  queryParams.value.season = '2026'
  queryParams.value.competition = ''
  handleQuery()
}

function handleExport() {
  proxy.download('stat/stat/export', {
    ...queryParams.value
  }, `stat_${new Date().getTime()}.xlsx`)
}

// ======================== Tab2: 排行榜 ========================
const goalRanking = ref([])
const assistRanking = ref([])
const minutesRanking = ref([])
const yellowRanking = ref([])

function loadRankings() {
  const baseParams = { season: queryParams.value.season, competition: queryParams.value.competition || undefined }
  getStatRanking({ ...baseParams, rankBy: 'goals' }).then(res => { goalRanking.value = res.data || [] })
  getStatRanking({ ...baseParams, rankBy: 'assists' }).then(res => { assistRanking.value = res.data || [] })
  getStatRanking({ ...baseParams, rankBy: 'minutes_played' }).then(res => { minutesRanking.value = res.data || [] })
  getStatRanking({ ...baseParams, rankBy: 'yellow_cards' }).then(res => { yellowRanking.value = res.data || [] })
}

// ======================== Tab3: 球员对比 ========================
const compare = reactive({
  playerIdA: null,
  playerIdB: null,
  data: [],
  loading: false
})

const compareMetrics = [
  { key: 'appearances', label: '出场' },
  { key: 'minutesPlayed', label: '时间' },
  { key: 'goals', label: '进球' },
  { key: 'assists', label: '助攻' },
  { key: 'yellowCards', label: '黄牌' },
  { key: 'redCards', label: '红牌' }
]

function loadAllPlayers() {
  getPlayerOptions().then(response => {
    allPlayers.value = response.data || []
  })
}

function loadCompare() {
  if (!compare.playerIdA || !compare.playerIdB) {
    proxy.$modal.msgWarning('请选择两名球员')
    return
  }
  if (compare.playerIdA === compare.playerIdB) {
    proxy.$modal.msgWarning('请选择不同的球员进行对比')
    return
  }
  compare.loading = true
  getCompareStats({
    playerIdA: compare.playerIdA,
    playerIdB: compare.playerIdB,
    season: queryParams.value.season,
    competition: queryParams.value.competition || undefined
  }).then(res => {
    compare.data = res.data || []
    compare.loading = false
  }).catch(() => {
    compare.loading = false
  })
}

function compareBarWidth(valA, valB) {
  const max = Math.max(valA, valB, 1)
  return (valA / max * 100) + '%'
}

// ======================== Tab4: 个人详情 ========================
const detailSearch = ref('')
const selectedDetailPlayer = ref(null)
const detailDialogVisible = ref(false)
const dialogPlayer = ref(null)

const filteredDetailPlayers = computed(() => {
  let list = statList.value
  if (detailSearch.value) {
    const kw = detailSearch.value.toLowerCase()
    list = list.filter(p => (p.playerName || '').toLowerCase().includes(kw))
  }
  return list
})

function selectDetailPlayer(item) {
  selectedDetailPlayer.value = item
}

function viewPlayerDetail(row) {
  dialogPlayer.value = row
  detailDialogVisible.value = true
}

// ======================== 工具函数 ========================
function posLabel(pos) {
  const map = { '0': '守门员', '1': '后卫', '2': '中场', '3': '前锋' }
  return map[String(pos)] ?? pos ?? '-'
}

function posTagType(pos) {
  const map = { '0': 'warning', '1': '', '2': 'success', '3': 'danger' }
  return map[String(pos)] ?? 'info'
}

function avatarColor(pos) {
  const map = { '0': '#fa8c16', '1': '#1890ff', '2': '#52c41a', '3': '#f5222d' }
  return map[String(pos)] || '#1a3a5c'
}

function playerPhoto(name, avatarUrl) {
  return getPlayerPhoto(name, avatarUrl)
}

function goalRate(row) {
  return row.appearances > 0 ? row.goals / row.appearances : 0
}

// ======================== 初始化 ========================
getList()
loadTeamStats()
loadRankings()
loadAllPlayers()
</script>

<style scoped>
/* ===== 页面头部 ===== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(145, 166, 195, 0.14);
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #f3f6fa;
  margin: 0;
}
.page-filter {
  display: flex;
  align-items: center;
}
.filter-label {
  font-size: 13px;
  color: #8f9cb0;
}

/* ===== 统计卡片 ===== */
.stats-row {
  margin-bottom: 16px;
}
.stat-card {
  background: #101b29;
  border: 1px solid #223044;
  border-radius: 6px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: none;
}
.stat-title {
  font-size: 14px;
  color: #8f9cb0;
  margin-bottom: 12px;
}
.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: #f3f6fa;
}
.stat-value.stat-blue { color: #4f96ff; }
.stat-value.stat-green { color: #22b573; }
.stat-value.stat-red { color: #f14d5c; }
.stat-value.stat-orange { color: #ff9b31; }
.stat-unit {
  font-size: 14px;
  color: #7f8da2;
  font-weight: 400;
  margin-left: 2px;
}
.stat-sub {
  font-size: 12px;
  color: #7f8da2;
  margin-top: 4px;
}

/* ===== Tabs ===== */
.stat-tabs {
  background: #101b29;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #223044;
}

/* ===== 数字高亮 ===== */
.num-gold {
  font-weight: 700;
  color: #d48806;
}

/* ===== 排行榜 ===== */
.card {
  background: #101b29;
  border: 1px solid #223044;
  border-radius: 6px;
  padding: 20px;
  box-shadow: none;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #e9eef6;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title-extra {
  font-size: 12px;
  font-weight: 400;
  color: #7f8da2;
}
.ranking-list { }
.ranking-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(145, 166, 195, 0.14);
}
.ranking-item:last-child { border-bottom: none; }
.ranking-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  margin-right: 12px;
  background: #17263a;
  color: #8f9cb0;
}
.ranking-num.top1 { background: linear-gradient(135deg, #FFD700, #FFA500); color: #fff; }
.ranking-num.top2 { background: linear-gradient(135deg, #C0C0C0, #A0A0A0); color: #fff; }
.ranking-num.top3 { background: linear-gradient(135deg, #CD7F32, #A0522D); color: #fff; }
.ranking-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2f7dff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 12px;
  overflow: hidden;
}
.ranking-info { flex: 1; }
.ranking-name { font-size: 14px; font-weight: 600; color: #e9eef6; }
.ranking-sub { font-size: 12px; color: #7f8da2; margin-top: 2px; }
.ranking-value {
  font-size: 20px;
  font-weight: 700;
  color: #4f96ff;
  min-width: 40px;
  text-align: right;
}
.ranking-value small {
  font-size: 12px;
  font-weight: 400;
  color: #7f8da2;
  margin-left: 2px;
}

/* ===== 球员对比 ===== */
.compare-result { margin-top: 20px; }
.compare-header {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}
.compare-player { text-align: center; flex: 1; }
.compare-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  margin: 0 auto 8px;
  overflow: hidden;
}
.compare-player-name { font-size: 16px; font-weight: 700; }
.compare-player-sub { font-size: 12px; color: #7f8da2; }
.compare-vs {
  font-size: 24px;
  font-weight: 700;
  color: #7f8da2;
}
.compare-bars { padding: 0 20px; }
.compare-bar-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
}
.compare-val {
  font-size: 12px;
  font-weight: 600;
  min-width: 36px;
}
.compare-val.left { text-align: right; margin-right: 6px; color: #1890ff; }
.compare-val.right { text-align: left; margin-left: 6px; color: #fa541c; }
.compare-bar-left {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}
.compare-bar-right { flex: 1; }
.compare-label {
  width: 60px;
  text-align: center;
  color: #8f9cb0;
  font-size: 12px;
}
.bar-fill-left {
  height: 18px;
  background: linear-gradient(270deg, #1890ff, #69c0ff);
  border-radius: 3px 0 0 3px;
  min-width: 4px;
  transition: width 0.3s;
}
.bar-fill-right {
  height: 18px;
  background: linear-gradient(90deg, #fa541c, #ff9c6e);
  border-radius: 0 3px 3px 0;
  min-width: 4px;
  transition: width 0.3s;
}
.compare-summary {
  margin-top: 24px;
  padding: 16px;
  background: #132238;
  border-radius: 6px;
  font-size: 13px;
  color: #a9b4c5;
  line-height: 1.8;
}

/* ===== 个人详情 ===== */
.detail-sidebar { max-height: calc(100vh - 280px); overflow-y: auto; }
.player-select-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #132238;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.player-select-card:hover { border-color: #1890ff; }
.player-select-card.selected { border-color: #2f7dff; background: rgba(47, 125, 255, .14); }
.psc-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}
.psc-info { flex: 1; }
.psc-name { font-size: 14px; font-weight: 600; }
.psc-sub { font-size: 12px; color: #7f8da2; margin-top: 2px; }
.psc-goals { font-size: 18px; font-weight: 700; color: #d48806; }

.detail-player-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(145, 166, 195, 0.14);
}
.detail-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}

.table-player-photo {
  width: 40px;
  height: 40px;
  margin: 2px auto;
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 50%;
  background: linear-gradient(145deg, #17304e, #0c192a);
  color: #8ebeff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
}

.table-player-photo img,
.ranking-avatar img,
.compare-avatar img,
.psc-avatar img,
.detail-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}
.detail-basic { flex: 1; }
.detail-basic h3 { font-size: 18px; margin: 0 0 6px; }
.detail-meta {
  font-size: 13px;
  color: #8f9cb0;
  display: flex;
  gap: 16px;
}
.detail-stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.detail-stat-item {
  text-align: center;
  padding: 14px 8px;
  background: #132238;
  border-radius: 6px;
}
.detail-stat-item .num { font-size: 22px; font-weight: 700; color: #4f96ff; }
.detail-stat-item .lbl { font-size: 11px; color: #7f8da2; margin-top: 4px; }
</style>
