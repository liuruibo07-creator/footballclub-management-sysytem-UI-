import request from '@/utils/request'

// 查询训练计划列表
export function listTraining(query) {
  return request({
    url: '/system/training/list',
    method: 'get',
    params: query
  })
}

// 查询训练计划详细
export function getTraining(id) {
  return request({
    url: '/system/training/' + id,
    method: 'get'
  })
}

// 新增训练计划
export function addTraining(data) {
  return request({
    url: '/system/training',
    method: 'post',
    data: data
  })
}

// 修改训练计划
export function updateTraining(data) {
  return request({
    url: '/system/training',
    method: 'put',
    data: data
  })
}

// 删除训练计划
export function delTraining(id) {
  return request({
    url: '/system/training/' + id,
    method: 'delete'
  })
}
