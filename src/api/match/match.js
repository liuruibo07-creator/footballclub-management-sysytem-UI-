import request from '@/utils/request'

// 查询比赛管理列表
export function listMatch(query) {
  return request({
    url: '/match/match/list',
    method: 'get',
    params: query
  })
}

// 查询首页赛季概览
export function getSeasonOverview() {
  return request({
    url: '/match/match/season-overview',
    method: 'get'
  })
}

// 查询首页下一场比赛
export function getNextMatch() {
  return request({
    url: '/match/match/next',
    method: 'get'
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
