var debug = Debug("devsupport/kafka.js");

var uniqueId = (function(that) {
  if (that.Random) {
    return function uniqueId() { return that.Random.id; };
  } else {
    var unique = 0;
    return function uniqueId() { return unique++; }
  }
})(this);

if (Meteor.isServer) {
  var kafka = require('kafka-node');

  var topics = ["passwords"];

  Meteor.publish("kafka", function (topic) {
    var self = this;
    var kafkaClientString = Meteor.settings.kafkaClientString;
    var client = new kafka.Client(kafkaClientString);

    function getLatestOffset(topic) {
      var offset = new kafka.Offset(client);
      return Meteor.wrapAsync(
        function (topics, done) {
          offset.fetch(topics, done);
        })(
        [{topic: topic, time: -1}])[topic][0];
    }

    var consumer = new kafka.Consumer(
        client, [{topic: topic, offset: getLatestOffset(topic)}],
        {
          fromOffset: true,
          // Only one client in a given group ID may receive any given message.
          // Since we want an unlimited number of clients to tail the stream at
          // the same time, we want all different group IDs
          // Also, slashes are not welcome - This is used as part of a
          // ZooKeeper path
          groupId: "devsupport:kafka.js:" + uniqueId()
        }
      );

    debug("Meteor.publish(\"kafka\"), kafkaClientString =", kafkaClientString,
      ", consumer ID:", consumer.id);

    function onMessage(message) {
      debug("Message on consumer ID", consumer.id);
      self.added("kafka", new Mongo.ObjectID(), _.extend({user: self.userId}, message));
    }

    consumer.on("message", onMessage);
    self.onStop(function() {
      debug("Meteor.publish(\"kafka\"): closing consumer ID " + consumer.id);
      consumer.removeListener("message", onMessage);
    });

  });
} else { // Client
  Kafka = new Meteor.Collection("kafka");
  Kafka.subscribe = function(topic) {
    Meteor.subscribe("kafka", topic);
  };

  Template.Kafka.helpers({
    messages: function() { return Kafka.find({}) }
  });
}
