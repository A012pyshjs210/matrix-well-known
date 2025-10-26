// 使用 itty-router 库简化路由处理，需在 wrangler.toml 中声明依赖
import { createCors, error, json, Router, withParams } from 'itty-router'

const router = Router()
const { preflight, corsify } = createCors({
  origins: ['*'],
  methods: ['GET', 'OPTIONS'], // 确保包含 OPTIONS 方法以处理 CORS 预检请求
  headers: ['X-Requested-With', 'Content-Type', 'Authorization']
})

/*
export interface Env {
  MATRIX_SERVER_ADDR: string
}
*/

const missing = (message = 'Not found.') => error(404, message)

router
  // 处理 CORS 预检请求 (OPTIONS)
  .options('*', preflight)
  .all('*', withParams)

  // 提供 matrix/client 文件
  .get('/.well-known/matrix/client', (request, env, context) => {
    const responseData = {
      'm.homeserver': {
        base_url: 'https://matrix.yycfruit.xyz:1234/' // 从环境变量读取实际服务器地址
      },
      "im.vector.riot.jitsi": {
        "preferredDomain": "jitsi.yycfruit.xyz"
      }
      // 可按需添加 m.identity_server 等其他信息
    }
    return json(responseData)
  })

  // 提供 matrix/server 文件 (v1.10 规范新增)
  /*
  .get('/.well-known/matrix/server', (request, env, context) => {
    const responseData = {
      'm.server': env.MATRIX_SERVER_ADDR
    }
    return json(responseData)
  })
  */

  // 提供 matrix/support 文件 (v1.10 规范新增)
  .get('/.well-known/matrix/support', (request, env, context) => {
    const responseData = {
      "contacts": [
        {
          "email_address": "yycfruit_xyz@yeah.net",
          "matrix_id": "@akadmin:yycfruit.xyz",
          "role": "m.role.admin"
        }
      ],
      "support_page": "https://matrix.org/"
    }
    return json(responseData)
  })

  // 404 处理
  .all('*', () => missing('Are you sure about that?'))

export default {
  fetch: async (request, env, context) => 
    router.handle(request, env, context)
      .then(json)
      .catch(err => error(500, err.stack))
      .then(corsify) // 确保所有响应都包含 CORS 头部
}