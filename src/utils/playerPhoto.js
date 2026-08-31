const photoFiles = {
  '齐雨熙': '齐雨熙.jpg',
  '闫炳良': '闫炳良.png',
  '张皓然': '张皓然.jpg',
  '王政豪': '王政豪.jpg',
  '杨帆': '杨帆.png',
  '王献钧': '王献钧.png',
  '吴兴涵': '吴兴涵.png',
  '艾托尔·科尔多瓦': '科尔多瓦.png',
  '李嗣镕': '李嗣镕.jpg',
  '孙铭谦': '孙铭谦.jpg',
  '李帅琪': '李帅琪.jpg',
  '蔡承峻': '蔡承峻.jpg',
  '石炎': '石炎.jpg',
  '豪梅·格劳': '格劳.png',
  '布鲁诺·哈达斯': '哈达斯.png',
  '克里斯蒂安·萨尔瓦多': '克里斯蒂安·萨尔瓦多.jpg',
  '黄嘉辉': '黄嘉辉.png',
  '刘帅': '刘帅.jpg',
  '季胜攀': '季胜攀.png',
  '李永佳': '李永佳.jpg',
  '陈哲宣': '陈哲宣.png',
  '郭皓': '郭皓.jpg',
  '巴顿': '巴顿.png',
  '王秋明': '王秋明.png',
  '乃博宁林': '乃博宁林.jpg',
  '吉列尔梅·谢蒂内': '吉列尔梅.png',
  '阿尔韦托·基莱斯': '基莱斯.png',
  '谢维军': '谢维军.png',
  '刘俊贤': '刘俊贤.jpg'
}

function uploadedPhotoUrl(avatarUrl) {
  if (!avatarUrl) return ''
  if (/^(https?:|data:|blob:)/i.test(avatarUrl)) return avatarUrl
  const baseUrl = import.meta.env.VITE_APP_BASE_API || ''
  return `${baseUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`
}

export function getPlayerPhoto(name, avatarUrl) {
  const uploaded = uploadedPhotoUrl(avatarUrl)
  if (uploaded) return uploaded
  const file = photoFiles[name]
  return file ? `/player-photos/${encodeURIComponent(file)}` : ''
}

export function hasPlayerPhoto(name, avatarUrl) {
  return Boolean(avatarUrl || photoFiles[name])
}
