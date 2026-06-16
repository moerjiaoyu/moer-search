FROM openjdk:17-alpine
MAINTAINER @moer
# UTF-8 并配置环境
ENV BUILD_ENV=dev SERVICE_NAME=moer-search-service LANG=C.UTF-8 TZ=Asia/Shanghai LOG_FILE_PATH="/var/log"
# 时区
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ENV JAVA_OPTS="-Dspring.profiles.active=${BUILD_ENV} -Dspring.application.name=${SERVICE_NAME} -Dfile.encoding=UTF-8 -Djava.security.egd=file:/dev/./urandom"
ENV JAVA_TOOL_OPTIONS="-Xmx512m -Xms512m"
ARG JAR_FILE=target/moer-search-service-1.0.0.jar
WORKDIR /app
COPY ${JAR_FILE} /app/app.jar
COPY config /app/config
ENTRYPOINT ["sh", "-c", "java --add-exports java.base/jdk.internal.misc=ALL-UNNAMED $JAVA_TOOL_OPTIONS $JAVA_OPTS -jar  /app/app.jar"]
