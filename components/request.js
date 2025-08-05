// 定义全局变量来替代 process.env.VUE_APP_API_BASE_URL
const BASE_URL = 'https://larsc.hzau.edu.cn/prod-api';

export const request = (options) => {
  console.log('Request options:', options);
  return new Promise((resolve, reject) => {
    // 处理URL和参数
    let url = BASE_URL + options.url;

    // 对于GET请求，手动将参数拼接到URL上
    if (options.method === 'GET' && options.data) {
      let queryString = '';
      for (const key in options.data) {
        if (options.data[key] !== undefined && options.data[key] !== null) {
          if (queryString) {
            queryString += '&';
          }
          queryString += `${key}=${encodeURIComponent(options.data[key])}`;
        }
      }
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    uni.request({
      url: url,
      method: options.method || 'GET',
      data: options.method !== 'GET' ? options.data : undefined, // GET请求不传data
      header: {
        ...options.headers,
        'Authorization': options.headers?.Authorization?.trim() // 确保没有多余空格
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(`请求失败，状态码：${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error(`网络错误：${err.errMsg}`));
      }
    });
  });
};