import request from '@/utils/request'

// 查询球员档案列表
export function listPlayer(query) {
  return request({
    url: '/player/player/list',
    method: 'get',
    params: query
  })
}

// 查询球员档案详细
export function getPlayer(id) {
  return request({
    url: '/player/player/' + id,
    method: 'get'
  })
}

// 新增球员档案
export function addPlayer(data) {
  return request({
    url: '/player/player',
    method: 'post',
    data: data
  })
}

// 修改球员档案
export function updatePlayer(data) {
  return request({
    url: '/player/player',
    method: 'put',
    data: data
  })
}

// 删除球员档案
export function delPlayer(id) {
  return request({
    url: '/player/player/' + id,
    method: 'delete'
  })
}
