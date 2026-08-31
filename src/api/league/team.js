import request from '@/utils/request'

// 查询联赛球队列表
export function listLeagueTeam(query) {
  return request({
    url: '/league/team/list',
    method: 'get',
    params: query
  })
}

// 联赛球队下拉选项(比赛管理新增弹窗主客队共用)
export function optionselectLeagueTeam() {
  return request({
    url: '/league/team/optionselect',
    method: 'get'
  })
}

// 查询联赛球队详细
export function getLeagueTeam(id) {
  return request({
    url: '/league/team/' + id,
    method: 'get'
  })
}

// 新增联赛球队
export function addLeagueTeam(data) {
  return request({
    url: '/league/team',
    method: 'post',
    data: data
  })
}

// 修改联赛球队
export function updateLeagueTeam(data) {
  return request({
    url: '/league/team',
    method: 'put',
    data: data
  })
}

// 删除联赛球队
export function delLeagueTeam(id) {
  return request({
    url: '/league/team/' + id,
    method: 'delete'
  })
}
