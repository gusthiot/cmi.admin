FROM ulexus/meteor
MAINTAINER Dominique Quatravaux <dominique.quatravaux@epfl.ch>

RUN curl https://install.meteor.com/ |sh 
RUN mkdir /target
RUN (cd /target; meteor create houston-in-Docker; meteor add houston)
RUN echo "Houston.add_collection(Meteor.users);" > /target/houston.js
RUN echo "Houston.add_collection(Houston._admis);" > /target/houston.js

