FROM ulexus/meteor
MAINTAINER Dominique Quatravaux <dominique.quatravaux@epfl.ch>

RUN curl https://install.meteor.com/ |sh 
RUN (cd /; meteor create target)
WORKDIR /target
RUN meteor add houston:admin
RUN echo "Houston.add_collection(Meteor.users);" > /target/main.js
RUN echo "Houston.add_collection(Houston._admins);" > /target/main.js
ENTRYPOINT /usr/local/bin/meteor
CMD run

