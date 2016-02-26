FROM ulexus/meteor
MAINTAINER Dominique Quatravaux <dominique.quatravaux@epfl.ch>

RUN curl https://install.meteor.com/ |sh 
RUN (cd /; meteor create target)
WORKDIR /target
RUN meteor add houston:admin
RUN echo "if (Meteor.isServer) { Houston.add_collection(Meteor.users); Houston.add_collection(Houston._admins); }" > /target/main.js
ENTRYPOINT /usr/local/bin/meteor
CMD run

