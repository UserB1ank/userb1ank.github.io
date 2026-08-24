---
title: "Virustotal爬虫"
category: "爬虫"
date: 2025-11-10
---

我的目的是爬取Virustotal搜集到的子域名，这里以百度为例看一下api的情况。

![image](/assets/images/image-20251110111746-irkvfhl.png)

直接用curl访问一下url，

![image](/assets/images/image-20251110111903-besnn15.png)

返回reCAPTCHA验证错误。右键浏览器记录，复制为cURL请求格式，然后再次访问。

![image](/assets/images/image-20251110112148-5mlgcp3.png)

成功返回数据。由此可以推测出标头里面有需要携带的字段。经过测试，该字段为`X-VT-Anti-Abuse-Header`。对其进行base64解码，发现没有进行aes或者别的什么加密手段，查看js,看一下这个东西是怎么生成的。

![image](/assets/images/image-20251110142941-11161wr.png)

全局搜索关键字，找到相关生成代码。涉及到的函数如下图所示

```javascript
computeAntiAbuseHeader() {
                    let e = Date.now() / 1e3;
                    return btoa(`${( () => {
                        let e = (1 + Math.random() % 5e4) * 1e10;
                        return e < 50 ? "-1" : e.toFixed(0)
                    }
                    )()}-ZG9udCBiZSBldmls-${e}`)
                }
```

外部变量`e`是当前时间的时间戳除以1000，最后被拼接到`-ZG9udCBiZSBldmls-`这串固定值的末尾。

```javascript
let e = (1 + Math.random() % 5e4) * 1e10;
return e < 50 ? "-1" : e.toFixed(0)
```

匿名函数先计算出一个值，最后与50比较，如果小于50,则返回-1,如果大于50,则对这个值保留整数部分并返回，最终拼接到`-ZG9udCBiZSBldmls-`的前面。用python重构一下代码。

```python
import base64
import random
from time import time
def compute_anti_abuse_header():
    suffix_str= str(time()*1000) #python默认返回s，*1000换算为ms
    e=(1+random.random()%5e4)*1e10
    if e<50:
        prefix_str=str(-1)
    else:
        prefix_str=str(int(e))
    return base64.b64encode((prefix_str+"-ZG9udCBiZSBldmls-"+suffix_str).encode()).decode()
```

经过测试，计算出的值在请求中可以返回合规数据。

![image](/assets/images/image-20251110145512-knmf3lh.png)

接下来按照[官方文档](https://docs.virustotal.com/reference/subdomains)，带着请求头请求数据即可。
