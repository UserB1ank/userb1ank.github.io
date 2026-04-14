---
title: "Tinyhttpd源码阅读学习"
date: 2024-04-18
tags: ["httpd", "cgi", "源码阅读", "网络编程", "web服务器"]
categories: ["网络编程", "源码分析"]
---



# Tinyhttpd源码阅读学习

# Tinyhttpd

## 简介

[项目地址](https://github.com/EZLippi/Tinyhttpd)，这是一个非常精简的CGI系统，老东西写的玩具，对于现代程序员来说，阅读其源码是学习httpd原理的一个好方法。

建议源码阅读顺序： main -> startup -> accept_request -> execute_cgi, 通晓主要工作流程后再仔细把每个函数的源码看一看。

![Screenshot_20240424_153317_com.newskyer.draw](/assets/images/network-asset-Screenshot_20240424_153317_com.newskyer.draw-20250930215821-bp5fooq.jpg)

## 主要函数

### main

```c
int main(void)
{
    int server_sock = -1; 
    u_short port = 4000; //指定端口
    int client_sock = -1;
    struct sockaddr_in client_name;
    socklen_t  client_name_len = sizeof(client_name);
    pthread_t newthread;

    server_sock = startup(&port);//开启tcp监听
    printf("httpd running on port %d\n", port);

    while (1)//while循环持续接收请求，并作出处理
    {
        client_sock = accept(server_sock,  
                (struct sockaddr *)&client_name,
                &client_name_len);//建立套接字，如果没有客户端请求，则阻塞程序
        if (client_sock == -1)
            error_die("accept");
        /* accept_request(&client_sock); */
        if (pthread_create(&newthread , NULL, (void *)accept_request, (void *)(intptr_t)client_sock) != 0) //创建进程处理请求
            perror("pthread_create");
    }

    close(server_sock);

    return(0);
}
```

利用`netinet/in.h`和`sys/socket.h`开启监听，等待客户端请求。如果收到请求则建立一个新的线程以处理请求。

### accept_request

```c
void accept_request(void *arg) /*这里的形参就是main函数中的client_sock = accept(server_sock, (struct sockaddr *)&client_name, &client_name_len);*/
{
    int client = (intptr_t)arg;
    char buf[1024]; //报文内容
    size_t numchars; //报文大小
    char method[255]; //访问方法
    char url[255]; //访问的url
    char path[512]; //路径
    size_t i, j;
    struct stat st;
    int cgi = 0;      /* becomes true if server decides this is a CGI
                       * program */
    char *query_string = NULL;

    numchars = get_line(client, buf, sizeof(buf));//读取套接字缓冲区中的一行数据，返回值为数据大小
    i = 0; j = 0;
    while (!ISspace(buf[i]) && (i < sizeof(method) - 1))//以空格为结束符，从buf数组中提取method，也就是提取报文一开始的POST, GET, DELET等，并存储到method[]中
    {
        method[i] = buf[i];
        i++;
    }
    j=i;//j存储i的最终位置，也就是空格处。
    method[i] = '\0';

    if (strcasecmp(method, "GET") && strcasecmp(method, "POST"))//判断method是否为GET或者POST，如果不是二者之一则抛出异常
    {
        unimplemented(client);//用来抛出异常的方法
        return;
    }

    if (strcasecmp(method, "POST") == 0)//如果method是POST，则设置cgi为1
        cgi = 1;

    i = 0;
    while (ISspace(buf[j]) && (j < numchars))//继续过滤空格字符，这里也是用来容错。规范的http报文中，method与url之间只有一个空格
        j++;
    while (!ISspace(buf[j]) && (i < sizeof(url) - 1) && (j < numchars))//读取报文中的url，也是以空格为分隔符
    {
        url[i] = buf[j];
        i++; j++;
    }
    url[i] = '\0';

    if (strcasecmp(method, "GET") == 0)//如果method是GET
    {
        query_string = url;
        while ((*query_string != '?') && (*query_string != '\0'))//遍历url，尝试找到GET请求携带了查询参数的标识符，也就是`?`
            query_string++;
        if (*query_string == '?')//当找到了`?`
        {
            cgi = 1;//开启CGI
            *query_string = '\0';//将`?`替换为终止符
            query_string++;//后移一位以继续读取数据
        }
    }

    sprintf(path, "htdocs%s", url);//将url数据拼接上'htdocs'字符，并存储到path数组中。由于上一步操作将?置换为\0，所以只有url中的路径部分被拼接
    if (path[strlen(path) - 1] == '/')//如果path的最后一个字符是/，则在末尾添加index.html
        strcat(path, "index.html");
    if (stat(path, &st) == -1) {//获取指定路径的文件或目录的属性信息，并存储到结构体st中，返回-1则意味着没找到文件
        while ((numchars > 0) && strcmp("\n", buf))  /* read & discard headers */
            numchars = get_line(client, buf, sizeof(buf));
        not_found(client);//抛出404异常
    }
    else
    {
        if ((st.st_mode & S_IFMT) == S_IFDIR)//判断读取到的是否目录信息，如果是目录，则拼接index.html
            strcat(path, "/index.html");
        if ((st.st_mode & S_IXUSR) ||   //检查文件的执行权限，如果属主或属组或其它人中存在任一执行权限，则开启CGI
                (st.st_mode & S_IXGRP) ||
                (st.st_mode & S_IXOTH)    )
            cgi = 1;
        if (!cgi)
            serve_file(client, path);//渲染文件
        else
            execute_cgi(client, path, method, query_string);//执行CGI
    }

    close(client);//关闭套接字
}
```

### serve_file

```c
void serve_file(int client, const char *filename)
{
    FILE *resource = NULL;
    //初始化局部变量
    int numchars = 1;
    char buf[1024];

    buf[0] = 'A'; buf[1] = '\0';
    while ((numchars > 0) && strcmp("\n", buf))  /* read & discard headers */
        numchars = get_line(client, buf, sizeof(buf));

    resource = fopen(filename, "r");//尝试读取文件
    if (resource == NULL)
        not_found(client);//抛出404异常
    else
    {
        headers(client, filename);//将预定义的headers内容放入缓冲区
        cat(client, resource);//将文件内容放入缓冲区
    }
    fclose(resource);
}
```

### execute_cgi

```c
void execute_cgi(int client, const char *path,
        const char *method, const char *query_string)  //形参：套接字， 请求文件的路径， 请求方法， 请求参数
{
    char buf[1024];
    int cgi_output[2];
    int cgi_input[2];
    pid_t pid;
    int status;
    int i;
    char c;
    int numchars = 1;
    int content_length = -1;

    buf[0] = 'A'; buf[1] = '\0';
    if (strcasecmp(method, "GET") == 0)//GET请求就不考虑请求体了，直接清空缓冲区
        while ((numchars > 0) && strcmp("\n", buf))  /* read & discard headers */
            numchars = get_line(client, buf, sizeof(buf));
    else if (strcasecmp(method, "POST") == 0) /*POST*/ 
    {
        numchars = get_line(client, buf, sizeof(buf));//
        while ((numchars > 0) && strcmp("\n", buf))
        {
            buf[15] = '\0';//Content-Length的长度是14，这一步是为了让strcasecmp能找到报文头中的这个字段。从而使得报文体中的数据能按照正确的长度被提取
            if (strcasecmp(buf, "Content-Length:") == 0)
                content_length = atoi(&(buf[16]));//从\0截断后读取字符内容，也就是读取报文长度
            numchars = get_line(client, buf, sizeof(buf));//丢弃报文头
        }
        if (content_length == -1) {
            bad_request(client);//异常处理
            return;
        }
    }
    else/*HEAD or other*/
    {
    }


    if (pipe(cgi_output) < 0) {//创建输出管道
        cannot_execute(client);
        return;
    }
    if (pipe(cgi_input) < 0) {//创建输入管道
        cannot_execute(client);
        return;
    }

    if ( (pid = fork()) < 0 ) {//这个方法会被调用两次。创建子进程，如果创建成功，父进程中的这个方法会返回子进程id，子进程中会返回0
        cannot_execute(client);
        return;
    }
    sprintf(buf, "HTTP/1.0 200 OK\r\n");
    send(client, buf, strlen(buf), 0);
    if (pid == 0)  /* child: CGI script */ //判断是否为子进程
    {
        char meth_env[255];
        char query_env[255];
        char length_env[255];

        dup2(cgi_output[1], STDOUT);//重定向子进程的标准输出到父进程的管道符
        dup2(cgi_input[0], STDIN);//重定向子进程的标准输入到父进程的管道符
        close(cgi_output[0]);
        close(cgi_input[1]);
        sprintf(meth_env, "REQUEST_METHOD=%s", method);//提取method，设置环境变量
        putenv(meth_env);
        if (strcasecmp(method, "GET") == 0) {
            sprintf(query_env, "QUERY_STRING=%s", query_string);
            putenv(query_env);
        }
        else {   /* POST */
            sprintf(length_env, "CONTENT_LENGTH=%d", content_length);
            putenv(length_env);
        }
        execl(path, NULL);//运行指定的文件
        exit(0);
    } else {    /* parent */
        close(cgi_output[1]);
        close(cgi_input[0]);
        if (strcasecmp(method, "POST") == 0)
            for (i = 0; i < content_length; i++) {
                recv(client, &c, 1, 0);
                write(cgi_input[1], &c, 1);//将post的内容输入到子进程
            }
        while (read(cgi_output[0], &c, 1) > 0)//将子进程的输出填入套接字缓冲区
            send(client, &c, 1, 0);

        close(cgi_output[0]);
        close(cgi_input[1]);
        waitpid(pid, &status, 0);//等待子进程结束
    }
}

```

这里是利用子进程执行脚本，父进程的输入重定向到子进程，子进程的输出重定向到父进程，由此实现了进程通信。

## 功能函数

### get_line()

```c
	int get_line(int sock, char *buf, int size)
{
    int i = 0;
    char c = '\0';
    int n;

    while ((i < size - 1) && (c != '\n'))
    {
        n = recv(sock, &c, 1, 0);//从套接字读取一字节信息，放置于字符变量c中
        /* DEBUG printf("%02X\n", c); */
        if (n > 0)//判断是否成功读取
        {
            if (c == '\r')//如果读到\r回车符
            {
                n = recv(sock, &c, 1, MSG_PEEK);//预览下一字符（不会从缓冲区去除）
                /* DEBUG printf("%02X\n", c); */
                if ((n > 0) && (c == '\n'))//如果预览到\n，就将\n从缓冲区中剔除，也就是再读一字节
                    recv(sock, &c, 1, 0);
                else //如果读到\r但是预览的下一字节不是\n，那么就将c中的内容从\r置换为\n
                    c = '\n';
            }
            buf[i] = c;//存储读取到的信息到buf数组
            i++;
        }
        else
            c = '\n';//如果读取失败，则手工为报文添加结束符。http报文可以使用\n作为报文结束符
    }
    buf[i] = '\0';//字符数组终止符

    return(i);
}
```

该方法用于从套接字缓冲区中读取数据，并进行了容错处理。
