const sign = require('./lib/shangma_utils.js');
const axios = require('axios');


function concatParams(signParams) {
    const paramsString = Object.entries(signParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return `${paramsString}`;
  }


function getHeaders(){
    // 不能修改APP_ID
    const APP_ID = "5PFuGr3Q7AA0vbJAFior" 
    
    const DEVICE_ID = "Z8T23iCPme3DWGRAQLpJO2w0qY2Kq9-R1"
    const CHANNEL = "windows-PC"
    const noncesr =  Date.now()
    const ts = Math.floor(noncesr/1000) 
      
    const signParams = {
        appid: APP_ID,
        channel: CHANNEL,
        device_id: DEVICE_ID,
        language: 'zh-CN',
        model: '',
        noncesr: noncesr,
        sys_version: '',
        ts: ts,
        version: 'V1.0'
      };
    let param = concatParams(signParams) +'xbbaUe8PPVblLWaVP-iIJnUGhnDXmrm_';
    signature = sign(param);
    console.log("cancat param:", param, "sign", signature)
    
    let shangma_headers = {
        "Marathon-App-Id": APP_ID,
        "Marathon-Device-Id":DEVICE_ID ,
        "Marathon-Ts": ts,
        "Marathon-Noncesr": noncesr,
        "Marathon-Language": 'zh-CN',
        "Marathon-Sign": signature,
        "Marathon-Version": "V1.0",
        "Marathon-Model": "",
        "Marathon-Sys-Version": "",
        "Marathon-Channel": CHANNEL,
    };
    
    const localHeaders = {
        'authority': 'www.shang-ma.com',
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6',
        'content-type': 'application/json', 
        'referer': 'https://www.shang-ma.com/',
        'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      };
    
    return  Object.assign({}, shangma_headers, localHeaders);
}


async function getAuthorizationByCookie(cookie) {
  const url = 'https://www.shang-ma.com/api/official/sso/client/info';
  try {
    const headers  = getHeaders()
    headers.cookie = cookie;
    console.log("get auth request headers:" ,headers)
    const response = await axios.get(url, { headers });
    let shmJwtToken = null;

    if (response.headers['set-cookie']) {
      const setCookies = response.headers['set-cookie'];
      for (const setCookie of setCookies) {
        if (setCookie.includes('SHM_JWT_TOKEN')) {
            const match = setCookie.match(/SHM_JWT_TOKEN=([^;]+)/);
            shmJwtToken = match ? match[1] : null;
            break;
        }
      }
    }

    const data = response.data;
    console.log('data:', data);
    return shmJwtToken;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function signIn(cookie){
    const authorization = await getAuthorizationByCookie(cookie);
    let headers = getHeaders();
    headers.authorization = "JwtUser ".concat(authorization);
    let data = JSON.stringify({
      //请求参数为：{}，经过AES算法加密之后就是: S1uAYaf/g6oBpv8DWUaQlQ==，在前端js代码中搜索encryptBody关键字
      "encryptBody": "S1uAYaf/g6oBpv8DWUaQlQ=="
    });
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://www.shang-ma.com/api/v1/user/integral/sign-in',
      headers: headers,
      data : data
    };
    
    axios.request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}

const cookie = 'Hm_lvt_99155c57e3d03070373e7c41a70f52e7=1689407468; sso_token_official=5kwyww4tz1ssks0o4go08kwo8gwwogsw80wwk0ok4kcck0w0wo; sso_verify_official=5ofcuh3aq3gg4sccw8wo44okc0cog8s0kw4gs4swscw080kccc; Hm_lpvt_99155c57e3d03070373e7c41a70f52e7=1689432523; SHM_JWT_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOjcyOTI3LCJndWVzdCI6MCwiZXhwaXJlZCI6MTY4OTQzNjEyMywidGltZXN0YW1wIjoiMTU5NjE5NDcxOTA1NDEifQ.qb5pWfer0hcNvdWlFe40Q30S3NTiMkFn6UsNgdhXrtI';

signIn(cookie);


