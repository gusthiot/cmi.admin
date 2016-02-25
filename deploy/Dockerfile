FROM ulexus/meteor
MAINTAINER Dominique Quatravaux <dominique.quatravaux@epfl.ch>

RUN curl https://install.meteor.com/ |sh 
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -yq install ngrok-client supervisor
RUN mkdir /git-pull-server
COPY git-pull-server.js /git-pull-server/
COPY do-pull.sh /git-pull-server/
RUN chmod +x /git-pull-server/do-pull.sh
ADD supervisord.conf /etc/supervisor/
ENTRYPOINT /usr/bin/supervisord
