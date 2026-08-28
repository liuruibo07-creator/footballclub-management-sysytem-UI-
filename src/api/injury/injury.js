import request from '@/utils/request'

// 查询伤病康复列表
export function listInjury(query) {
  return request({
    url: '/injury/injury/list',
    method: 'get',
    params: query
  })
}

// 查询伤病康复详细
export function getInjury(id) {
  return request({
    url: '/injury/injury/' + id,
    method: 'get'
  })
}

// 新增伤病康复
export function addInjury(data) {
  return request({
    url: '/injury/injury',
    method: 'post',
    data: data
  })
}

// 修改伤病康复
export function updateInjury(data) {
  return request({
    url: '/injury/injury',
    method: 'put',
    data: data
  })
}

// 删除伤病康复
export function delInjury(id) {
  return request({
    url: '/injury/injury/' + id,
    method: 'delete'
  })
}

// 获取球员下拉列表
export function playerOptions() {
  return request({
    url: '/injury/injury/playerOptions',
    method: 'get'
  })
}

// 获取伤病统计数据
export function injuryStats() {
  return request({
    url: '/injury/injury/stats',
    method: 'get'
  })
}
