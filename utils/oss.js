import OSS from 'ali-oss'

// 初始化OSS客户端（直接使用AccessKey，仅限测试环境！）
const client = new OSS({
  region: 'oss-cn-hangzhou', // 替换为你的OSS区域
  accessKeyId: '你的AccessKeyId', // 替换为你的AK
  accessKeySecret: '你的AccessKeySecret', // 替换为你的SK
  bucket: '你的Bucket名称'
})

/**
 * 上传文件到OSS
 * @param {string} filePath - 本地文件路径（uni.chooseImage返回的tempFilePaths）
 * @param {string} dir - 存储目录，如 'images/'
 * @returns {Promise<string>} 返回文件URL
 */
export const uploadToOSS = async (filePath, dir = 'images/') => {
  try {
    // 生成唯一文件名（避免覆盖）
    const fileName = `${dir}${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${filePath.split('.').pop()}`
    
    // 上传文件
    const result = await client.put(fileName, filePath)
    return result.url // 返回OSS文件地址
  } catch (error) {
    console.error('OSS上传失败:', error)
    throw error
  }
}