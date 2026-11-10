# 才探 TalentRadar 应用镜像：Spring Boot 3.2.5 / Java 21
# build context 是项目根目录（compose 中 context: ..），因此 jar 与前端页面都在这里 COPY
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app
ENV TZ=Asia/Shanghai \
    SPRING_PROFILES_ACTIVE=docker

COPY server/target/talent-radar-server-0.1.0.jar /app/app.jar

# 同源部署：index.html + assets 由 Spring Boot 静态资源处理器直接提供
COPY index.html /app/web/index.html
COPY assets/ /app/web/assets/

EXPOSE 8080

# exec 形式启动，保证 docker stop 时 Spring Boot 能收到 SIGTERM 正常关闭
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
