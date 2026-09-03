/**
 * 球队日程管理模块 - 前端API接口封装
 *
 * 对应后端 Controller: FootballScheduleEventController
 * 请求路径前缀: /system/event
 *
 * 日程模块是俱乐部的"统一时间线"，将所有事件（比赛/训练/会议）汇总展示。
 * 日程事件来源：
 *   1. 比赛模块自动同步（match → event，event_type=0）
 *   2. 训练模块自动同步（training → event，event_type=1）
 *   3. 用户手动新增（会议等，event_type=2）
 *
 * 核心表: football_schedule_event（日程事件主表）
 * 关联表: football_schedule_player（日程参与人员，仅手动新增的日程有）
 */
import request from '@/utils/request'

/**
 * 查询日程事件列表（分页）
 *
 * 对应后端: GET /system/event/list
 * Controller: FootballScheduleEventController.list()
 *
 * @param {Object} query - 查询参数对象，支持以下可选字段：
 *   @param {string} query.title      - 事件标题（模糊查询）
 *   @param {string} query.eventType  - 事件类型（字典值：0=比赛,1=训练,2=会议）
 *   @param {string} query.status     - 状态（字典值：0=已安排,1=已完成,2=已推迟,3=已取消）
 *   @param {string} query.startTime  - 开始时间（用于日期筛选）
 *   @param {string} query.beginStartTime - 日期范围查询起始（由前端 setDateParams() 构造）
 *   @param {string} query.endStartTime   - 日期范围查询截止（由前端 setDateParams() 构造）
 *   @param {number} query.pageNum    - 当前页码，默认1
 *   @param {number} query.pageSize   - 每页条数，默认10
 *
 * @returns {Promise} 返回 TableDataInfo 格式：{ rows: [], total: number }
 *   rows 中每条记录包含：id, title, eventType, startTime, endTime, location,
 *   status, description, matchId, trainingId 等字段
 */
export function listEvent(query) {
  return request({
    url: '/system/event/list',
    method: 'get',
    params: query
  })
}

/**
 * 查询首页待办日程汇总
 *
 * 对应后端: GET /system/event/pending
 * Controller: FootballScheduleEventController.getPendingSummary()
 *
 * 返回当前用户角色相关的待办事件统计，用于首页 Dashboard 展示。
 * 返回数据结构：
 * {
 *   todayTrainingCount: number,   // 今日训练数量
 *   pendingMatchCount: number,    // 待进行比赛数量（status=0）
 *   pendingTrainingCount: number, // 待进行训练数量（status=0）
 *   pendingMeetingCount: number   // 待进行会议数量（status=0）
 * }
 *
 * 该方法被首页 src/views/index.vue 调用，展示"今日训练"和"待办日程"卡片。
 *
 * @returns {Promise}
 */
export function getPendingEventSummary() {
  return request({
    url: '/system/event/pending',
    method: 'get'
  })
}

/**
 * 查询日程事件详情
 *
 * 对应后端: GET /system/event/{id}
 * Controller: FootballScheduleEventController.getInfo()
 *
 * 返回数据包含主表字段 + footballSchedulePlayerList 子表数组（参与人员列表）。
 * 子表每条记录结构：{ id, eventId, playerId, playerName, position, ... }
 *
 * 注意：由训练/比赛自动同步的日程，其参与人员通过 training_id/match_id 关联查询，
 * 而非 footballSchedulePlayerList（该表仅存储手动新增日程的参与人员）。
 *
 * @param {number|string} id - 日程事件ID
 * @returns {Promise} 返回 { data: { ...日程字段, footballSchedulePlayerList?: [...] } }
 */
export function getEvent(id) {
  return request({
    url: '/system/event/' + id,
    method: 'get'
  })
}

/**
 * 新增日程事件
 *
 * 对应后端: POST /system/event
 * Controller: FootballScheduleEventController.add()
 *
 * 提交数据结构：
 * {
 *   title: '会议标题',
 *   eventType: 2,            // 事件类型（0=比赛,1=训练,2=会议）
 *   startTime: '2025-03-15 14:00:00',
 *   endTime: '2025-03-15 16:00:00',
 *   location: '会议室A',
 *   description: '会议内容',
 *   status: 0,               // 状态（0=已安排）
 *   footballSchedulePlayerList: [  // 参与人员（仅手动新增时使用）
 *     { playerId: 1 },
 *     { playerId: 2 }
 *   ]
 * }
 *
 * 注意：比赛和训练事件由对应模块自动同步创建，不需要手动调用此接口。
 * 此接口主要用于手动新增会议等其他类型事件。
 *
 * @param {Object} data - 日程事件数据
 * @returns {Promise}
 */
export function addEvent(data) {
  return request({
    url: '/system/event',
    method: 'post',
    data: data
  })
}

/**
 * 修改日程事件
 *
 * 对应后端: PUT /system/event
 * Controller: FootballScheduleEventController.edit()
 *
 * 提交数据结构同新增，但必须包含 id 字段。
 * 后端处理流程：
 *   1. 更新 football_schedule_event 主表记录
 *   2. 先删除旧参与人员记录（DELETE WHERE event_id=?）
 *   3. 再批量插入新的参与人员记录（"删后重建"策略）
 *
 * 注意：修改比赛/训练事件时，建议从比赛/训练模块修改，
 * 以确保数据一致性（单向同步：训练→日程，而非双向）。
 *
 * @param {Object} data - 日程事件数据（必须含 id）
 * @returns {Promise}
 */
export function updateEvent(data) {
  return request({
    url: '/system/event',
    method: 'put',
    data: data
  })
}

/**
 * 删除日程事件
 *
 * 对应后端: DELETE /system/event/{id}
 * Controller: FootballScheduleEventController.remove()
 *
 * 后端处理流程：
 *   1. 删除 football_schedule_event 主表记录（逻辑删除）
 *   2. 删除关联的 football_schedule_player 子表记录
 *
 * 注意：删除比赛/训练事件时，建议从比赛/训练模块操作，
 * 否则可能导致数据不一致。支持批量删除，id 可用逗号分隔。
 *
 * @param {number|string} id - 日程事件ID（或多个ID用逗号分隔）
 * @returns {Promise}
 */
export function delEvent(id) {
  return request({
    url: '/system/event/' + id,
    method: 'delete'
  })
}
