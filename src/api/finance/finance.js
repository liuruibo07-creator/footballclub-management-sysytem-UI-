import request from '@/utils/request'

// 查询财务收支列表
export function listFinance(query) {
  return request({
    url: '/finance/finance/list',
    method: 'get',
    params: query
  })
}

// 查询财务收支汇总
export function getFinanceSummary() {
  return request({
    url: '/finance/finance/summary',
    method: 'get'
  })
}

// 查询财务收支详细
export function getFinance(id) {
  return request({
    url: '/finance/finance/' + id,
    method: 'get'
  })
}

// 新增财务收支
export function addFinance(data) {
  return request({
    url: '/finance/finance',
    method: 'post',
    data: data
  })
}

// 修改财务收支
export function updateFinance(data) {
  return request({
    url: '/finance/finance',
    method: 'put',
    data: data
  })
}

// 删除财务收支
export function delFinance(id) {
  return request({
    url: '/finance/finance/' + id,
    method: 'delete'
  })
}
