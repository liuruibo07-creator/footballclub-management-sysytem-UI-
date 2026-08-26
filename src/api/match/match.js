import request from '@/utils/request'

// 查询比赛管理列表
export function listMatch(query) {
  return request({
    url: '/match/match/list',
    method: 'get',
    params: query
  })
}

// 查询比赛管理详细
export function getMatch(id) {
  return request({
    url: '/match/match/' + id,
    method: 'get'
  })
}

// 新增比赛管理
export function addMatch(data) {
  return request({
    url: '/match/match',
    method: 'post',
    data: data
  })
}

// 修改比赛管理
export function updateMatch(data) {
  return request({
    url: '/match/match',
    method: 'put',
    data: data
  })
}

// 删除比赛管理
export function delMatch(id) {
  return request({
    url: '/match/match/' + id,
    method: 'delete'
  })
}
