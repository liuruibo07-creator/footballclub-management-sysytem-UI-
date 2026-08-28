import request from '@/utils/request'

// 查询球员赛季统计列表
export function listStat(query) {
  return request({
    url: '/stat/stat/list',
    method: 'get',
    params: query
  })
}

// 查询球员赛季统计详细
export function getStat(id) {
  return request({
    url: '/stat/stat/' + id,
    method: 'get'
  })
}

// 新增球员赛季统计
export function addStat(data) {
  return request({
    url: '/stat/stat',
    method: 'post',
    data: data
  })
}

// 修改球员赛季统计
export function updateStat(data) {
  return request({
    url: '/stat/stat',
    method: 'put',
    data: data
  })
}

// 删除球员赛季统计
export function delStat(id) {
  return request({
    url: '/stat/stat/' + id,
    method: 'delete'
  })
}

// 获取球员下拉列表
export function getPlayerOptions() {
  return request({
    url: '/stat/stat/playerOptions',
    method: 'get'
  })
}

// 获取球队赛季汇总统计
export function getTeamSummary(query) {
  return request({
    url: '/stat/stat/teamSummary',
    method: 'get',
    params: query
  })
}

// 获取排行榜数据
export function getStatRanking(query) {
  return request({
    url: '/stat/stat/ranking',
    method: 'get',
    params: query
  })
}

// 获取球员对比数据
export function getCompareStats(query) {
  return request({
    url: '/stat/stat/compare',
    method: 'get',
    params: query
  })
}
