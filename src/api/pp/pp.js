import request from '@/utils/request'

// 查询球员档案列表
export function listPp(query) {
  return request({
    url: '/pp/pp/list',
    method: 'get',
    params: query
  })
}

// 查询球员列表（训练管理等模块使用）
export function listPlayer(query) {
  return request({
    url: '/pp/pp/list',
    method: 'get',
    params: query
  })
}

// 查询球员档案详细
export function getPp(id) {
  return request({
    url: '/pp/pp/' + id,
    method: 'get'
  })
}

// 新增球员档案
export function addPp(data) {
  return request({
    url: '/pp/pp',
    method: 'post',
    data: data
  })
}

// 修改球员档案
export function updatePp(data) {
  return request({
    url: '/pp/pp',
    method: 'put',
    data: data
  })
}

// 删除球员档案
export function delPp(id) {
  return request({
    url: '/pp/pp/' + id,
    method: 'delete'
  })
}
