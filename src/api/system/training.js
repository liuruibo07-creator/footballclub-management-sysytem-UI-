/**
 * 训练管理模块 - 前端API接口封装
 *
 * 对应后端 Controller: FootballTrainingController
 * 请求路径前缀: /system/training
 *
 * 后端接口由若依代码生成器生成，训练管理是"主表-子表"结构：
 *   主表: football_training（训练计划）
 *   子表: football_training_player（训练参与球员，记录缺席人员）
 * 新增/修改时，前端将子表数据嵌入主表 JSON 的 footballTrainingPlayerList 字段一起提交。
 */
import request from '@/utils/request'

/**
 * 查询训练计划列表（分页）
 *
 * 对应后端: GET /system/training/list
 * Controller: FootballTrainingController.list()
 *
 * @param {Object} query - 查询参数对象，支持以下可选字段：
 *   @param {string} query.title        - 训练名称（模糊查询）
 *   @param {string} query.trainingType - 训练类型（字典值：0=体能,1=战术,2=技术,3=恢复,4=热身）
 *   @param {string} query.status       - 状态（字典值：0=已计划,1=已完成,2=已取消）
 *   @param {string} query.startTime    - 开始时间（日期范围查询起始）
 *   @param {number} query.pageNum      - 当前页码，默认1
 *   @param {number} query.pageSize     - 每页条数，默认10
 *
 * @returns {Promise} 返回 TableDataInfo 格式：{ rows: [], total: number }
 *   rows 中每条记录包含训练基本信息及 attendanceRate（出勤率）等计算字段
 */
export function listTraining(query) {
  return request({
    url: '/system/training/list',
    method: 'get',
    params: query
  })
}

/**
 * 查询训练计划详情（含子表缺席球员列表）
 *
 * 对应后端: GET /system/training/{id}
 * Controller: FootballTrainingController.getInfo()
 *
 * 返回数据包含主表字段 + footballTrainingPlayerList 子表数组。
 * 子表每条记录结构：{ id, trainingId, playerId, playerName, attendanceStatus }
 *   attendanceStatus: 0=待确认, 1=已出勤, 2=缺勤, 3=请假
 *
 * 注意：系统只存储"缺席"球员（attendanceStatus=2或3），
 * 出勤球员通过"全部球员 - 缺席球员"计算得出。
 *
 * @param {number|string} id - 训练计划ID
 * @returns {Promise} 返回 { data: { ...训练主表字段, footballTrainingPlayerList: [...] } }
 */
export function getTraining(id) {
  return request({
    url: '/system/training/' + id,
    method: 'get'
  })
}

/**
 * 新增训练计划（含缺席球员）
 *
 * 对应后端: POST /system/training
 * Controller: FootballTrainingController.add()
 *
 * 提交数据结构：
 * {
 *   title: '训练名称',
 *   trainingType: 0,        // 训练类型（数字编码）
 *   startTime: '2025-03-15 09:00:00',
 *   endTime: '2025-03-15 11:00:00',
 *   venue: '训练基地A场',
 *   description: '训练内容描述',
 *   trainingGoal: '训练目标',
 *   status: 0,              // 状态（数字编码）
 *   footballTrainingPlayerList: [   // 子表：缺席球员列表
 *     { playerId: 1, attendanceStatus: 2 },  // attendanceStatus=2 表示缺勤
 *     { playerId: 3, attendanceStatus: 2 }
 *   ]
 * }
 *
 * 后端处理流程：
 *   1. 插入 football_training 主表记录
 *   2. 批量插入 football_training_player 子表记录（缺席球员）
 *   3. 自动同步创建对应的日程事件（football_schedule_event，event_type=1）
 *
 * @param {Object} data - 训练计划数据（含 footballTrainingPlayerList）
 * @returns {Promise}
 */
export function addTraining(data) {
  return request({
    url: '/system/training',
    method: 'post',
    data: data
  })
}

/**
 * 修改训练计划（含缺席球员）
 *
 * 对应后端: PUT /system/training
 * Controller: FootballTrainingController.edit()
 *
 * 提交数据结构同新增，但必须包含 id 字段。
 * 后端处理流程：
 *   1. 更新 football_training 主表记录
 *   2. 先删除该训练的所有旧子表记录（DELETE WHERE training_id=?）
 *   3. 再批量插入新的缺席球员子表记录（"删后重建"策略）
 *   4. 同步更新对应的日程事件（标题、时间、地点等）
 *
 * @param {Object} data - 训练计划数据（必须含 id，含 footballTrainingPlayerList）
 * @returns {Promise}
 */
export function updateTraining(data) {
  return request({
    url: '/system/training',
    method: 'put',
    data: data
  })
}

/**
 * 删除训练计划
 *
 * 对应后端: DELETE /system/training/{id}
 * Controller: FootballTrainingController.remove()
 *
 * 后端处理流程：
 *   1. 删除 football_training 主表记录（逻辑删除，del_flag=1）
 *   2. 删除关联的 football_training_player 子表记录（物理删除）
 *   3. 同步删除对应的日程事件（football_schedule_event）
 *
 * 注意：支持批量删除，id 可用逗号分隔多个ID，如 "1,2,3"
 *
 * @param {number|string} id - 训练计划ID（或多个ID用逗号分隔）
 * @returns {Promise}
 */
export function delTraining(id) {
  return request({
    url: '/system/training/' + id,
    method: 'delete'
  })
}
