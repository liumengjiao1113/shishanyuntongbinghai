<template>
    <view style="height:100vh;background: #fff;">
        <view class="img-a">
            <view class="t-b">
                您好，
                <br />
                欢迎使用狮山云瞳小程序
                <view class="sub-title">病害检测专用版</view>
            </view>
        </view>
        <view class="login-view" style="">
            <view class="t-login">
                <form class="cl">
                    <view class="t-a">
                        <text class="txt">用户名</text>
                        <input type="text" name="username" placeholder="请输入您的用户名" maxlength="99" 
                               v-model="username" @input="handleUsernameInput" />
                    </view>
                    <view class="t-a">
                        <text class="txt">密码</text>
                        <input type="password" name="password" maxlength="99" placeholder="请输入您的密码" 
                               v-model="password" @input="handlePasswordInput" />
                    </view>
                    <button @tap="login()">登 录</button>
					<button @click="gooffline()" class="off">去离线</button>
                </form>
            </view>
        </view>
    </view>
</template>

<script>
// 使用npm安装的JSEncrypt
import JSEncrypt from 'jsencrypt';
import { request } from '@/components/request.js';

export default {
    data() {
        return {
            username: '',
            password: '',
            isLoading: false
        };
    },
    methods: {
        handleUsernameInput(e) {
            const maxLength = 20;
            if (e.detail.value.length > maxLength) {
                this.username = e.detail.value.slice(0, maxLength);
                uni.showToast({ 
                    title: `用户名不能超过${maxLength}位`, 
                    icon: 'none' 
                });
            }
        },
        
        handlePasswordInput(e) {
            const maxLength = 32;
            if (e.detail.value.length > maxLength) {
                this.password = e.detail.value.slice(0, maxLength);
                uni.showToast({ 
                    title: `密码不能超过${maxLength}位`, 
                    icon: 'none' 
                });
            }
        },
        
        async login() {
            try {
                if (!this.username) {
                    uni.showToast({ title: '请输入用户名', icon: 'none' });
                    return;
                }
                if (!this.password) {
                    uni.showToast({ title: '请输入密码', icon: 'none' });
                    return;
                }

                // 1. 获取公钥
                const publicKeyRes = await request({
                    url: '/api/v1/auth/publicKey',
                    method: 'GET'
                });

                const publicKey = publicKeyRes.data;
                if (!publicKey) {
                    throw new Error('获取公钥失败');
                }

                // 2. 加密密码
                const encryptor = new JSEncrypt();
                encryptor.setPublicKey(publicKey);
                const encryptedPwd = encryptor.encrypt(this.password);
                if (!encryptedPwd) {
                    throw new Error('密码加密失败');
                }

                // 3. 手动构建查询字符串
                const queryString = `username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(encryptedPwd)}`;

                // 4. 发送登录请求（使用手动构建的查询字符串）
                const loginRes = await request({
                    url: `/api/v1/auth/login?${queryString}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                // 5. 处理登录结果
                if (loginRes.code === '00000') {
                    uni.setStorageSync('token', loginRes.data.accessToken);
                    uni.setStorageSync('username', this.username);

                    uni.showToast({ title: '登录成功', icon: 'none' });
                    setTimeout(() => {
                        uni.reLaunch({ url: '/pages/index/index' });
                    }, 500);
                } else {
                    throw new Error(loginRes.msg || '登录失败');
                }

            } catch (error) {
                console.error('登录出错:', error);
                uni.showToast({
                    title: error.message || '登录失败，请重试',
                    icon: 'none'
                });
            }
        },
		
        gooffline(){
			uni.reLaunch({
				url:'/pages/offline/offline'
				
			})
		}
	}
};
</script>

<style scoped>
/* 保持原有的样式不变 */
.txt {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
}
.img-a {
    width: 100%;
    height: 450rpx;
    background-color: #2796f2;
    background-size: 100%;
}

.login-view {
    width: 100%;
    position: relative;
    margin-top: -120rpx;
    background-color: #ffffff;
    border-radius: 8% 8% 0% 0;
}

.t-login {
    width: 600rpx;
    margin: 0 auto;
    font-size: 28rpx;
    padding-top: 80rpx;
}

.t-login button {
    font-size: 28rpx;
    background: #2796f2;
    color: #fff;
    height: 90rpx;
    line-height: 90rpx;
    border-radius: 50rpx;
    font-weight: bold;
}

.t-login input {
    height: 90rpx;
    line-height: 90rpx;
    margin-bottom: 50rpx;
    border-bottom: 1px solid #e9e9e9;
    font-size: 28rpx;
}

.t-login .t-a {
    position: relative;
}

.t-b {
    text-align: left;
    font-size: 42rpx;
    color: #ffffff;
    padding: 130rpx 0 0 70rpx;
    font-weight: bold;
    line-height: 70rpx;
}

/* 新增的副标题样式 */
.sub-title {
    font-size: 34rpx;
    color: #ffffff;
    /* margin-top: 10rpx; */
    font-weight: normal;
    opacity: 0.9;
}

.t-login .t-c {
    position: absolute;
    right: 22rpx;
    top: 22rpx;
    background: #5677fc;
    color: #fff;
    font-size: 24rpx;
    border-radius: 50rpx;
    height: 50rpx;
    line-height: 50rpx;
    padding: 0 25rpx;
}

.t-login .t-d {
    text-align: center;
    color: #999;
    margin: 80rpx 0;
}

.t-login .t-e {
    text-align: center;
    width: 250rpx;
}

.t-login .t-g {
    float: left;
    width: 50%;
}

.t-login .t-e image {
    width: 50rpx;
    height: 50rpx;
}

.t-login .t-f {
    text-align: center;
    margin: 150rpx 0 0 0;
    color: #666;
}

.t-login .t-f text {
    margin-left: 20rpx;
    color: #aaaaaa;
    font-size: 27rpx;
}

.t-login .uni-input-placeholder {
    color: #aeaeae;
}

.cl {
    zoom: 1;
}

.cl:after {
    clear: both;
    display: block;
    visibility: hidden;
    height: 0;
    content: '\20';
}

button{
	margin-bottom: 80px;
}

.off{
	width: 100px;
	float: right;
	
}
</style>